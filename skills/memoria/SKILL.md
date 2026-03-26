# Skill: Memoria Persistente

**Trigger**: Cuando el usuario dice "memoria", "guardar esto", "qué recuerdas", "qué hicimos", "busca en memoria", "mem_save", "mem_search", o al iniciar cualquier sesión de trabajo.

---

## Protocolo de Arranque (ejecutar AL INICIO de cada sesión)

```
1. mem_session_start  → project = nombre del repo git actual
2. mem_context        → recuperar qué se trabajó antes
3. mem_search("decisiones vigentes") → saber qué NO hacer
```

**Regla de oro**: Si la memoria tiene el contexto → NO leer archivos. Usar memoria directamente. Esto ahorra 500-1000 tokens por sesión.

---

## Topic Keys estables (personal-ai)

| topic_key | Contenido |
|-----------|-----------|
| `project/estado-general` | Stack, paths, archivos clave |
| `project/decisiones-vigentes` | Qué NO hacer, restricciones |
| `user/preferencias` | Idioma, tono, estilo de trabajo |

---

## Cuándo guardar

| Situación | Type | Ejemplo |
|-----------|------|---------|
| Encontré un bug y lo fixeé | `bugfix` | "Fix: X fallaba por Y" |
| Tomé una decisión de arquitectura | `decision` | "Usar X en vez de Y porque..." |
| Establecí una convención | `config` | "Los componentes van en /features/" |
| El usuario expresó preferencia | `preference` | "Prefiere commits en inglés" |
| Descubrí algo no obvio | `learning` | "npm run build falla si NODE_ENV no está seteado" |

## Reglas de memoria
- **1 memoria consolidada > varias pequeñas del mismo tema**
- Usar `topic_key` estable para actualizar, no crear duplicados
- NO guardar memorias de test o prueba
- Siempre incluir: Qué / Por qué / Dónde / Aprendido

---

## Fin de sesión (OBLIGATORIO)

Antes de cerrar, llamar `mem_session_summary` con:
```
## Goal        → qué se quería lograr
## Accomplished → qué se completó
## Discoveries  → hallazgos técnicos
## Next Steps   → qué falta
```

---

## Comandos rápidos

```bash
# Ver contexto de sesiones recientes
mem_context

# Buscar en memorias
mem_search("término")

# Guardar memoria
mem_save title="..." content="..." type=decision project=nombre

# Ver todas las memorias de un proyecto
mem_stats project=nombre

# Actualizar memoria existente (no duplicar)
mem_update id="..." content="..."
```
