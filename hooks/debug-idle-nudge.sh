#!/bin/bash
set -euo pipefail

INPUT=$(cat)

TEAMMATE_NAME=$(echo "$INPUT" | jq -r '.teammate_name // empty')
TEAM_NAME=$(echo "$INPUT" | jq -r '.team_name // empty')

if ! echo "$TEAM_NAME" | grep -qi "^debug-"; then
  exit 0
fi

echo "{\"decision\": \"block\", \"reason\": \"You are idle. Continue your investigation and send findings to the team lead when done. If blocked, message the lead with: what you tried, what you found, and where you are stuck.\"}" >&2
exit 2
