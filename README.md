# Personal AI Setup

> Mi configuración de desarrollo con IA - Typescript, PHP, Excel y más

## ¿Qué es?

Este es mi setup personal de herramientas de IA para desarrollo. Inspirado en el Gentleman AI Ecosystem pero adaptado a mis necesidades:

- **Typescript** - Mi lenguaje principal
- **PHP** - Backend y proyectos legacy
- **Excel** - Automatización con libraries
- **Angular/React** - Frameworks frontend
- **JS** - Vanilla y librerías

---

## Componentes

| Componente | Descripción | Estado |
|------------|-------------|--------|
| **Engram** | Memoria persistente para el agente | ✅ Instalado |
| **Agent Teams Lite** | Orquestación SDD con sub-agentes | ✅ Configurado |
| **Skills** | Patterns curados para mi stack | ✅ Personalizado |
| **OpenCode** | Agente de IA principal | ✅ Instalado |
| **Claude Code** | Alternativa de agente | ✅ Disponible |

---

## Skills Instalados

### SDD (Spec-Driven Development)
- `sdd-init` - Bootstrap del proyecto
- `sdd-explore` - Investigar codebase
- `sdd-propose` - Crear propuesta
- `sdd-spec` - Especificaciones
- `sdd-design` - Diseño técnico
- `sdd-tasks` - Descomponer tareas
- `sdd-apply` - Implementación
- `sdd-verify` - Validación
- `sdd-archive` - Archivar

### Frameworks & Languages
- `typescript` - TypeScript strict patterns
- `react-19` - React con Compiler
- `angular` - Angular 20+ con signals
- `nextjs-15` - Next.js App Router
- `tailwind-4` - Tailwind CSS 4

### Libraries & Tools
- `zustand-5` - State management
- `zod-4` - Schema validation
- `ai-sdk-5` - Vercel AI SDK
- `playwright` - E2E testing

### Utilities
- `skill-creator` - Crear nuevos skills
- `skill-registry` - Registry de skills

---

## Instalación

```bash
# Ejecutar el script de instalación
./install.sh
```

### Requisitos
- Node.js + npm
- Go 1.21+
- Git

### Post-Instalación
1. Agregar al PATH: `~/go/bin`
2. Configurar Claude Code u OpenCode
3. Inicializar SDD: `/sdd-init`

---

## Uso

### Inicializar SDD en un proyecto
```bash
cd tu-proyecto
opencode
# /sdd-init
```

### Nuevo feature
```bash
# /sdd-new nombre-del-feature
```

### Continuar trabajo
```bash
# /sdd-continue
```

---

## Estructura

```
personal-ai/
├── README.md          # Este archivo
├── install.sh         # Script de instalación
└── skills/            # Skills personalizados (futuro)
```

---

## Inspiración

- [Gentleman Programming](https://github.com/gentleman-programming)
- [gentle-ai](https://github.com/gentleman-programming/gentle-ai)
- [Agent Teams Lite](https://github.com/gentleman-programming/agent-teams-lite)
- [Engram](https://github.com/gentleman-programming/engram)
- [Gentleman Skills](https://github.com/gentleman-programming/Gentleman-Skills)

---

## Licencia

MIT - Personal use
