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

> ⚠️ `~/personal-ai` es la **instalación del sistema** — todos los symlinks apuntan ahí. No borrar.
> Para actualizar: volver a correr `bash install.sh`.

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

```yaml
sdd:
  explore: opencode/claude-opus-4-5        # planificación → opus
  apply: opencode/claude-sonnet-4-6        # implementación → sonnet
  archive: opencode/claude-haiku-4-5-20251001  # archivado → haiku
```

## Skills (34)

- **Backend**: php-general, sql-general, api-rest, typescript
- **JS/Node**: js-node, jq
- **Frontend**: css-general
- **Infra**: docker, docker-compose, bash-scripting, ssh
- **Utilidades**: regex, port-manager, fixer, email-generator, git-commits
- **AI**: ai-sdk-5
- **Testing**: playwright
- **SDD**: sdd-init/explore/propose/spec/design/tasks/apply/verify/archive
- **Workflow**: branch-pr, issue-creation, agent-guard, skill-creator, skill-registry, memoria

## Memoria persistente (MCP)

El servidor MCP `persistence` corre automáticamente con Claude Code y OpenCode.
No requiere configuración adicional — se conecta via `~/.claude/mcp/persistence.json`.

Protocolos de memoria disponibles en la skill `memoria`.

## Benchmark de tokens

```bash
PERSONAL_AI_DIR=~/personal-ai bash ~/personal-ai/scripts/token-check.sh
```

## Créditos e inspiración

Este proyecto nació del estudio de las integraciones de agentes IA presentadas por
**[@gentleman_prog](https://www.youtube.com/@gentleman_prog)** (Gentleman Programming).

Su trabajo en la exploración de flujos de trabajo con IA, agentes especializados y
pipelines de desarrollo fue la base de estudio que permitió construir esta configuración
a medida. Altamente recomendado si querés profundizar en desarrollo con IA.
