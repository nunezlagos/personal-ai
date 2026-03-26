import { db } from '../db/connection.js';
import { randomUUID } from 'crypto';

// =====================================================
// SDD CONTEXT TYPES
// =====================================================

export interface SDDPhase {
  name: 'init' | 'explore' | 'propose' | 'spec' | 'design' | 'tasks' | 'apply' | 'verify' | 'archive';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  started_at?: string;
  completed_at?: string;
  notes?: string;
}

export interface SDDChange {
  id: string;
  project: string;
  name: string;
  description?: string;
  current_phase?: string;
  phases: SDDPhase[];
  created_at: string;
  updated_at: string;
  metadata?: string;  // JSON - stores additional context
}

export interface SDDDecision {
  id: string;
  change_id: string;
  phase: string;
  decision: string;
  rationale: string;
  files_affected?: string;
  created_at: string;
}

export interface SDDContext {
  currentChange?: SDDChange;
  recentDecisions: SDDDecision[];
  taskState: any;
  workContext: any;
  previousSessions: any[];
}

export interface SearchOptions {
  query?: string;
  project?: string;
  phase?: string;
  limit?: number;
}

// =====================================================
// SDD CONTEXT SERVICE
// =====================================================

/**
 * Create a new SDD change
 */
export function createChange(project: string, name: string, description?: string): SDDChange {
  const id = randomUUID();
  const now = new Date().toISOString();
  
  const defaultPhases: SDDPhase[] = [
    { name: 'init', status: 'completed', started_at: now, completed_at: now },
    { name: 'explore', status: 'pending' },
    { name: 'propose', status: 'pending' },
    { name: 'spec', status: 'pending' },
    { name: 'design', status: 'pending' },
    { name: 'tasks', status: 'pending' },
    { name: 'apply', status: 'pending' },
    { name: 'verify', status: 'pending' },
    { name: 'archive', status: 'pending' }
  ];
  
  const stmt = db.prepare(`
    INSERT INTO sdd_changes (id, project, name, description, current_phase, phases, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    project,
    name,
    description || null,
    'explore',
    JSON.stringify(defaultPhases),
    now,
    now
  );
  
  return getChangeById(id)!;
}

/**
 * Get change by ID
 */
export function getChangeById(id: string): SDDChange | undefined {
  const stmt = db.prepare('SELECT * FROM sdd_changes WHERE id = ?');
  const row = stmt.get(id) as any;
  
  if (!row) return undefined;
  
  return {
    ...row,
    phases: JSON.parse(row.phases || '[]')
  };
}

/**
 * Get active change for a project
 */
export function getActiveChange(project: string): SDDChange | undefined {
  const stmt = db.prepare(`
    SELECT * FROM sdd_changes 
    WHERE project = ? 
    ORDER BY updated_at DESC 
    LIMIT 1
  `);
  const row = stmt.get(project) as any;
  
  if (!row) return undefined;
  
  return {
    ...row,
    phases: JSON.parse(row.phases || '[]')
  };
}

/**
 * Update change phase status
 */
export function updatePhase(changeId: string, phaseName: string, status: SDDPhase['status'], notes?: string): SDDChange | undefined {
  const change = getChangeById(changeId);
  if (!change) return undefined;
  
  const phases = change.phases.map(p => {
    if (p.name === phaseName) {
      const now = new Date().toISOString();
      return {
        ...p,
        status,
        started_at: p.started_at || (status === 'in_progress' ? now : undefined),
        completed_at: status === 'completed' ? now : p.completed_at,
        notes: notes || p.notes
      };
    }
    return p;
  });
  
  const currentPhase = phases.find(p => p.status === 'in_progress')?.name || 
                       phases.find(p => p.status === 'pending')?.name || 
                       'archive';
  
  const stmt = db.prepare(`
    UPDATE sdd_changes SET
      current_phase = ?,
      phases = ?,
      updated_at = ?
    WHERE id = ?
  `);
  
  stmt.run(
    currentPhase,
    JSON.stringify(phases),
    new Date().toISOString(),
    changeId
  );
  
  return getChangeById(changeId);
}

/**
 * Record a decision in SDD flow
 */
export function recordDecision(
  changeId: string,
  phase: string,
  decision: string,
  rationale: string,
  filesAffected?: string
): SDDDecision {
  const id = randomUUID();
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO sdd_decisions (id, change_id, phase, decision, rationale, files_affected, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, changeId, phase, decision, rationale, filesAffected || null, now);
  
  // Also save as a memory for semantic search
  saveSDDDecisionMemory(changeId, phase, decision, rationale);
  
  return {
    id,
    change_id: changeId,
    phase,
    decision,
    rationale,
    files_affected: filesAffected || undefined,
    created_at: now
  };
}

/**
 * Save decision as memory for semantic search
 */
function saveSDDDecisionMemory(changeId: string, phase: string, decision: string, rationale: string) {
  const memoryStmt = db.prepare(`
    INSERT INTO memories (id, title, content, type, project, scope, topic_key, tool_name, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const id = randomUUID();
  const now = new Date().toISOString();
  
  memoryStmt.run(
    id,
    `[SDD:${phase}] ${decision.substring(0, 50)}`,
    `Phase: ${phase}\nDecision: ${decision}\nRationale: ${rationale}`,
    'sdd_decision',
    'persistence-ai-memory',
    'project',
    `sdd:${changeId}:${phase}:decision`,
    'sdd-context',
    now,
    now
  );
}

/**
 * Get decisions for a change
 */
export function getChangeDecisions(changeId: string): SDDDecision[] {
  const stmt = db.prepare(`
    SELECT * FROM sdd_decisions 
    WHERE change_id = ? 
    ORDER BY created_at DESC
  `);
  
  return stmt.all(changeId) as SDDDecision[];
}

/**
 * Get key decisions for a project (recent ones)
 */
export function getRecentDecisions(project: string, limit: number = 20): any[] {
  const stmt = db.prepare(`
    SELECT d.*, c.name as change_name
    FROM sdd_decisions d
    JOIN sdd_changes c ON d.change_id = c.id
    WHERE c.project = ?
    ORDER BY d.created_at DESC
    LIMIT ?
  `);
  
  return stmt.all(project, limit) as any[];
}

/**
 * Update change metadata
 */
export function updateMetadata(changeId: string, metadata: object): SDDChange | undefined {
  const stmt = db.prepare(`
    UPDATE sdd_changes SET
      metadata = ?,
      updated_at = ?
    WHERE id = ?
  `);
  
  stmt.run(JSON.stringify(metadata), new Date().toISOString(), changeId);
  
  return getChangeById(changeId);
}

/**
 * List all changes for a project
 */
export function listChanges(project: string): SDDChange[] {
  const stmt = db.prepare(`
    SELECT * FROM sdd_changes 
    WHERE project = ?
    ORDER BY updated_at DESC
  `);
  
  const rows = stmt.all(project) as any[];
  
  return rows.map(row => ({
    ...row,
    phases: JSON.parse(row.phases || '[]')
  }));
}

/**
 * Get complete SDD context for a project
 */
export function getProjectSDDContext(project: string): SDDContext {
  const activeChange = getActiveChange(project);
  const recentDecisions = getRecentDecisions(project, 20);
  
  // Get task state from work_context
  const taskState = db.prepare(`
    SELECT * FROM work_context WHERE project = ?
  `).get(project) as any;
  
  // Get work context
  const workContext = db.prepare(`
    SELECT current_task, task_status, progress, notes 
    FROM work_context WHERE project = ?
  `).get(project) as any;
  
  // Get recent sessions
  const previousSessions = db.prepare(`
    SELECT id, started_at, ended_at, summary, goals, accomplished
    FROM sessions 
    WHERE project = ?
    ORDER BY started_at DESC
    LIMIT 5
  `).all(project) as any[];
  
  return {
    currentChange: activeChange,
    recentDecisions,
    taskState,
    workContext,
    previousSessions
  };
}

/**
 * Summarize context for LLM consumption (token-optimized)
 */
export function summarizeForLLM(project: string): string {
  const ctx = getProjectSDDContext(project);
  
  let summary = `# Project Context: ${project}\n\n`;
  
  if (ctx.currentChange) {
    summary += `## Active SDD Change\n`;
    summary += `- Name: ${ctx.currentChange.name}\n`;
    summary += `- Phase: ${ctx.currentChange.current_phase}\n`;
    summary += `- Phases: ${ctx.currentChange.phases.map(p => `${p.name}(${p.status})`).join(', ')}\n\n`;
  }
  
  if (ctx.recentDecisions.length > 0) {
    summary += `## Recent Decisions\n`;
    ctx.recentDecisions.slice(0, 10).forEach(d => {
      summary += `- [${d.phase}] ${d.decision.substring(0, 80)}...\n`;
    });
    summary += '\n';
  }
  
  if (ctx.workContext) {
    summary += `## Current Work\n`;
    summary += `- Task: ${ctx.workContext.current_task || 'None'}\n`;
    summary += `- Status: ${ctx.workContext.task_status || 'pending'}\n`;
    if (ctx.workContext.notes) {
      summary += `- Notes: ${ctx.workContext.notes.substring(0, 200)}...\n`;
    }
    summary += '\n';
  }
  
  if (ctx.previousSessions.length > 0) {
    summary += `## Recent Sessions\n`;
    ctx.previousSessions.forEach(s => {
      summary += `- ${s.started_at}: ${s.summary || 'No summary'}\n`;
    });
  }
  
  return summary;
}

/**
 * Clean up old completed changes (archive them)
 */
export function archiveOldChanges(project: string, keepLast: number = 10): number {
  const stmt = db.prepare(`
    UPDATE sdd_changes 
    SET current_phase = 'archive'
    WHERE project = ? 
    AND current_phase = 'archive'
    AND id NOT IN (
      SELECT id FROM sdd_changes 
      WHERE project = ?
      ORDER BY updated_at DESC
      LIMIT ?
    )
  `);
  
  const result = stmt.run(project, project, keepLast);
  return result.changes;
}

// =====================================================
// DEFAULT EXPORTS
// =====================================================

export default {
  createChange,
  getChangeById,
  getActiveChange,
  updatePhase,
  recordDecision,
  getChangeDecisions,
  getRecentDecisions,
  updateMetadata,
  listChanges,
  getProjectSDDContext,
  summarizeForLLM,
  archiveOldChanges
};