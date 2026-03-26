# Persistence Convention — SDD Artifacts

Sistema: **MCP `persistence`** (personal-persistence-ai-memory / SQLite local)

> Todos los artefactos SDD se guardan en la misma base. No hay modos alternativos (no engram, no openspec, no hybrid).

---

## Naming Convention

Todos los artefactos SDD usan esta estructura determinística:

```
title:     sdd/{change-name}/{artifact-type}
topic_key: sdd/{change-name}/{artifact-type}
type:      architecture
project:   {nombre del proyecto detectado}
scope:     project
```

### Artifact Types

| Artifact | Producido por | Descripción |
|----------|--------------|-------------|
| `explore` | sdd-explore | Análisis de exploración |
| `proposal` | sdd-propose | Propuesta de cambio |
| `spec` | sdd-spec | Especificaciones delta |
| `design` | sdd-design | Diseño técnico |
| `tasks` | sdd-tasks | Breakdown de tareas |
| `apply-progress` | sdd-apply | Progreso de implementación |
| `verify-report` | sdd-verify | Reporte de verificación |
| `archive-report` | sdd-archive | Cierre con linaje de artefactos |
| `state` | orquestador | Estado DAG para recovery |

**Excepción**: `sdd-init` usa `sdd-init/{project-name}` como title y topic_key (scope de proyecto, no de change).

---

## Guardar artefacto

```
mem_save(
  title: "sdd/{change-name}/{artifact-type}",
  topic_key: "sdd/{change-name}/{artifact-type}",
  type: "architecture",
  project: "{project}",
  content: "{markdown completo del artefacto}"
)
```

`topic_key` permite upserts — guardar de nuevo actualiza, no duplica.

---

## Recuperar artefacto (dos pasos obligatorios)

`mem_search` retorna previews de 300 chars — SIEMPRE usar `mem_get` para el contenido completo.

```
# Paso 1 — Buscar (en paralelo si son varios)
mem_search(query: "sdd/{change-name}/{artifact-type}", project: "{project}") → guardar id

# Paso 2 — Leer completo (en paralelo)
mem_get(id: {id}) → contenido completo
```

**NUNCA usar el preview de mem_search como fuente de trabajo.**

---

## Recuperar múltiples artefactos (paralelo)

```
# Paso A — Buscar todos en paralelo
mem_search(query: "sdd/{change-name}/proposal", project: "{project}") → id_proposal
mem_search(query: "sdd/{change-name}/spec",     project: "{project}") → id_spec
mem_search(query: "sdd/{change-name}/design",   project: "{project}") → id_design

# Paso B — Leer todos en paralelo
mem_get(id: id_proposal) → proposal completo
mem_get(id: id_spec)     → spec completa
mem_get(id: id_design)   → design completo
```

---

## Estado del orquestador (recovery)

```
mem_save(
  title: "sdd/{change-name}/state",
  topic_key: "sdd/{change-name}/state",
  type: "architecture",
  project: "{project}",
  content: |
    change: {change-name}
    phase: {last-phase}
    artifacts:
      proposal: true/false
      spec: true/false
      design: true/false
      tasks: true/false
    tasks_progress:
      completed: []
      pending: []
    last_updated: {ISO date}
)
```

Recovery: `mem_search("sdd/{change-name}/state")` → `mem_get(id)` → parse YAML → restaurar estado.

---

## Actualizar artefacto existente

```
mem_update(
  id: {id-del-artefacto},
  content: "{contenido actualizado completo}"
)
```

Usar `mem_update` cuando tenés el ID exacto. Usar `mem_save` con el mismo `topic_key` para upserts sin ID.
