# Skill: Implementación de Código

**Trigger**: Cuando implementás features, refactorizás código, escribís funciones/clases, o construís cualquier componente de software desde cero o modificando código existente.

---

## Proceso de implementación

### 1. Entender antes de escribir
- Leer specs o requerimientos si existen
- Preguntar si algo no está claro
- Identificar qué archivos afecta el cambio
- Verificar convenciones del proyecto

```bash
# Ver estructura del proyecto
ls -la
cat package.json 2>/dev/null || cat composer.json 2>/dev/null

# Ver convenciones existentes — imitar el estilo del código circundante
```

### 2. Planificar antes de implementar
- Identificar los archivos a crear/modificar
- Definir la interfaz pública primero (firma de funciones, tipos)
- Considerar edge cases desde el inicio
- Pensar en el manejo de errores

### 3. Implementar en orden
1. Crear/modificar archivos necesarios
2. Implementar lógica principal
3. Agregar manejo de errores
4. Verificar que funcione (correr, testear manualmente)
5. Limpiar: eliminar console.log, código comentado, etc.

### 4. Verificar antes de entregar
```bash
# Build
npm run build 2>/dev/null || true

# Tests
npm test 2>/dev/null || phpunit 2>/dev/null || true

# Lint
npm run lint 2>/dev/null || true
```

---

## Principios de código limpio

### Nombres descriptivos
```js
// Mal
const d = new Date();
const u = users.filter(x => x.a);

// Bien
const today = new Date();
const activeUsers = users.filter(user => user.active);
```

### Funciones pequeñas y con una sola responsabilidad
```js
// Mal — hace demasiado
function processUser(user) {
  // valida, guarda en DB, envía email, loguea...
}

// Bien — separar responsabilidades
function validateUser(user) { ... }
function saveUser(user) { ... }
function notifyUser(user) { ... }
```

### Manejo de errores explícito
```js
// Mal
const data = JSON.parse(input);

// Bien
try {
  const data = JSON.parse(input);
} catch (err) {
  logger.error('Invalid JSON input', { input, err });
  throw new ValidationError('Input must be valid JSON');
}
```

### Evitar magic numbers y strings
```js
// Mal
if (user.role === 3) { ... }
setTimeout(fn, 86400000);

// Bien
const ROLE_ADMIN = 3;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
if (user.role === ROLE_ADMIN) { ... }
setTimeout(fn, ONE_DAY_MS);
```

---

## Patrones de implementación por tipo de tarea

### Nueva función/método
1. Definir firma con tipos
2. Escribir casos de uso (qué entra, qué sale)
3. Implementar happy path
4. Agregar validaciones y error handling
5. Documentar si es API pública

### Refactoring
1. Asegurarse de que hay tests antes de cambiar
2. Hacer cambios pequeños e incrementales
3. Verificar que tests pasan después de cada cambio
4. No agregar funcionalidad nueva durante refactor

### Bug fix
1. Reproducir el bug primero
2. Entender la causa raíz (no solo el síntoma)
3. Escribir test que falle con el bug
4. Implementar el fix
5. Verificar que el test pasa

### Nueva feature
1. Leer la spec completa
2. Identificar todos los componentes afectados
3. Implementar de adentro hacia afuera (lógica → API → UI)
4. Testear cada capa

---

## Checklist antes de entregar

- [ ] El código hace lo que se pidió
- [ ] No hay console.log / var_dump / print_r olvidados
- [ ] No hay código comentado sin razón
- [ ] Los errores se manejan correctamente
- [ ] El build funciona sin errores
- [ ] Seguí las convenciones del proyecto (nombres, estructura)
- [ ] Si es complejo, hay comentarios que explican el "por qué" (no el "qué")
