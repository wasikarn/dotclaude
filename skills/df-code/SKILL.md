---
name: df-code
description: Iteration macro skill — build + test loop for rapid development cycles. Trigger when user says "code this for me", "implement this feature", "let's code this", or in the middle of active feature work needing quick iteration without full review. Do NOT trigger for questions about how to implement something.
type: agent
agent: executor
---

# df-code: Development Loop

Rapid iteration: build + test cycle without review overhead.

## When to Use

- Middle of feature implementation
- "Code this function"
- Quick iteration before formal review
- Prototyping / spiking

## What It Does

1. **Build** (`df-build --micro`) — minimal research, direct implementation
2. **Test** (`df-tests`) — verify with generated tests

## Workflow

```text
idea → df-code → working code + tests
  ↑_______________↓
    (iterate)
```

## Usage

```bash
/df-code "add user authentication middleware"
```

## Flags

| Flag | Effect |
|------|--------|
| (none) | Micro mode: minimal ceremony |
| `--with-tests` | Force test generation even if tests exist |

## Notes

- Skips Phase 6 review — use `/df-review` when ready
- For spikes: don't expect production quality
- Review before merge always required
