#!/usr/bin/env bash
# Re-patches plugin cache files after plugin updates.
# Adds `disable-model-invocation: true` to side-effect skills
# that should never auto-trigger.
#
# Usage: ~/.claude/hooks/patch-plugin-skills.sh
# Run after: plugin install/update, or on session start

set -euo pipefail

CACHE_DIR="$HOME/.claude/plugins/cache/claude-plugins-official"
PATCHED=0
SKIPPED=0

patch_file() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    return
  fi
  if grep -q 'disable-model-invocation: true' "$file" 2>/dev/null; then
    SKIPPED=$((SKIPPED + 1))
    return
  fi
  # Insert disable-model-invocation: true before the closing ---
  # Find the line number of the closing --- (second occurrence)
  local close_line
  close_line=$(awk '/^---$/{n++; if(n==2){print NR; exit}}' "$file")
  if [[ -z "$close_line" ]]; then
    echo "WARN: no closing --- found in $file" >&2
    return
  fi
  sed -i '' "${close_line}i\\
disable-model-invocation: true
" "$file"
  PATCHED=$((PATCHED + 1))
  echo "PATCHED: $file"
}

# Find all cache versions for each plugin
for ver_dir in "$CACHE_DIR"/commit-commands/*/; do
  [[ -d "$ver_dir" ]] || continue
  patch_file "$ver_dir/commands/commit.md"
  patch_file "$ver_dir/commands/commit-push-pr.md"
  patch_file "$ver_dir/commands/clean_gone.md"
done

for ver_dir in "$CACHE_DIR"/ralph-loop/*/; do
  [[ -d "$ver_dir" ]] || continue
  patch_file "$ver_dir/commands/ralph-loop.md"
  patch_file "$ver_dir/commands/cancel-ralph.md"
  patch_file "$ver_dir/commands/help.md"
done

echo "Done: $PATCHED patched, $SKIPPED already patched"
