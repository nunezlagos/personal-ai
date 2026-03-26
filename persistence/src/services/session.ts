import { db } from '../db/connection.js';
import { randomUUID } from 'crypto';

export interface Session {
  id: string;
  project?: string;
  started_at: string;
  ended_at?: string;
  summary?: string;
  goals?: string;      // JSON array
  discoveries?: string; // JSON array
  accomplished?: string; // JSON array
  files_changed?: string; // JSON array
}

export interface SessionMetadata {
  id: string;
  session_id: string;
  start_time: string;
  end_time?: string;
  commands?: string;      // JSON array
  files_touched?: string; // JSON array
  errors?: string;        // JSON array
  skills_used?: string;  // JSON array
  context_updates?: string; // JSON
  duration_ms?: number;
  tokens_used?: number;
  project?: string;
  scope: string;
}

export interface SessionInput {
  project?: string;
  goals?: string[];
  summary?: string;
}

export interface SessionMetadataInput {
  session_id: string;
  commands?: string[];
  files_touched?: string[];
  errors?: string[];
  skills_used?: string[];
  context_updates?: object;
  duration_ms?: number;
  tokens_used?: number;
  project?: string;
  scope?: string;
}

function generateId(): string {
  return randomUUID();
}

// =====================================================
// SESSION SERVICE (Extended)
// =====================================================

/**
 * Start a new session
 */
export function startSession(input: SessionInput = {}): Session {
  const id = generateId();
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO sessions (id, project, started_at, goals)
    VALUES (?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    input.project || null,
    now,
    input.goals ? JSON.stringify(input.goals) : null
  );
  
  return getSession(id)!;
}

/**
 * End a session
 */
