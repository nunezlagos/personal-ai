#!/usr/bin/env node
/**
 * personal-persistence-ai-memory — MCP stdio server
 *
 * Servidor MCP que se comunica por stdio (JSON-RPC 2.0).
 * Accede a SQLite directamente, sin HTTP server.
 *
 * Uso: node dist/mcp.js
 * Claude Code / OpenCode lo lanzan como proceso hijo.
 */

import { createInterface } from 'readline';
import {
  saveMemory,
  searchMemories,
  getMemoryById,
  updateMemory,
  deleteMemory,
  getMemoryStats,
  upsertMemory,
} from './services/memory.js';
import {
  startSession,
  endSession,
  getRecentSessions,
  getSessionContext,
} from './services/session.js';

// ─── MCP helpers ────────────────────────────────────

const JSONRPC = '2.0';

function ok(id: any, result: unknown) {
  return { jsonrpc: JSONRPC, id, result };
}

function err(id: any, code: number, message: string) {
  return { jsonrpc: JSONRPC, id, error: { code, message } };
}

function send(obj: unknown) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

// ─── Tool definitions (para tools/list) ─────────────

const TOOLS = [
  {
    name: 'mem_save',
    description:
      'Guarda una memoria persistente. Llamar INMEDIATAMENTE después de: bug fix, decisión de arquitectura, convención establecida, preferencia del usuario, descubrimiento no obvio.',
    inputSchema: {
      type: 'object',
      required: ['title', 'content'],
      properties: {
        title: { type: 'string', description: 'Verbo + qué. Corto y buscable. Ej: "Fixed N+1 query en UserList"' },
        content: { type: 'string', description: 'What/Why/Where/Learned. Qué se hizo, por qué, archivos afectados, gotchas.' },
        type: {
          type: 'string',
          enum: ['bugfix', 'decision', 'architecture', 'discovery', 'pattern', 'config', 'preference', 'learning'],
          description: 'Tipo de memoria. Usar el más específico.',
        },
        project: { type: 'string', description: 'Nombre del proyecto. Usar el nombre del repo git si es posible.' },
        scope: { type: 'string', enum: ['project', 'personal'], description: 'Scope de la memoria. Default: project.' },
        topic_key: { type: 'string', description: 'Clave estable para temas evolutivos. Ej: "architecture/auth-model". Reutilizar la misma key para actualizar un tema.' },
      },
    },
  },
  {
    name: 'mem_search',
    description: 'Busca en memorias con FTS5 full-text search. Usar cuando el usuario pregunta por algo pasado o antes de empezar trabajo que puede haber sido hecho antes.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Palabras clave a buscar.' },
        project: { type: 'string', description: 'Filtrar por proyecto.' },
        type: { type: 'string', description: 'Filtrar por tipo de memoria.' },
        scope: { type: 'string', description: 'Filtrar por scope.' },
        limit: { type: 'number', description: 'Máximo de resultados. Default: 20.' },
      },
    },
  },
  {
    name: 'mem_get',
    description: 'Obtiene el contenido completo de una memoria por ID.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'ID de la memoria.' },
      },
    },
  },
  {
    name: 'mem_update',
    description: 'Actualiza una memoria existente por ID.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'ID de la memoria a actualizar.' },
        title: { type: 'string' },
        content: { type: 'string' },
        type: { type: 'string' },
        topic_key: { type: 'string' },
      },
    },
  },
  {
    name: 'mem_delete',
    description: 'Elimina una memoria por ID.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'ID de la memoria a eliminar.' },
      },
    },
  },
  {
    name: 'mem_context',
    description: 'Obtiene el contexto de sesiones recientes. Llamar al inicio de sesión o cuando el usuario pregunta "qué hicimos antes".',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'Filtrar por proyecto.' },
        limit: { type: 'number', description: 'Cantidad de sesiones. Default: 5.' },
      },
    },
  },
  {
    name: 'mem_session_summary',
    description:
      'OBLIGATORIO antes de cerrar sesión. Guarda el resumen de lo que se hizo. Llamar también después de compactación de contexto.',
    inputSchema: {
      type: 'object',
      required: ['summary'],
      properties: {
        summary: {
          type: 'string',
          description:
            'Resumen con estructura:\n## Goal\n[Qué se trabajó]\n\n## Accomplished\n- [items]\n\n## Discoveries\n- [hallazgos]\n\n## Next Steps\n- [qué falta]',
        },
        project: { type: 'string', description: 'Nombre del proyecto.' },
        accomplished: { type: 'array', items: { type: 'string' }, description: 'Lista de cosas completadas.' },
        discoveries: { type: 'array', items: { type: 'string' }, description: 'Hallazgos técnicos.' },
        files_changed: { type: 'array', items: { type: 'string' }, description: 'Archivos modificados.' },
      },
    },
  },
  {
    name: 'mem_session_start',
    description: 'Inicia una nueva sesión de trabajo. Llamar al abrir el agente.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'Nombre del proyecto.' },
        goals: { type: 'array', items: { type: 'string' }, description: 'Objetivos de la sesión.' },
      },
    },
  },
  {
    name: 'mem_stats',
    description: 'Estadísticas de memorias guardadas.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'Filtrar por proyecto.' },
      },
    },
  },
  {
    name: 'mem_timeline',
    description: 'Obtiene las sesiones más recientes ordenadas cronológicamente.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'Filtrar por proyecto.' },
        limit: { type: 'number', description: 'Cantidad de sesiones. Default: 10.' },
      },
    },
  },
  {
    name: 'mem_suggest_topic_key',
    description: 'Sugiere una topic_key estable basada en el título. Usar antes de mem_save cuando no estás seguro de la key.',
    inputSchema: {
      type: 'object',
      required: ['title'],
      properties: {
        title: { type: 'string', description: 'Título de la memoria.' },
      },
    },
  },
];

