# Skill: Regex — Expresiones Regulares

**Trigger**: Cuando necesitás validar, buscar, extraer o transformar texto con regex en JavaScript, PHP, Python, bash, o cualquier lenguaje.

---

## Sintaxis base

```
.       → cualquier caracter (excepto newline)
\d      → dígito [0-9]
\w      → palabra [a-zA-Z0-9_]
\s      → espacio, tab, newline
\D \W \S → negaciones de los anteriores
^       → inicio de línea/string
$       → fin de línea/string
\b      → word boundary

# Cuantificadores
*       → 0 o más
+       → 1 o más
?       → 0 o 1 (opcional)
{n}     → exactamente n
{n,}    → n o más
{n,m}   → entre n y m

# Greedy vs Lazy
.*      → greedy: toma lo máximo posible
.*?     → lazy: toma lo mínimo posible

# Grupos
(abc)   → grupo capturador
(?:abc) → grupo no capturador (sin guardar)
(?P<name>abc) → grupo con nombre (Python/PHP)
(?<name>abc)  → grupo con nombre (JS/PHP)

# Alternancia y sets
a|b     → a o b
[abc]   → a, b o c
[^abc]  → cualquier cosa excepto a, b, c
[a-z]   → a hasta z
```

---

## Patrones comunes

```
# Email (básico — no usar en producción, hay librerías)
^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$

# URL
https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&/=]*)

# Teléfono (flexible)
^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,}$

# IP v4
^(\d{1,3}\.){3}\d{1,3}$

# Fecha YYYY-MM-DD
^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$

# Slug URL
^[a-z0-9]+(?:-[a-z0-9]+)*$

# Contraseña fuerte (mín 8 chars, mayúscula, minúscula, número)
^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$

# UUID
^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$

# JWT
^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$

# Hex color
^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$

# Número entero o decimal
^-?\d+(\.\d+)?$

# Solo letras y espacios
^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$
```

---

## JavaScript

```js
// Literal
const re = /^hello\s+world$/i;  // i = case insensitive

// Constructor (cuando el pattern es dinámico)
const re = new RegExp(`^${escapeRegex(input)}$`, 'i');

// Flags: g=global, i=insensitive, m=multiline, s=dotAll, u=unicode

// test — boolean
/^\d+$/.test('123')   // true

// match — array de matches
'2024-01-15'.match(/(\d{4})-(\d{2})-(\d{2})/)
// ['2024-01-15', '2024', '01', '15', index: 0]

// matchAll — todos los matches (requiere /g)
const matches = [...'cat bat rat'.matchAll(/[a-z]at/g)];

// replace
'hello world'.replace(/world/, 'JS')           // 'hello JS'
'aaa bbb'.replace(/[a-z]+/g, s => s.toUpperCase())  // 'AAA BBB'

// replaceAll — equivalente a /g
'a,b,c'.replaceAll(',', ' | ')

// split
'one,two,,three'.split(/,+/)   // ['one', 'two', 'three']

// Grupos con nombre
const { year, month, day } = '2024-01-15'
  .match(/(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/)
  .groups;

// Escapar caracteres especiales en un string
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
```

---

## PHP

```php
// preg_match — primer match (retorna 1/0/false)
preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $date, $matches);
// $matches[0] = match completo, [1] = año, [2] = mes...

// preg_match_all — todos los matches
$count = preg_match_all('/\d+/', $string, $matches);
// $matches[0] = array de todos los matches

// preg_replace
$slug = preg_replace('/[^a-z0-9-]/', '', strtolower($title));

// preg_replace_callback
$result = preg_replace_callback('/\{\{(\w+)\}\}/', function($m) use ($vars) {
    return $vars[$m[1]] ?? $m[0];
}, $template);

// preg_split
$parts = preg_split('/\s+/', trim($input));

// Grupos con nombre
preg_match('/(?P<year>\d{4})-(?P<month>\d{2})/', $date, $m);
echo $m['year'];  // 2024

// Flags: i=insensitive, m=multiline, s=dotAll, u=unicode
preg_match('/patrón/iu', $string);
```

---

## Bash / grep / sed

```bash
# grep — buscar líneas
grep -E '^\d{4}-\d{2}-\d{2}' archivo.log   # -E = extended regex
grep -P '\d{1,3}\.\d{1,3}' archivo.log       # -P = Perl regex
grep -oE '\b\d+\b' archivo.txt               # -o = solo el match

# sed — reemplazar
sed 's/foo/bar/g' archivo.txt               # reemplazar en output
sed -i 's/foo/bar/g' archivo.txt            # in-place
sed -E 's/^([0-9]+)\s+//' archivo.txt       # con grupos

# Captura con bash regex
if [[ "$fecha" =~ ^([0-9]{4})-([0-9]{2})-([0-9]{2})$ ]]; then
  echo "Año: ${BASH_REMATCH[1]}"
fi
```

---

## Lookahead / Lookbehind

```
(?=...)    → lookahead positivo: seguido de...
(?!...)    → lookahead negativo: NO seguido de...
(?<=...)   → lookbehind positivo: precedido de...
(?<!...)   → lookbehind negativo: NO precedido de...

# Precio: número seguido de $ pero sin capturar el $
\d+(?=\$)   → en "100$ 200€" captura 100

# Contraseña con lookaheads (tiene mayúscula Y número)
^(?=.*[A-Z])(?=.*\d).{8,}$
```

---

## Tips de rendimiento

| Problema | Solución |
|----------|---------|
| Backtracking catastrófico | Evitar `(.+)+` — usar `[^x]+` con límites claros |
| Regex en loop sin compilar | Pre-compilar fuera del loop (`const re = /pattern/`) |
| `.*` para todo | Ser específico: `[^,]+` en vez de `.*` para CSVs |
| Sin anclas | Agregar `^` y `$` cuando corresponda |
| Validar emails con regex | Usar librería o verificación por envío |
