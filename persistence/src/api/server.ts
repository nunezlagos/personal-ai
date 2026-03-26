import express from 'express';
import * as memory from '../services/memory.js';
import * as session from '../services/session.js';
import * as docs from '../services/docs.js';
import * as skills from '../services/skills.js';
import * as context from '../services/context.js';
import * as sddContext from '../services/sdd-context.js';
import * as compaction from '../services/compaction.js';
import * as exportImport from '../services/export.js';

const app = express();
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'persistence-ai-memory' });
});

// =====================================================
// MEMORY ROUTES
// =====================================================

// Save memory
app.post('/api/memories', (req, res) => {
  try {
    const result = memory.saveMemory(req.body);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Search memories
app.get('/api/memories', (req, res) => {
  try {
    const results = memory.searchMemories({
      query: req.query.query as string,
      type: req.query.type as string,
      project: req.query.project as string,
      scope: req.query.scope as string,
      limit: parseInt(req.query.limit as string) || 20
    });
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Get memory by ID
app.get('/api/memories/:id', (req, res) => {
  try {
    const result = memory.getMemoryById(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Update memory
app.put('/api/memories/:id', (req, res) => {
  try {
    const result = memory.updateMemory(req.params.id, req.body);
    if (!result) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Delete memory
app.delete('/api/memories/:id', (req, res) => {
  try {
    const result = memory.deleteMemory(req.params.id);
    res.json({ success: result });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Memory stats
app.get('/api/memories/stats', (req, res) => {
  try {
    const stats = memory.getMemoryStats(req.query.project as string);
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// =====================================================
// SESSION ROUTES
// =====================================================

// Start session
app.post('/api/sessions', (req, res) => {
  try {
    const result = session.startSession(req.body);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Get session
app.get('/api/sessions/:id', (req, res) => {
  try {
    const result = session.getSession(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// End session
app.post('/api/sessions/:id/end', (req, res) => {
  try {
    const result = session.endSession(
      req.params.id,
      req.body.summary,
      req.body.accomplished,
      req.body.discoveries,
      req.body.files_changed
    );
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Get recent sessions
app.get('/api/sessions', (req, res) => {
  try {
    const results = session.getRecentSessions(
      req.query.project as string,
      parseInt(req.query.limit as string) || 10
    );
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Session context
app.get('/api/context', (req, res) => {
  try {
    const result = session.getSessionContext(
      req.query.project as string,
      parseInt(req.query.limit as string) || 5
    );
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Session stats
app.get('/api/sessions/stats', (req, res) => {
  try {
    const stats = session.getSessionStats(req.query.project as string);
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// =====================================================
// DOCUMENTATION ROUTES
// =====================================================

// Index documentation
app.post('/api/docs', (req, res) => {
  try {
    const result = docs.indexDocumentation(req.body);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Search documentation
app.get('/api/docs', (req, res) => {
  try {
    const results = docs.searchDocumentation({
      query: req.query.query as string,
      framework: req.query.framework as string,
      category: req.query.category as string,
      limit: parseInt(req.query.limit as string) || 20
    });
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Get docs by framework
app.get('/api/docs/framework/:framework', (req, res) => {
  try {
    const results = docs.getByFramework(
      req.params.framework,
      parseInt(req.query.limit as string) || 50
    );
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Documentation stats
app.get('/api/docs/stats', (req, res) => {
  try {
    const stats = docs.getDocStats();
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// =====================================================
// SKILLS ROUTES
// =====================================================

// Detect skills
app.post('/api/skills/detect', (req, res) => {
  try {
    const result = skills.detectSkill(req.body);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Auto-detect skills
app.post('/api/skills/auto-detect', (req, res) => {
  try {
    const { path, project } = req.body;
    const result = skills.autoDetectSkills(path, project);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Get project skills
app.get('/api/skills', (req, res) => {
  try {
    const project = req.query.project;
    if (!project) {
      return res.status(400).json({ error: 'project required' });
    }
    const results = skills.getProjectSkills(project as string);
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Skill stats
app.get('/api/skills/stats', (req, res) => {
  try {
    const project = req.query.project;
    if (!project) {
      return res.status(400).json({ error: 'project required' });
    }
    const stats = skills.getSkillStats(project as string);
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// =====================================================
// CONTEXT ROUTES
// =====================================================

// Get or create context
app.get('/api/context', (req, res) => {
  try {
    const project = req.query.project;
    if (!project) {
      return res.status(400).json({ error: 'project required' });
    }
    const result = context.getOrCreateContext(project as string);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Update context
app.put('/api/context', (req, res) => {
  try {
    const project = req.body.project;
    if (!project) {
      return res.status(400).json({ error: 'project required' });
    }
    const result = context.updateContext(project, req.body);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// =====================================================
// SDD CONTEXT ROUTES
// =====================================================

// Get SDD context for project
app.get('/api/sdd/context', (req, res) => {
  try {
    const project = req.query.project;
    if (!project) {
      return res.status(400).json({ error: 'project required' });
    }
    const result = sddContext.getProjectSDDContext(project as string);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Get LLM-optimized summary
app.get('/api/sdd/summary', (req, res) => {
  try {
    const project = req.query.project;
    if (!project) {
      return res.status(400).json({ error: 'project required' });
    }
    const result = sddContext.summarizeForLLM(project as string);
    res.json({ summary: result });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Get recent SDD decisions
app.get('/api/sdd/decisions', (req, res) => {
  try {
    const project = req.query.project;
    if (!project) {
      return res.status(400).json({ error: 'project required' });
    }
    const limit = parseInt(req.query.limit as string) || 20;
    const result = sddContext.getRecentDecisions(project as string, limit);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Record SDD decision
app.post('/api/sdd/decisions', (req, res) => {
  try {
    const { change_id, phase, decision, rationale, files_affected } = req.body;
    if (!change_id || !phase || !decision) {
      return res.status(400).json({ error: 'change_id, phase, decision required' });
    }
    const result = sddContext.recordDecision(change_id, phase, decision, rationale, files_affected);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// =====================================================
// COMPACTION & TTL ROUTES
// =====================================================

// Run compaction
app.post('/api/compact', (req, res) => {
  try {
    const project = req.query.project as string | undefined;
    const result = compaction.compactMemoriesByThreshold(project);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Run full maintenance
app.post('/api/maintenance', (req, res) => {
  try {
    const project = req.query.project as string | undefined;
    const result = compaction.runAutoMaintenance(project);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Get TTL stats
app.get('/api/ttl/stats', (req, res) => {
  try {
    const project = req.query.project as string | undefined;
    const result = compaction.getTTLStats(project);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Get TTL policies
app.get('/api/ttl/policies', (req, res) => {
  try {
    const result = compaction.getAllPolicies();
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// =====================================================
// EXPORT/IMPORT ROUTES
// =====================================================

// Export project
app.post('/api/export', (req, res) => {
  try {
    const { project, output_path } = req.body;
    if (!project) {
      return res.status(400).json({ error: 'project required' });
    }
    const output = output_path || `${project}_${Date.now()}.ppmem`;
    const path = exportImport.exportToFile(project, output);
    res.json({ exported_to: path });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Import project
app.post('/api/import', (req, res) => {
  try {
    const { file_path, merge_strategy } = req.body;
    if (!file_path) {
      return res.status(400).json({ error: 'file_path required' });
    }
    const result = exportImport.importFromFile(file_path, merge_strategy || 'newer');
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export function startServer(port: number = 7438): Promise<void> {
  return new Promise((resolve) => {
    app.listen(port, () => {
      console.log(`persistence-ai-memory API server running on http://localhost:${port}`);
      resolve();
    });
  });
}

export default app;