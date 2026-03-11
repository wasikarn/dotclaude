#!/usr/bin/env bash
# TaskCompleted hook for team-review-pr
# Verifies that completed review/debate tasks include evidence (file:line references).
# Exit code 2 = block completion and send feedback to teammate.

set -euo pipefail

# Read hook input from stdin
INPUT=$(cat)

# Extract task name and tool output
TASK_NAME=$(echo "$INPUT" | jq -r '.task_name // empty')
TOOL_OUTPUT=$(echo "$INPUT" | jq -r '.tool_output // empty')

# Only gate review-debate tasks
if ! echo "$TASK_NAME" | grep -qi "review\|debate\|finding"; then
  exit 0
fi

# Check if the output contains file:line evidence
# Pattern: filename.ext:number or `filename.ext:number`
if ! echo "$TOOL_OUTPUT" | grep -qE '[a-zA-Z0-9_/.-]+\.[a-zA-Z]+:[0-9]+'; then
  echo '{"decision": "block", "reason": "Your findings must include file:line evidence for every issue. Please re-review and cite specific code locations."}' >&2
  exit 2
fi

exit 0
