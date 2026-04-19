---
name: df-start
description: Quick-start macro skill — bootstrap a project then run build in quick mode. Trigger when user says "start working on", "let's build this", "begin new project", or wants to quickly onboard then build without full ceremony.
compatibility: Node.js projects with package.json
type: agent
agent: executor
---

# df-start: Quick Start

One command to onboard project and start building.

## When to Use

- Starting work on new project
- "Let's build this feature"
- Want minimal ceremony, maximum progress
- Unclear where to begin

## What It Does

1. **Onboard** (`df-onboard`) — scaffold hard-rules.md, build directories
2. **Quick Build** (`df-build --quick`) — research → plan → implement with reduced ceremony

## Workflow

```text
df-onboard → df-build --quick
         ↓
    Working code
```

## Usage

```bash
/df-start
```

## Notes

- Skips full Phase 1-2 research for speed
- Use `/df-build --full` later if complexity demands
- Auto-detects existing onboard — skip if already done
