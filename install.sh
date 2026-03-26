#!/bin/bash

set -e

REPO_URL="https://github.com/nunezlagos/personal-ai.git"
REPO_DIR="$HOME/personal-ai"

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}  Personal AI Setup${NC}"
echo -e "${BLUE}  Stack: PHP, TypeScript, JavaScript${NC}"
echo -e "${BLUE}  Agente: Oraculo${NC}"
echo -e "${BLUE}==========================================${NC}"
echo ""

if [ -d "$REPO_DIR" ]; then
    echo -e "${YELLOW}📦 Actualizando repositorio...${NC}"
    cd "$REPO_DIR"
    git pull
else
    echo -e "${YELLOW}📥 Clonando repositorio...${NC}"
    git clone "$REPO_URL" "$REPO_DIR"
    cd "$REPO_DIR"
fi

echo ""
echo -e "${YELLOW}🔍 Verificando dependencias del sistema...${NC}"
echo ""

check_command() {
    if command -v "$1" &> /dev/null; then
        version=$($1 --version 2>&1 | head -1 | cut -d' ' -f1-3 || echo "installed")
        echo -e "  ${GREEN}✓${NC} $1: $version"
        return 0
    else
        echo -e "  ${RED}✗${NC} $1: NO INSTALADO"
        return 1
    fi
}

MISSING_DEPS=()

echo "Lenguajes y runtimes:"
check_command node || MISSING_DEPS+=(node)
check_command npm || MISSING_DEPS+=(npm)
check_command php || MISSING_DEPS+=(php)
check_command go || MISSING_DEPS+=(go)
check_command python3 || MISSING_DEPS+=(python3)

echo ""
echo "Bases de datos:"
check_command mysql || check_command mysqld || echo -e "  ${YELLOW}⚠${NC} MySQL: no encontrado (opcional)"
check_command psql || echo -e "  ${YELLOW}⚠${NC} PostgreSQL: no encontrado (opcional)"
check_command mongod || echo -e "  ${YELLOW}⚠${NC} MongoDB: no encontrado (opcional)"

echo ""
echo "Herramientas de desarrollo:"
check_command git || MISSING_DEPS+=(git)
check_command docker || echo -e "  ${YELLOW}⚠${NC} Docker: no encontrado (opcional)"
check_command composer || echo -e "  ${YELLOW}⚠${NC} Composer: no encontrado (recomendado para PHP)"

echo ""
echo "AI Agents:"
if command -v opencode &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} OpenCode: $(opencode --version 2>/dev/null || echo "installed")"
else
    echo -e "  ${RED}✗${NC} OpenCode: NO INSTALADO"
    echo "    → npm install -g opencode-ai"
fi

if command -v claude &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} Claude Code: installed"
else
    echo -e "  ${YELLOW}⚠${NC} Claude Code: no encontrado (opcional)"
fi

echo ""
echo "Engram (memoria persistente):"
if [ -f "$HOME/go/bin/engram" ]; then
    echo -e "  ${GREEN}✓${NC} Engram: ~/go/bin/engram"
else
    echo -e "${YELLOW}📦 Instalando Engram...${NC}"
    mkdir -p "$HOME/go/bin"
    ARCH=$(uname -m)
    if [ "$ARCH" = "x86_64" ]; then
        ENGRAM_FILE="engram-linux-amd64"
    elif [ "$ARCH" = "aarch64" ]; then
        ENGRAM_FILE="engram-linux-arm64"
    else
        ENGRAM_FILE="engram-linux-amd64"
    fi
    
    curl -fsSL "https://github.com/gentleman-programming/engram/releases/latest/download/$ENGRAM_FILE" -o "$HOME/go/bin/engram" 2>/dev/null && \
    chmod +x "$HOME/go/bin/engram" && \
    echo -e "  ${GREEN}✓${NC} Engram instalado" || \
    echo -e "  ${RED}✗${NC} Error al instalar Engram"
fi

if [[ ":$PATH:" != *":$HOME/go/bin:"* ]]; then
    echo ""
    echo -e "${YELLOW}⚠️  Agregá ~/go/bin a tu PATH:${NC}"
    echo "    echo 'export PATH=\$HOME/go/bin:\$PATH' >> ~/.zshrc"
fi

echo ""
echo "Agent Teams Lite:"
if [ -d "$HOME/agent-teams-lite" ]; then
    echo -e "  ${GREEN}✓${NC} Agent Teams Lite: ~/agent-teams-lite"
else
    echo -e "${YELLOW}📦 Instalando Agent Teams Lite...${NC}"
    git clone --depth 1 https://github.com/gentleman-programming/agent-teams-lite.git "$HOME/agent-teams-lite" && \
    echo -e "  ${GREEN}✓${NC} Agent Teams Lite instalado" || \
    echo -e "  ${RED}✗${NC} Error al instalar Agent Teams Lite"
fi

echo ""
echo -e "${YELLOW}🔗 Configurando symlinks...${NC}"

mkdir -p "$HOME/.config/opencode"
mkdir -p "$HOME/.config/opencode/skills"

echo -n "  "
for file in AGENTS.md opencode.json .gitignore; do
    if [ -f "$REPO_DIR/config/$file" ]; then
        ln -sf "$REPO_DIR/config/$file" "$HOME/.config/opencode/$file" 2>/dev/null && \
        echo -n "${GREEN}✓${NC} " || echo -n "${RED}✗${NC} "
    fi
done
echo ""

echo "  Skills:"
for skill in "$REPO_DIR/skills"/*; do
    if [ -d "$skill" ]; then
        skill_name=$(basename "$skill")
        ln -sf "$skill" "$HOME/.config/opencode/skills/$skill_name" 2>/dev/null && \
        echo -e "    ${GREEN}✓${NC} $skill_name" || \
        echo -e "    ${RED}✗${NC} $skill_name (falló)"
    fi
done

if [ -f "$REPO_DIR/config/.claude.json" ]; then
    ln -sf "$REPO_DIR/config/.claude.json" "$HOME/.claude.json" 2>/dev/null && \
    echo -e "  ${GREEN}✓${NC} .claude.json" || true
fi

if [ -f "$REPO_DIR/config/CLAUDE.md" ]; then
    mkdir -p "$HOME/.claude"
    ln -sf "$REPO_DIR/config/CLAUDE.md" "$HOME/.claude/CLAUDE.md" 2>/dev/null && \
    echo -e "  ${GREEN}✓${NC} CLAUDE.md" || true
fi

echo ""
if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Dependencias faltantes:${NC}"
    for dep in "${MISSING_DEPS[@]}"; do
        echo "    - $dep"
    done
    echo ""
    echo "Para instalar en Arch/Manjaro:"
    echo "    sudo pacman -S ${MISSING_DEPS[*]}"
    echo ""
    echo "Para instalar en Ubuntu/Debian:"
    echo "    sudo apt install ${MISSING_DEPS[*]}"
    echo ""
else
    echo -e "${GREEN}✅ Todas las dependencias principales están instaladas${NC}"
fi

echo ""
echo -e "${BLUE}==========================================${NC}"
echo -e "${GREEN}  Instalación completada${NC}"
echo -e "${BLUE}==========================================${NC}"
echo ""
echo "Próximos pasos:"
echo "  1. source ~/.zshrc"
echo "  2. opencode"
echo "  3. Usá el agente 'oraculo' para comenzar"
echo "  4. /sdd-init para inicializar un proyecto"
echo ""
