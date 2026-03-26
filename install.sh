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
echo -e "${BLUE}  Agentes: Oraculo, Arquitecto, Desarrollador, Revisor, Guardia${NC}"
echo -e "${BLUE}  Memoria: personal-persistence-ai-memory${NC}"
echo -e "${BLUE}==========================================${NC}"
echo ""

# ============================================
# DETECCIÓN DEL SISTEMA OPERATIVO
# ============================================

detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        echo "$ID"
    elif [ -f /etc/arch-release ]; then
        echo "arch"
    elif [ -f /etc/debian_version ]; then
        echo "debian"
    elif [ -f /etc/fedora-release ]; then
        echo "fedora"
    elif [ "$(uname)" = "Darwin" ]; then
        echo "macos"
    else
        echo "unknown"
    fi
}

OS=$(detect_os)
echo -e "Sistema detectado: ${YELLOW}$OS${NC}"
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

echo "Lenguajes y runtimes (verificación - ya deben estar en sistema):"
check_command node || echo -e "  ${YELLOW}⚠${NC} Node.js: recomendado para personal-persistence-ai-memory"
check_command npm || echo -e "  ${YELLOW}⚠${NC} npm: necesario para Node.js"
check_command php || echo -e "  ${YELLOW}⚠${NC} PHP: opcional (proyectos PHP)"
check_command composer || true
check_command go || true
check_command python3 || true

echo ""
echo "Herramientas de desarrollo:"
check_command git || true
check_command docker || echo -e "  ${YELLOW}⚠${NC} Docker: no encontrado (opcional)"

echo ""
echo -e "${YELLOW}🤖 AI Agents:${NC}"
echo ""

# ============================================
# OPENCODE
# ============================================

echo "OpenCode:"
if command -v opencode &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} OpenCode: $(opencode --version 2>/dev/null || echo "installed")"
    echo -e "  ${YELLOW}↻${NC} Actualizando OpenCode a última versión..."
    npm install -g opencode-ai 2>/dev/null && echo -e "  ${GREEN}✓${NC} OpenCode actualizado" || echo -e "  ${RED}✗${NC} OpenCode update failed"
else
    echo -e "  ${RED}✗${NC} OpenCode: NO INSTALADO"
    echo -e "  ${YELLOW}📦 Instalando OpenCode...${NC}"
    npm install -g opencode-ai && echo -e "  ${GREEN}✓${NC} OpenCode instalado" || echo -e "  ${RED}✗${NC} Error al instalar OpenCode"
fi

# ============================================
# CLAUDE CODE
# ============================================

