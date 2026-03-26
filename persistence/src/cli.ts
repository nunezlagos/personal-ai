import { Command } from 'commander';
import { db, getDbPath, close } from './db/connection.js';
import * as memory from './services/memory.js';
import * as session from './services/session.js';
import * as docs from './services/docs.js';
import * as skills from './services/skills.js';
import * as context from './services/context.js';
import * as sddContext from './services/sdd-context.js';
import * as compaction from './services/compaction.js';
import * as exportImport from './services/export.js';
import { join } from 'path';

const program = new Command();

// Global options
program
  .option('-p, --project <name>', 'Project name')
  .option('--scope <scope>', 'Scope (project|personal)', 'project');

// Memory commands
program
  .command('save')
  .description('Save a memory')
  .argument('<title>', 'Memory title')
  .argument('<content>', 'Memory content')
  .option('-t, --type <type>', 'Memory type (learning, decision, bugfix, etc.)')
  .action(async (title, content, opts) => {
    const result = memory.saveMemory({
      title,
      content,
      type: opts.type || 'learning',
      project: program.opts().project,
      scope: program.opts().scope
    });
    console.log('Memory saved:', result.id);
  });

program
  .command('search')
  .description('Search memories')
  .argument('<query>', 'Search query')
  .option('-t, --type <type>', 'Filter by type')
  .option('-l, --limit <number>', 'Limit results', '20')
  .action(async (query, opts) => {
    const results = memory.searchMemories({
      query,
      type: opts.type,
      project: program.opts().project,
      scope: program.opts().scope,
      limit: parseInt(opts.limit)
    });
    console.log(`Found ${results.length} memories:`);
    results.forEach(m => {
      console.log(`  - [${m.type}] ${m.title}`);
    });
  });

program
  .command('stats')
  .description('Show memory statistics')
  .action(async () => {
    const stats = memory.getMemoryStats(program.opts().project);
    console.log('Memory Statistics:');
    console.log(`  Total: ${stats.total}`);
    console.log('  By Type:', stats.byType);
    console.log('  By Project:', stats.byProject);
  });

// Session commands
program
  .command('session:start')
  .description('Start a new session')
  .option('-g, --goals <goals...>', 'Session goals')
  .action(async (opts) => {
    const sess = session.startSession({
      project: program.opts().project,
      goals: opts.goals
    });
    console.log('Session started:', sess.id);
  });

program
  .command('session:end')
  .description('End current session')
  .argument('<session-id>', 'Session ID')
  .option('-s, --summary <text>', 'Session summary')
  .option('-a, --accomplished <tasks...>', 'Accomplished tasks')
  .action(async (id, opts) => {
    const sess = session.endSession(
      id,
      opts.summary,
      opts.accomplished
    );
    console.log('Session ended:', sess?.ended_at);
  });

program
  .command('session:context')
  .description('Get recent session context')
  .option('-l, --limit <number>', 'Number of sessions', '5')
  .action(async (opts) => {
    const ctx = session.getSessionContext(program.opts().project, parseInt(opts.limit));
    console.log('Recent Sessions:');
    ctx.sessions.forEach(s => {
      console.log(`  - ${s.started_at}: ${s.summary || 'No summary'}`);
    });
  });

// Documentation commands
program
  .command('docs:index')
  .description('Index documentation')
  .argument('<framework>', 'Framework name (react, php, ts, etc.)')
  .argument('<title>', 'Document title')
  .argument('<content>', 'Document content')
  .option('-c, --category <category>', 'Category (api, config, patterns)')
  .action(async (framework, title, content, opts) => {
    const doc = docs.indexDocumentation({
      framework,
      title,
      content,
      category: opts.category
    });
    console.log('Document indexed:', doc.id);
  });

program
  .command('docs:search')
  .description('Search documentation')
  .argument('<query>', 'Search query')
  .option('-f, --framework <framework>', 'Filter by framework')
  .action(async (query, opts) => {
    const results = docs.searchDocumentation({
      query,
      framework: opts.framework,
      limit: 20
    });
    console.log(`Found ${results.length} docs:`);
    results.forEach(d => {
      console.log(`  - [${d.framework}] ${d.title}`);
    });
  });

