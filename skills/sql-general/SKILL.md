# Skill: SQL General

**Trigger**: Cuando escribís queries SQL, diseñás esquemas, optimizás consultas, trabajás con MySQL, PostgreSQL o SQLite, o necesitás patrones de base de datos relacionales.

---

## Dialecto por motor

| Feature | MySQL | PostgreSQL | SQLite |
|---------|-------|-----------|--------|
| Auto-increment | `AUTO_INCREMENT` | `SERIAL` / `GENERATED ALWAYS AS IDENTITY` | `INTEGER PRIMARY KEY` |
| String type | `VARCHAR(n)` | `VARCHAR(n)` / `TEXT` | `TEXT` |
| JSON | `JSON` | `JSONB` (indexable) | `TEXT` / `JSON` (v3.38+) |
| Booleano | `TINYINT(1)` | `BOOLEAN` | `INTEGER` (0/1) |
| Fecha actual | `NOW()` | `NOW()` / `CURRENT_TIMESTAMP` | `datetime('now')` |
| Regex | `REGEXP` | `~` / `~*` | `REGEXP` (extensión) |

---

## SELECT — Patrones esenciales

```sql
-- Básico con alias
SELECT u.id, u.name AS nombre, u.email
FROM users u
WHERE u.active = 1
ORDER BY u.name ASC
LIMIT 20 OFFSET 40;

-- CASE
SELECT name,
  CASE
    WHEN age < 18 THEN 'menor'
    WHEN age < 65 THEN 'adulto'
    ELSE 'senior'
  END AS grupo
FROM users;

-- Coalesce (primer valor no nulo)
SELECT COALESCE(phone, mobile, 'sin teléfono') AS contacto FROM users;

-- NULLIF (devuelve null si son iguales — evita división por cero)
SELECT total / NULLIF(count, 0) AS promedio FROM stats;
```

---

## JOINs

```sql
-- INNER JOIN: solo los que tienen match en ambas tablas
SELECT u.name, o.id AS order_id, o.total
FROM users u
INNER JOIN orders o ON u.id = o.user_id;

-- LEFT JOIN: todos los users, con o sin órdenes
SELECT u.name, COUNT(o.id) AS total_orders
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name;

-- Múltiples joins
SELECT u.name, p.name AS product, oi.quantity
FROM users u
JOIN orders o ON u.id = o.user_id
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id;
```

---

## Agregaciones

```sql
-- GROUP BY con HAVING
SELECT category, COUNT(*) AS total, AVG(price) AS precio_promedio
FROM products
WHERE active = 1
GROUP BY category
HAVING COUNT(*) > 5
ORDER BY total DESC;

-- Window functions (PostgreSQL / MySQL 8+)
SELECT
  name,
  salary,
  department,
  RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rank_en_depto,
  AVG(salary) OVER (PARTITION BY department) AS promedio_depto
FROM employees;

-- Running total
SELECT
  date,
  amount,
  SUM(amount) OVER (ORDER BY date) AS acumulado
FROM transactions;
```

---

## Subqueries y CTEs

```sql
-- CTE (Common Table Expression) — más legible que subqueries anidadas
WITH active_users AS (
  SELECT id, name, email
  FROM users
  WHERE active = 1 AND created_at > NOW() - INTERVAL '30 days'
),
user_orders AS (
  SELECT user_id, COUNT(*) AS total_orders, SUM(total) AS revenue
  FROM orders
  WHERE status = 'completed'
  GROUP BY user_id
)
SELECT u.name, u.email, COALESCE(o.total_orders, 0), COALESCE(o.revenue, 0)
FROM active_users u
LEFT JOIN user_orders o ON u.id = o.user_id
ORDER BY o.revenue DESC NULLS LAST;

-- Subquery correlacionada
SELECT name, (
  SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id
) AS total_orders
FROM users u;
```

---

## INSERT / UPDATE / DELETE

```sql
-- INSERT con ON CONFLICT (upsert PostgreSQL)
INSERT INTO users (email, name, updated_at)
VALUES ('ana@mail.com', 'Ana', NOW())
ON CONFLICT (email) DO UPDATE
SET name = EXCLUDED.name, updated_at = EXCLUDED.updated_at;

-- INSERT con ON DUPLICATE KEY (MySQL)
INSERT INTO users (email, name) VALUES ('ana@mail.com', 'Ana')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- UPDATE con JOIN (MySQL)
UPDATE orders o
JOIN users u ON o.user_id = u.id
SET o.customer_name = u.name
WHERE o.customer_name IS NULL;

-- UPDATE con FROM (PostgreSQL)
UPDATE orders o
SET customer_name = u.name
FROM users u
WHERE o.user_id = u.id AND o.customer_name IS NULL;

-- DELETE con condición en otra tabla
DELETE FROM sessions
WHERE user_id IN (
  SELECT id FROM users WHERE active = 0 AND updated_at < NOW() - INTERVAL '90 days'
);
```

---

## Índices y performance

```sql
-- Crear índice
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_status ON orders(user_id, status);  -- compuesto
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);

-- Índice parcial (PostgreSQL) — solo indexa filas relevantes
CREATE INDEX idx_orders_pending ON orders(created_at)
WHERE status = 'pending';

-- Ver plan de ejecución
EXPLAIN SELECT * FROM orders WHERE user_id = 1;
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 1;  -- ejecuta y mide
```

---

## Transacciones

```sql
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
  -- Verificar antes de confirmar
  SELECT balance FROM accounts WHERE id IN (1, 2);
COMMIT;
-- o ROLLBACK; si algo falló
```

---

## Esquema — Patrones recomendados

```sql
-- Tabla base con timestamps y soft delete
CREATE TABLE products (
  id          SERIAL PRIMARY KEY,              -- PostgreSQL
  -- id       INT AUTO_INCREMENT PRIMARY KEY,  -- MySQL
  uuid        UUID DEFAULT gen_random_uuid(),  -- PostgreSQL
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  price       DECIMAL(10, 2) NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at  TIMESTAMP NULL DEFAULT NULL      -- soft delete
);

-- FK con cascade
CREATE TABLE order_items (
  id         SERIAL PRIMARY KEY,
  order_id   INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity   INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL
);
```

---

## Errores comunes

| Problema | Solución |
|----------|---------|
| N+1 queries | Usar JOIN o eager load |
| `SELECT *` | Seleccionar solo los campos necesarios |
| Sin índice en FK | Crear índice en cada foreign key |
| Comparar NULL con `=` | Usar `IS NULL` / `IS NOT NULL` |
| División por cero | `NULLIF(divisor, 0)` |
| Timezone issues | Guardar siempre en UTC, convertir en app |
