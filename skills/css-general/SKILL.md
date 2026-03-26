# Skill: CSS General

**Trigger**: Cuando trabajás con CSS, estilos, layouts, animaciones, responsive design, variables CSS, o cualquier tarea de estilado.

---

## Principios Fundamentales

- **Mobile-first**: diseñar desde el viewport más chico hacia arriba
- **Custom properties**: usar variables CSS (`--color-primary`) en lugar de valores hardcodeados
- **Semántica**: las clases describen propósito, no apariencia (`.card-header` no `.div-azul`)
- **Cascada controlada**: evitar especificidad alta (`!important` es señal de problema)

---

## Variables CSS — Base recomendada

```css
:root {
  /* Colores */
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --color-bg: #ffffff;
  --color-text: #1e293b;
  --color-border: #e2e8f0;

  /* Tipografía */
  --font-sans: system-ui, -apple-system, sans-serif;
  --font-mono: ui-monospace, monospace;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;

  /* Espaciado (escala 4px) */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;

  /* Bordes */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;

  /* Sombras */
  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px rgb(0 0 0 / 0.07);
}
```

---

## Layout — Flexbox

```css
/* Centrar vertical y horizontalmente */
.centered {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Row con gap */
.row {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
}

/* Columna que empuja el footer al fondo */
.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.page > main { flex: 1; }
```

## Layout — Grid

```css
/* Grid responsive sin media queries */
.grid-auto {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-4);
}

/* Grid de 12 columnas */
.grid-12 {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-4);
}
```

---

## Responsive Design

```css
/* Breakpoints base */
/* sm: 640px | md: 768px | lg: 1024px | xl: 1280px */

/* Mobile-first */
.card {
  padding: var(--space-4);
}

@media (min-width: 768px) {
  .card {
    padding: var(--space-8);
  }
}

/* Contenedor responsive */
.container {
  width: 100%;
  max-width: 1200px;
  margin-inline: auto;
  padding-inline: var(--space-4);
}
```

---

## Dark Mode

```css
/* Sistema automático */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #0f172a;
    --color-text: #f1f5f9;
    --color-border: #334155;
  }
}

/* Manual con clase */
[data-theme="dark"] {
  --color-bg: #0f172a;
  --color-text: #f1f5f9;
}
```

---

## Animaciones y Transiciones

```css
/* Transición suave — siempre usar transform/opacity (GPU) */
.btn {
  transition: transform 150ms ease, opacity 150ms ease;
}
.btn:hover {
  transform: translateY(-1px);
}

/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-in {
  animation: fadeIn 200ms ease forwards;
}

/* Respetar preferencia de movimiento reducido */
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

---

## Tipografía

```css
body {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: 1.6;
  color: var(--color-text);
}

/* Escala tipográfica */
h1 { font-size: clamp(1.75rem, 4vw, 2.5rem); font-weight: 700; }
h2 { font-size: clamp(1.375rem, 3vw, 1.875rem); font-weight: 600; }
h3 { font-size: 1.25rem; font-weight: 600; }

/* Texto truncado */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Multi-line clamp */
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

---

## Errores comunes a evitar

| Mal | Bien |
|-----|------|
| `margin: 0 auto; width: 80%` | `margin-inline: auto; max-width: ...` |
| `position: absolute` para centrar | `display: flex; place-items: center` |
| `px` para fuentes | `rem` o `clamp()` |
| `!important` | Revisar especificidad |
| `rgb(0,0,0,0.5)` | `rgb(0 0 0 / 0.5)` (sintaxis moderna) |
| `float` para layout | Flexbox o Grid |
