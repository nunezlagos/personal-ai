---
name: code-navigator
description: >
  Navegación y exploración inteligente de codebase. Panorama completo del proyecto
  y búsqueda optimizada de variables, clases, funciones, vistas, rutas y componentes.
  Trigger: Cuando necesitás entender la estructura de un proyecto, encontrar dónde
  está definida una clase, variable, función, vista o ruta, o antes de implementar
  algo nuevo.
license: MIT
metadata:
  author: nunezlagos
  version: "1.0"
---

# Code Navigator

Skill para explorar y entender codebases con criterio. Panorama completo + búsqueda quirúrgica.

## Fase 1 — Panorama del proyecto

Antes de tocar nada, entender qué hay:

```bash
# Estructura general
ls -la
cat package.json / composer.json / go.mod  # dependencias y scripts

# Entry points
ls src/ app/ lib/ pages/ routes/ controllers/ models/ views/

# Config principal
cat .env.example / config/ / tsconfig.json / next.config.* / vite.config.*
```

**Mapa mental a construir:**
```
proyecto/
├── ¿Dónde entran las rutas?      → routes/, pages/, app/
├── ¿Dónde está la lógica?        → controllers/, services/, handlers/
├── ¿Dónde están los modelos?     → models/, entities/, schemas/
├── ¿Dónde están las vistas?      → views/, components/, templates/
└── ¿Dónde está la config?        → config/, .env, *.config.*
```

## Fase 2 — Búsqueda optimizada

### Buscar una clase

```bash
# Por nombre exacto
grep -r "class NombreClase" src/ --include="*.ts" --include="*.php" -l

# Por herencia
grep -r "extends NombreClase" src/ -l

# Por instanciación
grep -r "new NombreClase" src/ -l
```

### Buscar una función o método

```bash
# Definición
grep -rn "function nombreFuncion\|def nombreFuncion\|nombreFuncion(" src/ -l

# Uso / llamadas
grep -rn "nombreFuncion(" src/ --include="*.ts"
```

### Buscar una variable o constante

```bash
# Definición
grep -rn "const NOMBRE\|let nombre\|var nombre\|\$nombre\s*=" src/ -l

# Por tipo
grep -rn "nombreVariable: TipoEspecifico" src/
```

### Buscar una vista / componente

```bash
# Por nombre de archivo
find . -name "*NombreVista*" -not -path "*/node_modules/*"

# Por uso en templates
grep -rn "NombreVista\|nombre-vista\|nombre_vista" src/views src/components -l
```

### Buscar una ruta

```bash
# Express / Next.js
grep -rn "'/ruta'\|'/ruta'" src/routes pages/ app/ -l

# Laravel / PHP
grep -rn "Route::.*ruta\|->prefix('ruta')" routes/ -l

# Por controller asociado
grep -rn "NombreController" routes/ -l
```

### Buscar por tipo / interface

```bash
# TypeScript
grep -rn "interface NombreTipo\|type NombreTipo" src/ -l

# Uso del tipo
grep -rn ": NombreTipo\|<NombreTipo>" src/ -l
```

## Fase 3 — Seguir el flujo

Una vez encontrado el elemento, trazar su flujo:

```
request/acción
    → ruta (routes/)
    → middleware (middleware/)
    → controller/handler
    → service/use-case
    → model/repository
    → respuesta/vista
```

**Herramientas para trazar:**
```bash
# Ver quién importa este archivo
grep -rn "import.*NombreArchivo\|require.*NombreArchivo" src/ -l

# Ver qué importa este archivo
head -30 archivo.ts  # primeras líneas = imports

# Ver exports del archivo
grep -n "^export\|module.exports" archivo.ts
```

## Fase 4 — Antes de implementar

**Checklist obligatorio antes de escribir código:**

- [ ] ¿Ya existe algo parecido? → `grep -r "nombreFuncionalidad" src/`
- [ ] ¿Hay un patrón establecido en el proyecto? → revisar 2-3 implementaciones similares
- [ ] ¿Dónde va el nuevo código? → decidir carpeta/módulo
- [ ] ¿Qué depende de qué? → evitar dependencias circulares
- [ ] ¿Hay tests de lo existente? → buscar en `tests/ __tests__ *.spec.*`

## Atajos por stack

### Next.js / React
```bash
# Páginas y rutas
ls app/ pages/
grep -r "useRouter\|Link href" src/ -l  # navegación

# Componentes usados en una página
grep -rn "import.*from" app/pagina/page.tsx
```

### Laravel / PHP
```bash
# Rutas
php artisan route:list
grep -r "Route::" routes/

# Modelos y relaciones
grep -rn "hasMany\|belongsTo\|hasOne" app/Models/ -l
```

### Express / Node
```bash
# Rutas registradas
grep -rn "app\.\(get\|post\|put\|delete\|use\)" src/ -l
grep -rn "router\.\(get\|post\|put\|delete\)" src/ -l
```

## Reglas

- **Leer antes de escribir** — siempre explorar primero, implementar después
- **Buscar lo existente** — no reimplementar lo que ya está
- **Seguir el patrón del proyecto** — coherencia sobre preferencia personal
- **Trazar el flujo completo** — entender el contexto antes de tocar un punto
- **Buscar en tests también** — los tests documentan el comportamiento esperado

## Keywords
codebase, navegacion, estructura, clase, variable, funcion, vista, ruta, componente,
busqueda, explorar, entender, panorama, arquitectura, flujo, trazar
