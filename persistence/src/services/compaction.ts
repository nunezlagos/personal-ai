import { db } from '../db/connection.js';
import { randomUUID } from 'crypto';

// =====================================================
// COMPACTION & TTL TYPES
// =====================================================

export interface MemoryTTLPolicy {
  type: string;
  ttl_days: number;
  auto_compact: boolean;
  compact_threshold: number;
  description: string;
}

export interface CompactionResult {
  compacted: number;
  deleted: number;
  errors: string[];
}

export interface TTLStats {
  expired: number;
  compacted: number;
  retained: number;
}

// =====================================================
// TTL POLICY SERVICE
// =====================================================

/**
 * Get TTL policy for a memory type
 */
export function getTTLPolicy(type: string): MemoryTTLPolicy | undefined {
  const stmt = db.prepare('SELECT * FROM memory_ttl WHERE type = ?');
  return stmt.get(type) as MemoryTTLPolicy | undefined;
}

/**
 * Get all TTL policies
 */
export function getAllPolicies(): MemoryTTLPolicy[] {
  const stmt = db.prepare('SELECT * FROM memory_ttl ORDER BY ttl_days');
  return stmt.all() as MemoryTTLPolicy[];
}

/**
 * Update TTL policy
 */
export function updatePolicy(type: string, ttlDays: number, autoCompact: boolean = true, compactThreshold: number = 2000): boolean {
  const stmt = db.prepare(`
    UPDATE memory_ttl SET 
      ttl_days = ?,
      auto_compact = ?,
      compact_threshold = ?
    WHERE type = ?
  `);
  
  const result = stmt.run(ttlDays, autoCompact ? 1 : 0, compactThreshold, type);
  return result.changes > 0;
}

/**
 * Create custom TTL policy
 */
