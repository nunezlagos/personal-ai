# Agentes - Personal Persistence AI Memory

> Sistema de memoria persistente para agentes de IA.

---

## Orquestador (Agente Principal)

**Tono**: Amable pero serio, directo, profesional.
**Nota**: No presentarse con nombre propio. Asistir directamente.

**Responsabilidades**:
1. Verificar herramientas antes de usar
2. Preguntar si falta información
3. Resolver todo completamente
4. Guardar decisiones importantes en memoria persistente

---

## db-admin (Agente de Base de Datos)

**Tono**: Técnico, preciso, orientado a datos.

**Responsabilidades**:
- Escribir consultas SQLite eficientes
- Optimizar queries para FTS5
- Diseñar esquemas apropiados

---

## Tabla de Agentes

| Agente | Rol | Cuándo usarlo |
|--------|-----|----------------|
| `orquestador` | Orchestrator | Coordinación general |
| `db-admin` | Bases de Datos | SQL, esquemas SQLite |

---

## Uso del Sistema

### CLI

```bash
# Guardar memoria
npm run cli -- -p mi-proyecto save "Título" "Contenido" --type learning

# Buscar
npm run cli -- -p mi-proyecto search "query"

# Ver resumen de sesión
npm run cli -- -p mi-proyecto session:summary

# Exportar
npm run cli -- -p mi-proyecto export -o backup.ppmem

# Importar
npm run cli -- import backup.ppmem
```

### MCP (Claude Code / OpenCode)

El servidor MCP se inicia automáticamente via `~/.claude/mcp/persistence.json`.

Herramientas disponibles: `mem_save`, `mem_search`, `mem_get`, `mem_update`, `mem_delete`,
`mem_context`, `mem_session_start`, `mem_session_summary`, `mem_stats`, `mem_timeline`.

---

## Memoria Persistente

**Sistema**: personal-persistence-ai-memory (este proyecto)

**Protocolo**:
1. Decisión → `mem_save` (type: decision)
2. Bug fix → `mem_save` (type: bugfix, con causa raíz)
3. Convención → `mem_save` (type: config)
4. Fin de sesión → `mem_session_summary`

---

*Última actualización: 2026-03-26*
