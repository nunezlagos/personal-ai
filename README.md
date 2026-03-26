# Personal AI

Setup personal de desarrollo con IA — Claude Code + OpenCode.

## Instalar

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/nunezlagos/personal-ai/master/install.sh)
```

O si ya está clonado:

```bash
bash ~/personal-ai/install.sh
```

## Uso

```bash
claude      # Claude Code (principal)
opencode    # OpenCode
```

## Agentes

| Agente | Rol | Modelo |
|--------|-----|--------|
| `fixer` | Debugging y bugs | sonnet |
| `forjador` | Implementación de código | sonnet |
| `revisor` | Code review y QA | sonnet |
| `sentinela` | Seguridad y auditoría | sonnet |
| `db-admin` | Bases de datos | sonnet |

## Flujo SDD

```
/sdd-init → /sdd-explore → /sdd-propose → /sdd-spec
         → /sdd-design → /sdd-tasks → /sdd-apply → /sdd-verify → /sdd-archive
```

Modelo por fase definido en `config/models.yaml`.

## Cambiar modelos

Editá `config/models.yaml` y reinstalá:

```bash
# config/models.yaml
sdd:
  explore: opencode/claude-opus-4-5      # planificación → opus
  apply: opencode/claude-sonnet-4-6      # implementación → sonnet
  archive: opencode/claude-haiku-4-5-20251001  # archivado → haiku
```

## Skills (32)

- **Frontend**: typescript, react-19, nextjs-15, angular, tailwind-4, zustand-5, zod-4
- **Backend/Infra**: docker, docker-compose, bash-scripting, ssh
- **AI**: ai-sdk-5
- **Testing**: playwright
- **SDD**: sdd-init/explore/propose/spec/design/tasks/apply/verify/archive
- **Workflow**: branch-pr, issue-creation, git-commits, agent-guard, skill-creator, skill-registry
- **Utilidades**: port-manager, fixer, email-generator

## Memoria persistente (MCP)

El servidor MCP `persistence` corre automáticamente con Claude Code y OpenCode.
No requiere configuración adicional — se conecta via `~/.claude/mcp/persistence.json`.

## Benchmark de tokens

```bash
PERSONAL_AI_DIR=~/personal-ai bash ~/personal-ai/scripts/token-check.sh
```
