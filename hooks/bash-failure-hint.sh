#!/usr/bin/env bash
# PostToolUseFailure hook — inject diagnostic context after Bash command failures.
# Reads error from hook payload and outputs additionalContext JSON.
# Non-blocking: Claude sees the context alongside the original error.

set -euo pipefail

# shellcheck source=lib/common.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"

require_jq
INPUT=$(cat)

IFS=$'\t' read -r COMMAND ERROR IS_INTERRUPT < <(jq_fields \
  '.tool_input.command // ""' \
  '.error // ""' \
  '(.is_interrupt | tostring)')

# Don't inject context for user-interrupted commands
[ "$IS_INTERRUPT" = "true" ] && exit 0

# Build diagnostic hint based on error patterns
HINT=""

shopt -s nocasematch
if [[ "$ERROR" == *"command not found"* ]]; then
  CMD_NAME=$(echo "$ERROR" | sed 's/: command not found.*//' | awk -F': ' '{print $NF}' 2>/dev/null || :)
  [ -z "$CMD_NAME" ] && CMD_NAME=$(echo "$COMMAND" | awk '{print $1}')
  HINT="Command '$CMD_NAME' not found. Check if it's installed (run: which $CMD_NAME) or use an alternative tool."
elif [[ "$ERROR" == *"permission denied"* ]]; then
  HINT="Permission denied. Check file permissions (ls -la) or if sudo is needed."
elif [[ "$ERROR" == *"no such file or directory"* ]]; then
  HINT="File or directory not found. Verify the path exists before retrying."
elif [[ "$ERROR" == *"already in use"* ]]; then
  HINT="Port already in use. Find and stop the process: lsof -ti :PORT | xargs kill"
elif [[ "$COMMAND" =~ ^(npm|yarn|pnpm|bun)[[:space:]] ]] && [[ "$ERROR" =~ (error|failed|not\ found|ERR!) ]]; then
  HINT="Package manager error. Try: remove node_modules and lock file, then reinstall."
elif [[ "$ERROR" == *"syntax error"* ]]; then
  HINT="Shell syntax error in command. Check for unmatched quotes, brackets, or missing semicolons."
fi
shopt -u nocasematch

if [ -n "$HINT" ]; then
  jq -n --arg hint "Diagnostic hint: $HINT" \
    '{"hookSpecificOutput": {"hookEventName": "PostToolUseFailure", "additionalContext": $hint}}'
fi

exit 0
