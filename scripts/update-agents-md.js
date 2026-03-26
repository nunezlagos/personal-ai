#!/usr/bin/env node
/**
 * AGENTS.md Info Reporter
 *
 * Lee memorias del sistema y muestra un resumen informativo.
 * NO sobreescribe AGENTS.md — ese archivo se edita manualmente.
 *
 * Uso: node update-agents-md.js [--dry-run]
 */

import { existsSync } from 'fs';
import { join } from 'path';

const MEMORY_DB_PATH = process.env.PERSISTENCE_DB_PATH ||
  join(process.env.HOME || '', 'personal-persistence-ai-memory', 'data', 'memory.db');

let db = null;

function initDb() {
  try {
    // dynamic require para better-sqlite3
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    const Database = require('better-sqlite3');
    db = new Database(MEMORY_DB_PATH, { readonly: true });
    return true;
  } catch (e) {
    return false;
  }
}

function getMemories(limit = 20) {
  if (!db) return [];
  try {
    return db.prepare('SELECT id, title, type, topic_key, updated_at FROM memories ORDER BY updated_at DESC LIMIT ?').all(limit);
  } catch (e) {
    return [];
  }
}

async function main() {
  console.log('📊 Estado de memorias personal-ai\n');

  if (!existsSync(MEMORY_DB_PATH)) {
    console.log('⚠️  Base de datos no encontrada:', MEMORY_DB_PATH);
    console.log('   Ejecutá install.sh para configurar el sistema.');
    return;
  }

  const ready = await initDb();
  if (!ready) {
    console.log('⚠️  No se pudo conectar a la base de datos.');
    console.log('   Verificá que better-sqlite3 esté instalado en personal-persistence-ai-memory.');
    return;
  }

  const memories = getMemories(50);

  if (memories.length === 0) {
    console.log('Sin memorias guardadas aún.');
    return;
  }

  console.log(`Total: ${memories.length} memorias\n`);

  // Agrupar por type
  const byType = {};
  for (const m of memories) {
    if (!byType[m.type]) byType[m.type] = [];
    byType[m.type].push(m);
  }

  for (const [type, mems] of Object.entries(byType)) {
    console.log(`[${type}]`);
    for (const m of mems) {
      const key = m.topic_key ? ` (${m.topic_key})` : '';
      console.log(`  - ${m.title}${key}`);
    }
    console.log('');
  }
}

main().catch(console.error);
