#!/bin/bash
# QMD Pre-Search Hook — injects cross-project matches before Grep.

INPUT=$(cat)
PATTERN=$(echo "$INPUT" | jq -r '.tool_input.pattern // empty')
[ -z "$PATTERN" ] && exit 0

KEYWORDS=$(echo "$PATTERN" \
  | sed 's/\\[a-zA-Z]/ /g; s/[.*+?^${}()|[\]\\]/ /g' \
  | tr -s ' ' | xargs)
[ -z "$KEYWORDS" ] || [ ${#KEYWORDS} -lt 4 ] && exit 0

QMD_RESULTS=$(qmd search "$KEYWORDS" --json -n 5 --min-score 0.5 2>/dev/null)
[ -z "$QMD_RESULTS" ] || [ "$QMD_RESULTS" = "[]" ] && exit 0

FILES=$(echo "$QMD_RESULTS" | jq -r '.[].file' | sed 's|qmd://||')

jq -n --arg ctx "QMD matches: $KEYWORDS
$FILES" \
  '{ hookSpecificOutput: { additionalContext: $ctx } }'
