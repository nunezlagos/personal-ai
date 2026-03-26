# Personal AI

Mi setup de desarrollo con IA.

## Instalar

```bash
./install.sh
```

## Uso

```bash
opencode    # Agente Oraculo + sistema de memoria
claude      # Claude Code
```

## Memoria Persistente

Sistema: **personal-persistence-ai-memory** (reemplaza Engram)

```bash
# API server (puerto 7438)
cd ~/personal-persistence-ai-memory && npm run cli -- serve

# CLI
cd ~/personal-persistence-ai-memory && npm run cli -- -p <proyecto> <comando>

# Ver contexto SDD
cd ~/personal-persistence-ai-memory && npm run cli -- -p <proyecto> sdd:summary
```

## Agentes

| Agente | Rol |
|--------|-----|
| **Oraculo** | Orchestrator principal |
| **Arquitecto** | Diseño y arquitectura |
| **Desarrollador** | Implementación |
| **Revisor** | QA y calidad |
| **Guardia** | Seguridad y auditoría |

## Skills

+30 skills para ambos agentes:

- **Desarrollo**: typescript, react-19, nextjs-15, angular, docker, docker-compose, playwright
- **Workflow SDD**: sdd-init, sdd-explore, sdd-spec, sdd-design, sdd-tasks, sdd-apply, sdd-verify, sdd-archive
- **Gestión**: port-manager, agent-guard, skill-creator, skill-registry, branch-pr, issue-creation
- **Utilities**: bash-scripting, ai-sdk-5, tailwind-4, zod-4, zustand-5, go-testing

## Proyectos

- `~/personal-ai` - Este repo
- `~/personal-persistence-ai-memory` - Sistema de memoria
- `~/personal-nvim` - Configuración de Neovim
- `~/Proyectos/` - Proyectos de trabajo
