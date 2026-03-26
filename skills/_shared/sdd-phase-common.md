# SDD Phase — Common Protocol

Este archivo contiene el protocolo compartido entre todas las skills SDD. Los sub-agentes DEBEN cargarlo junto con su SKILL.md de fase y seguir las secciones referenciadas.

Boundary de ejecución: cada agente de fase SDD es un EXECUTOR, no un orquestador. Hacer el trabajo de la fase uno mismo. NO lanzar sub-agentes, NO llamar `delegate`/`task`, y NO rebotar trabajo a otro agente a menos que la skill indique explícitamente reportar un bloqueante.

---

## A. Carga de Skills

Cada skill de fase sigue este procedimiento en "Step 1: Load Skills":

1. Verificar si el orquestador proveyó instrucciones `SKILL: Load` en el prompt de lanzamiento. Si sí, cargar esas skills exactas.
2. Si no se proveyó path de skill, buscar el skill registry:
   a. Intentar: `mem_search(query: "skill-registry", project: "{project}")` — si se encuentra, `mem_get(id)` para contenido completo
   b. Fallback: leer `.atl/skill-registry.md` si existe
3. Del registry, cargar las skills cuyos triggers coincidan con la tarea actual.
4. Si no existe registry, continuar solo con la skill de fase.

NOTA: buscar el registry es CARGA DE SKILLS, no delegación. Se cargan herramientas para el propio trabajo — no se entrega ejecución a otro agente.

---

## B. Artifact Retrieval (Persistence MCP)

Cuando la fase lee artefactos del MCP persistence, seguir este patrón de dos pasos. **Es obligatorio — no hay atajos.**

**CRÍTICO: `mem_search` retorna PREVIEWS de 300 chars, no contenido completo. SIEMPRE llamar `mem_get(id)` para CADA artefacto. Saltear esto produce trabajo con datos incompletos.**

### Paso A — Buscar (obtener IDs solamente)

**Ejecutar todas las búsquedas en paralelo** — llamar todos los `mem_search` simultáneamente en una sola respuesta.

```
mem_search(query: "sdd/{change-name}/{artifact-type}", project: "{project}") → guardar id
```

Repetir para cada artefacto que requiere la fase (ver SKILL.md de la fase para la lista).

### Paso B — Recuperar contenido completo (obligatorio para cada uno)

**Ejecutar todas las recuperaciones en paralelo** — llamar todos los `mem_get` simultáneamente en una sola respuesta.

```
mem_get(id: {id_guardado}) → contenido completo (REQUERIDO)
```

**NO usar previews de búsqueda como material de trabajo.**

---

## C. Persistencia de Artefactos

Toda fase que produce un artefacto DEBE persistirlo. **Si se saltea este paso, el pipeline SE ROMPE — las fases downstream no encontrarán el output.**

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

Ver `skills/_shared/persistence-convention.md` para convenciones completas de naming.

---

## D. Return Envelope

Toda fase DEBE retornar un envelope estructurado al orquestador. Incluir TODOS estos campos:

| Campo | Descripción |
|-------|-------------|
| `status` | `success`, `partial`, o `blocked` |
| `executive_summary` | Resumen de 1-3 oraciones de lo hecho |
| `detailed_report` | (opcional) Output completo de la fase |
| `artifacts` | Lista de artifact keys escritos |
| `next_recommended` | La siguiente fase SDD a ejecutar, o "none" |
| `risks` | Riesgos descubiertos, o "None" |

Ejemplo:

```markdown
**Status**: success
**Summary**: Proposal creada para `{change-name}`. Scope, enfoque y plan de rollback definidos.
**Artifacts**: Persistence `sdd/{change-name}/proposal`
**Next**: sdd-spec o sdd-design
**Risks**: None
```