echo ""
echo "Claude Code:"
if command -v claude &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} Claude Code: $(claude --version 2>/dev/null | head -1 || echo "installed")"
else
    echo -e "  ${YELLOW}⚠${NC} Claude Code: NO INSTALADO"
    echo -e "  ${YELLOW}📦 Instalando Claude Code...${NC}"
    
    # Intentar instalación automática
    if curl -sSfL 'https://docs.anthropic.com/claude-code/install' 2>/dev/null | sh 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} Claude Code instalado"
    else
        # Instalación manual
        echo "  ↳ Intentando instalación manual..."
        ARCH=$(uname -m)
        CLAUDE_VERSION=$(curl -s https://api.github.com/repos/anthropics/claude-code/releases/latest 2>/dev/null | grep '"tag_name"' | cut -d'"' -f4 || echo "")
        
        if [ -n "$CLAUDE_VERSION" ]; then
            if [ "$ARCH" = "x86_64" ]; then
                CLAUDE_TAR="claude-code-${CLAUDE_VERSION}-linux-x64.tar.gz"
            elif [ "$ARCH" = "aarch64" ]; then
                CLAUDE_TAR="claude-code-${CLAUDE_VERSION}-linux-arm64.tar.gz"
            else
                echo -e "  ${RED}✗${NC} Arquitectura no soportada: $ARCH"
                CLAUDE_TAR=""
            fi
            
            if [ -n "$CLAUDE_TAR" ]; then
                TEMP_DIR=$(mktemp -d)
                CLAUDE_URL="https://github.com/anthropics/claude-code/releases/download/$CLAUDE_VERSION/$CLAUDE_TAR"
                if curl -fsSL "$CLAUDE_URL" -o "$TEMP_DIR/claude.tar.gz" 2>/dev/null; then
                    tar -xzf "$TEMP_DIR/claude.tar.gz" -C "$TEMP_DIR"
                    mkdir -p "$HOME/.local/bin"
                    mv "$TEMP_DIR/claude" "$HOME/.local/bin/claude" && chmod +x "$HOME/.local/bin/claude"
                    rm -rf "$TEMP_DIR"
                    echo -e "  ${GREEN}✓${NC} Claude Code instalado"
                else
                    echo -e "  ${RED}✗${NC} Error al descargar Claude Code"
                    rm -rf "$TEMP_DIR"
                fi
            fi
        else
            echo -e "  ${YELLOW}↢${NC} Manual: https://docs.anthropic.com/claude-code/install"
        fi
    fi
fi

# Verificar que Claude Code esté en PATH
if command -v claude &> /dev/null; then
    :
elif [ -f "$HOME/.local/bin/claude" ]; then
    echo -e "  ${YELLOW}⚠️  Agregá ~/.local/bin a tu PATH:${NC}"
    echo "    echo 'export PATH=\$HOME/.local/bin:\$PATH' >> ~/.zshrc"
fi

echo ""
echo "personal-persistence-ai-memory (memoria persistente):"

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "  ${RED}✗${NC} Node.js no está instalado"
    echo -e "  ${YELLOW}⚠${NC} Instala Node.js primero: https://nodejs.org/"
else
    # Verificar si ya está instalado
    if [ -d "$HOME/personal-persistence-ai-memory" ]; then
        echo -e "  ${GREEN}✓${NC} personal-persistence-ai-memory: ~/personal-persistence-ai-memory"
        echo -e "  ${YELLOW}↻${NC} Actualizando..."
        cd "$HOME/personal-persistence-ai-memory" && git pull
    else
        echo -e "${YELLOW}📦 Instalando personal-persistence-ai-memory...${NC}"
        git clone --depth 1 https://github.com/nunezlagos/personal-persistence-ai-memory.git "$HOME/personal-persistence-ai-memory" && \
        cd "$HOME/personal-persistence-ai-memory" && npm install
    fi
    
    if [ -d "$HOME/personal-persistence-ai-memory" ]; then
        echo -e "  ${GREEN}✓${NC} personal-persistence-ai-memory instalado"
        
        # Verificar si la API está corriendo (opcional)
        echo ""
        echo "  Para iniciar la API:"
        echo "    cd ~/personal-persistence-ai-memory"
        echo "    npm run cli -- serve"
        echo ""
        echo "  Para usar desde CLI:"
        echo "    cd ~/personal-persistence-ai-memory"
        echo "    npm run cli -- -p <proyecto> <comando>"
    fi
fi

if [[ ":$PATH:" != *":$HOME/go/bin:"* ]] || [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    echo ""
    echo -e "${YELLOW}⚠️  Agregá los bins a tu PATH:${NC}"
    if [[ ":$PATH:" != *":$HOME/go/bin:"* ]]; then
        echo "    echo 'export PATH=\$HOME/go/bin:\$PATH' >> ~/.zshrc"
    fi
    if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
        echo "    echo 'export PATH=\$HOME/.local/bin:\$PATH' >> ~/.zshrc"
    fi
fi

echo ""
echo "Agent Teams Lite:"
if [ -d "$HOME/agent-teams-lite" ]; then
    echo -e "  ${GREEN}✓${NC} Agent Teams Lite: ~/agent-teams-lite"
    echo -e "  ${YELLOW}↻${NC} Actualizando Agent Teams Lite..."
    cd "$HOME/agent-teams-lite" && git pull && echo -e "  ${GREEN}✓${NC} Actualizado" || echo -e "  ${RED}✗${NC} Error al actualizar"
else
    echo -e "${YELLOW}📦 Instalando Agent Teams Lite...${NC}"
    git clone --depth 1 https://github.com/gentleman-programming/agent-teams-lite.git "$HOME/agent-teams-lite" && \
    echo -e "  ${GREEN}✓${NC} Agent Teams Lite instalado" || \
    echo -e "  ${RED}✗${NC} Error al instalar Agent Teams Lite"
fi

echo ""
echo -e "${YELLOW}🔗 Configurando symlinks (idempotente)...${NC}"

mkdir -p "$HOME/.config/opencode"
mkdir -p "$HOME/.config/opencode/skills"

for file in AGENTS.md opencode.json .gitignore; do
    if [ -f "$REPO_DIR/config/$file" ]; then
        rm -f "$HOME/.config/opencode/$file"
        ln -s "$REPO_DIR/config/$file" "$HOME/.config/opencode/$file" && \
        echo -e "  ${GREEN}✓${NC} $file" || echo -e "  ${RED}✗${NC} $file"
    fi
done

echo "  Skills:"
for skill in "$REPO_DIR/skills"/*; do
    if [ -d "$skill" ]; then
        skill_name=$(basename "$skill")
        rm -rf "$HOME/.config/opencode/skills/$skill_name"
        ln -s "$skill" "$HOME/.config/opencode/skills/$skill_name" && \
        echo -e "    ${GREEN}✓${NC} $skill_name" || \
        echo -e "    ${RED}✗${NC} $skill_name (falló)"
    fi
done

if [ -f "$REPO_DIR/config/CLAUDE.md" ]; then
    mkdir -p "$HOME/.claude"
    rm -f "$HOME/.claude/CLAUDE.md"
    ln -s "$REPO_DIR/config/CLAUDE.md" "$HOME/.claude/CLAUDE.md" && \
    echo -e "  ${GREEN}✓${NC} CLAUDE.md" || true
fi

echo ""
echo -e "${YELLOW}🔗 Configurando skills para Claude Code...${NC}"
mkdir -p "$HOME/.claude/skills"

for skill in "$REPO_DIR/skills"/*; do
    if [ -d "$skill" ]; then
        skill_name=$(basename "$skill")
        rm -rf "$HOME/.claude/skills/$skill_name"
        ln -s "$skill" "$HOME/.claude/skills/$skill_name" && \
        echo -e "  ${GREEN}✓${NC} $skill_name" || \
        echo -e "  ${RED}✗${NC} $skill_name (falló)"
    fi
done

echo ""
echo -e "${YELLOW}🧠 Configurando personal-persistence-ai-memory MCP...${NC}"

# OpenCode: ya viene configurado en opencode.json (symlinkeado arriba)
echo -e "  ${GREEN}✓${NC} OpenCode: MCP configurado via opencode.json"

# Claude Code: el sistema de memoria funciona via CLI/API
if command -v node &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} Claude Code: personal-persistence-ai-memory accesible via npm run cli"
    echo "    Usage: cd ~/personal-persistence-ai-memory && npm run cli -- -p <proyecto> <comando>"
else
    echo -e "  ${YELLOW}⚠${NC} Node.js no disponible"
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
echo "  2. OpenCode: opencode"
echo "  3. Claude Code: claude"
echo "  4. Usá el agente 'oraculo' para comenzar"
echo "  5. /sdd-init para inicializar un proyecto"
echo ""
echo "Memoria persistente:"
echo "  - API: cd ~/personal-persistence-ai-memory && npm run cli -- serve"
echo "  - CLI: cd ~/personal-persistence-ai-memory && npm run cli -- -p <proyecto> <comando>"
echo "  - Puerto: 7438"
echo ""

# Auto-actualizar PATH en shell actual
if [ -f "$HOME/.zshrc" ]; then
    source "$HOME/.zshrc"
    echo -e "${GREEN}✅ Shell actualizado${NC}"
fi
