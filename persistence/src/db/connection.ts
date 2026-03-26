import Database, { Database as DatabaseType } from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Database path - configurable via env
const DB_PATH = process.env.PERSISTENCE_DB_PATH || 
  process.env.HOME + '/.persistence-ai-memory/memory.db';

// Ensure directory exists
import { mkdirSync, existsSync } from 'fs';
const dbDir = dirname(DB_PATH);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

// Initialize database
const db: DatabaseType = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Run migrations
const schemaPath = join(__dirname, 'schema.sql');
const schema = readFileSync(schemaPath, 'utf-8');
db.exec(schema);

// Export database instance
export { db };
export default db;

// Helper to get DB path
export function getDbPath(): string {
  return DB_PATH;
}

// Helper to close DB
export function close(): void {
  db.close();
}