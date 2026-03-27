---
name: web-researcher
description: >
  Investigación web combinando fetch MCP y Playwright MCP.
  Trigger: Cuando necesitás buscar información en internet, scrapear páginas,
  consumir APIs externas, verificar URLs, o explorar interfaces web.
license: MIT
metadata:
  author: nunezlagos
  version: "1.0"
---

# Web Researcher

Skill para investigación web usando **fetch MCP** y **Playwright MCP** en combinación.

## Cuándo usar cada herramienta

| Tarea | Herramienta | Por qué |
|-------|-------------|---------|
| Leer contenido de una URL | `fetch` | Rápido, devuelve markdown limpio |
| Verificar que una API responde | `fetch` | Simple HTTP request |
| Scrapear contenido estático | `fetch` | No necesita JS |
| Ver interfaz gráfica de una web | `playwright` | Renderiza JS, toma screenshots |
| Interactuar con formularios | `playwright` | Click, fill, submit |
| Scrapear SPA/React/Vue | `playwright` | Renderiza el DOM dinámico |
| Verificar flujo de usuario | `playwright` | Simula navegación real |
| API pública con JSON | `fetch` | Más eficiente |

## Flujo de decisión

```
¿La página usa JavaScript para renderizar contenido?
├── SÍ → Playwright
└── NO → fetch primero (más rápido)
    └── Si fetch falla o no tiene contenido → Playwright
```

## Patrones con fetch MCP

### Leer contenido de una URL
```
fetch_url(url, format="markdown")
→ Devuelve el contenido convertido a markdown
```

### Consumir una API REST
```
fetch_url("https://api.ejemplo.com/endpoint")
→ Devuelve el JSON de la respuesta
```

### Verificar disponibilidad
```
fetch_url(url)
→ Si responde = OK | Si falla = caído o bloqueado
```

## Patrones con Playwright MCP

### Ver página con JS
```
browser_navigate(url)
browser_snapshot()  → ver estructura DOM
browser_screenshot() → imagen de la página
```

### Interactuar con formularios
```
browser_navigate(url)
browser_snapshot()          → identificar elementos
browser_click(element)      → clickear
browser_fill(element, text) → escribir
browser_screenshot()        → verificar resultado
```

### Extraer datos de SPA
```
browser_navigate(url)
browser_wait_for(selector)   → esperar que cargue
browser_snapshot()           → leer DOM renderizado
```

## Workflow completo de investigación

1. **Clarificar objetivo** — ¿qué información necesitás exactamente?
2. **Elegir herramienta** — fetch para APIs/HTML estático, Playwright para SPAs/interacción
3. **Ejecutar y capturar** — siempre documentar la URL y el resultado
4. **Validar resultado** — verificar que el contenido es el esperado
5. **Iterar si es necesario** — ajustar selectores o parámetros

## Combinación fetch + Playwright

```
# Ejemplo: verificar que una API existe Y la UI la muestra correctamente
1. fetch_url(api_url)       → confirmar que la API responde
2. browser_navigate(app_url) → abrir la app
3. browser_snapshot()        → verificar que los datos aparecen en la UI
4. browser_screenshot()      → documentar el estado visual
```

## Reglas

- Siempre usar `fetch` primero si solo necesitás leer contenido — es más rápido
- Usar `Playwright` cuando necesitás ver, clicar o interactuar
- Si el contenido no carga con fetch → intentar con Playwright
- Documentar URLs consultadas para reproducibilidad
- No asumir el contenido — verificarlo con las herramientas

## Keywords
web, fetch, playwright, scraping, api, http, browser, investigacion, busqueda, url
