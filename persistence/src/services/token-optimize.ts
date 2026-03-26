/**
 * Token Optimization Utilities
 * 
 * Functions to optimize memory context for LLM consumption
 * reducing token usage while maintaining relevance
 */

// =====================================================
// TYPES
// =====================================================

export interface TokenOptimizeOptions {
  maxMemoryTokens?: number;
  maxDecisionTokens?: number;
  maxSessionTokens?: number;
}

/**
 * Compact memory representation for context injection
 * Uses XML-like tags for structure (more token efficient than prose)
 */
export function compactMemoryEntry(memory: {
  title: string;
  content: string;
  type: string;
  created_at?: string;
}): string {
  const date = memory.created_at ? new Date(memory.created_at).toISOString().split('T')[0] : '';
  
  return `<mem type="${memory.type}" date="${date}">
<title>${escapeXml(memory.title)}</title>
<content>${escapeXml(truncateContent(memory.content, 300))}</content>
</mem>`;
}

/**
 * Compact decision representation
 */
export function compactDecision(decision: {
  phase: string;
  decision: string;
  rationale?: string;
  created_at?: string;
}): string {
  const date = decision.created_at ? new Date(decision.created_at).toISOString().split('T')[0] : '';
  
  return `<dec phase="${decision.phase}" date="${date}">
<what>${escapeXml(decision.decision.substring(0, 100))}</what>
${decision.rationale ? `<why>${escapeXml(decision.rationale.substring(0, 80))}</why>` : ''}
</dec>`;
}

/**
 * Session summary representation
 */
export function compactSession(session: {
  started_at: string;
  ended_at?: string;
  summary?: string;
  goals?: string;
  accomplished?: string;
}): string {
  const start = new Date(session.started_at).toISOString().split('T')[0];
  const end = session.ended_at ? new Date(session.ended_at).toISOString().split('T')[0] : 'active';
  
  return `<sess start="${start}" end="${end}">
${session.summary ? escapeXml(session.summary.substring(0, 100)) : ''}
${session.accomplished ? `<done>${escapeXml(session.accomplished.substring(0, 80))}</done>` : ''}
</sess>`;
}

/**
 * Work context representation
 */
export function compactContext(context: {
  current_task?: string;
  task_status?: string;
  notes?: string;
}): string {
  return `<ctx status="${context.task_status || 'pending'}">
<task>${escapeXml(context.current_task || 'None')}</task>
${context.notes ? `<notes>${escapeXml(truncateContent(context.notes, 100))}</notes>` : ''}
</ctx>`;
}

// =====================================================
// CONTEXT BUNDLING
// =====================================================

/**
 * Bundle memories for context with token budget
 */
export function bundleMemories(
  memories: Array<{ title: string; content: string; type: string; created_at?: string }>,
  maxTokens: number = 4000
): string {
  if (memories.length === 0) return '';
  
  const entries: string[] = [];
  let tokens = 0;
  
  // Sort by importance: SDD decisions first, then recent
  const sorted = [...memories].sort((a, b) => {
    const priorityA = a.type === 'sdd_decision' ? 0 : 1;
    const priorityB = b.type === 'sdd_decision' ? 0 : 1;
    if (priorityA !== priorityB) return priorityA - priorityB;
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });
  
  for (const mem of sorted) {
    const entry = compactMemoryEntry(mem);
    const entryTokens = estimateTokens(entry);
    
    if (tokens + entryTokens <= maxTokens) {
      entries.push(entry);
      tokens += entryTokens;
    } else {
      break; // Stop if we'd exceed budget
    }
  }
  
  return `<memories>\n${entries.join('\n')}\n</memories>`;
}

/**
 * Bundle decisions for context
 */
export function bundleDecisions(
  decisions: Array<{ phase: string; decision: string; rationale?: string; created_at?: string }>,
  maxTokens: number = 1000
): string {
  if (decisions.length === 0) return '';
  
  const entries: string[] = [];
  let tokens = 0;
  
  const sorted = decisions.sort((a, b) => 
    new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );
  
  for (const dec of sorted) {
    const entry = compactDecision(dec);
    const entryTokens = estimateTokens(entry);
    
    if (tokens + entryTokens <= maxTokens) {
      entries.push(entry);
      tokens += entryTokens;
    }
  }
  
  return `<decisions>\n${entries.join('\n')}\n</decisions>`;
}

/**
 * Bundle sessions for context
 */
export function bundleSessions(
  sessions: Array<{ started_at: string; ended_at?: string; summary?: string; goals?: string; accomplished?: string }>,
  maxTokens: number = 1000
): string {
  if (sessions.length === 0) return '';
  
  const entries: string[] = [];
  let tokens = 0;
  
  const sorted = sessions.sort((a, b) => 
    new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );
  
  for (const sess of sorted.slice(0, 5)) { // Max 5 sessions
    const entry = compactSession(sess);
    const entryTokens = estimateTokens(entry);
    
    if (tokens + entryTokens <= maxTokens) {
      entries.push(entry);
      tokens += entryTokens;
    }
  }
  
  return `<sessions>\n${entries.join('\n')}\n</sessions>`;
}

/**
 * Full context bundle for SDD
 */
export function createContextBundle(context: {
  memories?: Array<{ title: string; content: string; type: string; created_at?: string }>;
  decisions?: Array<{ phase: string; decision: string; rationale?: string; created_at?: string }>;
  sessions?: Array<{ started_at: string; ended_at?: string; summary?: string; goals?: string; accomplished?: string }>;
  currentTask?: { current_task?: string; task_status?: string; notes?: string };
}, options?: { maxMemoryTokens?: number; maxDecisionTokens?: number; maxSessionTokens?: number }): string {
  const maxMemoryTokens = options?.maxMemoryTokens ?? 3000;
  const maxDecisionTokens = options?.maxDecisionTokens ?? 1000;
  const maxSessionTokens = options?.maxSessionTokens ?? 1000;
  
  const parts: string[] = [];
  
  if (context.currentTask) {
    parts.push(compactContext(context.currentTask));
  }
  
  if (context.memories) {
    parts.push(bundleMemories(context.memories, maxMemoryTokens));
  }
  
  if (context.decisions) {
    parts.push(bundleDecisions(context.decisions, maxDecisionTokens));
  }
  
  if (context.sessions) {
    parts.push(bundleSessions(context.sessions, maxSessionTokens));
  }
  
  return parts.join('\n\n');
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Estimate token count (approximate)
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Average: 1 token ≈ 4 characters for English
  // More accurate: count words * 1.3
  const words = text.split(/\s+/).length;
  return Math.ceil(words * 1.3);
}

/**
 * Truncate content to max length
 */
export function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content;
  
  // Find last space or period before maxLength
  const truncated = content.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  const lastPeriod = truncated.lastIndexOf('.');
  
  const cutoff = Math.max(lastSpace, lastPeriod);
  if (cutoff > maxLength * 0.7) {
    return truncated.substring(0, cutoff) + '...';
  }
  
  return truncated + '...';
}

/**
 * Escape XML special characters
 */
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// =====================================================
// DEFAULT EXPORTS
// =====================================================

export default {
  compactMemoryEntry,
  compactDecision,
  compactSession,
  compactContext,
  bundleMemories,
  bundleDecisions,
  bundleSessions,
  createContextBundle,
  estimateTokens,
  truncateContent,
  escapeXml
};