// ─── Tool handlers ───────────────────────────────────

async function callTool(name: string, args: Record<string, any>): Promise<string> {
  switch (name) {
    case 'mem_save': {
      const mem = upsertMemory({
        title: args.title,
        content: args.content,
        type: args.type || 'learning',
        project: args.project,
        scope: args.scope || 'project',
        topic_key: args.topic_key,
      });
      return `✓ Memoria guardada: "${mem.title}" (id: ${mem.id}, type: ${mem.type})`;
    }

    case 'mem_search': {
      const results = searchMemories({
        query: args.query,
        type: args.type,
        project: args.project,
        scope: args.scope,
        limit: args.limit || 20,
      });
      if (results.length === 0) return 'No se encontraron memorias para esa búsqueda.';
      return results
        .map(
          (m) =>
            `[${m.id}] [${m.type}] ${m.title}\n${m.content.substring(0, 200)}${m.content.length > 200 ? '...' : ''}\n`
        )
        .join('\n---\n');
    }

    case 'mem_get': {
      const mem = getMemoryById(args.id);
      if (!mem) return `No se encontró memoria con id: ${args.id}`;
      return JSON.stringify(mem, null, 2);
    }

    case 'mem_update': {
      const mem = updateMemory(args.id, {
        title: args.title,
        content: args.content,
        type: args.type,
        topic_key: args.topic_key,
      });
      if (!mem) return `No se encontró memoria con id: ${args.id}`;
      return `✓ Memoria actualizada: "${mem.title}" (id: ${mem.id})`;
    }

    case 'mem_delete': {
      const ok2 = deleteMemory(args.id);
      return ok2 ? `✓ Memoria eliminada: ${args.id}` : `No se encontró memoria con id: ${args.id}`;
    }

    case 'mem_context': {
      const ctx = getSessionContext(args.project, args.limit || 5);
      if (ctx.sessions.length === 0) return 'No hay sesiones previas registradas.';
      const sessionsText = ctx.sessions
        .map((s) => {
          const summary = s.summary ? `\nSummary: ${s.summary.substring(0, 300)}` : '';
          return `Session [${s.id.substring(0, 8)}] ${s.started_at} — ${s.project || 'unknown'}${summary}`;
        })
        .join('\n\n');
      return `## Contexto de sesiones recientes\n\n${sessionsText}`;
    }

    case 'mem_session_summary': {
      // Buscar sesión activa (no terminada) más reciente del proyecto
      const sessions = getRecentSessions(args.project, 5);
      const active = sessions.find((s) => !s.ended_at);

      if (active) {
        endSession(
          active.id,
          args.summary,
          args.accomplished,
          args.discoveries,
          args.files_changed
        );
        return `✓ Sesión ${active.id.substring(0, 8)} finalizada con resumen guardado.`;
      }

      // Si no hay sesión activa, crear una nueva y cerrarla con el resumen
      const newSession = startSession({ project: args.project });
      endSession(
        newSession.id,
        args.summary,
        args.accomplished,
        args.discoveries,
        args.files_changed
      );
      return `✓ Resumen de sesión guardado (id: ${newSession.id.substring(0, 8)}).`;
    }

    case 'mem_session_start': {
      const session = startSession({
        project: args.project,
        goals: args.goals,
      });
      const ctx = getSessionContext(args.project, 3);
      let response = `✓ Sesión iniciada (id: ${session.id.substring(0, 8)}, proyecto: ${args.project || 'unknown'})`;

      if (ctx.sessions.length > 1) {
        // Hay sesiones previas: mostrar contexto
        const prevSessions = ctx.sessions.slice(1);
        const prevSummaries = prevSessions
          .filter((s) => s.summary)
          .map((s) => `[${s.started_at.substring(0, 10)}] ${s.summary!.substring(0, 200)}`)
          .join('\n\n');
        if (prevSummaries) {
          response += `\n\n## Contexto de sesiones anteriores\n\n${prevSummaries}`;
        }
      }
      return response;
    }

    case 'mem_stats': {
      const stats = getMemoryStats(args.project);
      const byType = Object.entries(stats.byType)
        .map(([t, c]) => `  ${t}: ${c}`)
        .join('\n');
      return `## Estadísticas de memorias\n\nTotal: ${stats.total}\n\nPor tipo:\n${byType}`;
    }

    case 'mem_timeline': {
      const sessions = getRecentSessions(args.project, args.limit || 10);
      if (sessions.length === 0) return 'No hay sesiones registradas.';
      return sessions
        .map(
          (s) =>
            `[${s.started_at.substring(0, 10)}] ${s.project || 'unknown'} — ${
              s.summary ? s.summary.substring(0, 100) : 'sin resumen'
            }`
        )
        .join('\n');
    }

    case 'mem_suggest_topic_key': {
      const key = (args.title as string)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '/')
        .replace(/^\/|\/$/g, '')
        .substring(0, 60);
      return `Suggested topic_key: "${key}"`;
    }

    default:
      throw new Error(`Tool desconocido: ${name}`);
  }
}

