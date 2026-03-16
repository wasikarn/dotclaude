#!/bin/bash
SOUNDS_DIR="$(dirname "$0")/sounds"
SOUND="$1"
[[ -f "$SOUNDS_DIR/$SOUND" ]] || exit 0
# --no-overlap: kill any existing instance of the same sound before playing
[[ "$2" == "--no-overlap" ]] && pkill -f "afplay.*$SOUND" 2>/dev/null
afplay "$SOUNDS_DIR/$SOUND" &
