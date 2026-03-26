# Skill: jq — JSON processor

**Trigger**: Cuando necesitás procesar JSON en la terminal, filtrar campos, transformar estructuras, parsear APIs, o trabajar con JSON en scripts bash/Node.

---

## Sintaxis base

```bash
# Leer desde archivo
jq '.' archivo.json

# Leer desde stdin (APIs, curl)
curl -s https://api.example.com/users | jq '.'

# Sin color (para scripts)
jq -r '.' archivo.json
```

---

## Filtros esenciales

```bash
# Campo simple
jq '.name' data.json

# Campo anidado
jq '.user.address.city' data.json

# Elemento de array
jq '.[0]' data.json
jq '.[-1]'          # último elemento

# Slicing
jq '.[2:5]'         # elementos 2,3,4

# Iterar array → un resultado por línea
jq '.[]' data.json

# Múltiples campos a la vez
jq '{name: .name, email: .email}' data.json
```

---

## Arrays — map, select, filter

```bash
# Mapear: transformar cada elemento
jq '[.[] | {id: .id, name: .name}]' users.json

# Filtrar: solo activos
jq '[.[] | select(.active == true)]' users.json

# Combinar filter + map
jq '[.[] | select(.age > 18) | .name]' users.json

# Longitud de array
jq '.users | length' data.json

# Ordenar
jq 'sort_by(.name)' data.json
jq 'sort_by(.age) | reverse' data.json

# Unique
jq '[.[] | .role] | unique' data.json

# Min / Max
jq 'min_by(.age)' data.json
jq 'max_by(.score)' data.json
```

---

## Objetos — keys, values, has

```bash
# Keys de un objeto
jq 'keys' config.json

# Values
jq '.config | values' data.json

# Verificar existencia
jq 'has("name")' data.json

# Seleccionar objetos que tienen un campo
jq 'select(has("email"))' data.json

# Eliminar campo
jq 'del(.password)' user.json

# Agregar/sobreescribir campo
jq '. + {status: "active"}' user.json
jq '.version = "2.0"' package.json
```

---

## Strings

```bash
# Interpolación de strings
jq '"Hola, \(.name)!"' user.json

# Split / Join
jq '.tags | join(", ")' data.json
jq '"a,b,c" | split(",")' data.json

# String contains / test (regex)
jq 'select(.email | test("@gmail\\.com$"))' users.json

# Convertir a string
jq '.id | tostring' data.json

# Parsear número
jq '"42" | tonumber' data.json
```

---

## Combinaciones útiles con bash

```bash
# Extraer IDs de una lista
jq -r '.[].id' users.json

# Iterar con bash
jq -r '.users[] | "\(.id) \(.name)"' data.json | while read id name; do
  echo "Procesando: $id - $name"
done

# Crear JSON desde bash
jq -n --arg name "Ana" --argjson age 30 '{name: $name, age: $age}'

# Merge de dos archivos
jq -s '.[0] * .[1]' base.json override.json

# Contar elementos con condición
jq '[.[] | select(.status == "error")] | length' logs.json

# Extraer valor para variable en bash
NAME=$(curl -s https://api/user/1 | jq -r '.name')
echo "Nombre: $NAME"
```

---

## curl + jq — Patrón API

```bash
# GET con header
curl -s -H "Authorization: Bearer $TOKEN" \
  https://api.example.com/users \
  | jq '.data[] | {id, name, email}'

# POST y parsear respuesta
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"name": "Ana"}' \
  https://api.example.com/users \
  | jq '{id: .id, status: "created"}'

# Paginar: extraer next_page
NEXT=$(curl -s "https://api/items?page=1" | jq -r '.meta.next_page // empty')
```

---

## Flags útiles

| Flag | Uso |
|------|-----|
| `-r` | Raw output (sin comillas en strings) |
| `-c` | Compact (una línea, sin espacios) |
| `-n` | Null input (para construir JSON sin input) |
| `-s` | Slurp (leer todo stdin como array) |
| `-e` | Exit code 1 si output es false/null |
| `--arg k v` | Pasar variable string al filtro |
| `--argjson k v` | Pasar variable JSON al filtro |

---

## Errores comunes

| Problema | Solución |
|----------|----------|
| `null` en output | El campo no existe — verificar nombre exacto |
| `Cannot iterate over null` | El campo es null — usar `// []` como default |
| Output con comillas | Usar `-r` para raw output |
| Input inválido | Verificar que el JSON sea válido: `jq '.' archivo.json` |
| Varios archivos | Usar `-s` para slurp o `jq -s '.[0]' f1.json` |

```bash
# Defaults para evitar null errors
jq '.tags // []' data.json
jq '.count // 0' data.json
jq '.name // "sin nombre"' data.json
```
