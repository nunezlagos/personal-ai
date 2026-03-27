#!/bin/bash

# No set -e - allow continuing through optional errors

REPO_URL="https://github.com/nunezlagos/personal-ai.git"
REPO_DIR="$HOME/personal-ai"
PERSISTENCE_DIR="$REPO_DIR/persistence"

# ─── Colors ──────────────────────────────────────
B='\033[0;34m'
G='\033[0;32m'
Y='\033[1;33m'
R='\033[0;31m'
D='\033[2m'
NC='\033[0m'

# ─── Helpers ─────────────────────────────────────
ok()   { echo -e "  ${G}✓${NC}  $*"; }
fail() { echo -e "  ${R}✗${NC}  $*"; }
warn() { echo -e "  ${Y}·${NC}  $*"; }
run()  { echo -e "  ${D}→  $*${NC}"; }

STEP=0
TOTAL=7

step() {
    STEP=$((STEP + 1))
    echo ""
    echo -e "${B}[$STEP/$TOTAL]${NC}  $*"
    echo -e "  ${D}$(printf '─%.0s' {1..40})${NC}"
}

# ─── Header ──────────────────────────────────────
clear
echo ""
echo -e "  ${B}Personal AI${NC}  ${D}·  Orquestador${NC}"
echo -e "  ${D}──────────────────────────────────────────${NC}"
echo ""

# ─────────────────────────────────────────────────
# [1/7] Limpieza de instalación previa
# ─────────────────────────────────────────────────

step "Limpieza previa"

clean_symlink() {
    local target="$1"
    local label="${2:-$1}"
    if [ -L "$target" ] || [ -e "$target" ]; then
        rm -rf "$target" && ok "Limpiado  ${D}$label${NC}"
    fi
}

# Symlinks de configuración
clean_symlink "$HOME/.claude/AGENTS.md"    "~/.claude/AGENTS.md"
clean_symlink "$HOME/.claude/CLAUDE.md"   "~/.claude/CLAUDE.md"
clean_symlink "$HOME/.config/opencode/AGENTS.md"   "~/.config/opencode/AGENTS.md"
clean_symlink "$HOME/.config/opencode/opencode.json" "~/.config/opencode/opencode.json"
clean_symlink "$HOME/.config/opencode/.gitignore"  "~/.config/opencode/.gitignore"

