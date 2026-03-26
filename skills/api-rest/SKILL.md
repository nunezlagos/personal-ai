# Skill: API REST

**Trigger**: Cuando diseñás, construís o consumís APIs REST — endpoints, status codes, autenticación, versionado, o documentación.

---

## Principios de diseño

- **Resources sobre verbos**: `/users` no `/getUsers`
- **Plural para colecciones**: `/users`, `/orders`, `/products`
- **Jerarquía con sentido**: `/users/42/orders` (órdenes del user 42)
- **Stateless**: cada request contiene toda la info necesaria
- **Consistencia**: mismas convenciones en todos los endpoints

---

## Estructura de URLs

```
GET    /users              → listar usuarios
POST   /users              → crear usuario
GET    /users/:id          → obtener usuario
PUT    /users/:id          → reemplazar usuario completo
PATCH  /users/:id          → actualizar campos parciales
DELETE /users/:id          → eliminar usuario

GET    /users/:id/orders   → órdenes de un usuario
POST   /users/:id/orders   → crear orden para un usuario

# Acciones que no encajan en CRUD
POST   /users/:id/activate
POST   /orders/:id/cancel
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
```

---

## HTTP Status Codes

```
# 2xx — Éxito
200 OK              → GET, PUT, PATCH exitosos
201 Created         → POST exitoso (incluir Location header)
204 No Content      → DELETE exitoso, o PUT/PATCH sin body

# 3xx — Redirección
301 Moved Permanently
304 Not Modified    → caché válido (ETag / If-None-Match)

# 4xx — Error del cliente
400 Bad Request     → datos inválidos, JSON malformado
401 Unauthorized    → no autenticado (falta token)
403 Forbidden       → autenticado pero sin permiso
404 Not Found       → recurso no existe
409 Conflict        → conflicto de estado (ej. email ya existe)
422 Unprocessable   → datos bien formados pero inválidos (validación)
429 Too Many Req    → rate limiting

# 5xx — Error del servidor
500 Internal Error  → error inesperado
503 Unavailable     → mantenimiento o sobrecarga
```

---

## Estructura de respuestas

### Éxito — Recurso simple
```json
{
  "data": {
    "id": 42,
    "name": "Ana García",
    "email": "ana@mail.com",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Éxito — Colección paginada
```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "per_page": 20,
    "total_pages": 8
  },
  "links": {
    "self":  "/users?page=1",
    "next":  "/users?page=2",
    "last":  "/users?page=8"
  }
}
```

### Error
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos enviados son inválidos",
    "details": [
      { "field": "email", "message": "Formato de email inválido" },
      { "field": "age",   "message": "Debe ser mayor de 18" }
    ]
  }
}
```

---

## Headers importantes

```
# Request
Authorization: Bearer {jwt_token}
Content-Type: application/json
Accept: application/json
X-Request-ID: {uuid}        # tracing

# Response
Content-Type: application/json; charset=utf-8
Location: /users/42          # después de POST 201
X-Request-ID: {uuid}         # eco del request id
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1716000000
```

---

## Autenticación — JWT

```
POST /auth/login
Body: { "email": "ana@mail.com", "password": "..." }

Response 200:
{
  "data": {
    "access_token":  "eyJ...",   // corta duración (15min - 1h)
    "refresh_token": "eyJ...",   // larga duración (7-30 días)
    "expires_in": 3600
  }
}

# Refresh
POST /auth/refresh
Authorization: Bearer {refresh_token}
→ nuevo access_token

# Logout
POST /auth/logout
Authorization: Bearer {access_token}
→ invalida refresh_token en servidor
```

---

## Versionado

```
# URL versioning (más explícito)
/api/v1/users
/api/v2/users

# Header versioning (más limpio)
Accept: application/vnd.myapi.v2+json

# Recomendado: URL versioning para APIs públicas
# Regla: v1 siempre funciona, v2 agrega/cambia, nunca romper sin deprecar
```

---

## Filtrado, ordenamiento y paginación

```
# Filtros
GET /users?active=true&role=admin
GET /orders?status=pending&created_after=2024-01-01

# Ordenamiento
GET /users?sort=name&order=asc
GET /products?sort=-price          # - = descendente

# Paginación (cursor-based para grandes datasets)
GET /users?page=2&per_page=20
GET /users?cursor=eyJpZCI6MTB9&limit=20

# Búsqueda
GET /users?q=ana
GET /products?search=laptop&category=electronics

# Campos específicos (reducir payload)
GET /users?fields=id,name,email
```

---

## Idempotencia

```
# Idempotentes (se pueden repetir sin cambiar resultado):
GET, PUT, DELETE, PATCH

# NO idempotente (crea algo nuevo cada vez):
POST

# Hacer POST idempotente con Idempotency-Key:
POST /payments
Idempotency-Key: {uuid-del-cliente}
→ Si se reintenta con la misma key, retorna el resultado original
```

---

## Errores comunes

| Problema | Solución |
|----------|---------|
| Verbos en URLs | Usar HTTP methods + sustantivos |
| 200 para errores | Usar código HTTP correcto |
| Exponer detalles internos | Sanitizar mensajes de error en producción |
| Sin versionado | Agregar `/v1/` desde el inicio |
| Paginación sin límite | Siempre límite máximo (ej. 100) |
| Retornar contraseñas/tokens en respuestas | Filtrar campos sensibles |
| Sin rate limiting | Implementar desde el principio |
