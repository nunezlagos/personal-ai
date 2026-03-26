#!/usr/bin/env node
/**
 * MCP Bridge - Convierte llamadas MCP stdio a HTTP de personal-persistence-ai-memory
 * 
 * Usa: node mcp-bridge.js
 */

import readline from 'readline';
import { spawn } from 'child_process';

const SERVER_URL = 'http://localhost:7438';

// MCP message types
const JSONRPC_VERSION = '2.0';

function createResponse(id, result) {
  return { jsonrpc: JSONRPC_VERSION, id, result };
}

function createError(id, code, message) {
  return { jsonrpc: JSONRPC_VERSION, id, error: { code, message } };
}

// Tool handlers - mapean herramientas MCP a endpoints HTTP
const tools = {
  mem_save: async (params) => {
    const res = await fetch(`${SERVER_URL}/api/memories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: params.title,
        content: params.content,
        type: params.type || 'learning',
        project: params.project,
        scope: params.scope || 'project',
        topic_key: params.topic_key
      })
    });
    return await res.json();
  },

  mem_search: async (params) => {
    const query = params.query || '';
    const url = new URL(`${SERVER_URL}/api/memories`);
    if (query) url.searchParams.set('query', query);
    if (params.type) url.searchParams.set('type', params.type);
    if (params.project) url.searchParams.set('project', params.project);
    if (params.scope) url.searchParams.set('scope', params.scope);
    url.searchParams.set('limit', String(params.limit || 20));
    
    const res = await fetch(url);
    const results = await res.json();
    return { observations: results.map(m => ({
      id: m.id,
      title: m.title,
      content: m.content,
      type: m.type,
      project: m.project,
      created_at: m.created_at
    }))};
  },

  mem_context: async (params) => {
    const url = new URL(`${SERVER_URL}/api/context`);
    if (params.project) url.searchParams.set('project', params.project);
    url.searchParams.set('limit', String(params.limit || 5));
    
    const res = await fetch(url);
    return await res.json();
  },

  mem_session_summary: async (params) => {
    const res = await fetch(`${SERVER_URL}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project: params.project,
        summary: params.summary,
        goals: params.goals
      })
    });
    return await res.json();
  },

  mem_get: async (params) => {
    const res = await fetch(`${SERVER_URL}/api/memories/${params.id}`);
    if (!res.ok) return null;
    const m = await res.json();
    return { ...m, content: m.content };
  },

  mem_update: async (params) => {
    const res = await fetch(`${SERVER_URL}/api/memories/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: params.title,
        content: params.content,
        type: params.type
      })
    });
    return await res.json();
  },

  mem_delete: async (params) => {
    const res = await fetch(`${SERVER_URL}/api/memories/${params.id}`, {
      method: 'DELETE'
    });
    return { success: res.ok };
  },

  mem_list: async (params) => {
    const url = new URL(`${SERVER_URL}/api/memories`);
    if (params.project) url.searchParams.set('project', params.project);
    if (params.scope) url.searchParams.set('scope', params.scope);
    url.searchParams.set('limit', String(params.limit || 50));
    
    const res = await fetch(url);
    return await res.json();
  },

  mem_timeline: async (params) => {
    const res = await fetch(`${SERVER_URL}/api/sessions?limit=20`);
    return { sessions: await res.json() };
  },

  mem_stats: async (params) => {
    const url = new URL(`${SERVER_URL}/api/memories/stats`);
    if (params.project) url.searchParams.set('project', params.project);
    return await fetch(url).then(r => r.json());
  },

  mem_recent: async (params) => {
    const url = new URL(`${SERVER_URL}/api/memories`);
    if (params.project) url.searchParams.set('project', params.project);
    url.searchParams.set('limit', String(params.limit || 10));
    
    const res = await fetch(url);
    return await res.json();
  },

  mem_session_start: async (params) => {
    const res = await fetch(`${SERVER_URL}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project: params.project })
    });
    return await res.json();
  },

  mem_session_end: async (params) => {
    const res = await fetch(`${SERVER_URL}/api/sessions/${params.id}/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: params.summary,
        accomplished: params.accomplished
      })
    });
    return await res.json();
  },

  mem_save_prompt: async (params) => {
    // Similar a mem_save pero para prompts
    const res = await fetch(`${SERVER_URL}/api/memories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Prompt: ${params.content.substring(0, 50)}...`,
        content: params.content,
        type: 'prompt',
        project: params.project
      })
    });
    return await res.json();
  },

  mem_get_observation: async (params) => {
    const res = await fetch(`${SERVER_URL}/api/memories/${params.id}`);
    if (!res.ok) return null;
    return await res.json();
  },

  mem_suggest_topic_key: async (params) => {
    // Genera un topic_key basado en el título
    const key = params.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '/')
      .replace(/^\/|\/$/g, '');
    return { topic_key: key };
  }
};

// MCP Protocol handlers
async function handleRequest(msg) {
  const { id, method, params } = msg;

  // Initialize response
  if (method === 'initialize') {
    return createResponse(id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: { listChanged: true } },
      serverInfo: { name: 'personal-persistence-ai-memory', version: '1.0.0' },
      instructions: 'Personal AI Memory - MCP Bridge'
    });
  }

  // Tools listing
  if (method === 'tools/list') {
    const toolList = Object.keys(tools).map(name => ({
      name,
      description: `${name} - personal-persistence-ai-memory tool`,
      inputSchema: { type: 'object', properties: {} }
    }));
    return createResponse(id, { tools: toolList });
  }

  // Tool call
  if (method === 'tools/call') {
    const toolName = params.name;
    const toolParams = params.arguments || {};
    
    if (tools[toolName]) {
      try {
        const result = await tools[toolName](toolParams);
        return createResponse(id, { content: [{ type: 'text', text: JSON.stringify(result) }] });
      } catch (e) {
        return createError(id, -32603, String(e));
      }
    }
    return createError(id, -32601, `Tool not found: ${toolName}`);
  }

  // Ping
  if (method === 'ping') {
    return createResponse(id, null);
  }

  return createError(id, -32601, `Method not found: ${method}`);
}

// Check server health and start if needed
async function checkServer() {
  try {
    const res = await fetch(`${SERVER_URL}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    // Server not running, try to start it
    return await startServer();
  }
}

