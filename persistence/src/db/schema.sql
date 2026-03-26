-- persistence-ai-memory Schema
-- Based on Engram + extended tables for session tracking, docs indexing, and skills detection

-- =====================================================
-- ENGRAM CORE TABLES (base memory system)
-- =====================================================

-- Sesiones (base Engram)
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    project TEXT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    summary TEXT,
    goals TEXT,          -- JSON array
    discoveries TEXT,   -- JSON array
    accomplished TEXT,  -- JSON array
    files_changed TEXT  -- JSON array
);

-- Memorias principales (base Engram)
CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'learning',
    project TEXT,
    scope TEXT DEFAULT 'project',
    topic_key TEXT,
    revision_count INTEGER DEFAULT 0,
    tool_name TEXT,
    session_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Prompts del usuario (base Engram)
CREATE TABLE IF NOT EXISTS prompts (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    project TEXT,
    session_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- FTS5 índice para memorias
CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
    title,
    content,
    type,
    tool_name,
    content='memories',
    content_rowid='rowid'
);

-- Triggers para mantener FTS en sync
CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
    INSERT INTO memories_fts(rowid, title, content, type, tool_name)
    VALUES (NEW.rowid, NEW.title, NEW.content, NEW.type, NEW.tool_name);
END;

CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
    INSERT INTO memories_fts(memories_fts, rowid, title, content, type, tool_name)
    VALUES ('delete', OLD.rowid, OLD.title, OLD.content, OLD.type, OLD.tool_name);
END;

CREATE TRIGGER IF NOT EXISTS memories_au AFTER UPDATE ON memories BEGIN
    INSERT INTO memories_fts(memories_fts, rowid, title, content, type, tool_name)
    VALUES ('delete', OLD.rowid, OLD.title, OLD.content, OLD.type, OLD.tool_name);
    INSERT INTO memories_fts(rowid, title, content, type, tool_name)
    VALUES (NEW.rowid, NEW.title, NEW.content, NEW.type, NEW.tool_name);
END;

-- =====================================================
-- EXTENDED TABLES (new features)
-- =====================================================

-- Metadatos de sesiones extendidos
CREATE TABLE IF NOT EXISTS session_metadata (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    commands TEXT,           -- JSON array: [/sdd-init, /sdd-new, etc.]
    files_touched TEXT,     -- JSON array: ["src/auth.ts", "config.yml"]
    errors TEXT,            -- JSON array
    skills_used TEXT,       -- JSON array: ["sdd-apply", "typescript", "react-19"]
    context_updates TEXT,  -- JSON: state changes
    duration_ms INTEGER,
    tokens_used INTEGER,
    project TEXT,
    scope TEXT DEFAULT 'project',
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Documentación indexada de frameworks
CREATE TABLE IF NOT EXISTS documentation (
    id TEXT PRIMARY KEY,
    framework TEXT NOT NULL,        -- react, php, ts, js, nextjs, laravel, etc.
    version TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,          -- contenido relevante del doc
    url TEXT,
    file_path TEXT,                 -- archivo fuente del doc
    category TEXT,                  -- api, config, patterns, hooks, etc.
    indexed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_accessed DATETIME,
    access_count INTEGER DEFAULT 0
);

-- FTS5 índice para documentación
CREATE VIRTUAL TABLE IF NOT EXISTS docs_fts USING fts5(
    framework,
    title,
    content,
    category,
    content='documentation',
    content_rowid='rowid'
);

-- Skills detectados en proyectos
CREATE TABLE IF NOT EXISTS project_skills (
    id TEXT PRIMARY KEY,
    project TEXT NOT NULL,
    skill_name TEXT NOT NULL,
    skill_version TEXT,
    skill_type TEXT,                -- language, framework, library, tool, etc.
    detected_from TEXT,             -- package.json, composer.json, pyproject.toml, etc.
    file_path TEXT,                 -- archivo donde se detectó
    confidence REAL DEFAULT 1.0,    -- 0.0 a 1.0
    detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project, skill_name, detected_from)
);

-- Contexto de trabajo persistente
CREATE TABLE IF NOT EXISTS work_context (
    id TEXT PRIMARY KEY,
    project TEXT NOT NULL,
    current_task TEXT,
    task_status TEXT,              -- in_progress, pending, blocked, completed
    progress TEXT,                -- JSON: { phase, percent, details }
    blockers TEXT,                -- JSON array
    notes TEXT,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT               -- skill or agent name
);

