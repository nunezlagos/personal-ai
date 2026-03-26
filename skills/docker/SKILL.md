---
name: docker
description: >
  Docker patterns for development, debugging, and container management.
  Trigger: When working with Docker containers, images, networks, or debugging container issues.
license: Apache-2.0
metadata:
  author: personal-ai
  version: "1.0"
---

## When to Use

Use this skill when:
- Managing Docker containers (start, stop, restart, remove)
- Building Docker images
- Debugging container issues
- Inspecting container logs
- Managing networks y volumes
- Cleaning up Docker resources

---

## Critical Patterns

### Pattern 1: Container Lifecycle

```bash
# Ver estado de todos los contenedores
docker ps -a

# Ver contenedores corriendo
docker ps

# Iniciar un contenedor
docker start <container_name>

# Detener un contenedor
docker stop <container_name>

# Reiniciar un contenedor
docker restart <container_name)

# Eliminar un contenedor (forzado)
docker rm -f <container_name>
```

### Pattern 2: Logs y Debugging

```bash
# Ver logs de un contenedor (follow)
docker logs -f <container_name>

# Ver logs con timestamps
docker logs -f --timestamps <container_name>

# Ver últimas N líneas
docker logs --tail 100 <container_name>

# Inspect completo de un contenedor
docker inspect <container_name>

# Ver procesos dentro del contenedor
docker top <container_name>

#进入 un contenedor (sh o bash)
docker exec -it <container_name> sh
docker exec -it <container_name> bash
```

### Pattern 3: Images

```bash
# Listar imágenes
docker images

# Eliminar imagen
docker rmi <image_name>

# Eliminar imágenes dangling
docker image prune

# Build de imagen
docker build -t <image_name>:<tag> .

# Taggear imagen
docker tag <image> <new_image>:<tag>

# Pull de imagen
docker pull <image>
```

### Pattern 4: Networks y Volumes

```bash
# Listar redes
docker network ls

# Listar volúmenes
docker volume ls

# Inspección de red
docker network inspect <network_name>

# Inspección de volumen
docker volume inspect <volume_name>

# Crear red
docker network create <network_name>

# Eliminar red
docker network rm <network_name>

# Eliminar volúmenes huérfanos
docker volume prune
```

### Pattern 5: Limpieza

```bash
# Eliminar contenedores detenidos
docker container prune

# Eliminar redes no usadas
docker network prune

# Eliminar imágenes sin usar
docker image prune -a

# Limpieza completa (con Warning!)
docker system prune -a --volumes
```

---

## Troubleshooting

### Contenedor no inicia

```bash
# Ver logs
docker logs <container_name>

# Ver estado
docker inspect <container_name>

# Ver eventos
docker events

# Verificar si hay conflictos de puerto
docker port <container_name>
```

### Problemas de red

```bash
# Ver redes del contenedor
docker inspect <container_name> --format '{{json .NetworkSettings.Networks}}'

# Probar conectividad desde el contenedor
docker exec -it <container_name> ping <host>

# Ver DNS del contenedor
docker exec -it <container_name> cat /etc/resolv.conf
```

### Problemas de permisos

```bash
# Agregar usuario al grupo docker
sudo usermod -aG docker $USER

# O usar sudo temporalmente
sudo docker <command>
```

---

## Common Commands Reference

| Acción | Comando |
|--------|---------|
| Ver contenedores | `docker ps -a` |
| Ver logs | `docker logs -f <name>` |
|进入 contenedor | `docker exec -it <name> sh` |
| Ver imágenes | `docker images` |
| Ver redes | `docker network ls` |
| Ver volúmenes | `docker volume ls` |
| Limpiar todo | `docker system prune -a` |