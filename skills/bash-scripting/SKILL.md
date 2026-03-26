---
name: bash-scripting
description: >
  Bash scripting patterns for automation, scripts, and shell operations.
  Trigger: When writing bash scripts, automation tasks, or shell commands.
license: Apache-2.0
metadata:
  author: personal-ai
  version: "1.0"
---

## When to Use

Use this skill when:
- Writing bash scripts
- Automating tasks
- Processing files
- System administration scripts

---

## Critical Patterns

### Pattern 1: Script Structure

```bash
#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
```

### Pattern 2: Functions

```bash
function log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

function error() {
    echo "[ERROR] $*" >&2
    exit 1
}
```

### Pattern 3: Arguments

```bash
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            help=true
            shift
            ;;
        -f|--force)
            force=true
            shift
            ;;
        *)
            positional+=("$1")
            shift
            ;;
    esac
done
```

### Pattern 4: File Operations

```bash
if [[ -f "$file" ]]; then
    echo "File exists"
fi

while IFS= read -r line; do
    echo "$line"
done < "$file"
```

### Pattern 5: Conditionals

```bash
if [[ -z "$var" ]]; then
    echo "Empty"
fi

if [[ "$var" =~ ^[0-9]+$ ]]; then
    echo "Number"
fi
```

---

## Common Patterns

```bash
for file in *.txt; do
    echo "Processing $file"
done

while read -r line; do
    echo "$line"
done < input.txt

array=(one two three)
for item in "${array[@]}"; do
    echo "$item"
done

result=$(command)
echo "$result"
```