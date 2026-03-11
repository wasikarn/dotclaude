#!/usr/bin/env bash
# TaskCompleted hook for team-dev-loop
# Verifies that completed tasks include evidence (file:line references).
# Exit code 2 = block completion and send feedback to teammate.

set -euo pipefail

# Read hook input from stdin
INPUT=$(cat)

# Extract task name and tool output
TASK_NAME=$(echo "$INPUT" | jq -r '.task_name // empty')
TOOL_OUTPUT=$(echo "$INPUT" | jq -r '.tool_output // empty')

# Only gate dev-loop tasks
if ! echo "$TASK_NAME" | grep -qi "dev-loop\|explore\|implement\|review\|fix\|finding"; then
  exit 0
fi

# Check if the output contains file:line evidence
# Pattern: filename.ext:number or `filename.ext:number`
if ! echo "$TOOL_OUTPUT" | grep -qE '[a-zA-Z0-9_/.-]+\.[a-zA-Z]+:[0-9]+'; then
  echo '{"decision": "block", "reason": "Your output must include file:line evidence. Re-examine the code and cite specific locations."}' >&2
  exit 2
fi

exit 0