// Start the persistence server
async function startServer() {
  console.error('Starting personal-persistence-ai-memory server...');
  
  return new Promise((resolve) => {
    const child = spawn('npm', ['run', 'cli', '--', 'serve', '-p', '7438'], {
      cwd: '/home/nunezlagos/personal-persistence-ai-memory',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    child.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('running on')) {
        resolve(true);
      }
    });
    
    child.stderr.on('data', (data) => {
      console.error('Server:', data.toString().trim());
    });
    
    // Wait for server to be ready
    setTimeout(async () => {
      try {
        const res = await fetch(`${SERVER_URL}/health`, { signal: AbortSignal.timeout(2000) });
        resolve(res.ok);
      } catch {
        resolve(false);
      }
    }, 3000);
  });
}

// Main loop
async function main() {
  // Verify server is running
  const serverOk = await checkServer();
  if (!serverOk) {
    console.error('Error: personal-persistence-ai-memory server not running on port 7438');
    console.error('Start it with: cd ~/personal-persistence-ai-memory && npm run cli -- serve');
    process.exit(1);
  }

  console.error('MCP Bridge connected to personal-persistence-ai-memory');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  let buffer = '';

  rl.on('line', async (line) => {
    buffer += line;
    
    // Try to parse complete JSON-RPC messages
    try {
      const msg = JSON.parse(buffer);
      buffer = '';
      
      const response = await handleRequest(msg);
      process.stdout.write(JSON.stringify(response) + '\n');
    } catch (e) {
      // Incomplete message, wait for more
      if (!line.trim()) {
        buffer = '';
      }
    }
  });

  process.stdin.on('error', () => process.exit(0));
}

main();