program
  .command('docs:stats')
  .description('Show documentation statistics')
  .action(async () => {
    const stats = docs.getDocStats();
    console.log('Documentation Statistics:');
    console.log(`  Total: ${stats.totalDocs}`);
    console.log('  By Framework:', stats.byFramework);
    console.log('  By Category:', stats.byCategory);
  });

// Skills commands
program
  .command('skills:detect')
  .description('Auto-detect skills in a project')
  .argument('<path>', 'Project path')
  .action(async (path) => {
    const projectName = program.opts().project || require('path').basename(path);
    const detected = skills.autoDetectSkills(path, projectName);
    console.log(`Detected ${detected.length} skills:`);
    detected.forEach(s => {
      console.log(`  - ${s.skill_name} (${s.skill_type}) from ${s.detected_from}`);
    });
  });

program
  .command('skills:list')
  .description('List project skills')
  .action(async () => {
    const project = program.opts().project;
    if (!project) {
      console.error('Error: --project required');
      process.exit(1);
    }
    const projectSkills = skills.getProjectSkills(project);
    console.log(`Skills in ${project}:`);
    projectSkills.forEach(s => {
      console.log(`  - ${s.skill_name} (${s.skill_type || 'unknown'}) - ${s.detected_from}`);
    });
  });

// Context commands
program
  .command('context:get')
  .description('Get current work context')
  .action(async () => {
    const project = program.opts().project;
    if (!project) {
      console.error('Error: --project required');
      process.exit(1);
    }
    const ctx = context.getOrCreateContext(project);
    console.log('Work Context:');
    console.log(`  Task: ${ctx.current_task || 'None'}`);
    console.log(`  Status: ${ctx.task_status || 'pending'}`);
    console.log(`  Progress: ${ctx.progress || 'None'}`);
    console.log(`  Notes: ${ctx.notes || 'None'}`);
  });

program
  .command('context:set-task')
  .description('Set current task')
  .argument('<task>', 'Task description')
  .option('-s, --status <status>', 'Task status', 'in_progress')
  .action(async (task, opts) => {
    const project = program.opts().project;
    if (!project) {
      console.error('Error: --project required');
      process.exit(1);
    }
    const ctx = context.setCurrentTask(project, task, opts.status);
    console.log('Task updated:', ctx.current_task);
  });

program
  .command('context:add-note')
  .description('Add a note to context')
  .argument('<note>', 'Note text')
  .action(async (note) => {
    const project = program.opts().project;
    if (!project) {
      console.error('Error: --project required');
      process.exit(1);
    }
    const ctx = context.addNote(project, note);
    console.log('Note added');
  });

// =====================================================
// SDD CONTEXT COMMANDS
// =====================================================

program
  .command('sdd:context')
  .description('Get SDD context for current project')
  .action(async () => {
    const project = program.opts().project;
    if (!project) {
      console.error('Error: --project required');
      process.exit(1);
    }
    const ctx = sddContext.getProjectSDDContext(project);
    console.log('SDD Context:');
    if (ctx.currentChange) {
      console.log(`  Active Change: ${ctx.currentChange.name}`);
      console.log(`  Phase: ${ctx.currentChange.current_phase}`);
    } else {
      console.log('  Active Change: None');
    }
    console.log(`  Recent Decisions: ${ctx.recentDecisions.length}`);
    console.log(`  Previous Sessions: ${ctx.previousSessions.length}`);
  });

program
  .command('sdd:summary')
  .description('Get LLM-optimized context summary')
  .option('-p, --project <name>', 'Project name', program.opts().project)
  .action(async (opts) => {
    const project = opts.project || program.opts().project;
    if (!project) {
      console.error('Error: --project required');
      process.exit(1);
    }
    const summary = sddContext.summarizeForLLM(project);
    console.log(summary);
  });

program
  .command('sdd:decisions')
  .description('List recent SDD decisions')
  .option('-l, --limit <number>', 'Limit results', '20')
  .action(async (opts) => {
    const project = program.opts().project;
    if (!project) {
      console.error('Error: --project required');
      process.exit(1);
    }
    const decisions = sddContext.getRecentDecisions(project, parseInt(opts.limit));
    console.log(`Recent SDD Decisions (${decisions.length}):`);
    decisions.forEach(d => {
      console.log(`  - [${d.phase}] ${d.decision.substring(0, 60)}...`);
    });
  });

