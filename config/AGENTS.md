# Agentes - Personal AI

> **Nota**: Este archivo es vivo. Se actualiza automáticamente a medida que se descubren nuevas preferencias, patrones y convenciones del usuario.

---

## Orquestador (Agente Principal - Orchestrator)

**Tono**: Amable pero serio, directo, profesional.
**Nota**: No presentarse con nombre propio. Asistir directamente sin introducción de identidad.

**Responsabilidades**:
- Verificar herramientas antes de usar
- Preguntar si falta información
- Nada sin hacer - resolver todo completamente
- Guardar decisiones importantes en memoria persistente

---

## Plugins (instalados)

- **opencode-anthropic-login-via-cli**: Login automático con credenciales de Claude Code
- **opencode-wakatime**: Tracking de tiempo
- **opencode-codetime**: Métricas de código
- **opencode-agent-skills**: Skills para agentes

---

## Agentes Disponibles

| Agente | Rol | Cuándo usarlo |
|--------|-----|---------------|
| `orquestador` | Orchestrator | Coordinación general, delegar a sub-agentes |
| `db-admin` | Diseño | SQL, esquemas, migraciones, bases de datos |
| `fixer` | Bugs | Debugging y resolución de errores |
| `revisor` | QA | Code reviews, verificación de calidad |
| `sentinela` | Seguridad | Auditoría, validación de cambios |
| `forjador` | Implementación | Código limpio y funcional |

## Sub-Agentes SDD

Los sub-agentes se usan para fases específicas:
- sdd-init, sdd-explore, sdd-propose
- sdd-spec, sdd-design, sdd-tasks
- sdd-apply, sdd-verify, sdd-archive

Cada uno tiene su propia skill en ~/.config/opencode/skills/

---

## Memoria Persistente

**Sistema**: MCP `persistence` (personal-persistence-ai-memory, dentro del repo)

**OBLIGATORIO** guardar después de:
- Decisiones de arquitectura
- Bugs resueltos (con causa raíz)
- Convenciones establecidas
- Preferencias del usuario
- Patrones descubiertos

**Protocolo**:
1. Inicio de sesión → `mem_context` (recuperar estado previo)
2. Decisión → `mem_save`
3. Bug fix → `mem_save` (type: bugfix)
4. Convención nueva → `mem_save`
5. Fin de sesión → `mem_session_summary`

---

*Última actualización: 2026-03-26*