-- Historial de decisiones técnicas
CREATE TABLE IF NOT EXISTS decisions (
    id TEXT PRIMARY KEY,
    project TEXT NOT NULL,
    title TEXT NOT NULL,
    context TEXT NOT NULL,         -- qué problema se resolvió
    decision TEXT NOT NULL,        -- qué se decidió
    rationale TEXT,                -- por qué
    alternatives TEXT,            -- JSON array de alternativas consideradas
    status TEXT DEFAULT 'active', -- active, superseded, deprecated
    superseded_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- FTS5 índice para decisiones
CREATE VIRTUAL TABLE IF NOT EXISTS decisions_fts USING fts5(
    title,
    context,
    decision,
    rationale,
    content='decisions',
    content_rowid='rowid'
);

-- Métricas y estadísticas
CREATE TABLE IF NOT EXISTS metrics (
    id TEXT PRIMARY KEY,
    project TEXT,
    metric_type TEXT NOT NULL,    -- tokens, commands, files, errors, etc.
    value REAL NOT NULL,
    metadata TEXT,                -- JSON
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES (performance)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_memories_project ON memories(project);
CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
CREATE INDEX IF NOT EXISTS idx_memories_scope ON memories(scope);
CREATE INDEX IF NOT EXISTS idx_memories_topic_key ON memories(topic_key);
CREATE INDEX IF NOT EXISTS idx_memories_session ON memories(session_id);
CREATE INDEX IF NOT EXISTS idx_memories_created ON memories(created_at);

CREATE INDEX IF NOT EXISTS idx_session_metadata_project ON session_metadata(project);
CREATE INDEX IF NOT EXISTS idx_session_metadata_session ON session_metadata(session_id);

CREATE INDEX IF NOT EXISTS idx_docs_framework ON documentation(framework);
CREATE INDEX IF NOT EXISTS idx_docs_category ON documentation(category);

CREATE INDEX IF NOT EXISTS idx_skills_project ON project_skills(project);
CREATE INDEX IF NOT EXISTS idx_skills_name ON project_skills(skill_name);

CREATE INDEX IF NOT EXISTS idx_context_project ON work_context(project);
CREATE INDEX IF NOT EXISTS idx_decisions_project ON decisions(project);

CREATE INDEX IF NOT EXISTS idx_metrics_project ON metrics(project);
CREATE INDEX IF NOT EXISTS idx_metrics_type ON metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_metrics_recorded ON metrics(recorded_at);

-- =====================================================
-- SDD CONTEXT TABLES
-- =====================================================

-- SDD Changes tracking
CREATE TABLE IF NOT EXISTS sdd_changes (
    id TEXT PRIMARY KEY,
    project TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    current_phase TEXT DEFAULT 'init',
    phases TEXT NOT NULL,             -- JSON array of phases
    metadata TEXT,                    -- JSON: additional context
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sdd_changes_project ON sdd_changes(project);
CREATE INDEX IF NOT EXISTS idx_sdd_changes_updated ON sdd_changes(updated_at);

-- SDD Decisions tracking
CREATE TABLE IF NOT EXISTS sdd_decisions (
    id TEXT PRIMARY KEY,
    change_id TEXT NOT NULL,
    phase TEXT NOT NULL,
    decision TEXT NOT NULL,
    rationale TEXT,
    files_affected TEXT,              -- JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (change_id) REFERENCES sdd_changes(id)
);

CREATE INDEX IF NOT EXISTS idx_sdd_decisions_change ON sdd_decisions(change_id);
CREATE INDEX IF NOT EXISTS idx_sdd_decisions_phase ON sdd_decisions(phase);

-- =====================================================
-- TTL & EXPIRATION TABLES
-- =====================================================

-- Memory expiration settings
CREATE TABLE IF NOT EXISTS memory_ttl (
    type TEXT PRIMARY KEY,
    ttl_days INTEGER NOT NULL,        -- Days until expiration
    auto_compact BOOLEAN DEFAULT 1,   -- Auto-compact before delete
    compact_threshold INTEGER DEFAULT 2000,  -- Chars to trigger compression
    description TEXT
);

-- Default TTL policies
INSERT OR IGNORE INTO memory_ttl (type, ttl_days, auto_compact, compact_threshold, description) VALUES
    ('session_context', 7, 1, 1000, 'Session-specific context - short term'),
    ('sdd_decision', 90, 0, 0, 'SDD decisions - long term, important'),
    ('learning', 30, 1, 2000, 'General learning - medium term'),
    ('bugfix', 60, 0, 0, 'Bug fixes - should persist'),
    ('decision', 90, 0, 0, 'Important decisions - long term'),
    ('pattern', 180, 1, 3000, 'Code patterns - long term reference'),
    ('default', 30, 1, 2000, 'Default TTL for unknown types');