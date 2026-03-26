# Skill: PHP General

**Trigger**: Cuando trabajás con PHP, scripts, APIs, clases, Laravel, Symfony, o cualquier código PHP.

---

## PHP Moderno (8.x) — Patrones clave

### Tipos y declaraciones

```php
<?php
declare(strict_types=1);  // SIEMPRE al inicio

// Tipos en propiedades, parámetros y retorno
class User {
    public function __construct(
        public readonly int $id,
        public string $name,
        public ?string $email = null,  // nullable
    ) {}
}

// Union types
function process(int|string $value): bool|null {}

// Named arguments
createUser(name: 'Ana', email: 'ana@mail.com', active: true);
```

### Match expression

```php
// Match es estricto (===), no hace type coercion como switch
$status = match($code) {
    200, 201 => 'success',
    400      => 'bad_request',
    401, 403 => 'auth_error',
    404      => 'not_found',
    default  => 'unknown',
};
```

### Nullsafe operator

```php
// Sin nullsafe
$city = $user ? ($user->getAddress() ? $user->getAddress()->city : null) : null;

// Con nullsafe (?->)
$city = $user?->getAddress()?->city;
```

### Fibers (PHP 8.1+)

```php
$fiber = new Fiber(function(): void {
    $value = Fiber::suspend('primer suspend');
    echo "Recibí: $value\n";
});

$value = $fiber->start();     // 'primer suspend'
$fiber->resume('hola');       // Recibí: hola
```

---

## Arrays

```php
// array_map, array_filter, array_reduce
$names = array_map(fn($u) => $u->name, $users);

$active = array_filter($users, fn($u) => $u->active);

$total = array_reduce($orders, fn($carry, $o) => $carry + $o->total, 0);

// Spread operator
$merged = [...$array1, ...$array2];

// array_column — extraer columna
$ids = array_column($users, 'id');
$byId = array_column($users, null, 'id');  // indexado por id

// usort con arrow function
usort($users, fn($a, $b) => $a->name <=> $b->name);

// array_chunk — dividir en lotes
$batches = array_chunk($items, 100);
```

---

## Strings

```php
// str_contains, str_starts_with, str_ends_with (PHP 8.0+)
str_contains($email, '@gmail.com');
str_starts_with($path, '/api/');
str_ends_with($file, '.json');

// Interpolación
$msg = "Hola, {$user->name}! Tenés {$count} mensajes.";

// sprintf para formateo
$price = sprintf('$%.2f', 1234.5);  // $1234.50

// Trim / Split
$parts = explode(',', 'a,b,c');
$clean = trim($input);

// Regex
preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $date, $matches);
$slug = preg_replace('/[^a-z0-9-]/', '', strtolower($title));
```

---

## Manejo de errores

```php
// Excepciones tipadas
class UserNotFoundException extends RuntimeException {}
class ValidationException extends RuntimeException {
    public function __construct(
        public readonly array $errors,
        string $message = 'Validation failed'
    ) {
        parent::__construct($message);
    }
}

// Try / catch / finally
try {
    $user = $repo->findOrFail($id);
} catch (UserNotFoundException $e) {
    return response()->json(['error' => 'Usuario no encontrado'], 404);
} catch (Throwable $e) {
    logger()->error($e->getMessage(), ['exception' => $e]);
    return response()->json(['error' => 'Error interno'], 500);
} finally {
    $db->close();
}
```

---

## Interfaces y traits

```php
interface Repository {
    public function find(int $id): ?object;
    public function save(object $entity): void;
    public function delete(int $id): bool;
}

trait Timestamps {
    public readonly \DateTimeImmutable $createdAt;
    public \DateTimeImmutable $updatedAt;

    public function touch(): void {
        $this->updatedAt = new \DateTimeImmutable();
    }
}

class UserRepository implements Repository {
    use Timestamps;
    // ...
}
```

---

## PDO — Base de datos sin ORM

```php
// Conexión
$pdo = new PDO(
    'mysql:host=localhost;dbname=myapp;charset=utf8mb4',
    $user, $pass,
    [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]
);

// Query con prepared statement (SIEMPRE para user input)
$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ? AND active = ?');
$stmt->execute([$email, 1]);
$user = $stmt->fetch();

// Named params
$stmt = $pdo->prepare('INSERT INTO users (name, email) VALUES (:name, :email)');
$stmt->execute(['name' => $name, 'email' => $email]);
$id = $pdo->lastInsertId();

// Transacción
$pdo->beginTransaction();
try {
    $pdo->prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?')
        ->execute([$amount, $from]);
    $pdo->prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?')
        ->execute([$amount, $to]);
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    throw $e;
}
```

---

## HTTP / API sin framework

```php
// Leer body JSON
$body = json_decode(file_get_contents('php://input'), true, 512, JSON_THROW_ON_ERROR);

// Responder JSON
header('Content-Type: application/json; charset=utf-8');
http_response_code(200);
echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
exit;

// Router básico
$method = $_SERVER['REQUEST_METHOD'];
$path   = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

match("$method $path") {
    'GET /api/users'    => handleGetUsers(),
    'POST /api/users'   => handleCreateUser(),
    default             => sendJson(['error' => 'Not found'], 404),
};
```

---

## Composer / autoload

```json
// composer.json
{
  "autoload": {
    "psr-4": { "App\\": "src/" }
  },
  "require": {
    "php": "^8.2"
  }
}
```

```bash
composer install
composer require vendor/package
composer dump-autoload
```

---

## Errores comunes

| Problema | Solución |
|----------|---------|
| SQL injection | SIEMPRE prepared statements |
| Sin `declare(strict_types=1)` | Agregarlo al inicio de cada archivo |
| `isset()` abusado | Usar `??` (null coalescing) o tipos nullable |
| `array_map` retorna null values | Usar `array_values(array_filter(...))` |
| `==` para comparar | Usar `===` (estricto) |
| echo directo de user input | Siempre `htmlspecialchars()` |
