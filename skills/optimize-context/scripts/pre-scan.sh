#!/usr/bin/env bash
# pre-scan.sh — Collect all Phase 1 metadata in one pass.
# Output: compact JSON to stdout. Run before starting optimize-context workflow.
# Usage: bash skills/optimize-context/scripts/pre-scan.sh [project-root]
#
# Replaces ~5 separate agent reads (package.json, lockfiles, ls, wc, find) with one script.
# Saves ~2-4k tokens per run by consolidating discovery into a single structured output.

set -euo pipefail
ROOT="${1:-.}"
cd "$ROOT"

# ── Helpers ───────────────────────────────────────────────────────────────────
json_str() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/	/\\t/g'; }
node_field() { node -e "try{const p=require('./package.json');console.log(p.$1||'')}catch(e){}" 2>/dev/null || true; }

# ── CLAUDE.md files ──────────────────────────────────────────────────────────
files_json="["
first_file=1
while IFS= read -r f; do
  total=$(wc -c < "$f" 2>/dev/null | tr -d ' ' || echo 0)
  # Human bytes: exclude auto-generated claude-mem blocks
  human=$(grep -v '<claude-mem-context>' "$f" 2>/dev/null | wc -c | tr -d ' ' || echo "$total")
  [[ $first_file -eq 0 ]] && files_json+=","
  files_json+="{\"path\":\"$(json_str "$f")\",\"bytes\":$total,\"human_bytes\":$human}"
  first_file=0
done < <(find . \( -name "CLAUDE.md" -o -name ".claude.local.md" -o -name ".claude.md" \) \
           ! -path "*/node_modules/*" ! -path "*/.git/*" 2>/dev/null | sort)
files_json+="]"

# ── Framework detection ───────────────────────────────────────────────────────
framework="none"
fw_version="unknown"

if [[ -f "package.json" ]]; then
  for dep in "dependencies?.next" "devDependencies?.next"; do
    ver=$(node_field "$dep"); [[ -n "$ver" ]] && { framework="nextjs"; fw_version="$ver"; break; }
  done
  if [[ "$framework" == "none" ]]; then
    ver=$(node_field "dependencies?.['@nestjs/core']"); [[ -n "$ver" ]] && { framework="nestjs"; fw_version="$ver"; }
  fi
  if [[ "$framework" == "none" ]]; then
    ver=$(node_field "dependencies?.express"); [[ -n "$ver" ]] && { framework="express"; fw_version="$ver"; }
  fi
  if [[ "$framework" == "none" ]]; then
    for dep in "dependencies?.react" "devDependencies?.react"; do
      ver=$(node_field "$dep"); [[ -n "$ver" ]] && { framework="react"; fw_version="$ver"; break; }
    done
  fi
fi

if [[ "$framework" == "none" ]]; then
  for req_file in requirements.txt pyproject.toml setup.py; do
    if [[ -f "$req_file" ]]; then
      framework="python"
      grep -qi "django" "$req_file" 2>/dev/null && framework="django"
      grep -qi "fastapi" "$req_file" 2>/dev/null && framework="fastapi"
      break
    fi
  done
fi

if [[ "$framework" == "none" && -f "go.mod" ]]; then
  framework="go"
  fw_version=$(awk '/^go / {print $2; exit}' go.mod || echo "unknown")
fi

# ── npm scripts ───────────────────────────────────────────────────────────────
npm_scripts="{}"
if [[ -f "package.json" ]]; then
  npm_scripts=$(node -e "try{const p=require('./package.json');console.log(JSON.stringify(p.scripts||{}))}catch(e){console.log('{}')}" 2>/dev/null || echo "{}")
fi

# ── Directory structure (2 levels, excluding common noise) ───────────────────
dir_list=$(find . -maxdepth 2 \
  ! -path "*/node_modules*" ! -path "*/.git*" ! -path "*/.next*" \
  ! -path "*/dist*" ! -path "*/build*" ! -path "*/__pycache__*" \
  ! -path "*/.turbo*" 2>/dev/null | sort | head -80)
dir_json=$(printf '%s\n' "$dir_list" | python3 -c \
  "import sys,json; print(json.dumps([l.rstrip() for l in sys.stdin if l.strip()]))" 2>/dev/null \
  || echo "[]")

# ── Supplementary paths ───────────────────────────────────────────────────────
has_agent_docs="false"; [[ -d "agent_docs" ]] && has_agent_docs="true"
has_claude_rules="false"; [[ -d ".claude/rules" ]] && has_claude_rules="true"

# ── Output ────────────────────────────────────────────────────────────────────
printf '{"claude_files":%s,"framework":{"name":"%s","version":"%s"},"npm_scripts":%s,"dir_structure":%s,"has_agent_docs":%s,"has_claude_rules":%s}\n' \
  "$files_json" \
  "$(json_str "$framework")" \
  "$(json_str "$fw_version")" \
  "$npm_scripts" \
  "$dir_json" \
  "$has_agent_docs" \
  "$has_claude_rules"