# Skills (limpiar todas las que existan de instalaciones previas)
if [ -d "$HOME/.config/opencode/skills" ]; then
    for skill in "$HOME/.config/opencode/skills"/*; do
        [ -L "$skill" ] && rm -f "$skill"
    done
fi
if [ -d "$HOME/.config/Claude/skills" ]; then
    for skill in "$HOME/.config/Claude/skills"/*; do
        [ -L "$skill" ] && rm -f "$skill"
    done
fi
ok "Skills anteriores  ${D}limpiadas${NC}"

# MCP wrapper
clean_symlink "$HOME/.local/bin/persistence-mcp" "persistence-mcp wrapper"

ok "Limpieza  ${D}completa${NC}"

# ─────────────────────────────────────────────────
# [2/7] Sistema y repositorio
# ─────────────────────────────────────────────────

step "Sistema y repositorio"

detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release; echo "$ID"
    elif [ -f /etc/arch-release ]; then echo "arch"
    elif [ -f /etc/debian_version ]; then echo "debian"
    elif [ -f /etc/fedora-release ]; then echo "fedora"
    elif [ "$(uname)" = "Darwin" ]; then echo "macos"
    else echo "unknown"
    fi
}

OS=$(detect_os)
ok "OS  ${D}$OS${NC}"

if [ -d "$REPO_DIR" ]; then
    run "Actualizando repositorio..."
    cd "$REPO_DIR"
    git fetch -q origin 2>/dev/null
    git reset --hard origin/master -q 2>/dev/null && ok "Repositorio  ${D}actualizado${NC}" || \
    (git pull -q && ok "Repositorio  ${D}actualizado${NC}")
else
    run "Clonando repositorio..."
    git clone -q "$REPO_URL" "$REPO_DIR" && ok "Repositorio  ${D}clonado${NC}"
    cd "$REPO_DIR"
fi

# ─────────────────────────────────────────────────
# [3/7] Dependencias
# ─────────────────────────────────────────────────

step "Dependencias"

MISSING_DEPS=()

check_cmd() {
    local cmd="$1"
    local label="${2:-$1}"
    local optional="${3:-}"
    if command -v "$cmd" &> /dev/null; then
        local ver
        ver=$("$cmd" --version 2>&1 | head -1 | grep -oE '[0-9]+\.[0-9]+(\.[0-9]+)?' | head -1 || echo "")
        ok "$label  ${D}${ver}${NC}"
        return 0
    else
        if [ "$optional" = "optional" ]; then
            warn "$label  ${D}no encontrado (opcional)${NC}"
        else
            fail "$label  ${D}no instalado${NC}"
            MISSING_DEPS+=("$cmd")
        fi
        return 1
    fi
}

echo -e "  ${D}Runtimes${NC}"
check_cmd node     "node"
check_cmd npm      "npm"
check_cmd php      "php"    optional
check_cmd go       "go"     optional
check_cmd python3  "python3" optional

echo ""
echo -e "  ${D}Herramientas${NC}"
check_cmd git      "git"
check_cmd docker   "docker"   optional
check_cmd composer "composer" optional

# ─────────────────────────────────────────────────
# [4/7] OpenCode
# ─────────────────────────────────────────────────

step "OpenCode"

if command -v opencode &> /dev/null; then
    ver=$(opencode --version 2>/dev/null || echo "")
    ok "OpenCode  ${D}$ver${NC}"
    run "Actualizando..."
    npm install -g opencode-ai -q 2>/dev/null && ok "Core actualizado" || fail "Error al actualizar"
else
    run "Instalando OpenCode..."
    npm install -g opencode-ai 2>/dev/null && ok "Core instalado" || fail "Error al instalar"
fi

# ── Plugins de OpenCode ────────────────────────────
echo -e "  ${D}Plugins${NC}"
for plugin in opencode-anthropic-login-via-cli opencode-agent-skills opencode-wakatime opencode-codetime; do
    if npm list -g "$plugin" &>/dev/null; then
        npm install -g "$plugin" -q 2>/dev/null && ok "$plugin  ${D}actualizado${NC}" || fail "$plugin"
    else
        npm install -g "$plugin" 2>/dev/null && ok "$plugin  ${D}instalado${NC}" || warn "$plugin  ${D}(opcional, omitido)${NC}"
    fi
done

# ─────────────────────────────────────────────────
# [5/7] Claude Code
# ─────────────────────────────────────────────────

step "Claude Code"

if command -v claude &> /dev/null; then
    ver=$(claude --version 2>/dev/null | head -1 || echo "")
    ok "Instalado  ${D}$ver${NC}"
else
    run "Instalando Claude Code..."
    installed=0

    if curl -sSfL 'https://docs.anthropic.com/claude-code/install' 2>/dev/null | sh 2>/dev/null; then
        ok "Instalado"
        installed=1
    else
        ARCH=$(uname -m)
        CLAUDE_VERSION=$(curl -s https://api.github.com/repos/anthropics/claude-code/releases/latest 2>/dev/null | grep '"tag_name"' | cut -d'"' -f4 || echo "")

        if [ -n "$CLAUDE_VERSION" ]; then
            [ "$ARCH" = "x86_64" ]  && CLAUDE_TAR="claude-code-${CLAUDE_VERSION}-linux-x64.tar.gz"
            [ "$ARCH" = "aarch64" ] && CLAUDE_TAR="claude-code-${CLAUDE_VERSION}-linux-arm64.tar.gz"

            if [ -n "${CLAUDE_TAR:-}" ]; then
                TEMP=$(mktemp -d)
                URL="https://github.com/anthropics/claude-code/releases/download/$CLAUDE_VERSION/$CLAUDE_TAR"
                if curl -fsSL "$URL" -o "$TEMP/claude.tar.gz" 2>/dev/null; then
                    tar -xzf "$TEMP/claude.tar.gz" -C "$TEMP"
                    mkdir -p "$HOME/.local/bin"
                    mv "$TEMP/claude" "$HOME/.local/bin/claude" && chmod +x "$HOME/.local/bin/claude"
                    rm -rf "$TEMP"
                    ok "Instalado  ${D}$CLAUDE_VERSION${NC}"
                    installed=1
                else
                    fail "Error al descargar"
                    rm -rf "$TEMP"
                fi
            fi
        else
            warn "Manual  ${D}→ https://docs.anthropic.com/claude-code/install${NC}"
        fi
    fi

    if [ $installed -eq 0 ] && [ -f "$HOME/.local/bin/claude" ]; then
        warn "Agregá ~/.local/bin a PATH"
    fi
fi

# ─────────────────────────────────────────────────
# [6/7] Configuración (symlinks + skills)
# ─────────────────────────────────────────────────

step "Configuración"

mkdir -p "$HOME/.config/opencode"
mkdir -p "$HOME/.config/opencode/skills"
mkdir -p "$HOME/.config/Claude/skills"
mkdir -p "$HOME/.claude"

echo -e "  ${D}Archivos de configuración${NC}"

# OpenCode config
for file in AGENTS.md opencode.json .gitignore; do
    if [ -f "$REPO_DIR/config/$file" ]; then
        rm -f "$HOME/.config/opencode/$file"
        ln -s "$REPO_DIR/config/$file" "$HOME/.config/opencode/$file" && \
        ok "$file  ${D}→ opencode${NC}" || fail "$file (opencode)"
    fi
done

# AGENTS.md → Claude Code (lee desde ~/.claude/AGENTS.md)
if [ -f "$REPO_DIR/config/AGENTS.md" ]; then
    rm -f "$HOME/.claude/AGENTS.md"
    ln -s "$REPO_DIR/config/AGENTS.md" "$HOME/.claude/AGENTS.md" && ok "AGENTS.md  ${D}→ claude${NC}" || true
fi

# CLAUDE.md → Claude Code
if [ -f "$REPO_DIR/config/CLAUDE.md" ]; then
    rm -f "$HOME/.claude/CLAUDE.md"
    ln -s "$REPO_DIR/config/CLAUDE.md" "$HOME/.claude/CLAUDE.md" && ok "CLAUDE.md  ${D}→ claude${NC}" || true
fi

# ── Model routing: models.yaml → opencode.json ──────────────

echo ""
echo -e "  ${D}Model routing (models.yaml → opencode.json)${NC}"

MODELS_YAML="$REPO_DIR/config/models.yaml"
OC_JSON="$REPO_DIR/config/opencode.json"

if [ -f "$MODELS_YAML" ] && [ -f "$OC_JSON" ] && command -v node &>/dev/null; then
    node -e "
const fs = require('fs');
const yaml_raw = fs.readFileSync('$MODELS_YAML', 'utf8');
const json = JSON.parse(fs.readFileSync('$OC_JSON', 'utf8'));

// Minimal YAML parser for flat/nested key: value
function parseYaml(text) {
  const result = {};
  let section = null;
  for (const raw of text.split('\n')) {
    const line = raw.replace(/#.*$/, '').trimEnd();
    if (!line.trim()) continue;
    const indent = line.length - line.trimStart().length;
    const kv = line.trim().match(/^([a-z_-]+):\s*(.*)\$/);
    if (!kv) continue;
    const [, key, val] = kv;
    if (indent === 0) { section = key; result[key] = {}; }
    else if (section && val.trim()) result[section][key] = val.trim();
  }
  return result;
}

const models = parseYaml(yaml_raw);
let changed = 0;

// Apply sdd models
if (models.sdd) {
  for (const [phase, model] of Object.entries(models.sdd)) {
    const agentKey = 'sdd-' + phase;
    if (json.agent && json.agent[agentKey]) {
      json.agent[agentKey].model = model;
      changed++;
    }
  }
}

// Apply agent models
if (models.agents) {
  for (const [agent, model] of Object.entries(models.agents)) {
    if (json.agent && json.agent[agent]) {
      json.agent[agent].model = model;
      changed++;
    }
  }
}

fs.writeFileSync('$OC_JSON', JSON.stringify(json, null, 2) + '\n');
console.log(changed + ' modelos actualizados');
" 2>/dev/null && ok "models.yaml aplicado a opencode.json" || warn "Error al aplicar models.yaml (verificar manualmente)"
else
    if [ ! -f "$MODELS_YAML" ]; then warn "models.yaml no encontrado — omitiendo model routing"; fi
fi

echo ""
echo -e "  ${D}Skills${NC}"
skill_count=0
for skill in "$REPO_DIR/skills"/*; do
    if [ -d "$skill" ]; then
        name=$(basename "$skill")

        # OpenCode
        rm -rf "$HOME/.config/opencode/skills/$name"
        ln -s "$skill" "$HOME/.config/opencode/skills/$name" 2>/dev/null && : || fail "$name (opencode)"

        # Claude Code — dos paths posibles
        rm -rf "$HOME/.config/Claude/skills/$name"
        ln -s "$skill" "$HOME/.config/Claude/skills/$name" 2>/dev/null && : || fail "$name (claude ~/.config/Claude)"

        skill_count=$((skill_count + 1))
    fi
done
ok "$skill_count skills vinculados  ${D}(opencode + claude)${NC}"

# ─────────────────────────────────────────────────
# [7/7] Personal Persistence MCP
# ─────────────────────────────────────────────────

step "Personal Persistence MCP"

# ── a) Build persistence ────────────────────────

echo -e "  ${D}Build persistence${NC}"
if [ -d "$PERSISTENCE_DIR" ] && [ -f "$PERSISTENCE_DIR/package.json" ]; then
    cd "$PERSISTENCE_DIR"
    run "Instalando dependencias..."
    npm install --silent 2>/dev/null && ok "Dependencias" || fail "Error en npm install"

    run "Compilando TypeScript..."
    npm run build 2>/dev/null && ok "Build completo" || fail "Error en build"

    cd "$REPO_DIR"
else
    fail "Directorio persistence no encontrado: $PERSISTENCE_DIR"
fi

# ── b) Wrapper persistence-mcp ─────────────────

echo ""
echo -e "  ${D}Wrapper persistence-mcp${NC}"
mkdir -p "$HOME/.local/bin"

MCP_WRAPPER="$HOME/.local/bin/persistence-mcp"
cat > "$MCP_WRAPPER" <<WRAPPER
#!/bin/bash
# persistence-mcp — MCP stdio server for personal-persistence-ai-memory
exec node "$PERSISTENCE_DIR/dist/mcp.js" "\$@"
WRAPPER

chmod +x "$MCP_WRAPPER"
ok "persistence-mcp  ${D}$MCP_WRAPPER${NC}"

# Verificar que funciona
if echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | \
   timeout 3 "$MCP_WRAPPER" 2>/dev/null | grep -q '"result"'; then
    ok "MCP server  ${D}respondiendo${NC}"
else
    warn "MCP server  ${D}verificar manualmente: persistence-mcp${NC}"
fi

# ── c) Limpiar Engram de Claude Code ───────────

echo ""
echo -e "  ${D}Limpiando Engram de Claude Code${NC}"

# Desinstalar plugin engram si está instalado
if command -v claude &>/dev/null; then
    if claude plugin list 2>/dev/null | grep -q "engram"; then
        run "Desinstalando plugin engram..."
        claude plugin uninstall engram 2>/dev/null && ok "Plugin engram desinstalado" || warn "Error desinstalando engram"
    else
        ok "Plugin engram  ${D}no estaba instalado${NC}"
    fi
fi

# Limpiar archivos residuales de engram
ENGRAM_MCP="$HOME/.claude/mcp/engram.json"
if [ -f "$ENGRAM_MCP" ]; then
    rm -f "$ENGRAM_MCP"
    ok "Removido  ${D}$ENGRAM_MCP${NC}"
fi

ENGRAM_CACHE="$HOME/.claude/plugins/cache/engram"
if [ -d "$ENGRAM_CACHE" ]; then
    rm -rf "$ENGRAM_CACHE"
    ok "Removido  ${D}$ENGRAM_CACHE${NC}"
fi

ENGRAM_MARKETPLACE="$HOME/.claude/plugins/marketplaces/engram"
if [ -d "$ENGRAM_MARKETPLACE" ]; then
    rm -rf "$ENGRAM_MARKETPLACE"
    ok "Removido  ${D}$ENGRAM_MARKETPLACE${NC}"
fi

# Limpiar installed_plugins.json
INSTALLED_PLUGINS="$HOME/.claude/plugins/installed_plugins.json"
if [ -f "$INSTALLED_PLUGINS" ] && command -v node &>/dev/null; then
    node -e "
const fs = require('fs');
const f = '$INSTALLED_PLUGINS';
try {
  const data = JSON.parse(fs.readFileSync(f, 'utf8'));
  if (data.plugins && data.plugins['engram@engram']) {
    delete data.plugins['engram@engram'];
    fs.writeFileSync(f, JSON.stringify(data, null, 2));
    console.log('ok');
  }
} catch(e) {}
" 2>/dev/null && ok "installed_plugins.json  ${D}limpiado${NC}" || true
fi

# ── d) Configurar MCP de Claude Code ───────────

echo ""
echo -e "  ${D}Configurando MCP Claude Code${NC}"
mkdir -p "$HOME/.claude/mcp"

# MCP persistence (siempre requerido)
CLAUDE_MCP_FILE="$HOME/.claude/mcp/persistence.json"
cat > "$CLAUDE_MCP_FILE" <<JSON
{
  "command": "persistence-mcp",
  "args": []
}
JSON
ok "persistence.json  ${D}creado${NC}"

# MCPs adicionales del proyecto (context7, filesystem, playwright)
MCP_CONFIG_DIR="$REPO_DIR/config/mcp"
if [ -d "$MCP_CONFIG_DIR" ]; then
    for mcp_file in "$MCP_CONFIG_DIR"/*.json; do
        if [ -f "$mcp_file" ]; then
            mcp_name=$(basename "$mcp_file")
            # No sobrescribir persistence.json (ya configurado arriba)
            if [ "$mcp_name" != "persistence.json" ]; then
                cp "$mcp_file" "$HOME/.claude/mcp/$mcp_name" && \
                ok "$mcp_name  ${D}→ MCP${NC}" || warn "$mcp_name  ${D}error al copiar${NC}"
            fi
        fi
    done
fi

# ── e) Actualizar settings.json de Claude ──────

echo ""
echo -e "  ${D}Configurando permisos Claude Code${NC}"
CLAUDE_SETTINGS="$HOME/.claude/settings.json"

if [ -f "$CLAUDE_SETTINGS" ] && command -v node &>/dev/null; then
    node -e "
const fs = require('fs');
const f = '$CLAUDE_SETTINGS';
try {
  const data = JSON.parse(fs.readFileSync(f, 'utf8'));

  // Limpiar engram de enabledPlugins
  if (data.enabledPlugins && data.enabledPlugins['engram@engram'] !== undefined) {
    delete data.enabledPlugins['engram@engram'];
  }

  // Limpiar extraKnownMarketplaces
  if (data.extraKnownMarketplaces && data.extraKnownMarketplaces.engram) {
    delete data.extraKnownMarketplaces.engram;
  }

  // Configurar permisos de persistence
  if (!data.permissions) data.permissions = {};
  if (!data.permissions.allow) data.permissions.allow = [];
  if (!data.permissions.deny) data.permissions.deny = [];

  // Quitar permisos viejos de engram
  data.permissions.allow = data.permissions.allow.filter(p => !p.includes('mcp__engram__'));

  // Agregar permisos de persistence
  const persistenceTools = [
    'mcp__persistence__mem_save',
    'mcp__persistence__mem_search',
    'mcp__persistence__mem_get',
    'mcp__persistence__mem_update',
    'mcp__persistence__mem_delete',
    'mcp__persistence__mem_context',
    'mcp__persistence__mem_session_summary',
    'mcp__persistence__mem_session_start',
    'mcp__persistence__mem_stats',
    'mcp__persistence__mem_timeline',
    'mcp__persistence__mem_suggest_topic_key',
  ];
  for (const tool of persistenceTools) {
    if (!data.permissions.allow.includes(tool)) {
      data.permissions.allow.push(tool);
    }
  }

  fs.writeFileSync(f, JSON.stringify(data, null, 2));
  console.log('ok');
} catch(e) { console.error(e.message); }
" 2>/dev/null && ok "settings.json  ${D}actualizado${NC}" || warn "settings.json  ${D}revisar manualmente${NC}"
else
    # Crear settings.json básico si no existe
    mkdir -p "$HOME/.claude"
    cat > "$CLAUDE_SETTINGS" <<JSON
{
  "permissions": {
    "allow": [
      "mcp__persistence__mem_save",
      "mcp__persistence__mem_search",
      "mcp__persistence__mem_get",
      "mcp__persistence__mem_update",
      "mcp__persistence__mem_delete",
      "mcp__persistence__mem_context",
      "mcp__persistence__mem_session_summary",
      "mcp__persistence__mem_session_start",
      "mcp__persistence__mem_stats",
      "mcp__persistence__mem_timeline",
      "mcp__persistence__mem_suggest_topic_key"
    ],
    "deny": [
      "Bash(rm -rf /)",
      "Bash(sudo rm -rf /)",
      "Read(.env)",
      "Read(.env.*)"
    ],
    "defaultMode": "bypassPermissions"
  }
}
JSON
    ok "settings.json  ${D}creado${NC}"
fi

# ── f) Verificar OpenCode MCP ──────────────────

echo ""
echo -e "  ${D}Verificando OpenCode MCP${NC}"
OC_CONFIG="$HOME/.config/opencode/opencode.json"
if [ -f "$OC_CONFIG" ] || [ -L "$OC_CONFIG" ]; then
    if grep -q '"persistence-mcp"' "$OC_CONFIG" 2>/dev/null; then
        ok "opencode.json  ${D}persistence-mcp configurado${NC}"
    else
        warn "opencode.json  ${D}verificar configuración MCP${NC}"
    fi
fi

# ─────────────────────────────────────────────────
# PATH warnings
# ─────────────────────────────────────────────────

PATH_WARN=0
[[ ":$PATH:" != *":$HOME/.local/bin:"* ]] && PATH_WARN=1

if [ $PATH_WARN -eq 1 ]; then
    echo ""
    warn "Agregá estos paths a ~/.zshrc o ~/.bashrc:"
    echo -e "      ${D}export PATH=\$HOME/.local/bin:\$PATH${NC}"
fi

# ─────────────────────────────────────────────────
# Resumen final
# ─────────────────────────────────────────────────

echo ""
echo -e "  ${D}──────────────────────────────────────────${NC}"
echo ""

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    warn "Dependencias faltantes: ${MISSING_DEPS[*]}"
    echo ""
    echo -e "  ${D}Arch/Manjaro:  sudo pacman -S ${MISSING_DEPS[*]}${NC}"
    echo -e "  ${D}Ubuntu/Debian: sudo apt install ${MISSING_DEPS[*]}${NC}"
    echo ""
fi

echo -e "  ${G}Instalación completada${NC}"
echo ""
echo -e "  ${D}→ source ~/.zshrc${NC}"
echo -e "  ${D}→ opencode          (OpenCode)${NC}"
echo -e "  ${D}→ claude            (Claude Code)${NC}"
echo -e "  ${D}→ /sdd-init         (inicializar proyecto)${NC}"
echo ""
echo -e "  ${D}Memoria persistente disponible vía MCP:${NC}"
echo -e "  ${D}  mem_save, mem_search, mem_context,${NC}"
echo -e "  ${D}  mem_session_summary, mem_session_start${NC}"
echo ""
echo -e "  ${Y}IMPORTANTE — $REPO_DIR es instalación del sistema:${NC}"
echo -e "  ${D}  · Todos los symlinks apuntan aquí — NO borrar${NC}"
echo -e "  ${D}  · Para actualizar: bash install.sh (re-ejecutar)${NC}"
echo -e "  ${D}  · Para desarrollar: trabajar en tu repo y hacer push${NC}"
echo -e "  ${D}  · La memoria vive en ~/personal-persistence-ai-memory/${NC}"
echo ""

# Auto-source shell
if [ -f "$HOME/.zshrc" ]; then
    source "$HOME/.zshrc" 2>/dev/null || true
fi
