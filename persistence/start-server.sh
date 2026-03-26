#!/bin/bash
# Start script para personal-persistence-ai-memory
# Ejecutar con: bash start-server.sh

cd /home/nunezlagos/personal-persistence-ai-memory

# Verificar si el servidor ya está corriendo
if curl -s http://localhost:7438/health > /dev/null 2>&1; then
  echo "Server already running on port 7438"
  exit 0
fi

# Iniciar el servidor en background
nohup npm run cli -- serve -p 7438 > /tmp/persistence-ai-memory.log 2>&1 &

# Esperar a que inicie
sleep 2

# Verificar
if curl -s http://localhost:7438/health > /dev/null 2>&1; then
  echo "Server started on port 7438"
else
  echo "Error: Server failed to start"
  cat /tmp/persistence-ai-memory.log
  exit 1
fi