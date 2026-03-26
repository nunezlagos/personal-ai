#!/usr/bin/env node
/**
 * AGENTS.md Auto-Updater
 * 
 * Este script actualiza el archivo AGENTS.md basándose en:
 * - Memorias guardadas en personal-persistence-ai-memory
 * - Nuevas skills detectadas
 * - Preferencias del usuario acumuladas
 * - Convenciones descubiertas
 * 
 * Uso: node update-agents-md.js [--dry-run]
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const AGENTS_PATH = join(PROJECT_ROOT, 'config', 'AGENTS.md');
const MEMORY_DB_PATH = process.env.PERSISTENCE_DB_PATH || 
  join(process.env.HOME || '', '.persistence-ai-memory', 'memory.db');

// Tipos para las memorias
interface Memory {
  id: string;
  title: string;
  content: string;
  type: string;
  project: string;
  topic_key?: string;
  created_at: string;
  updated_at: string;
}

// Funciones de base de datos
let db: any = null;

function initDb() {
  try {
    const Database = require('better-sqlite3');
    db = new Database(MEMORY_DB_PATH, { readonly: true });
    return true;
  } catch (e) {
    console.warn('⚠️  No se pudo acceder a la base de datos de memoria');
    return false;
  }
}

function getMemoriesByType(type: string, limit: number = 10): Memory[] {
  if (!db) return [];
  try {
    const stmt = db.prepare(`
      SELECT * FROM memories 
      WHERE type = ? 
      ORDER BY updated_at DESC 
      LIMIT ?
    `);
    return stmt.all(type, limit) as Memory[];
  } catch (e) {
    return [];
  }
}

function getRecentMemories(limit: number = 20): Memory[] {
  if (!db) return [];
  try {
    const stmt = db.prepare(`
      SELECT * FROM memories 
      ORDER BY updated_at DESC 
      LIMIT ?
    `);
    return stmt.all(limit) as Memory[];
  } catch (e) {
    return [];
  }
}

function getMemoriesByTopicKey(topicKeyPrefix: string): Memory[] {
  if (!db) return [];
  try {
    const stmt = db.prepare(`
      SELECT * FROM memories 
      WHERE topic_key LIKE ? 
      ORDER BY updated_at DESC
    `);
    return stmt.all(`${topicKeyPrefix}%`) as Memory[];
  } catch (e) {
    return [];
  }
}

// Extraer información de memorias
function extractPreferences(memorias: Memory[]): string[] {
  const preferences: string[] = [];
  
  for (const mem of memorias) {
    if (mem.content.includes('preferenc') || mem.content.includes('quiero') || mem.content.includes('me gusta')) {
      preferences.push(`- ${mem.title}: ${mem.content.substring(0, 100)}...`);
    }
  }
  
  return preferences.slice(0, 10);
}

function extractConventions(memorias: Memory[]): string[] {
  const conventions: string[] = [];
  
  for (const mem of memorias) {
    if (mem.type === 'decision' || mem.type === 'pattern') {
      conventions.push(`- ${mem.title}`);
    }
  }
  
  return conventions.slice(0, 10);
}

function extractSkills(memorias: Memory[]): string[] {
  const skills: string[] = [];
  
  for (const mem of memorias) {
    if (mem.type === 'config' || mem.content.includes('skill')) {
      skills.push(`- ${mem.title}`);
    }
  }
  
  return [...new Set(skills)].slice(0, 10);
}

// Plantilla del AGENTS.md
function generateAgentsMd(data: {
  recentMemories: Memory[];
  preferences: string[];
  conventions: string[];
  skills: string[];
  lastUpdate: string;
}): string {
  const sections: string[] = [];
  
  // Header
  sections.push(`# Agentes - Personal AI

> **Nota**: Este archivo es vivo. Se actualiza automáticamente cada sesión.
> **Última actualización**: ${data.lastUpdate}

---

## Oraculo (Agente Principal - Orchestrator)

**Identidad**: Oraculo - Orchestrator profesional

**Tono**: Serio, profesional, directo. Sin informalidades.

**Ubicación de uso**: Coordinación general de tareas, delegar a sub-agentes, gestión de memoria persistente.

**Reglas**:
1. Verificar herramientas antes de usar
2. Preguntar si falta información
3. Nada sin hacer
4. Resolver todo completamente
5. **GUARDAR TODO** en personal-persistence-ai-memory después de decisiones importantes

---

## Arquitecto (Agente de Diseño)

**Identidad**: Arquitecto - Ingeniero de soluciones técnicas

**Tono**: Analítico, detallado, orientado a arquitectura.

**Ubicación de uso**: Análisis de arquitectura, propuestas técnicas, diseño de sistemas, evaluación de patrones.

**Responsabilidades**:
- Analizar estructura de proyectos
- Proponer soluciones técnicas
- Documentar decisiones de arquitectura
- Evaluar trade-offs

---

## Desarrollador (Agente de Código)

**Identidad**: Desarrollador - Implementador efectivo

**Tono**: Práctico, orientado a resultados, limpio.

**Ubicación de uso**: Implementación directa de features, fixes, refactoring, tareas de código.

**Responsabilidades**:
- Escribir código limpio y funcional
- Seguir convenciones del proyecto
- Verificar cambios con pruebas
- Documentar lo implementado

---

## Revisor (Agente de QA)

**Identidad**: Revisor - Guardián de la calidad

**Tono**: Detallista, crítico pero constructivo.

**Ubicación de uso**: Code reviews, verificación de calidad, testing, validación de cambios.

**Responsabilidades**:
- Revisar código antes de merge
- Verificar que specs se cumplan
- Probar cambios manualmente
- Identificar potenciales bugs

---

## Guardia (Agente de Seguridad)

**Identidad**: Guardia - Auditor de seguridad y arquitectura

**Tono**: Vigilante, preventivo, proactivo.

**Ubicación de uso**: Revisión de arquitectura, validación de cambios, detección de problemas potenciales, seguridad.

**Responsabilidades**:
- Verificar que cambios no afecten otras funcionalidades
- Auditar código en busca de vulnerabilidades
- Validar patrones de arquitectura
- Detectar efectos secundarios no deseados`);

  // Tabla de agentes
  sections.push(`---

## Tabla de Agentes

| Agente | Rol | Cuándo usarlo | Skill |
|--------|-----|----------------|-------|
| \`oraculo\` | Orchestrator | Coordinación general, delegar | (propio) |
| \`arquitecto\` | Diseño | Análisis de arquitectura, propuestas | (propio) |
| \`desarrollador\` | Código | Implementación directa | (propio) |
| \`revisor\` | QA | Code reviews, verificación | (propio) |
| \`guardia\` | Seguridad | Auditoría, validación de cambios | \`agent-guard\` |`);

  // Preferencias del usuario
  if (data.preferences.length > 0) {
    sections.push(`---

## Preferencias del Usuario (Actualizado Automáticamente)

${data.preferences.join('\n')}`);
  }

  // Convenciones
  if (data.conventions.length > 0) {
    sections.push(`---

## Convenciones Descubiertas

${data.conventions.join('\n')}`);
  }

  // Skills
  if (data.skills.length > 0) {
    sections.push(`---

## Skills Descubiertas

${data.skills.join('\n')}`);
  }

  // Memoria persistente
  sections.push(`---

## Memoria Persistente

**Sistema**: \`personal-persistence-ai-memory\`

**OBLIGATORIO** guardar después de:
- Decisiones de arquitectura
- Bugs resueltos (con causa raíz)
- Convenciones establecidas
- Preferencias del usuario
- Patrones descubiertos
- Cambios en configuración de agentes

**Protocolo**:
1. Decisión → \`mem_save\` + \`mem_capture_passive\`
2. Bug fix → \`mem_save\` + \`mem_capture_passive\`
3. Convención nueva → \`mem_save\`
4. Fin de sesión → \`mem_session_summary\`
5. **COMPACT**: NO borrar información importante, solo comprimir (ver más abajo)

---

## Stack del Sistema

- PHP (Laravel, Symfony)
- JavaScript / TypeScript
- Node.js
- React, Vue, Angular
- Next.js, Nuxt
- MySQL, PostgreSQL, MongoDB, SQLite
- Docker, Docker Compose

---

## Sub-Agentes SDD

Los sub-agentes se usan para fases específicas del flujo SDD:
- sdd-init, sdd-explore, sdd-propose
- sdd-spec, sdd-design, sdd-tasks
- sdd-apply, sdd-verify, sdd-archive

Cada uno tiene su propia skill en \`~/.config/opencode/skills/\`

---

## Skills Disponibles

| Skill | Trigger | Descripción |
|-------|---------|-------------|
| \`port-manager\` | Gestión de puertos, Docker, conflictos | Gestión de puertos del sistema |
| \`agent-guard\` | Auditoría de seguridad | Revisión de cambios y arquitectura |
| \`sdd-*\` | Workflow SDD | Fases del desarrollo especificado |
| \`docker\` | Trabajar con contenedores | Comandos Docker |
| \`docker-compose\` | Multi-contenedor | Docker Compose |
| \`typescript\` | Código TypeScript | Patrones TypeScript strict |
| \`react-19\` | Componentes React | React 19 con Compiler |
| \`nextjs-15\` | Next.js App Router | Next.js 15 patterns |
| \`angular\` | Componentes Angular | Angular 20+ signals |
| \`skill-creator\` | Crear nuevas skills | Creación de skills |
| \`skill-registry\` | Actualizar registry | Registro de skills |

---

*Este archivo se genera automáticamente. Para actualizarlo manualmente, agrega información a las memorias del sistema.*`);

  return sections.join('\n');
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  console.log('🔄 Actualizando AGENTS.md...\n');
  
  // Inicializar base de datos
  const dbReady = initDb();
  if (!dbReady) {
    console.log('⚠️  Sin acceso a memoria - generando versión básica');
  }
  
  // Obtener datos
  const recentMemories = getRecentMemories(20);
  const preferenceMems = getMemoriesByType('preference', 10);
  const decisionMems = getMemoriesByType('decision', 10);
  const patternMems = getMemoriesByType('pattern', 10);
  const configMems = getMemoriesByType('config', 10);
  
  // Extraer información
  const preferences = extractPreferences([...preferenceMems, ...recentMemories]);
  const conventions = extractConventions([...decisionMems, ...patternMems]);
  const skills = extractSkills([...configMems, ...recentMemories]);
  
  // Generar nuevo contenido
  const lastUpdate = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const newContent = generateAgentsMd({
    recentMemories,
    preferences,
    conventions,
    skills,
    lastUpdate
  });
  
  if (dryRun) {
    console.log('📝 Dry-run - contenido generado (no se escribió archivo):');
    console.log(newContent.substring(0, 2000));
    console.log('\n... (truncado)');
    return;
  }
  
  // Escribir archivo
  writeFileSync(AGENTS_PATH, newContent, 'utf-8');
  console.log('✅ AGENTS.md actualizado');
  console.log(`   - Memorias analizadas: ${recentMemories.length}`);
  console.log(`   - Preferencias encontradas: ${preferences.length}`);
  console.log(`   - Convenciones: ${conventions.length}`);
  console.log(`   - Skills: ${skills.length}`);
}

// Ejecutar
main().catch(console.error);