#!/usr/bin/env bash
# TeammateIdle hook for team-dev-loop
# Nudges idle teammates during active phases to stay on task.
# Exit code 2 = send feedback and keep teammate working.

set -euo pipefail

# Read hook input from stdin
INPUT=$(cat)

# Extract teammate name and team name
TEAMMATE_NAME=$(echo "$INPUT" | jq -r '.teammate_name // empty')
TEAM_NAME=$(echo "$INPUT" | jq -r '.team_name // empty')

# Only act on dev-loop teams
if ! echo "$TEAM_NAME" | grep -qi "dev-loop"; then
  exit 0
fi

# Check if there are pending tasks for this teammate
TASKS_DIR="$HOME/.claude/tasks/$TEAM_NAME"
if [ -d "$TASKS_DIR" ]; then
  PENDING=$(find "$TASKS_DIR" -name "*.json" -exec grep -l '"status":"pending"' {} \; 2>/dev/null | head -1)
  if [ -n "$PENDING" ]; then
    echo "{\"decision\": \"block\", \"reason\": \"You have pending tasks. Please continue working on your assigned phase tasks and message the team lead when done.\"}" >&2
    exit 2
  fi
fi

exit 0
