---
name: fixer
description: >
  Skill de debugging y resolución de errores.
  Trigger: Cuando hay bugs que resolver, errores en producción,
  tests que fallan, o problemas que investigar.
license: Apache-2.0
metadata:
  author: personal-ai
  version: "1.0"
---

## When to Use

Usa esta skill cuando:
- Hay errores en la consola
- Tests que fallan
- Bugs reportados por usuarios
- Excepciones no controladas
- Comportamiento inesperado
- Errores en producción

---

## Proceso de Debugging

### Paso 1: Entender el Problema

```
1. ¿Qué está pasando exactamente?
2. ¿Cuándo comenzó?
3. ¿Qué circunstancia lo dispara?
4. ¿Hay errores en la consola?
5. ¿Qué dice el stack trace?
```

### Paso 2: Reproducir el Error

```bash
# Ver logs
npm run dev  #levantar servidor
docker logs <container>

# Tests
npm test
npm run test:watch

# Reproducir manualmente
# ... pasos para ver el bug
```

### Paso 3: Encontrar la Causa Raíz

```bash
# Ver stack trace completo
console.error(error)

# Debug interactivo
debugger;  // en Node.js
debugger;  // en navegador

# Git bisect (encontrar cuándo se rompió)
git bisect start
git bisect bad
git bisect good <commit-anterior>
git bisect run npm test
```

### Paso 4: Investigar el Código

```bash
# Ver el archivo problematico
cat src/problematic.ts

# Ver imports
import { something } from './module'

# Buscar usages
grep -r "functionName" src/

# Ver tests relacionados
cat tests/problematic.test.ts
```

### Paso 5: Implementar Solución

```typescript
// Antes (con bug)
function getUser(id: string) {
  return users.find(u => u.id === id); // Puede ser undefined
}

// Después (arreglado)
function getUser(id: string): User | null {
  return users.find(u => u.id === id) ?? null;
}
```

### Paso 6: Verificar

```bash
# Tests
npm test

# Manual
npm run dev
# ... verificar que el bug está solved

# Regresión
# Verificar que no rompimos otra cosa
```

---

## Errores Comunes y Soluciones

### TypeScript

| Error | Solución |
|-------|----------|
| `Property 'x' does not exist on type 'Y'` | Verificar tipo, usar assertions o condiciones |
| `Argument of type 'string' is not assignable to parameter of type 'number'` | Conversión de tipos |
| `Cannot find module './module'` | Verificar path, crear archivo, verificar imports |

### JavaScript/Node

| Error | Solución |
|-------|----------|
| `Cannot read property 'x' of undefined` | Verificar que el objeto existe antes de acceder |
| `Promise is not defined` | Usar async/await o .then() |
| `CORS policy blocked` | Configurar headers de CORS |

### React

| Error | Solución |
|-------|----------|
| `Cannot update during an existing state transition` | Usar useEffect para actualizaciones |
| `Too many re-renders` | Evitar actualizaciones en render |
| `Hydration failed` | Verificar SSR vs client |

### Base de Datos

| Error | Solución |
|-------|----------|
| `Connection refused` | Verificar credentials y puerto |
| `Table doesn't exist` | Ejecutar migraciones |
| `Unique constraint violation` | Verificar datos duplicados |

---

## Comandos Útiles para Debugging

```bash
# Ver errores en tiempo real
npm run dev 2>&1 | grep -i error

# Ver solo errores
node server.js 2>&1 | grep Error

# Verbose
DEBUG=* npm run dev

# Tests con coverage
npm test -- --coverage

# Tests específicos
npm test -- --grep "nombre del test"
```

---

## Después del Fix

**SIEMPRE** documentar en memoria:

```javascript
mem_save({
  title: "Bug: [título corto del bug]",
  type: "bugfix",
  project: "nombre-proyecto",
  content: `**What**: El error que ocurría
**Why**: La causa raíz (por qué ocurría)
**Where**: Archivos modificados
**How**: Cómo se solucionó (detalle técnico)
**Learned**: Cómo evitar que vuelva a pasar`
})
```

---

## Integración con SDD

En flujos SDD:

1. **sdd-explore**: Investigar el código problematico
2. **sdd-apply**: Implementar el fix
3. **sdd-verify**: Verificar que funciona
4. **mem_save**: Documentar el bug y solución

---

## Checklist del Fixer

- [ ] Reproducir el bug
- [ ] Entender el flujo hasta el error
- [ ] Identificar causa raíz
- [ ] Implementar solución
- [ ] Verificar que funciona
- [ ] Verificar que no rompe otras cosas
- [ ] Documentar en memoria
- [ ] Si es crítico, notificar al equipo