// ─── MCP request handler ─────────────────────────────

async function handle(msg: any): Promise<any> {
  const { id, method, params } = msg;

  if (method === 'initialize') {
    return ok(id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'personal-persistence-ai-memory', version: '1.0.0' },
    });
  }

  if (method === 'initialized') {
    return null; // notificación, sin respuesta
  }

  if (method === 'tools/list') {
    return ok(id, { tools: TOOLS });
  }

  if (method === 'tools/call') {
    const toolName = params?.name;
    const toolArgs = params?.arguments ?? {};
    try {
      const result = await callTool(toolName, toolArgs);
      return ok(id, { content: [{ type: 'text', text: result }] });
    } catch (e: any) {
      return ok(id, {
        content: [{ type: 'text', text: `Error: ${e.message}` }],
        isError: true,
      });
    }
  }

  if (method === 'ping') {
    return ok(id, {});
  }

  return err(id, -32601, `Method not found: ${method}`);
}

// ─── Main loop ───────────────────────────────────────

async function main() {
  // Logging va a stderr (no contamina stdout que usa el protocolo MCP)
  process.stderr.write('[persistence-mcp] started\n');

  const rl = createInterface({ input: process.stdin, terminal: false });
  let buf = '';

  rl.on('line', async (line) => {
    buf += line;
    try {
      const msg = JSON.parse(buf);
      buf = '';
      const response = await handle(msg);
      if (response !== null) {
        send(response);
      }
    } catch {
      // Buffer incompleto, seguir acumulando
    }
  });

  process.stdin.on('end', () => {
    process.stderr.write('[persistence-mcp] stdin closed, exiting\n');
    process.exit(0);
  });

  process.on('SIGTERM', () => process.exit(0));
  process.on('SIGINT', () => process.exit(0));
}

main();
