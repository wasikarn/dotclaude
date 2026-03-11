#!/usr/bin/env bash
# TeammateIdle hook for team-review-pr
# Nudges idle teammates during active debate rounds to respond.
# Exit code 2 = send feedback and keep teammate working.

set -euo pipefail

# Read hook input from stdin
INPUT=$(cat)

# Extract teammate name and team name
TEAMMATE_NAME=$(echo "$INPUT" | jq -r '.teammate_name // empty')
TEAM_NAME=$(echo "$INPUT" | jq -r '.team_name // empty')

# Only act on review-pr teams
if ! echo "$TEAM_NAME" | grep -qi "review-pr"; then
  exit 0
fi

# Check if there are pending debate tasks for this teammate
TASKS_DIR="$HOME/.claude/tasks/$TEAM_NAME"
if [ -d "$TASKS_DIR" ]; then
  # Look for pending tasks assigned to this teammate
  PENDING=$(find "$TASKS_DIR" -name "*.json" -exec grep -l '"status":"pending"' {} \; 2>/dev/null | head -1)
  if [ -n "$PENDING" ]; then
    echo "{\"decision\": \"block\", \"reason\": \"You still have pending debate tasks. Please review your assigned teammate's findings and respond with Agree, Challenge, or Escalate per the debate protocol.\"}" >&2
    exit 2
  fi
fi

exit 0
