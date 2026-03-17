#!/usr/bin/env bash
# Kill MCP processes older than 10 minutes (orphans from force-closed sessions)
# Runs at SessionStart so new session's MCPs haven't started yet — safe for multi-session

MCP_PATTERNS=(
    "dbhub"
    "figma-developer-mcp"
    "mcp-server-sequential-thinking"
    "mcp-atlassian"
    "jira-cache-server/server.py"
    "playwright-mcp"
    "mcp-server.cjs"
)

for pattern in "${MCP_PATTERNS[@]}"; do
    PIDS=$(pgrep -f "$pattern" 2>/dev/null | tr '\n' ' ')
    [ -z "$PIDS" ] && continue

    # Batch: one Python call per pattern handles all matching PIDs
    read -ra pid_array <<< "$PIDS"
    python3 - "${pid_array[@]}" <<'PYEOF' 2>/dev/null
import subprocess, sys

pids = sys.argv[1:]
if not pids:
    sys.exit(0)

try:
    result = subprocess.check_output(
        ['ps', '-p', ','.join(pids), '-o', 'pid=,etime='],
        text=True, stderr=subprocess.DEVNULL
    )
except subprocess.CalledProcessError:
    sys.exit(0)

for line in result.strip().splitlines():
    parts = line.split(None, 1)
    if len(parts) != 2:
        continue
    pid, t = parts[0], parts[1].strip()
    # etime format: [[dd-]hh:]mm:ss
    segs = t.replace('-', ':').split(':')
    weights = [1, 60, 3600, 86400]
    age = sum(int(s) * weights[i] for i, s in enumerate(reversed(segs)))
    if age > 600:
        subprocess.run(['kill', pid], capture_output=True)
PYEOF
done
