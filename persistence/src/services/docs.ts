import { db } from '../db/connection.js';
import { randomUUID } from 'crypto';

export interface Documentation {
  id: string;
  framework: string;
  version?: string;
  title: string;
  content: string;
  url?: string;
  file_path?: string;
  category?: string;
  indexed_at: string;
  last_accessed?: string;
  access_count: number;
}

export interface DocumentationInput {
  framework: string;
  version?: string;
  title: string;
  content: string;
  url?: string;
  file_path?: string;
  category?: string;
}

export interface DocSearchOptions {
  query?: string;
  framework?: string;
  category?: string;
  limit?: number;
}

function generateId(): string {
  return randomUUID();
}

// =====================================================
// DOCUMENTATION SERVICE
// =====================================================

/**
 * Index a documentation entry
 */
export function indexDocumentation(input: DocumentationInput): Documentation {
  const id = generateId();
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO documentation (id, framework, version, title, content, url, file_path, category, indexed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    input.framework,
    input.version || null,
    input.title,
    input.content,
    input.url || null,
    input.file_path || null,
    input.category || null,
    now
  );
  
  return getDocumentationById(id)!;
}

/**
 * Get documentation by ID
 */
export function getDocumentationById(id: string): Documentation | undefined {
  const stmt = db.prepare('SELECT * FROM documentation WHERE id = ?');
  return stmt.get(id) as Documentation | undefined;
}

/**
 * Search documentation (FTS5)
 */
export function searchDocumentation(options: DocSearchOptions): Documentation[] {
  const { query, framework, category, limit = 20 } = options;
  
  let sql = 'SELECT * FROM documentation WHERE 1=1';
  const params: any[] = [];
  
  if (query) {
    sql = `
      SELECT d.* FROM documentation d
      JOIN docs_fts fts ON d.rowid = fts.rowid
      WHERE docs_fts MATCH ?
    `;
    const sanitizedQuery = query.split(/\s+/).map(w => `"${w}"`).join(' ');
    params.push(sanitizedQuery);
  }
  
  if (framework) {
    sql += ' AND framework = ?';
    params.push(framework);
  }
  
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  
  sql += ' ORDER BY access_count DESC, indexed_at DESC LIMIT ?';
  params.push(limit);
  
  const stmt = db.prepare(sql);
  return stmt.all(...params) as Documentation[];
}

/**
 * Update access stats
 */
export function trackAccess(id: string): void {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    UPDATE documentation SET 
      last_accessed = ?,
      access_count = access_count + 1
    WHERE id = ?
  `);
  stmt.run(now, id);
}

/**
 * Get documentation by framework
 */
export function getByFramework(framework: string, limit = 50): Documentation[] {
  const stmt = db.prepare(`
    SELECT * FROM documentation 
    WHERE framework = ?
    ORDER BY access_count DESC, indexed_at DESC
    LIMIT ?
  `);
  return stmt.all(framework, limit) as Documentation[];
}

/**
 * Get all indexed frameworks
 */
export function getIndexedFrameworks(): { framework: string; count: number }[] {
  const stmt = db.prepare(`
    SELECT framework, COUNT(*) as count 
    FROM documentation 
    GROUP BY framework 
    ORDER BY count DESC
  `);
  return stmt.all() as any[];
}

/**
 * Delete documentation
 */
export function deleteDocumentation(id: string): boolean {
  const stmt = db.prepare('DELETE FROM documentation WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Get documentation stats
 */
export function getDocStats(): {
  totalDocs: number;
  byFramework: Record<string, number>;
  byCategory: Record<string, number>;
  totalAccesses: number;
} {
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM documentation');
  const totalDocs = (countStmt.get() as any).count;
  
  const accessStmt = db.prepare('SELECT SUM(access_count) as total FROM documentation');
  const totalAccesses = (accessStmt.get() as any).total || 0;
  
  const byFrameworkStmt = db.prepare('SELECT framework, COUNT(*) as count FROM documentation GROUP BY framework');
  const byFramework = byFrameworkStmt.all().reduce((acc: Record<string, number>, row: any) => {
    acc[row.framework] = row.count;
    return acc;
  }, {} as Record<string, number>);
  
  const byCategoryStmt = db.prepare('SELECT category, COUNT(*) as count FROM documentation WHERE category IS NOT NULL GROUP BY category');
  const byCategory = byCategoryStmt.all().reduce((acc: Record<string, number>, row: any) => {
    acc[row.category] = row.count;
    return acc;
  }, {} as Record<string, number>);
  
  return { totalDocs, byFramework, byCategory, totalAccesses };
}

// =====================================================
// AUTO-INDEX HELPERS (for agents/skills to use)
// =====================================================

/**
 * Quick index: for a skill to add documentation references
 */
export function quickIndex(framework: string, title: string, content: string, category: string = 'reference'): Documentation {
  return indexDocumentation({
    framework,
    title,
    content,
    category
  });
}

export default {
  indexDocumentation,
  getDocumentationById,
  searchDocumentation,
  trackAccess,
  getByFramework,
  getIndexedFrameworks,
  deleteDocumentation,
  getDocStats,
  quickIndex
};