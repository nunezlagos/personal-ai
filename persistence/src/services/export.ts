import { db } from '../db/connection.js';
import * as memory from './memory.js';
import * as session from './session.js';
import * as docs from './docs.js';
import * as skills from './skills.js';
import * as context from './context.js';
import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

// =====================================================
// EXPORT/IMPORT TYPES
// =====================================================

export interface ExportBundle {
  version: string;
  exported_at: string;
  project: string;
  memories: any[];
  sessions: any[];
  session_metadata: any[];
  documentation: any[];
  project_skills: any[];
  work_context: any[];
}

export interface ImportResult {
  imported: {
    memories: number;
    sessions: number;
    documentation: number;
    skills: number;
    context: number;
  };
  skipped: number;
  errors: string[];
}

export interface SyncOptions {
  sourceProject?: string;
  targetPath: string;
  mergeStrategy?: 'newer' | 'skip' | 'replace';
}

// =====================================================
// EXPORT FUNCTIONS
// =====================================================

/**
 * Export all data for a specific project
 */
export function exportProject(project: string): ExportBundle {
  const now = new Date().toISOString();
  
  // Get all data for the project
  const memories = db.prepare(`
    SELECT * FROM memories WHERE project = ? OR (project IS NULL AND scope = 'personal')
  `).all(project) as any[];
  
  const sessions = db.prepare(`
    SELECT * FROM sessions WHERE project = ?
  `).all(project) as any[];
  
  const sessionMetadata = db.prepare(`
    SELECT * FROM session_metadata WHERE project = ?
  `).all(project) as any[];
  
  const documentation = db.prepare(`
    SELECT * FROM documentation
  `).all() as any[];
  
  const projectSkills = db.prepare(`
    SELECT * FROM project_skills WHERE project = ?
  `).all(project) as any[];
  
  const workContext = db.prepare(`
    SELECT * FROM work_context WHERE project = ?
  `).all(project) as any[];
  
  return {
    version: '1.0',
    exported_at: now,
    project,
    memories,
    sessions,
    session_metadata: sessionMetadata,
    documentation,
    project_skills: projectSkills,
    work_context: workContext
  };
}

/**
 * Export project to file (.ppmem format - Persistence Profile Memory)
 */
