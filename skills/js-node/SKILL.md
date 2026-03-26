# Skill: JavaScript Vanilla / Node.js

**Trigger**: Cuando trabajás con JavaScript puro (sin framework), Node.js, scripts de automatización, APIs con Express/Fastify, manipulación del DOM, o cualquier tarea JS/Node sin React/Vue/Angular.

---

## JavaScript Moderno — Patrones clave

### Variables y destructuring

```js
// Preferir const > let > var (nunca var)
const user = { name: 'Ana', age: 30, role: 'admin' };

// Destructuring con defaults
const { name, role = 'user' } = user;

// Spread
const updated = { ...user, age: 31 };

// Array destructuring
const [first, second, ...rest] = [1, 2, 3, 4, 5];
```

### Funciones

```js
// Arrow function — sin contexto propio (no usar para métodos de clase)
const sum = (a, b) => a + b;

// Default params
const greet = (name = 'mundo') => `Hola, ${name}!`;

// Rest params
const total = (...nums) => nums.reduce((acc, n) => acc + n, 0);
```

### Async / Await

```js
// Siempre manejar errores
async function fetchUser(id) {
  try {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('fetchUser failed:', err.message);
    throw err;
  }
}

// Paralelo cuando no hay dependencia
const [users, posts] = await Promise.all([
  fetch('/api/users').then(r => r.json()),
  fetch('/api/posts').then(r => r.json()),
]);

// Promise.allSettled — cuando algunos pueden fallar
const results = await Promise.allSettled([fetchA(), fetchB()]);
const ok = results.filter(r => r.status === 'fulfilled').map(r => r.value);
```

### Manipulación de arrays

```js
const users = [
  { id: 1, name: 'Ana', active: true },
  { id: 2, name: 'Bob', active: false },
  { id: 3, name: 'Car', active: true },
];

// Filtrar + mapear + reducir
const activeNames = users
  .filter(u => u.active)
  .map(u => u.name);             // ['Ana', 'Car']

// Agrupar por clave
const byActive = Object.groupBy(users, u => u.active); // ES2024

// Buscar uno
const found = users.find(u => u.id === 2);

// Verificar existencia
const hasAdmin = users.some(u => u.role === 'admin');
```

### Manejo de errores

```js
// Patrón Result — evitar excepciones silenciosas
function divide(a, b) {
  if (b === 0) return { ok: false, error: 'División por cero' };
  return { ok: true, value: a / b };
}

const result = divide(10, 0);
if (!result.ok) console.error(result.error);
```

---

## DOM — Vanilla JS

```js
// Selección
const el = document.querySelector('.card');
const all = document.querySelectorAll('.item');

// Eventos — siempre con AbortController para limpiar
const controller = new AbortController();
el.addEventListener('click', handler, { signal: controller.signal });
// Para limpiar: controller.abort()

// Delegación de eventos (más eficiente que N listeners)
document.querySelector('.list').addEventListener('click', (e) => {
  const item = e.target.closest('.item');
  if (!item) return;
  // manejar click en item
});

// Crear y agregar elementos
const card = document.createElement('div');
card.className = 'card';
card.textContent = 'Hola';
document.body.append(card);

// Intersection Observer — lazy load, animaciones on-scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.animate').forEach(el => observer.observe(el));
```

---

## Node.js — Patrones comunes

### Filesystem (fs/promises)

```js
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Leer JSON
const config = JSON.parse(await readFile(join(__dirname, 'config.json'), 'utf8'));

// Escribir
await writeFile('output.json', JSON.stringify(data, null, 2));

// Listar archivos
const files = await readdir('./src', { withFileTypes: true });
const jsFiles = files.filter(f => f.isFile() && f.name.endsWith('.js'));
```

### HTTP Server — sin framework

```js
import { createServer } from 'node:http';

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(3000, () => console.log('Server en http://localhost:3000'));
```

### Express — estructura básica

```js
import express from 'express';

const app = express();
app.use(express.json());

// Middleware de errores — siempre al final
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status ?? 500).json({ error: err.message });
});

app.listen(3000);
```

### Variables de entorno

```js
// Validar al inicio — falla rápido si falta algo crítico
const required = ['DATABASE_URL', 'API_KEY'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Falta variable de entorno: ${key}`);
}

const PORT = Number(process.env.PORT) || 3000;
```

### Scripts de automatización

```js
#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { argv } from 'node:process';

const [,, ...args] = argv;

function run(cmd) {
  console.log(`→ ${cmd}`);
  return execSync(cmd, { stdio: 'inherit' });
}

// Ejemplo: script de build
run('npm run lint');
run('npm run test');
run('npm run build');
console.log('✓ Build completo');
```

---

## Módulos ES vs CommonJS

```js
// ES Modules (preferido, .mjs o "type": "module" en package.json)
import { algo } from './modulo.js';   // extensión OBLIGATORIA en Node ESM
export const fn = () => {};
export default class MyClass {}

// CommonJS (legacy)
const { algo } = require('./modulo');
module.exports = { fn };
```

---

## Errores comunes

| Mal | Bien |
|-----|------|
| `var x` | `const x` / `let x` |
| `.then().catch()` mezclado con `await` | Elegir uno: async/await con try/catch |
| `require()` en proyecto ESM | `import` |
| `JSON.parse()` sin try/catch | Siempre wrappear |
| `process.exit()` en librerías | Solo en entry points |
| Callbacks anidados | Promesas / async-await |
