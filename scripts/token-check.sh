#!/bin/bash
# token-check.sh — Mide el tamaño del contexto de sistema
# Uso: bash scripts/token-check.sh [--before|--after]
# Tokens estimados: bytes / 4 (aproximación estándar)

REPO_DIR="${PERSONAL_AI_DIR:-$HOME/personal-ai}"
SKILLS_DIR="$REPO_DIR/skills"

B='\033[0;34m'
G='\033[0;32m'
Y='\033[1;33m'
D='\033[2m'
NC='\033[0m'

bytes_to_tokens() { echo $(( $1 / 4 )); }

file_info() {
    local file="$1"
    local label="$2"
    if [ -f "$file" ]; then
        local bytes=$(wc -c < "$file")
        local lines=$(wc -l < "$file")
        local tokens=$(bytes_to_tokens $bytes)
        printf "  %-45s %6d bytes  %5d líneas  ~%5d tokens\n" "$label" "$bytes" "$lines" "$tokens"
        echo "$bytes"
    else
        printf "  %-45s %s\n" "$label" "(no encontrado)"
        echo "0"
    fi
}

echo ""
echo -e "${B}Personal AI — Token Budget Check${NC}"
echo -e "${D}$(date '+%Y-%m-%d %H:%M')${NC}"
echo -e "${D}──────────────────────────────────────────────────────────${NC}"

# ── Sistema de prompts (carga siempre) ──────────────────
echo ""
echo -e "${B}Sistema de Prompts (carga en cada sesión)${NC}"
total_sys=0
for f_bytes in \
    "$(file_info "$HOME/.claude/CLAUDE.md" "CLAUDE.md")" \
    "$(file_info "$REPO_DIR/config/AGENTS.md" "AGENTS.md")"; do
    total_sys=$((total_sys + f_bytes))
done

# Volver a calcular correctamente
total_sys=0
files_sys=("$HOME/.claude/CLAUDE.md" "$REPO_DIR/config/AGENTS.md")
labels_sys=("CLAUDE.md" "AGENTS.md")
for i in "${!files_sys[@]}"; do
    f="${files_sys[$i]}"
    label="${labels_sys[$i]}"
    if [ -f "$f" ]; then
        bytes=$(wc -c < "$f")
        lines=$(wc -l < "$f")
        tokens=$(bytes_to_tokens $bytes)
        printf "  %-45s %6d bytes  %5d líneas  ~%5d tokens\n" "$label" "$bytes" "$lines" "$tokens"
        total_sys=$((total_sys + bytes))
    fi
done
echo -e "  ${D}──────────────────────────────────────────────────────────${NC}"
echo -e "  ${G}Subtotal sistema${NC}  ~$(bytes_to_tokens $total_sys) tokens  (${total_sys} bytes)"

# ── Skills por categoría ──────────────────────────────
echo ""
echo -e "${B}Skills (carga bajo demanda)${NC}"

total_skills=0
skill_count=0
largest_skill=""
largest_bytes=0

for skill_dir in "$SKILLS_DIR"/*/; do
    [ -d "$skill_dir" ] || continue
    name=$(basename "$skill_dir")
    skill_file="$skill_dir/SKILL.md"
    [ -f "$skill_file" ] || continue
    bytes=$(wc -c < "$skill_file")
    lines=$(wc -l < "$skill_file")
    tokens=$(bytes_to_tokens $bytes)
    printf "  %-45s %6d bytes  %5d líneas  ~%5d tokens\n" "$name" "$bytes" "$lines" "$tokens"
    total_skills=$((total_skills + bytes))
    skill_count=$((skill_count + 1))
    if [ "$bytes" -gt "$largest_bytes" ]; then
        largest_bytes=$bytes
        largest_skill=$name
    fi
done

echo -e "  ${D}──────────────────────────────────────────────────────────${NC}"
echo -e "  ${G}$skill_count skills${NC}  total ~$(bytes_to_tokens $total_skills) tokens  (${total_skills} bytes)"
echo -e "  ${D}Más pesada: $largest_skill ($largest_bytes bytes / ~$(bytes_to_tokens $largest_bytes) tokens)${NC}"

# ── _shared (carga cuando skills SDD se usan) ─────────
echo ""
echo -e "${B}_shared SDD (carga con skills SDD)${NC}"
total_shared=0
shared_dir="$SKILLS_DIR/_shared"
if [ -d "$shared_dir" ]; then
    for f in "$shared_dir"/*.md; do
        [ -f "$f" ] || continue
        name=$(basename "$f")
        bytes=$(wc -c < "$f")
        lines=$(wc -l < "$f")
        tokens=$(bytes_to_tokens $bytes)
        printf "  %-45s %6d bytes  %5d líneas  ~%5d tokens\n" "$name" "$bytes" "$lines" "$tokens"
        total_shared=$((total_shared + bytes))
    done
fi
echo -e "  ${D}──────────────────────────────────────────────────────────${NC}"
echo -e "  ${G}Subtotal _shared${NC}  ~$(bytes_to_tokens $total_shared) tokens  (${total_shared} bytes)"

# ── Resumen ─────────────────────────────────────────
total_all=$((total_sys + total_skills + total_shared))
total_tokens=$(bytes_to_tokens $total_all)

echo ""
echo -e "${D}══════════════════════════════════════════════════════════${NC}"
echo -e "${B}Resumen${NC}"
echo -e "  Sistema (siempre):    ~$(bytes_to_tokens $total_sys) tokens"
echo -e "  Skills (on-demand):   ~$(bytes_to_tokens $total_skills) tokens total disponible"
echo -e "  _shared SDD:          ~$(bytes_to_tokens $total_shared) tokens"
echo -e "  ${G}Total repertorio:     ~$total_tokens tokens${NC}  (${total_all} bytes)"
echo ""
echo -e "  ${D}Sesión típica estimada:${NC}"
echo -e "  ${D}  Sin SDD:   ~$(bytes_to_tokens $total_sys) tokens base + skill cargada${NC}"
echo -e "  ${D}  Con SDD:   ~$(bytes_to_tokens $((total_sys + total_shared))) tokens base + 2-3 skills SDD${NC}"
echo ""

# ── Models config ───────────────────────────────────
MODELS_YAML="$REPO_DIR/config/models.yaml"
if [ -f "$MODELS_YAML" ]; then
    echo -e "${B}Model Routing (models.yaml)${NC}"
    while IFS= read -r line; do
        [[ "$line" =~ ^#.*$ ]] && continue
        [[ -z "${line// }" ]] && continue
        echo -e "  ${D}$line${NC}"
    done < "$MODELS_YAML"
fi
echo ""