export function exportToFile(project: string, filePath: string): string {
  const bundle = exportProject(project);
  
  // Create directory if it doesn't exist
  const dir = dirname(filePath);
  if (dir) {
    const fs = require('fs');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  
  // Write compressed JSON (simple compression)
  const jsonString = JSON.stringify(bundle);
  const compressed = compressString(jsonString);
  
  // Write with header to identify file type
  const fileContent = `PPMEM_V1\n${compressed}`;
  writeFileSync(filePath, fileContent, 'utf-8');
  
  return filePath;
}

/**
 * Get default export directory
 */
export function getDefaultExportPath(): string {
  return join(homedir(), '.persistence-ai-memory', 'exports');
}

// =====================================================
// IMPORT FUNCTIONS
// =====================================================

/**
 * Import project from file
 */
export function importFromFile(filePath: string, mergeStrategy: 'newer' | 'skip' | 'replace' = 'newer'): ImportResult {
  const result: ImportResult = {
    imported: {
      memories: 0,
      sessions: 0,
      documentation: 0,
      skills: 0,
      context: 0
    },
    skipped: 0,
    errors: []
  };
  
  try {
    // Read and decompress file
    const fileContent = readFileSync(filePath, 'utf-8');
    
    // Check header
    if (!fileContent.startsWith('PPMEM_V1\n')) {
      throw new Error('Invalid file format. Expected .ppmem file.');
    }
    
    const compressed = fileContent.substring(8); // Remove header
    const jsonString = decompressString(compressed);
    const bundle: ExportBundle = JSON.parse(jsonString);
    
    // Validate bundle
    if (!bundle.version || !bundle.project) {
      throw new Error('Invalid bundle structure');
    }
    
    // Import memories
    result.imported.memories = importMemories(bundle.memories, mergeStrategy);
    
    // Import sessions
    result.imported.sessions = importSessions(bundle.sessions, mergeStrategy);
    
    // Import session metadata
    importSessionMetadata(bundle.session_metadata, mergeStrategy);
    
    // Import documentation
    result.imported.documentation = importDocumentation(bundle.documentation, mergeStrategy);
    
    // Import skills
    result.imported.skills = importSkills(bundle.project_skills, mergeStrategy);
    
    // Import context
    result.imported.context = importContext(bundle.work_context, mergeStrategy);
    
  } catch (error: any) {
    result.errors.push(error.message);
  }
  
  return result;
}

/**
 * Import memories with conflict resolution
 */
function importMemories(memories: any[], strategy: string): number {
  let imported = 0;
  
  for (const mem of memories) {
    try {
      const existing = db.prepare(`
        SELECT * FROM memories WHERE id = ?
      `).get(mem.id) as any;
      
      if (existing) {
        if (strategy === 'skip') {
          continue;
        } else if (strategy === 'newer' && new Date(existing.updated_at) >= new Date(mem.updated_at)) {
          continue;
        } else if (strategy === 'replace') {
          db.prepare(`
            DELETE FROM memories WHERE id = ?
          `).run(mem.id);
        }
      }
      
      // Insert memory
      db.prepare(`
        INSERT INTO memories (id, title, content, type, project, scope, topic_key, tool_name, session_id, revision_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        mem.id, mem.title, mem.content, mem.type, mem.project, mem.scope,
        mem.topic_key, mem.tool_name, mem.session_id, mem.revision_count || 0,
        mem.created_at, mem.updated_at
      );
      
      imported++;
    } catch (e: any) {
      // Skip duplicates or conflicts
    }
  }
  
  return imported;
}

/**
 * Import sessions with conflict resolution
 */
function importSessions(sessions: any[], strategy: string): number {
  let imported = 0;
  
  for (const sess of sessions) {
    try {
      const existing = db.prepare(`
        SELECT * FROM sessions WHERE id = ?
      `).get(sess.id) as any;
      
      if (existing) {
        if (strategy === 'skip') continue;
        if (strategy === 'newer' && new Date(existing.ended_at || existing.started_at) >= new Date(sess.ended_at || sess.started_at)) continue;
        db.prepare(`DELETE FROM sessions WHERE id = ?`).run(sess.id);
      }
      
      db.prepare(`
        INSERT INTO sessions (id, project, started_at, ended_at, summary, goals, accomplished, commands_executed, files_touched, errors_encountered, skills_used)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        sess.id, sess.project, sess.started_at, sess.ended_at, sess.summary,
        sess.goals, sess.accomplished, sess.commands_executed,
        sess.files_touched, sess.errors_encountered, sess.skills_used
      );
      
      imported++;
    } catch (e: any) {
      // Skip
    }
  }
  
  return imported;
}

/**
 * Import session metadata
 */
function importSessionMetadata(metadata: any[], strategy: string): void {
  for (const meta of metadata) {
    try {
      db.prepare(`
        INSERT OR REPLACE INTO session_metadata (session_id, key, value, created_at)
        VALUES (?, ?, ?, ?)
      `).run(meta.session_id, meta.key, meta.value, meta.created_at);
    } catch (e: any) {
      // Skip
    }
  }
}

/**
 * Import documentation
 */
function importDocumentation(docs: any[], strategy: string): number {
  let imported = 0;
  
  for (const doc of docs) {
    try {
      const existing = db.prepare(`
        SELECT * FROM documentation WHERE id = ?
      `).get(doc.id);
      
      if (existing && strategy !== 'replace') continue;
      
      db.prepare(`
        INSERT INTO documentation (id, framework, title, content, category, access_count, last_accessed)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        doc.id, doc.framework, doc.title, doc.content, doc.category,
        doc.access_count || 0, doc.last_accessed
      );
      
      imported++;
    } catch (e: any) {
      // Skip
    }
  }
  
  return imported;
}

/**
 * Import project skills
 */
function importSkills(skillsList: any[], strategy: string): number {
  let imported = 0;
  
  for (const skill of skillsList) {
    try {
      const existing = db.prepare(`
        SELECT * FROM project_skills WHERE project = ? AND skill_name = ?
      `).get(skill.project, skill.skill_name);
      
      if (existing && strategy !== 'replace') continue;
      
      db.prepare(`
        INSERT OR REPLACE INTO project_skills (id, project, skill_name, skill_type, detected_from, version, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(skill.id || require('crypto').randomUUID(), skill.project, skill.skill_name, 
             skill.skill_type, skill.detected_from, skill.version, skill.created_at);
      
      imported++;
    } catch (e: any) {
      // Skip
    }
  }
  
  return imported;
}

/**
 * Import work context
 */
function importContext(contexts: any[], strategy: string): number {
  let imported = 0;
  
  for (const ctx of contexts) {
    try {
      const existing = db.prepare(`
        SELECT * FROM work_context WHERE project = ?
      `).get(ctx.project);
      
      if (existing && strategy !== 'replace') continue;
      
      db.prepare(`
        INSERT OR REPLACE INTO work_context (project, current_task, task_status, progress, blockers, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        ctx.project, ctx.current_task, ctx.task_status, ctx.progress,
        ctx.blockers, ctx.notes, ctx.created_at, ctx.updated_at
      );
      
      imported++;
    } catch (e: any) {
      // Skip
    }
  }
  
  return imported;
}

// =====================================================
// SYNC FUNCTIONS
// =====================================================

/**
 * Sync project to another location (export + optional import)
 */
export function syncProject(options: SyncOptions): { exported: string; imported?: ImportResult } {
  const { sourceProject, targetPath, mergeStrategy = 'newer' } = options;
  
  if (!sourceProject) {
    throw new Error('sourceProject is required for sync');
  }
  
  // Export to target path
  const exportPath = targetPath.endsWith('.ppmem') 
    ? targetPath 
    : join(targetPath, `${sourceProject}_${Date.now()}.ppmem`);
  
  exportToFile(sourceProject, exportPath);
  
  return {
    exported: exportPath
  };
}

// =====================================================
// COMPRESSION UTILITIES (Simple RLE-like compression)
// =====================================================

/**
 * Simple string compression for JSON
 * Uses basic substitution for common patterns
 */
function compressString(input: string): string {
  // Simple replacements for common patterns
  let result = input
    .replace(/"project":"/g, '"p":"')
    .replace(/"created_at":"/g, '"ca":"')
    .replace(/"updated_at":"/g, '"ua":"')
    .replace(/"started_at":"/g, '"sa":"')
    .replace(/"ended_at":"/g, '"ea":"')
    .replace(/"session_id":"/g, '"sid":"')
    .replace(/"topic_key":"/g, '"tk":"')
    .replace(/"skill_name":"/g, '"sn":"')
    .replace(/"skill_type":"/g, '"st":"')
    .replace(/"detected_from":"/g, '"df":"')
    .replace(/"content":"/g, '"c":"')
    .replace(/"title":"/g, '"t":"')
    .replace(/"type":"/g, '"tp":"')
    .replace(/"scope":"/g, '"sc":"')
    .replace(/"memory_type":"/g, '"mt":"')
    .replace(/"current_task":"/g, '"ct":"')
    .replace(/"task_status":"/g, '"ts":"')
    .replace(/"access_count":"/g, '"ac":"')
    .replace(/"last_accessed":"/g, '"la":"')
    .replace(/"framework":"/g, '"fw":"')
    .replace(/"category":"/g, '"cat":"')
    .replace(/"summary":"/g, '"sm":"')
    .replace(/"goals":"/g, '"g":"')
    .replace(/"accomplished":"/g, '"acc":"')
    .replace(/"commands_executed":"/g, '"ce":"')
    .replace(/"files_touched":"/g, '"ft":"')
    .replace(/"errors_encountered":"/g, '"ee":"')
    .replace(/"skills_used":"/g, '"su":"')
    .replace(/"revision_count":"/g, '"rc":"')
    .replace(/"tool_name":"/g, '"tn":"')
    .replace(/"blockers":"/g, '"bl":"')
    .replace(/"notes":"/g, '"nt":"')
    .replace(/"progress":"/g, '"pr":"')
    .replace(/"version":"/g, '"v":"')
    .replace(/"exported_at":"/g, '"ea":"');
  
  // Remove unnecessary whitespace
  result = result.replace(/\s+/g, ' ').trim();
  
  return result;
}

/**
 * Decompress string
 */
function decompressString(input: string): string {
  let result = input
    .replace(/"p":"/g, '"project":"')
    .replace(/"ca":"/g, '"created_at":"')
    .replace(/"ua":"/g, '"updated_at":"')
    .replace(/"sa":"/g, '"started_at":"')
    .replace(/"ea":"/g, '"ended_at":"')
    .replace(/"sid":"/g, '"session_id":"')
    .replace(/"tk":"/g, '"topic_key":"')
    .replace(/"sn":"/g, '"skill_name":"')
    .replace(/"st":"/g, '"skill_type":"')
    .replace(/"df":"/g, '"detected_from":"')
    .replace(/"c":"/g, '"content":"')
    .replace(/"t":"/g, '"title":"')
    .replace(/"tp":"/g, '"type":"')
    .replace(/"sc":"/g, '"scope":"')
    .replace(/"mt":"/g, '"memory_type":"')
    .replace(/"ct":"/g, '"current_task":"')
    .replace(/"ts":"/g, '"task_status":"')
    .replace(/"ac":"/g, '"access_count":"')
    .replace(/"la":"/g, '"last_accessed":"')
    .replace(/"fw":"/g, '"framework":"')
    .replace(/"cat":"/g, '"category":"')
    .replace(/"sm":"/g, '"summary":"')
    .replace(/"g":"/g, '"goals":"')
    .replace(/"acc":"/g, '"accomplished":"')
    .replace(/"ce":"/g, '"commands_executed":"')
    .replace(/"ft":"/g, '"files_touched":"')
    .replace(/"ee":"/g, '"errors_encountered":"')
    .replace(/"su":"/g, '"skills_used":"')
    .replace(/"rc":"/g, '"revision_count":"')
    .replace(/"tn":"/g, '"tool_name":"')
    .replace(/"bl":"/g, '"blockers":"')
    .replace(/"nt":"/g, '"notes":"')
    .replace(/"pr":"/g, '"progress":"')
    .replace(/"v":"/g, '"version":"');
  
  return result;
}

// =====================================================
// DEFAULT EXPORTS
// =====================================================

export default {
  exportProject,
  exportToFile,
  importFromFile,
  syncProject,
  getDefaultExportPath
};