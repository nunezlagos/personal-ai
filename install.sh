#!/bin/bash

set -e

REPO_URL="https://github.com/nunezlagos/personal-ai.git"
REPO_DIR="$HOME/personal-ai"

echo "=========================================="
echo "  Personal AI Setup"
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

echo ""
echo "✅ Instalación completada!"
echo ""
echo "Ejecuta: source ~/.zshrc"
echo "Luego: opencode o claude"
