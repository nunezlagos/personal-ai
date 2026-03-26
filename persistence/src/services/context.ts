import { db } from '../db/connection.js';
import { randomUUID } from 'crypto';

export interface WorkContext {
  id: string;
  project: string;
  current_task?: string;
  task_status?: string;
  progress?: string;     // JSON
  blockers?: string;    // JSON array
  notes?: string;
  last_updated: string;
  updated_by?: string;
}

export interface WorkContextInput {
  project: string;
  current_task?: string;
  task_status?: string;
  progress?: object;
  blockers?: string[];
  notes?: string;
  updated_by?: string;
}

function generateId(): string {
  return randomUUID();
}

// =====================================================
// WORK CONTEXT SERVICE
// =====================================================

/**
 * Get or create work context for a project
 */
export function getOrCreateContext(project: string): WorkContext {
  const existing = db.prepare(
    'SELECT * FROM work_context WHERE project = ?'
  ).get(project) as WorkContext | undefined;
  
  if (existing) return existing;
  
  return createContext({ project });
}

/**
 * Create work context
 */
export function createContext(input: WorkContextInput): WorkContext {
  const id = generateId();
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO work_context (
      id, project, current_task, task_status, progress, blockers, notes, last_updated, updated_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    input.project,
    input.current_task || null,
    input.task_status || 'pending',
    input.progress ? JSON.stringify(input.progress) : null,
    input.blockers ? JSON.stringify(input.blockers) : null,
    input.notes || null,
    now,
    input.updated_by || null
  );
  
  return getContextById(id)!;
}

/**
 * Get context by ID
 */
export function getContextById(id: string): WorkContext | undefined {
  const stmt = db.prepare('SELECT * FROM work_context WHERE id = ?');
  return stmt.get(id) as WorkContext | undefined;
}

/**
 * Update work context
 */
export function updateContext(project: string, input: Partial<WorkContextInput>): WorkContext | undefined {
  const existing = getOrCreateContext(project);
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    UPDATE work_context SET
      current_task = ?,
      task_status = ?,
      progress = ?,
      blockers = ?,
      notes = ?,
      last_updated = ?,
      updated_by = ?
    WHERE id = ?
  `);
  
  stmt.run(
    input.current_task || existing.current_task,
    input.task_status || existing.task_status,
    input.progress ? JSON.stringify(input.progress) : existing.progress,
    input.blockers ? JSON.stringify(input.blockers) : existing.blockers,
    input.notes || existing.notes,
    now,
    input.updated_by || existing.updated_by,
    existing.id
  );
  
  return getContextById(existing.id);
}

/**
 * Set current task
 */
export function setCurrentTask(project: string, task: string, status: string = 'in_progress', updatedBy?: string): WorkContext {
  return updateContext(project, {
    current_task: task,
    task_status: status,
    updated_by: updatedBy || 'system'
  })!;
}

/**
 * Update progress
 */
export function updateProgress(project: string, progress: object, updatedBy?: string): WorkContext {
  return updateContext(project, {
    progress,
    updated_by: updatedBy || 'system'
  })!;
}

/**
 * Add a blocker
 */
export function addBlocker(project: string, blocker: string, updatedBy?: string): WorkContext {
  const context = getOrCreateContext(project);
  const blockers = context.blockers ? JSON.parse(context.blockers) : [];
  blockers.push(blocker);
  
  return updateContext(project, {
    blockers,
    updated_by: updatedBy || 'system'
  })!;
}

/**
 * Clear blockers
 */
export function clearBlockers(project: string, updatedBy?: string): WorkContext {
  return updateContext(project, {
    blockers: [],
    updated_by: updatedBy || 'system'
  })!;
}

/**
 * Add note
 */
export function addNote(project: string, note: string, updatedBy?: string): WorkContext {
  const context = getOrCreateContext(project);
  const existingNotes = context.notes || '';
  const newNotes = existingNotes ? `${existingNotes}\n${note}` : note;
  
  return updateContext(project, {
    notes: newNotes,
    updated_by: updatedBy || 'system'
  })!;
}

/**
 * Mark task as completed
 */
export function completeTask(project: string, updatedBy?: string): WorkContext {
  return updateContext(project, {
    task_status: 'completed',
    updated_by: updatedBy || 'system'
  })!;
}

export default {
  getOrCreateContext,
  createContext,
  getContextById,
  updateContext,
  setCurrentTask,
  updateProgress,
  addBlocker,
  clearBlockers,
  addNote,
  completeTask
};