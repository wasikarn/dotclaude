---
name: df-ship
description: Completion macro skill — review + merge PR to close the loop. Trigger when user says "ship it", "let's merge this", "this is done", "code is complete", or when feature is finished and ready for final review. Trigger specifically at PR completion, not casual conversation.
type: agent
agent: executor
---

# df-ship: Ship It

Final review and merge to complete the loop.

## When to Use

- Code complete, ready for review
- "Ship it"
- "Let's merge this"
- Feature done, need to close PR

## What It Does

1. **Review** (`df-review`) — adversarial review with debate
2. **Merge** (`df-merge-pr`) — git-flow merge with proper versioning

## Workflow

```text
code complete → df-review → fixes → df-merge-pr → merged
                     ↓
               (debate if needed)
```

## Usage

```bash
/df-ship
/df-ship --hotfix  # for production incidents
```

## Flags

| Flag | Effect |
|------|--------|
| `--hotfix` | Skip debate, fast-track merge from main |
| `--skip-review` | Merge only (if review done externally) |

## Notes

- Always runs review before merge (safety)
- Hotfix mode branches from main, not develop
- Requires clean working tree
- Post-merge: Jira updated automatically
