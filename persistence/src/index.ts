/**
 * personal-persistence-ai-memory
 * Persistent memory layer for AI agents with extended session tracking, docs indexing, and skills detection
 */

// DB
export { db, getDbPath, close } from './db/connection.js';

// Services
export * as memory from './services/memory.js';
export * as session from './services/session.js';
export * as docs from './services/docs.js';
export * as skills from './services/skills.js';
export * as context from './services/context.js';
export * as sddContext from './services/sdd-context.js';
export * as compaction from './services/compaction.js';
export * as exportImport from './services/export.js';
export * as tokenOptimize from './services/token-optimize.js';

// API
export { startServer } from './api/server.js';
export { default as app } from './api/server.js';

// Types
export type { Memory, MemoryInput, SearchOptions } from './services/memory.js';
export type { Session, SessionMetadata, SessionInput } from './services/session.js';
export type { Documentation, DocumentationInput, DocSearchOptions } from './services/docs.js';
export type { ProjectSkill, SkillInput } from './services/skills.js';
export type { WorkContext, WorkContextInput } from './services/context.js';
export type { SDDPhase, SDDChange, SDDDecision, SDDContext } from './services/sdd-context.js';
export type { MemoryTTLPolicy, CompactionResult, TTLStats } from './services/compaction.js';
export type { ExportBundle, ImportResult, SyncOptions } from './services/export.js';
export type { TokenOptimizeOptions } from './services/token-optimize.js';