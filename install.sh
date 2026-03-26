#!/bin/bash

set -e

REPO_URL="https://github.com/nunezlagos/personal-ai.git"
REPO_DIR="$HOME/personal-ai"

echo "=========================================="
echo "  Personal AI Setup"
echo "  Engram + Agent Teams Lite + Skills"
echo "=========================================="

if [ -d "$REPO_DIR" ]; then
    echo "📦 Actualizando repositorio..."
    cd "$REPO_DIR"
    git pull
else
    echo "📥 Clonando repositorio..."
    git clone "$REPO_URL" "$REPO_DIR"
    cd "$REPO_DIR"
fi

echo ""
echo "🔧 Instalando Engram (memoria persistente)..."
if [ ! -f "$HOME/go/bin/engram" ]; then
    mkdir -p "$HOME/go/bin"
    curl -fsSL https://github.com/gentleman-programming/engram/releases/latest/download/engram-linux-amd64 -o "$HOME/go/bin/engram"
    chmod +x "$HOME/go/bin/engram"
    echo "  ✅ Engram instalado"
else
    echo "  ✅ Engram ya estaba instalado"
fi

if [[ ":$PATH:" != *":$HOME/go/bin:"* ]]; then
    echo "  ⚠️  Agregá ~/go/bin a tu PATH:"
    echo "     echo 'export PATH=\$HOME/go/bin:\$PATH' >> ~/.zshrc"
fi

echo ""
echo "🔧 Instalando Agent Teams Lite..."
if [ ! -d "$HOME/agent-teams-lite" ]; then
    git clone --depth 1 https://github.com/gentleman-programming/agent-teams-lite.git "$HOME/agent-teams-lite"
    echo "  ✅ Agent Teams Lite instalado"
else
    echo "  ✅ Agent Teams Lite ya estaba instalado"
fi

echo ""
echo "🔗 Creando symlinks..."

mkdir -p "$HOME/.config/opencode"
mkdir -p "$HOME/.config/opencode/skills"

ln -sf "$REPO_DIR/config/AGENTS.md" "$HOME/.config/opencode/AGENTS.md"
ln -sf "$REPO_DIR/config/opencode.json" "$HOME/.config/opencode/opencode.json"
ln -sf "$REPO_DIR/config/.gitignore" "$HOME/.config/opencode/.gitignore"

for skill in "$REPO_DIR/skills"/*; do
    if [ -d "$skill" ]; then
        skill_name=$(basename "$skill")
        ln -sf "$skill" "$HOME/.config/opencode/skills/$skill_name"
        echo "  ✅ $skill_name"
    fi
done

if [ -f "$REPO_DIR/config/.claude.json" ]; then
    ln -sf "$REPO_DIR/config/.claude.json" "$HOME/.claude.json"
    echo "  ✅ .claude.json"
fi

if [ -f "$REPO_DIR/config/CLAUDE.md" ]; then
    ln -sf "$REPO_DIR/config/CLAUDE.md" "$HOME/.claude/CLAUDE.md"
    echo "  ✅ CLAUDE.md"
fi

echo ""
echo "=========================================="
echo "  ✅ Instalación completada!"
echo "=========================================="
echo ""
echo "Próximos pasos:"
echo "  1. source ~/.zshrc"
echo "  2. opencode o claude"
echo "  3. /sdd-init para inicializar SDD"
echo ""
