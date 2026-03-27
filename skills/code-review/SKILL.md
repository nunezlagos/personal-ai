# Skill: Code Review

**Trigger**: Cuando revisás código antes de merge, hacés QA, verificás que specs se cumplan, o buscás bugs potenciales en un PR o cambio.

---

## Checklist de revisión

### Funcionalidad
- [ ] ¿El código hace lo que se supone?
- [ ] ¿Los edge cases están cubiertos?
- [ ] ¿Maneja errores correctamente?
- [ ] ¿No rompe funcionalidad existente?

### Calidad
- [ ] ¿El código es legible y mantenible?
- [ ] ¿Hay duplicación innecesaria? (DRY)
- [ ] ¿Los nombres de variables/funciones son descriptivos?
- [ ] ¿Las funciones tienen una sola responsabilidad?

### Seguridad
- [ ] ¿No hay SQL injection (queries parametrizadas)?
- [ ] ¿El input del usuario está sanitizado?
- [ ] ¿No se exponen datos sensibles en logs/respuestas?
- [ ] ¿Las rutas tienen autenticación/autorización correcta?

### Performance
- [ ] ¿No hay N+1 queries?
- [ ] ¿Se usan índices donde corresponde?
- [ ] ¿No hay operaciones costosas en loops?

### Tests y build
- [ ] ¿Los tests pasan? (`npm test`, `phpunit`, etc.)
- [ ] ¿El build funciona sin errores?
- [ ] ¿El linter no reporta problemas?

---

## Proceso de revisión

### 1. Entender el contexto
```bash
# Ver qué cambió
git diff main..HEAD --stat
git log main..HEAD --oneline

# Leer el PR/tarea si hay descripción
```

### 2. Revisar cambios archivo por archivo
```bash
git diff main..HEAD -- ruta/archivo.ext
```

Buscar:
- Lógica incorrecta
- Manejo de errores ausente
- Hardcoded values que deberían ser config
- `console.log` / `var_dump` olvidados
- TODOs sin resolver

### 3. Verificar tests
```bash
# Ejecutar suite de tests
npm test
# o
phpunit
# o
pytest
```

### 4. Verificar build
```bash
npm run build
# o el comando del proyecto
```

### 5. Buscar problemas de seguridad comunes

```bash
# Buscar secrets hardcodeados
grep -rn "password\s*=\s*['\"]" --include="*.js" --include="*.php" .
grep -rn "api_key\s*=\s*['\"]" .

# Buscar console.log olvidados
grep -rn "console\.log\|var_dump\|print_r" --include="*.js" --include="*.php" .

# Queries sin parametrizar (PHP)
grep -rn "\$_GET\|\$_POST\|\$_REQUEST" --include="*.php" . | grep -v "//.*\$_"
```

---

## Feedback constructivo

**Estructura del comentario:**
```
[BLOQUEANTE/SUGERENCIA/NITPICK] Descripción del problema.

Por qué importa: ...

Alternativa sugerida:
[código o solución]
```

**Niveles:**
- **BLOQUEANTE** → debe corregirse antes de merge
- **SUGERENCIA** → mejoraría el código, discutible
- **NITPICK** → estilo, preferencia personal, no bloquea

---

## Qué NO hacer en un review

- No criticar sin proponer alternativa
- No revisar solo la lógica, ignorar tests y seguridad
- No aprobar por presión de tiempo
- No pedir cambios triviales que no agregan valor
- No asumir intención maliciosa — siempre preguntar si algo no se entiende
