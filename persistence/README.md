# personal-persistence-ai-memory

Persistent memory layer for AI agents with extended session tracking, docs indexing, and skills detection.

## Features

- **Memory** - Persistent memory storage with FTS5 full-text search (Engram-compatible)
- **Sessions** - Extended session tracking with commands, files, errors, skills used
- **Documentation** - Index and search documentation for frameworks (React, PHP, TS, JS, etc.)
- **Skills** - Auto-detect project skills from package.json, composer.json, pyproject.toml
- **Context** - Persistent work context with tasks, progress, blockers, notes

## Installation

```bash
npm install
npm run build
```

## Usage

### CLI

```bash
# Save a memory
npm run cli -- save "Fixed auth bug" "What: JWT token expiration..." --project my-app

# Search memories
npm run cli -- search "auth" --project my-app

# Index documentation
npm run cli -- docs:index react "useState hook" "Function: const [state, setState] = useState(initial)" --category hooks

# Detect skills in project
npm run cli -- skills:detect /path/to/project --project my-app

# Get work context
npm run cli -- context:get --project my-app
```

### HTTP API Server

```bash
# Start server on port 7438
npm run cli -- serve

# Or start programmatically
import { startServer } from './src/index.js';
await startServer(7438);
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/memories | Save memory |
| GET | /api/memories | Search memories |
| GET | /api/memories/:id | Get memory by ID |
| PUT | /api/memories/:id | Update memory |
| DELETE | /api/memories/:id | Delete memory |
| POST | /api/sessions | Start session |
| POST | /api/sessions/:id/end | End session |
| GET | /api/sessions | Get recent sessions |
| GET | /api/context | Get session context |
| POST | /api/docs | Index documentation |
| GET | /api/docs | Search documentation |
| POST | /api/skills/detect | Detect a skill |
| POST | /api/skills/auto-detect | Auto-detect project skills |
| GET | /api/skills | Get project skills |
| GET | /api/context | Get work context |
| PUT | /api/context | Update work context |

## Database

Database is stored at: `~/.persistence-ai-memory/memory.db`

Or set custom path:
```bash
export PERSISTENCE_DB_PATH=/custom/path/memory.db
```

## Schema

### Engram Core Tables
- `sessions` - Session tracking
- `memories` - Persistent memories with FTS5
- `prompts` - User prompts

### Extended Tables
- `session_metadata` - Extended session info (commands, files, errors, skills)
- `documentation` - Framework docs with FTS5
- `project_skills` - Detected project skills
- `work_context` - Current work context
- `decisions` - Technical decisions history
- `metrics` - Usage metrics

## Development

```bash
# Watch mode
npm run dev

# Run tests
npm test

# Type check
npm run build
```

## License

MIT