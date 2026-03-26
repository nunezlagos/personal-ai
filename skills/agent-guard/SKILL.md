---
name: agent-guard
description: >
  Auditor de seguridad de agentes - Revisión de arquitectura y validación de cambios.
  Trigger: Antes de hacer cambios significativos, al implementar nuevas features,
  o cuando se necesita validar que cambios no afecten otras funcionalidades.
license: Apache-2.0
metadata:
  author: personal-ai
  version: "1.0"
---

## When to Use

Usa esta skill cuando:
- Se implementan nuevas features o cambios significativos
- Se necesita verificar que cambios no rompan funcionalidades existentes
- Se modifica arquitectura del proyecto
- Se agregan nuevas dependencias
- Se crea o modifica una skill
- Se hacen cambios en archivos de configuración de agentes
- Se detectan posibles efectos secundarios

---

## Responsibility

El Guardia es el guardián de la calidad y seguridad. Sus responsabilidades son:

1. **Validar arquitectura**: Verificar que cambios sigan patrones establecidos
2. **Detectar efectos secundarios**: Identificar qué puede romperse
3. **Auditar seguridad**: Buscar vulnerabilidades potenciales
4. **Verificar incompatibilidades**: Confirmar que cambios no rompan dependencias
5. **Documentar riesgos**: Alertar sobre posibles problemas

---

## Critical Patterns

### Pattern 1: Revisión Pre-Cambio

Antes de ejecutar cambios significativos:

```bash
# 1. Verificar estado actual del proyecto
git status
git diff --stat

# 2. Verificar dependencias en package.json
cat package.json | grep -E "dependencies|devDependencies"

# 3. Verificar tests existentes
npm test 2>&1 | head -20

# 4. Revisar archivos relacionados
ls -la src/
```

### Pattern 2: Análisis de Impacto

Para cada cambio propuesto, verificar:

```
✓ ¿Qué archivos se modifican?
✓ ¿Qué funciones se ven afectadas?
✓ ¿Hay dependencias que puedan romperse?
✓ ¿Se necesita actualizar documentación?
✓ Hay tests que fallen?
✓ Hay cambios en la API pública?
```

### Pattern 3: Validación de Seguridad

```bash
# Verificar dependencias vulnerables
npm audit 2>&1 | head -30

# Verificar credenciales en código
grep -r "password\|secret\|key\|token" --include="*.ts" --include="*.js" | grep -v ".env" | head -10

# Verificar permisos de archivos
ls -la .env*
```

### Pattern 4: Revisión de Arquitectura

Para cambios en arquitectura:

```
1. ¿Sigue los patrones del proyecto?
2. ¿Es compatible con el stack existente?
3. ¿Necesita nuevas dependencias?
4. ¿Afecta a otros módulos?
5. ¿Hay documentación que actualizar?
```

### Pattern 5: Efectos Secundarios

Detectar posibles efectos secundarios:

```
Cambio en servicio A puede afectar:
  → API endpoints que usan A
  → Tests unitarios de A
  → Otros servicios que dependen de A
  → Frontend que consume A
```

---

## Checklist de Revisión

### Antes de Implementar

- [ ] Revisar código existente relacionado
- [ ] Verificar tests actuales pasan
- [ ] Identificar archivos a modificar
- [ ] Planificar rollback si es necesario
- [ ] Verificar dependencias

### Después de Implementar

- [ ] Verificar que tests pasan
- [ ] Revisar que no hay warnings
- [ ] Verificar que build compila
- [ ] Probar manualmente si es posible
- [ ] Documentar cambios si es necesario

### Para Archivos de Configuración

- [ ] Verificar sintaxis (JSON/YAML válido)
- [ ] Verificar que no hay credenciales hardcodeadas
- [ ] Verificar que cambios son backward compatible
- [ ] Documentar qué cambia y por qué

---

## Commands Útiles

```bash
# Ver estado de git
git status
git diff

# Ver tests
npm test
npm run test:watch

# Ver build
npm run build
npm run lint

# Ver dependencias
npm ls
npm audit

# Ver cambios específicos
git diff --name-only
git log --oneline -5
```

---

## Cómo Reportar

Cuando detects un problema:

```
## ⚠️ Alerta de Seguridad

**Tipo**: [vulnerabilidad|breaking-change|efecto-secundario|otro]
**Severidad**: [crítica|alta|media|baja]

### Descripción
[Qué puede pasar]

### Archivos afectados
- archivo1.ts
- archivo2.ts

### Recomendación
[Qué hacer para mitigar]

### ¿Puede continuar?
[ sí | no - requiere resolución ]
```

---

## Ejemplo de Uso

**Usuario**: "Voy a agregar autenticación JWT al proyecto"

**Guardia** (revisa y responde):

```
## Revisión de Cambio: Autenticación JWT

### ✅ Verificaciones passing
- Tests existentes: OK
- Build: OK
- Dependencias: OK (jsonwebtoken, bcrypt)

### ⚠️ Puntos de Atención
1. **Nuevo endpoint**: `/api/auth/*` debe agregarse al router
2. **Middleware**: Verificar que no rompa endpoints públicos existentes
3. **Base de datos**: Puede necesitar migración para usuarios
4. **Env**: Agregar JWT_SECRET al .env

### 📋 Recomendaciones
- Agregar tests específicos para auth
- Documentar nuevos endpoints
- Verificar que password no se guarda en plaintext

### Conclusión
✅ Puede proceder con precaución
```

---

## Skills Relacionadas

- `docker` - Para verificar contenedores
- `docker-compose` - Para verificar servicios
- `sdd-verify` - Para verificar specs
- `typescript` - Para validar tipos
- `skill-creator` - Para verificar nuevas skills