export function endSession(id: string, summary?: string, accomplished?: string[], discoveries?: string[], files_changed?: string[]): Session | undefined {
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    UPDATE sessions SET
      ended_at = ?,
      summary = ?,
      discoveries = ?,
      accomplished = ?,
      files_changed = ?
    WHERE id = ?
  `);
  
  stmt.run(
    now,
    summary || null,
    discoveries ? JSON.stringify(discoveries) : null,
    accomplished ? JSON.stringify(accomplished) : null,
    files_changed ? JSON.stringify(files_changed) : null,
    id
  );
  
  return getSession(id);
}

/**
 * Get session by ID
 */
export function getSession(id: string): Session | undefined {
  const stmt = db.prepare('SELECT * FROM sessions WHERE id = ?');
  return stmt.get(id) as Session | undefined;
}

/**
 * Get recent sessions
 */
export function getRecentSessions(project?: string, limit = 10): Session[] {
  let sql = 'SELECT * FROM sessions';
  const params: any[] = [];
  
  if (project) {
    sql += ' WHERE project = ?';
    params.push(project);
  }
  
  sql += ' ORDER BY started_at DESC LIMIT ?';
  params.push(limit);
  
  const stmt = db.prepare(sql);
  return stmt.all(...params) as Session[];
}

/**
 * Get session context (recent sessions with their summaries)
 */
export function getSessionContext(project?: string, limit = 5): {
  sessions: Session[];
  prompts: { id: string; content: string; created_at: string }[];
} {
  const sessions = getRecentSessions(project, limit);
  
  let promptsSql = 'SELECT id, content, created_at FROM prompts';
  const params: any[] = [];
  
  if (project) {
    promptsSql += ' WHERE project = ?';
    params.push(project);
  }
  
  promptsSql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit * 2);
  
  const promptsStmt = db.prepare(promptsSql);
  const prompts = promptsStmt.all(...params) as any[];
  
  return { sessions, prompts };
}

// =====================================================
// SESSION METADATA SERVICE (Extended tracking)
// =====================================================

/**
 * Create session metadata entry
 */
export function createSessionMetadata(input: SessionMetadataInput): SessionMetadata {
  const id = generateId();
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO session_metadata (
      id, session_id, start_time, commands, files_touched, errors,
      skills_used, context_updates, duration_ms, tokens_used, project, scope
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    input.session_id,
    now,
    input.commands ? JSON.stringify(input.commands) : null,
    input.files_touched ? JSON.stringify(input.files_touched) : null,
    input.errors ? JSON.stringify(input.errors) : null,
    input.skills_used ? JSON.stringify(input.skills_used) : null,
    input.context_updates ? JSON.stringify(input.context_updates) : null,
    input.duration_ms || null,
    input.tokens_used || null,
    input.project || null,
    input.scope || 'project'
  );
  
  return getSessionMetadata(id)!;
}

/**
 * Update session metadata (add more info as session progresses)
 */
export function updateSessionMetadata(id: string, input: Partial<SessionMetadataInput>): SessionMetadata | undefined {
  const existing = getSessionMetadata(id);
  if (!existing) return undefined;
  
  const endTime = new Date().toISOString();
  
  const stmt = db.prepare(`
    UPDATE session_metadata SET
      end_time = ?,
      commands = COALESCE(?, commands),
      files_touched = COALESCE(?, files_touched),
      errors = COALESCE(?, errors),
      skills_used = COALESCE(?, skills_used),
      context_updates = COALESCE(?, context_updates),
      duration_ms = ?,
      tokens_used = ?
    WHERE id = ?
  `);
  
  stmt.run(
    endTime,
    input.commands ? JSON.stringify(input.commands) : existing.commands,
    input.files_touched ? JSON.stringify(input.files_touched) : existing.files_touched,
    input.errors ? JSON.stringify(input.errors) : existing.errors,
    input.skills_used ? JSON.stringify(input.skills_used) : existing.skills_used,
    input.context_updates ? JSON.stringify(input.context_updates) : existing.context_updates,
    input.duration_ms || existing.duration_ms,
    input.tokens_used || existing.tokens_used,
    id
  );
  
  return getSessionMetadata(id);
}

/**
 * Get session metadata by ID
 */
export function getSessionMetadata(id: string): SessionMetadata | undefined {
  const stmt = db.prepare('SELECT * FROM session_metadata WHERE id = ?');
  return stmt.get(id) as SessionMetadata | undefined;
}

/**
 * Get metadata by session ID
 */
export function getMetadataBySessionId(sessionId: string): SessionMetadata[] {
  const stmt = db.prepare('SELECT * FROM session_metadata WHERE session_id = ? ORDER BY start_time DESC');
  return stmt.all(sessionId) as SessionMetadata[];
}

/**
 * Get session statistics
 */
export function getSessionStats(project?: string): {
  totalSessions: number;
  totalCommands: number;
  totalFiles: number;
  totalErrors: number;
  totalSkills: number;
  avgDuration: number;
  avgTokens: number;
} {
  let whereClause = '';
  const params: any[] = [];
  
  if (project) {
    whereClause = ' WHERE project = ?';
    params.push(project);
  }
  
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM sessions' + whereClause);
  const totalSessions = (countStmt.get(...params) as any).count;
  
  // Get aggregate stats from metadata
  const metaStmt = db.prepare(`
    SELECT 
      COUNT(*) as count,
      SUM(json_length(commands)) as total_commands,
      SUM(json_length(files_touched)) as total_files,
      SUM(json_length(errors)) as total_errors,
      SUM(json_length(skills_used)) as total_skills,
      AVG(duration_ms) as avg_duration,
      AVG(tokens_used) as avg_tokens
    FROM session_metadata
    ${whereClause ? 'WHERE project = ?' : ''}
  `);
  
  const stats = metaStmt.get(...params) as any;
  
  return {
    totalSessions,
    totalCommands: stats.total_commands || 0,
    totalFiles: stats.total_files || 0,
    totalErrors: stats.total_errors || 0,
    totalSkills: stats.total_skills || 0,
    avgDuration: stats.avg_duration || 0,
    avgTokens: stats.avg_tokens || 0
  };
}

/**
 * Add a command to session metadata
 */
export function addCommandToSession(sessionId: string, command: string): SessionMetadata | undefined {
  const metadata = getMetadataBySessionId(sessionId)[0];
  if (!metadata) return undefined;
  
  const commands = metadata.commands ? JSON.parse(metadata.commands) : [];
  commands.push(command);
  
  return updateSessionMetadata(metadata.id, { commands });
}

/**
 * Add a skill to session metadata
 */
export function addSkillToSession(sessionId: string, skill: string): SessionMetadata | undefined {
  const metadata = getMetadataBySessionId(sessionId)[0];
  if (!metadata) return undefined;
  
  const skills = metadata.skills_used ? JSON.parse(metadata.skills_used) : [];
  if (!skills.includes(skill)) {
    skills.push(skill);
  }
  
  return updateSessionMetadata(metadata.id, { skills_used: skills });
}

export default {
  startSession,
  endSession,
  getSession,
  getRecentSessions,
  getSessionContext,
  createSessionMetadata,
  updateSessionMetadata,
  getSessionMetadata,
  getMetadataBySessionId,
  getSessionStats,
  addCommandToSession,
  addSkillToSession
};