---
name: git-commits
description: >
  Generación de commits semánticos y bien estructurados.
  Trigger: Cuando necesitas crear un commit con mensaje claro,
  convencional commits, o necesitas ayuda para decidir qué commitear.
license: Apache-2.0
metadata:
  author: personal-ai
  version: "1.0"
---

## When to Use

Usa esta skill cuando:
- Necesitas crear un commit con mensaje claro
- Quieres seguir conventional commits
- Tienes muchos cambios y necesitas organizarlos
- No estás seguro de qué incluir en un commit
- Necesitas revisar qué cambió antes de commitear

---

## Conventional Commits

Formato: `<tipo>(<ámbito>): <descripción>`

### Tipos de commit

| Tipo | Descripción |
|------|-------------|
| `feat` | Nueva funcionalidad |
| `fix` | Bug fix |
| `docs` | Documentación |
| `style` | Formateo, sin cambio de código |
| `refactor` | Refactoring sin funcionalidad nueva |
| `test` | Tests |
| `chore` | Mantenimiento, dependencias |
| `perf` | Mejora de rendimiento |
| `ci` | Cambios en CI/CD |
| `build` | Cambios en build system |

### Ámbitos comunes

- `api`, `ui`, `db`, `auth`, `config`, `deps`, etc.

### Ejemplos

```
feat(auth): agregar login con JWT
fix(db): corregir query que causaba N+1
docs(readme): actualizar instrucciones de instalación
refactor(utils): extraer lógica de validación
```

---

## Commands Útiles

### Ver cambios pendientes

```bash
# Ver estado
git status

# Ver diferencias
git diff
git diff --staged

# Ver archivos cambiados
git diff --name-only
git diff --stat
```

### Crear commits

```bash
# Commit con mensaje
git commit -m "feat(auth): agregar login con JWT"

# Commit con descripción extensa
git commit -m "feat(auth): agregar login con JWT

- Agregado endpoint /api/auth/login
- Implementado JWT con refresh tokens
- Agregados tests unitarios"

# Stage específico
git add archivo1 archivo2
git commit -m "fix: corregir error en componente X"

# Amend (si el commit anterior necesita cambios)
git commit --amend
```

### Tips para buenos commits

1. **Un commit por cambio**: Cada commit debe ser atómico
2. **Mensajes claros**: Que expliquen QUÉ y POR QUÉ, no solo QUÉ
3. **Separar concerns**: Docs分开 de código, refactors分开 de features
4. **Verificar antes de commitear**: `git diff --cached` para ver qué se.stageó

---

## Cómo genero un buen commit

### Paso 1: Ver qué cambió

```bash
git diff --stat
```

### Paso 2: Agrupar por tipo

- ¿Nuevas features? → `feat`
- ¿Bug fixes? → `fix`
- ¿Solo docs? → `docs`
- ¿Refactor? → `refactor`

### Paso 3: Escribir mensaje

```
<tipo>(<ámbito>): <descripción corta>

<descripción larga si es necesario>
```

### Paso 4: Verificar y commitear

```bash
git diff --cached  # Revisar lo que se commitea
git commit -m "..."
```

---

## Errores comunes

| Error | Solución |
|-------|----------|
| Mensaje vago ("fix stuff") | Ser específico: "fix: corregir login en Safari" |
| Commits gigantes | Dividir en commits más pequeños |
| Commits sin contexto | Agregar descripción extensa si es necesario |
| Mezclar cambios | Usar `git add -p` para commits parciales |

---

## Integración con flujos SDD

En flujos SDD, los commits típicos son:

```
sdd-init/<proyecto>: inicializar proyecto con estructura base
sdd-spec/<proyecto>: agregar especificaciones de feature X
sdd-design/<proyecto>: diseño de arquitectura para feature X
sdd-apply/<proyecto>: implementar feature X
sdd-verify/<proyecto>: verificar implementación de feature X
```
