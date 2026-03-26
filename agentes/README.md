# Agentes - Personal AI

> Directorio de agentes del sistema. Cada agente tiene su propia configuración y responsabilidades.

## Lista de Agentes

| Agente | Archivo | Descripción |
|--------|---------|-------------|
| **Oraculo** | `oraculo.md` | Orchestrator principal - coordina todo |
| **Sentinela** | `sentinela.md` | Seguridad y auditoría |
| **Forjador** | `forjador.md` | Implementación de código |
| **Revisor** | `revisor.md` | QA y validación |
| **Guardián BD** | `guardian-bd.md` | Bases de datos y SQL |

## Cómo usar los agentes

En tus prompts, puedes referirte a los agentes directamente:

- **Oraculo**: "@oraculo, coordina esta tarea"
- **Sentinela**: "Sentinela, revisa esto por seguridad"
- **Forjador**: "Forjador, implementa esta feature"
- **Revisor**: "Revisor, verifica este código"
- **Guardián BD**: "Guardián BD, escribe esta consulta SQL"

## Agentes Especializados

Además de los agentes principales, existen skills especializados que pueden actuar como "sub-agentes":

- **git-commits**: Generación de commits semánticos
- **email-generator**: Redacción de correos profesionales
- **agent-guard**: Auditoría de seguridad detallada
- **port-manager**: Gestión de puertos

## Agregar nuevo agente

Para agregar un nuevo agente:

1. Crear archivo `agentes/<nombre>.md`
2. Definir identidad, tono, responsabilidades
3. Agregar a la tabla arriba
4. Actualizar `AGENTS.md` principal
