---
name: docker-compose
description: >
  Docker Compose patterns for managing multi-container applications.
  Trigger: When working with docker-compose.yml files, managing stacks, or orchestration.
license: Apache-2.0
metadata:
  author: personal-ai
  version: "1.0"
---

## When to Use

Use this skill when:
- Managing docker-compose.yml files
- Starting/stopping multi-container applications
- Scaling services
- Viewing logs de múltiples contenedores

---

## Critical Patterns

### Pattern 1: Lifecycle

```bash
docker-compose up -d
docker-compose down
docker-compose restart <service>
docker-compose ps
```

### Pattern 2: Logs

```bash
docker-compose logs -f
docker-compose logs -f <service>
docker-compose logs --tail=100 <service>
```

### Pattern 3: Exec

```bash
docker-compose exec <service> sh
docker-compose exec <service> <command>
```

### Pattern 4: Build

```bash
docker-compose build
docker-compose build --no-cache <service>
docker-compose up --build
```

---

## Services Common

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```