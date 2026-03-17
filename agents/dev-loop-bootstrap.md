---
name: dev-loop-bootstrap
description: "Bootstraps dlc-build Phase 1 context by pre-gathering shared project structure, CLAUDE.md conventions, entry points, and key type definitions in one fast pass. Use at the START of Phase 1 before spawning explorers. Output goes to .claude/dlc-build/bootstrap-context.md for injection into explorer prompts."
tools: Read, Glob, Bash, Grep
model: haiku
---

# Dev Loop Bootstrap

Pre-gather shared project context in one pass so Phase 1 explorers don't redundantly re-read the same files.

## Steps

### 1. Map Project Structure

```bash
tree --gitignore -L 3 --dirsfirst --prune 2>/dev/null \
  || find . -type d -not -path '*/node_modules/*' -not -path '*/.git/*' | sort | head -40
```

### 2. Read CLAUDE.md

Read `CLAUDE.md` in the current project root. Extract: conventions, patterns, test command, linting rules, architecture notes.

### 3. Find Entry Points

Locate key entry files — just names and one-line descriptions, not full content. Look for: `src/index.ts`, `app/`, `server.ts`, `start/routes.ts`, `pages/`, `app/page.tsx`, `routes/`.

```bash
fd -t f "(index|server|app|routes)\.(ts|tsx|js)" --max-depth 4 2>/dev/null | head -15 \
  || find . -maxdepth 4 -type f \( -name "index.ts" -o -name "server.ts" -o -name "app.ts" \) \
       -not -path '*/node_modules/*' | head -15
```

### 4. Find Key Types in Task Area

Use the task description (`$ARGUMENTS`) to identify the primary area (e.g. "UserService" → look in `src/app/user/` or similar).

Try `ast-grep` first, fall back to grep:

```bash
ast-grep -p 'interface $NAME $$$' . --json 2>/dev/null | head -30 \
  || grep -r "^export interface\|^export type" --include="*.ts" -l 2>/dev/null | head -10
```

### 5. Detect Test Infrastructure

```bash
fd -t f "(vitest|jest)\.config\." --max-depth 3 2>/dev/null \
  || find . -maxdepth 3 -name "vitest.config.*" -o -name "jest.config.*" | head -5
```

Also check `package.json` for the test script.

### 6. Write Output

Create `.claude/dlc-build/` if it doesn't exist, then write `.claude/dlc-build/bootstrap-context.md`:

```markdown
# Bootstrap Context

**Task:** {task_description}
**Gathered:** {timestamp}

## Project Structure (Top 3 Levels)
{tree output}

## Conventions (from CLAUDE.md)
{key conventions — 5-10 bullet points, focus on patterns relevant to the task}

## Entry Points
{list of key files with one-line description}

## Key Types in Task Area
{list of relevant interfaces/types with file:line references}

## Test Infrastructure
{test config file, test command, test file pattern}
```

Keep each section concise — this is input to explorer agents, not a human report. Omit sections where nothing was found.
