---
name: port-manager
description: >
  Gestión de puertos del sistema - Docker, proyectos, servicios. 
  Trigger: Cuando se necesita saber qué puertos están ocupados, 
  gestionar servicios en puertos específicos, o diagnosticar conflictos de puertos.
license: Apache-2.0
metadata:
  author: personal-ai
  version: "1.0"
---

## When to Use

Use esta skill cuando:
- Necesitas saber qué puertos están ocupados en el sistema
- Docker está usando un puerto que necesitas
- Necesitas encontrar qué proceso está usando un puerto
- Quieres reservar puertos para proyectos específicos
- Diagnosticar errores de "port already in use"
- Gestionar múltiples proyectos con diferentes puertos

---

## Critical Patterns

### Pattern 1: Ver Puertos Ocupados

```bash
# Ver todos los puertos ocupados (formato limpio)
ss -tulpn | grep LISTEN

# Ver puertos ocupados con proceso
sudo lsof -i -P -n | grep LISTEN

# Ver puertos específicos (ej: 3000, 5432, 7438)
sudo lsof -i :3000
sudo lsof -i :5432
sudo lsof -i :7438

# Ver puertos Docker
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

### Pattern 2: Puertos por Proyecto

```bash
# Proyectos comunes y sus puertos por defecto:
# - Next.js: 3000, 3001, 3002...
# - React: 5173, 5174...
# - Node/Express: 3000, 4000, 5000...
# - PostgreSQL: 5432
# - MySQL: 3306
# - Redis: 6379
# - MongoDB: 27017
# - API servers: 7438, 8080, 8000...
# - Laravel: 8000, 5173
# - Angular: 4200

# Ver puertos de Docker por proyecto
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep -E "next|react|node|api"
```

### Pattern 3: Matar Proceso en Puerto

```bash
# Encontrar PID del proceso en puerto
sudo lsof -i :3000

# Matar el proceso (reemplazar PID)
kill -9 <PID>

# O usando fuser
sudo fuser -k 3000/tcp

# Para Docker: encontrar contenedor
docker ps --filter "publish=3000" --format "{{.Names}}"
docker stop $(docker ps --filter "publish=3000" -q)
```

### Pattern 4: Reservar Puertos para Proyecto

```bash
# Convention: Puertos por tipo de proyecto
# Frontend: 3000-3999
# Backend/API: 4000-4999
# Databases: 5000-5999
# DevTools: 7000-7999
# Testing: 8000-8999

# Asignaciones sugeridas:
# - personal-persistence-ai-memory: 7438
# - Next.js projects: 3000+
# - PostgreSQL: 5432
# - Redis: 6379

# Ver si puerto está libre
sudo lsof -i :7438
```

### Pattern 5: Diagnosticar Conflictos

```bash
# Error: port already in use
# 1. Encontrar qué está usando el puerto
sudo lsof -i :<puerto>

# 2. Ver si es Docker
docker ps --format "{{.Names}}" | xargs -I {} docker port {}

# 3. Matar o cambiar puerto
# Opción A: Matar proceso
sudo fuser -k <puerto>/tcp
# Opción B: Cambiar puerto en config del proyecto

# 4. Verificar que esté libre
sudo lsof -i :<puerto>
```

---

## Comandos Útiles

### Ver todos los servicios del sistema

```bash
# Servicios systemD activos
systemctl list-units --type=service --state=running | grep -E "nginx|apache|postgres|mysql|redis|mongodb"

# Ver servicios en puertos comunes
for port in 80 443 3000 5432 6379 27017 7438; do
  sudo lsof -i :$port 2>/dev/null && echo "Puerto $port: OCUPADO" || echo "Puerto $port: libre"
done
```

### Docker y puertos

```bash
# Ver todos los puertos publicados de Docker
docker port $(docker ps -q)

# Ver mapping de puertos de un contenedor
docker port <container_name>

# Verred de Docker
docker network ls
docker network inspect <network_name>
```

---

## Configuración de Proyecto

Para nuevos proyectos, registra los puertos en la memoria del sistema:

```bash
# Usar personal-persistence-ai-memory para guardar
npm run cli -- -p <proyecto> save "Puerto asignado" "Puerto: XXXX, usado para: descripcion" --type config
```

---

## Troubleshooting

| Error | Solución |
|-------|----------|
| EADDRINUSE | `sudo fuser -k <puerto>/tcp` |
| Docker port conflict | `docker stop $(docker ps -q)` o cambia puerto en docker-compose.yml |
| Cannot bind to port | Verificar permisos (sudo) o usar otro puerto |
| Port not exposed | Verificar EXPOSE en Dockerfile o --publish en docker run |