// =====================================================
// EXPORT/IMPORT COMMANDS
// =====================================================

program
  .command('export')
  .description('Export project data to .ppmem file')
  .option('-o, --output <path>', 'Output file path')
  .action(async (opts) => {
    const project = program.opts().project;
    if (!project) {
      console.error('Error: --project required');
      process.exit(1);
    }
    const outputPath = opts.output || join(exportImport.getDefaultExportPath(), `${project}_${Date.now()}.ppmem`);
    const path = exportImport.exportToFile(project, outputPath);
    console.log('Exported to:', path);
  });

program
  .command('import')
  .description('Import project data from .ppmem file')
  .argument('<file>', 'Path to .ppmem file')
  .option('-m, --merge <strategy>', 'Merge strategy (newer|skip|replace)', 'newer')
  .action(async (file, opts) => {
    const result = exportImport.importFromFile(file, opts.merge);
    console.log('Import result:');
    console.log(`  Memories: ${result.imported.memories}`);
    console.log(`  Sessions: ${result.imported.sessions}`);
    console.log(`  Docs: ${result.imported.documentation}`);
    console.log(`  Skills: ${result.imported.skills}`);
    console.log(`  Context: ${result.imported.context}`);
    if (result.errors.length > 0) {
      console.log('  Errors:', result.errors);
    }
  });

program
  .command('sync')
  .description('Sync project to another machine')
  .option('-t, --target <path>', 'Target path')
  .action(async (opts) => {
    const project = program.opts().project;
    if (!project) {
      console.error('Error: --project required');
      process.exit(1);
    }
    if (!opts.target) {
      console.error('Error: --target required');
      process.exit(1);
    }
    const result = exportImport.syncProject({
      sourceProject: project,
      targetPath: opts.target
    });
    console.log('Synced to:', result.exported);
  });

// =====================================================
// COMPACTION & TTL COMMANDS
// =====================================================

program
  .command('compact')
  .description('Run auto-compaction on memories')
  .action(async () => {
    const project = program.opts().project;
    const result = compaction.compactMemoriesByThreshold(project);
    console.log('Compaction result:');
    console.log(`  Compacted: ${result.compacted}`);
    if (result.errors.length > 0) {
      console.log('  Errors:', result.errors);
    }
  });

program
  .command('maintenance')
  .description('Run full auto-maintenance (compact + expire)')
  .action(async () => {
    const project = program.opts().project;
    const stats = compaction.runAutoMaintenance(project);
    console.log('Maintenance result:');
    console.log(`  Compacted: ${stats.compacted}`);
    console.log(`  Expired: ${stats.expired}`);
    console.log(`  Retained: ${stats.retained}`);
  });

program
  .command('ttl:stats')
  .description('Show TTL statistics')
  .action(async () => {
    const project = program.opts().project;
    const stats = compaction.getTTLStats(project);
    console.log('TTL Statistics:');
    console.log(`  Total: ${stats.total}`);
    console.log(`  Expired: ${stats.expiredCount}`);
    console.log('  By Type:');
    for (const [type, data] of Object.entries(stats.byType)) {
      console.log(`    ${type}: ${data.total} (avg age: ${data.avgAge}d, expired: ${data.expired})`);
    }
  });

program
  .command('ttl:policies')
  .description('List TTL policies')
  .action(async () => {
    const policies = compaction.getAllPolicies();
    console.log('TTL Policies:');
    policies.forEach(p => {
      console.log(`  ${p.type}: ${p.ttl_days} days (auto_compact: ${p.auto_compact ? 'yes' : 'no'})`);
    });
  });

// Server command
program
  .command('serve')
  .description('Start HTTP API server')
  .option('-p, --port <port>', 'Port', '7438')
  .action(async (opts) => {
    const { startServer } = await import('./api/server.js');
    await startServer(parseInt(opts.port));
  });

// Init command
program
  .command('init')
  .description('Initialize database')
  .action(() => {
    console.log('Database initialized at:', getDbPath());
  });

program.parse();

process.on('exit', () => close());