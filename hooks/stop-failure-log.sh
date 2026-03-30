#!/usr/bin/env bash
# StopFailure hook — log API errors to session log.
# Non-blocking: exit code and output are ignored by Claude Code.
# Env vars:
#   LOG=0     disable session log writing to $HOME/.claude/session-logs/ (opt-out)
#   NOTIFY=1  enable macOS notification (personal use, macOS only)

set -euo pipefail

# shellcheck source=lib/common.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"

require_jq
INPUT=$(cat)

IFS=$'\t' read -r ERROR ERROR_DETAILS < <(jq_fields '.error // "unknown"' '.error_details // ""')

# Privacy: only logs error type + API error details (rate limits, billing, server errors)
# No user prompts, code content, or file paths are captured.
# Log to session log (opt-out via LOG=0)
if [ "${LOG:-1}" = "1" ]; then
  LOG_DIR="$HOME/.claude/session-logs"
  mkdir -p "$LOG_DIR"
  LOG_FILE="$LOG_DIR/$(date +%Y-%m-%d).log"
  {
    echo "---"
    echo "time: $(date '+%H:%M:%S')"
    echo "event: StopFailure"
    echo "error: $ERROR"
    [ -n "$ERROR_DETAILS" ] && echo "details: $ERROR_DETAILS"
  } >> "$LOG_FILE"
  # Rotate: compress logs >500KB, delete compressed older than 30 days
  if [ -f "$LOG_FILE" ] && [ "$(wc -c < "$LOG_FILE" | tr -d ' ')" -gt 512000 ]; then
    gzip -f "$LOG_FILE" 2>/dev/null || true
  fi
  find "$(dirname "$LOG_FILE")" -name "*.gz" -mtime +30 -delete 2>/dev/null || true
fi

# Sanitize for AppleScript string interpolation (strip double-quotes and backslashes)
SAFE_ERROR=$(echo "$ERROR" | tr -d '"' | tr -d '\134' | tr -d '\n')

# macOS notification (opt-in via NOTIFY=1)
if [ "${NOTIFY:-0}" = "1" ] && command -v osascript > /dev/null 2>&1; then
  osascript -e "display notification \"Session stopped: $SAFE_ERROR\" with title \"Claude Code\" subtitle \"API Error\"" 2>/dev/null || :
fi

exit 0
