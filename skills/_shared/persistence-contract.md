# Persistence Contract (compartido entre todas las skills SDD)

Sistema: **MCP `persistence`** — siempre disponible, siempre activo.

No hay modos alternativos. No hay `engram | openspec | hybrid | none`. Todos los artefactos SDD van al MCP persistence.

---

## Estado del orquestador

El orquestador persiste el estado DAG después de cada transición de fase. Esto permite recovery tras compactación de contexto.

| Acción | Comando |
|--------|---------|
| Persistir estado | `mem_save(topic_key: "sdd/{change-name}/state")` |
| Recuperar estado | `mem_search("sdd/{change-name}/state")` → `mem_get(id)` |

---

## Reglas comunes

- Siempre persistir al MCP persistence usando los nombres de `persistence-convention.md`
- NUNCA crear archivos de proyecto para artefactos SDD (specs, designs, tasks van en memoria)
- NUNCA saltear `mem_save` al finalizar una fase — rompe el pipeline
- Si no encontrás un artefacto requerido → reportar bloqueante al orquestador

---

## Roles: quién lee, quién escribe

| Contexto | Quién lee del backend | Quién escribe al backend |
|----------|-----------------------|--------------------------|
| Tarea general (no SDD) | **Orquestador** busca y pasa resumen en el prompt | **Sub-agente** guarda descubrimientos via `mem_save` |
| SDD (fase con dependencias) | **Sub-agente** lee artefactos directamente | **Sub-agente** guarda su artefacto |
| SDD (fase sin dependencias, ej. explore) | Nadie | **Sub-agente** guarda su artefacto |

### Por qué este split

- **Orquestador lee para tareas generales**: ya tiene el protocolo cargado. Sabe qué contexto es relevante.
- **Sub-agentes leen para SDD**: los artefactos son grandes (specs, designs). El orquestador no debe inlinearlos — pasa referencias (topic keys) y el sub-agente recupera.
- **Sub-agentes siempre escriben**: tienen el detalle completo. Persistir en la fuente.

---

## Instrucciones para prompts de sub-agentes

El orquestador DEBE incluir instrucciones de persistencia en el prompt al lanzar un sub-agente:

**Tarea general (no SDD)**:
```
PERSISTENCIA (OBLIGATORIO):
Si hacés descubrimientos importantes, decisiones, o fixes, DEBÉS guardarlos en memoria:
  mem_save(title: "{descripción corta}", type: "{decision|bugfix|discovery|pattern}",
           project: "{project}", content: "{Qué, Por qué, Dónde, Aprendido}")
No retornes sin guardar lo que aprendiste.
```

**SDD (con dependencias)**:
```
Sistema de persistencia: MCP persistence
Leer estos artefactos antes de comenzar (dos pasos — mem_search retorna previews, usar mem_get para contenido completo):
  mem_search(query: "sdd/{change-name}/{type}", project: "{project}") → obtener id
  mem_get(id: {id}) → contenido completo (REQUERIDO para dependencias SDD)

PERSISTENCIA (OBLIGATORIO — no saltear):
Al finalizar, DEBÉS llamar:
  mem_save(
    title: "sdd/{change-name}/{artifact-type}",
    topic_key: "sdd/{change-name}/{artifact-type}",
    type: "architecture",
    project: "{project}",
    content: "{tu artefacto markdown completo}"
  )
Si retornás sin llamar mem_save, la siguiente fase NO puede encontrar tu artefacto y el pipeline SE ROMPE.
```

**SDD (sin dependencias)**:
```
Sistema de persistencia: MCP persistence

PERSISTENCIA (OBLIGATORIO — no saltear):
Al finalizar, DEBÉS llamar:
  mem_save(
    title: "sdd/{change-name}/{artifact-type}",
    topic_key: "sdd/{change-name}/{artifact-type}",
    type: "architecture",
    project: "{project}",
    content: "{tu artefacto markdown completo}"
  )
Si retornás sin llamar mem_save, la siguiente fase NO puede encontrar tu artefacto y el pipeline SE ROMPE.
```

---

## Skill Registry

El orquestador pre-resuelve los paths de skills y los pasa en el prompt de lanzamiento. Los sub-agentes NO buscan el skill registry por su cuenta.

### Cómo generar/actualizar

Ejecutar la skill `skill-registry`, o `sdd-init` (que incluye generación del registry).

---

## Nivel de detalle

El orquestador puede pasar `detail_level`: `concise | standard | deep`.
Controla verbosidad de output pero NO afecta lo que se persiste — siempre persistir el artefacto completo.
