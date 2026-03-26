import { db } from '../db/connection.js';
import { randomUUID } from 'crypto';

// Types
export interface Memory {
  id: string;
  title: string;
  content: string;
  type: string;
  project?: string;
  scope: string;
  topic_key?: string;
  revision_count: number;
  tool_name?: string;
  session_id?: string;
  created_at: string;
  updated_at: string;
}

export interface MemoryInput {
  title: string;
  content: string;
  type?: string;
  project?: string;
  scope?: string;
  topic_key?: string;
  tool_name?: string;
  session_id?: string;
  revision_count?: number;
}

export interface SearchOptions {
  query?: string;
  type?: string;
  project?: string;
  scope?: string;
  limit?: number;
}

// Generate UUID
function generateId(): string {
  return randomUUID();
}

// =====================================================
// MEMORY SERVICE (Engram-compatible)
// =====================================================

/**
 * Save a memory (Engram-compatible with extensions)
 */
export function saveMemory(input: MemoryInput): Memory {
  const id = generateId();
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO memories (id, title, content, type, project, scope, topic_key, tool_name, session_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    input.title,
    input.content,
    input.type || 'learning',
    input.project || null,
    input.scope || 'project',
    input.topic_key || null,
    input.tool_name || null,
    input.session_id || null,
    now,
    now
  );
  
  return getMemoryById(id)!;
}

/**
 * Get memory by ID
 */
export function getMemoryById(id: string): Memory | undefined {
  const stmt = db.prepare('SELECT * FROM memories WHERE id = ?');
  return stmt.get(id) as Memory | undefined;
}

/**
 * Update a memory
 */
export function updateMemory(id: string, input: Partial<MemoryInput>): Memory | undefined {
  const existing = getMemoryById(id);
  if (!existing) return undefined;
  
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    UPDATE memories SET
      title = ?,
      content = ?,
      type = ?,
      project = ?,
      scope = ?,
      topic_key = ?,
      updated_at = ?
    WHERE id = ?
  `);
  
  stmt.run(
    input.title || existing.title,
    input.content || existing.content,
    input.type || existing.type,
    input.project || existing.project,
    input.scope || existing.scope,
    input.topic_key || existing.topic_key,
    now,
    id
  );
  
  return getMemoryById(id);
}

/**
 * Search memories (FTS5)
 */
export function searchMemories(options: SearchOptions): Memory[] {
  const { query, type, project, scope, limit = 20 } = options;
  
  let sql = 'SELECT * FROM memories WHERE 1=1';
  const params: any[] = [];
  
  if (query) {
    // Use FTS5 for full-text search
    sql = `
      SELECT m.* FROM memories m
      JOIN memories_fts fts ON m.rowid = fts.rowid
      WHERE memories_fts MATCH ?
    `;
    // Wrap each word in quotes to avoid FTS5 syntax errors
    const sanitizedQuery = query.split(/\s+/).map(w => `"${w}"`).join(' ');
    params.push(sanitizedQuery);
  }
  
  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  
  if (project) {
    sql += ' AND project = ?';
    params.push(project);
  }
  
  if (scope) {
    sql += ' AND scope = ?';
    params.push(scope);
  }
  
  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);
  
  const stmt = db.prepare(sql);
  return stmt.all(...params) as Memory[];
}

/**
 * Delete a memory
 */
export function deleteMemory(id: string): boolean {
  const stmt = db.prepare('DELETE FROM memories WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Get memory statistics
 */
export function getMemoryStats(project?: string): {
  total: number;
  byType: Record<string, number>;
  byProject: Record<string, number>;
} {
  let totalSql = 'SELECT COUNT(*) as count FROM memories';
  let byTypeSql = 'SELECT type, COUNT(*) as count FROM memories';
  let byProjectSql = 'SELECT project, COUNT(*) as count FROM memories';
  
  const params: any[] = [];
  
  if (project) {
    totalSql += ' WHERE project = ?';
    byTypeSql += ' WHERE project = ?';
    byProjectSql += ' WHERE project = ?';
    params.push(project);
  }
  
  const totalStmt = db.prepare(totalSql);
  const total = (totalStmt.get(...params) as any).count;
  
  const byTypeStmt = db.prepare(byTypeSql + ' GROUP BY type');
  const byType = byTypeStmt.all(...params).reduce((acc: Record<string, number>, row: any) => {
    acc[row.type] = row.count;
    return acc;
  }, {} as Record<string, number>);
  
  const byProjectStmt = db.prepare(byProjectSql + ' GROUP BY project');
  const byProject = byProjectStmt.all(...params).reduce((acc: Record<string, number>, row: any) => {
    acc[row.project || 'unknown'] = row.count;
    return acc;
  }, {} as Record<string, number>);
  
  return { total, byType, byProject };
}

/**
 * Save or update (upsert) based on topic_key
 */
export function upsertMemory(input: MemoryInput): Memory {
  if (input.topic_key) {
    const existing = db.prepare(
      'SELECT * FROM memories WHERE topic_key = ? AND scope = ?'
    ).get(input.topic_key, input.scope || 'project') as Memory | undefined;
    
    if (existing) {
      return updateMemory(existing.id, {
        ...input,
        revision_count: existing.revision_count + 1
      })!;
    }
  }
  
  return saveMemory(input);
}

export default {
  saveMemory,
  getMemoryById,
  updateMemory,
  searchMemories,
  deleteMemory,
  getMemoryStats,
  upsertMemory
};