export function createPolicy(type: string, ttlDays: number, autoCompact: boolean = true, compactThreshold: number = 2000, description?: string): boolean {
  try {
    const stmt = db.prepare(`
      INSERT INTO memory_ttl (type, ttl_days, auto_compact, compact_threshold, description)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(type, ttlDays, autoCompact ? 1 : 0, compactThreshold, description || null);
    return true;
  } catch (e: any) {
    return false;
  }
}

// =====================================================
// AUTO-COMPACTION SERVICE
// =====================================================

/**
 * Compress memory content if it exceeds threshold
 * IMPORTANT: Preserve key information, decisions, and important facts
 * 
 * NOTE: In a full implementation, this would call an LLM to summarize
 * For now, uses rule-based compression that preserves important content
 */
export function compressContent(content: string, maxLength: number = 500): string {
  if (content.length <= maxLength) {
    return content;
  }
  
  // 1. Try to extract and preserve key information
  // Look for structured sections like "What:", "Why:", "Where:", "Learned:"
  const keySections: string[] = [];
  
  const whatMatch = content.match(/\*\*What\*\*:?([^\n]+)/i);
  const whyMatch = content.match(/\*\*Why\*\*:?([^\n]+)/i);
  const whereMatch = content.match(/\*\*Where\*\*:?([^\n]+)/i);
  const learnedMatch = content.match(/\*\*Learned\*\*:?([^\n]+)/i);
  
  if (whatMatch) keySections.push(`What: ${whatMatch[1].trim()}`);
  if (whyMatch) keySections.push(`Why: ${whyMatch[1].trim()}`);
  if (whereMatch) keySections.push(`Where: ${whereMatch[1].trim()}`);
  if (learnedMatch) keySections.push(`Learned: ${learnedMatch[1].trim()}`);
  
  // 2. Extract bullet points and numbered lists (often important)
  const bulletMatches = content.match(/^[•\-\*]\s+[^\n]+/gm);
  const numberMatches = content.match(/^\d+[\.\)]\s+[^\n]+/gm);
  
  // 3. Build compressed content prioritizing important info
  let compressed = '';
  
  if (keySections.length > 0) {
    compressed += keySections.join(' | ') + '\n';
  }
  
  // Add bullet points if they exist
  if (bulletMatches && bulletMatches.length <= 5) {
    compressed += bulletMatches.join(' ') + ' ';
  }
  
  // Add numbered items
  if (numberMatches && numberMatches.length <= 3) {
    compressed += numberMatches.join(' ') + ' ';
  }
  
  // 4. If we have key info, try to fit it in maxLength
  if (compressed.length > 50) {
    // Keep key sections + truncate rest
    const remaining = maxLength - compressed.length - 20;
    if (remaining > 100) {
      // Get additional context from original
      const additional = content
        .replace(/\*\*[^*]+\*\*/g, '')  // Remove bold markers
        .replace(/^[•\-\*]\s+/gm, '')   // Remove bullet points
        .replace(/^\d+[\.\)]\s+/gm, '') // Remove numbers
        .substring(0, remaining);
      
      compressed += '\n' + additional;
    }
  }
  
  // 5. Final fallback: if still too long, truncate at sentence boundary
  if (compressed.length > maxLength) {
    const truncated = compressed.substring(0, maxLength - 50);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastSpace = truncated.lastIndexOf(' ');
    
    const cutoff = lastPeriod > maxLength * 0.7 ? lastPeriod : lastSpace;
    compressed = truncated.substring(0, cutoff > 0 ? cutoff : maxLength - 30) + '...[COMPRESSED]';
  }
  
  return compressed.trim();
}

/**
 * Compact memories that exceed their content threshold
 */
export function compactMemoriesByThreshold(project?: string): CompactionResult {
  const result: CompactionResult = {
    compacted: 0,
    deleted: 0,
    errors: []
  };
  
  // Get all policies with auto_compact enabled
  const policies = db.prepare(`
    SELECT * FROM memory_ttl WHERE auto_compact = 1
  `).all() as MemoryTTLPolicy[];
  
  for (const policy of policies) {
    // Find memories of this type that exceed threshold
    const memories = db.prepare(`
      SELECT * FROM memories 
      WHERE type = ? 
      AND LENGTH(content) > ?
      ${project ? 'AND project = ?' : ''}
    `).all(policy.type, policy.compact_threshold, project || null) as any[];
    
    for (const mem of memories) {
      try {
        const compressed = compressContent(mem.content, policy.compact_threshold);
        
        if (compressed !== mem.content) {
          db.prepare(`
            UPDATE memories SET content = ?, updated_at = ? WHERE id = ?
          `).run(compressed, new Date().toISOString(), mem.id);
          
          result.compacted++;
        }
      } catch (e: any) {
        result.errors.push(`Failed to compact ${mem.id}: ${e.message}`);
      }
    }
  }
  
  return result;
}

/**
 * Full auto-compact: compress + expire old memories
 */
export function runAutoMaintenance(project?: string): TTLStats {
  const stats: TTLStats = {
    expired: 0,
    compacted: 0,
    retained: 0
  };
  
  // 1. Compact memories by threshold
  const compactResult = compactMemoriesByThreshold(project);
  stats.compacted = compactResult.compacted;
  
  // 2. Expire old memories based on TTL
  const expireResult = expireMemories(project);
  stats.expired = expireResult;
  
  // 3. Count retained
  const retainedStmt = project 
    ? db.prepare('SELECT COUNT(*) as count FROM memories WHERE project = ?').get(project) as any
    : db.prepare('SELECT COUNT(*) as count FROM memories').get() as any;
  
  stats.retained = retainedStmt.count;
  
  return stats;
}

/**
 * Expire memories based on TTL policy
 * IMPORTANT: Never delete important memories - always archive/compact instead
 */
export function expireMemories(project?: string): number {
  let expired = 0;
  
  // IMPORTANT MEMORY TYPES - never hard delete these
  const PROTECTED_TYPES = [
    'sdd_decision',      // SDD decisions are critical
    'decision',          // Architectural decisions
    'bugfix',            // Bug fixes with root cause
    'pattern',           // Code patterns discovered
    'architecture',     // Architecture documentation
    'config',           // Configuration decisions
    'preference',       // User preferences
  ];
  
  // Get all policies
  const policies = getAllPolicies();
  
  for (const policy of policies) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.ttl_days);
    
    // For memories with this type, check age
    const memories = db.prepare(`
      SELECT * FROM memories 
      WHERE type = ?
      AND created_at < ?
      ${project ? 'AND project = ?' : ''}
    `).all(policy.type, cutoffDate.toISOString(), project || null) as any[];
    
    for (const mem of memories) {
      try {
        // CHECK: Is this a protected memory type?
        const isProtected = PROTECTED_TYPES.includes(mem.type);
        const hasImportantTopicKey = mem.topic_key && (
          mem.topic_key.includes('sdd:') ||
          mem.topic_key.includes('architecture') ||
          mem.topic_key.includes('decision') ||
          mem.topic_key.includes('preference')
        );
        
        // ALWAYS preserve important memories - just mark as archived
        if (isProtected || hasImportantTopicKey || policy.auto_compact) {
          // Keep a compressed summary instead of deletion
          const summary = compressContent(mem.content, 500); // Keep more content
          
          db.prepare(`
            UPDATE memories SET 
              content = ?,
              type = ?,
              updated_at = ?
            WHERE id = ?
          `).run(summary, `${mem.type}_archived`, new Date().toISOString(), mem.id);
        } else {
          // Only hard delete if explicitly allowed and not important
          if (policy.auto_compact === false) {
            // Hard delete only for non-important types with auto_compact disabled
            db.prepare('DELETE FROM memories WHERE id = ?').run(mem.id);
            expired++;
          } else {
            // Default: compress and archive
            const summary = compressContent(mem.content, 300);
            db.prepare(`
              UPDATE memories SET 
                content = ?,
                type = ?,
                updated_at = ?
              WHERE id = ?
            `).run(summary, `${mem.type}_archived`, new Date().toISOString(), mem.id);
          }
        }
      } catch (e: any) {
        // Skip errors but log
        console.warn(`Failed to process memory ${mem.id}:`, e.message);
      }
    }
  }
  
  return expired;
}

/**
 * Get memory age in days
 */
export function getMemoryAge(id: string): number | null {
  const mem = db.prepare('SELECT created_at FROM memories WHERE id = ?').get(id) as any;
  
  if (!mem) return null;
  
  const created = new Date(mem.created_at);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if a memory is expired
 */
export function isMemoryExpired(id: string): boolean {
  const mem = db.prepare('SELECT type, created_at FROM memories WHERE id = ?').get(id) as any;
  
  if (!mem) return true;
  
  const policy = getTTLPolicy(mem.type);
  if (!policy) {
    // Use default policy
    const defaultPolicy = getTTLPolicy('default');
    if (!defaultPolicy) return false;
    
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - defaultPolicy.ttl_days);
    return new Date(mem.created_at) < cutoff;
  }
  
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - policy.ttl_days);
  return new Date(mem.created_at) < cutoff;
}

/**
 * Get TTL statistics for a project
 */
export function getTTLStats(project?: string): {
  byType: Record<string, { total: number; expired: number; avgAge: number }>;
  total: number;
  expiredCount: number;
} {
  const baseQuery = project 
    ? 'SELECT type, created_at FROM memories WHERE project = ?'
    : 'SELECT type, created_at FROM memories';
  
  const memories = db.prepare(baseQuery).all(project || null) as any[];
  
  const now = new Date();
  const byType: Record<string, { total: number; expired: number; ageSum: number }> = {};
  
  for (const mem of memories) {
    if (!byType[mem.type]) {
      byType[mem.type] = { total: 0, expired: 0, ageSum: 0 };
    }
    
    byType[mem.type].total++;
    
    const policy = getTTLPolicy(mem.type) || getTTLPolicy('default');
    const age = Math.floor((now.getTime() - new Date(mem.created_at).getTime()) / (1000 * 60 * 60 * 24));
    byType[mem.type].ageSum += age;
    
    if (policy && age > policy.ttl_days) {
      byType[mem.type].expired++;
    }
  }
  
  const result: any = { byType: {}, total: memories.length, expiredCount: 0 };
  
  for (const [type, data] of Object.entries(byType)) {
    result.byType[type] = {
      total: data.total,
      expired: data.expired,
      avgAge: Math.floor(data.ageSum / data.total)
    };
    result.expiredCount += data.expired;
  }
  
  return result;
}

// =====================================================
// TOKEN ESTIMATION
// =====================================================

/**
 * Estimate token count for content
 * Uses approximate ratio: 1 token ≈ 4 characters for English
 */
export function estimateTokens(text: string): number {
  // More accurate: count words and add overhead
  const words = text.split(/\s+/).length;
  // Average: 1.3 tokens per word for English
  return Math.ceil(words * 1.3);
}

/**
 * Estimate tokens for a memory bundle
 */
export function estimateMemoryTokens(memories: any[]): number {
  let total = 0;
  
  for (const mem of memories) {
    // Title + content + metadata overhead
    total += estimateTokens(mem.title || '');
    total += estimateTokens(mem.content || '');
    total += 10; // overhead for metadata
  }
  
  return total;
}

/**
 * Optimize context to fit within token budget
 */
export function optimizeForTokenBudget(memories: any[], maxTokens: number): any[] {
  // Sort by relevance (newer first, then by type importance)
  const sorted = [...memories].sort((a, b) => {
    // SDD decisions first, then by date
    const priorityA = a.type === 'sdd_decision' ? 0 : 1;
    const priorityB = b.type === 'sdd_decision' ? 0 : 1;
    
    if (priorityA !== priorityB) return priorityA - priorityB;
    
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
  
  const selected: any[] = [];
  let tokens = 0;
  
  for (const mem of sorted) {
    const memTokens = estimateTokens(mem.title) + estimateTokens(mem.content);
    
    if (tokens + memTokens <= maxTokens) {
      selected.push(mem);
      tokens += memTokens;
    } else {
      // Try compressed version
      const compressed = compressContent(mem.content, Math.floor((maxTokens - tokens) * 3 / 1.3));
      if (compressed.length > 50) {
        selected.push({ ...mem, content: compressed });
        tokens += estimateTokens(compressed);
      }
    }
  }
  
  return selected;
}

// =====================================================
// DEFAULT EXPORTS
// =====================================================

export default {
  getTTLPolicy,
  getAllPolicies,
  updatePolicy,
  createPolicy,
  compressContent,
  compactMemoriesByThreshold,
  runAutoMaintenance,
  expireMemories,
  getMemoryAge,
  isMemoryExpired,
  getTTLStats,
  estimateTokens,
  estimateMemoryTokens,
  optimizeForTokenBudget
};