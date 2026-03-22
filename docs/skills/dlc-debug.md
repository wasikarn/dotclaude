# dlc-debug — Development Loop Cycle: Debug

Parallel root cause analysis for bugs, test failures, and unexpected behavior.

## When to use

Use `/dlc-debug` when you have a bug or failure and want structured investigation
before making changes.

## Invocation

    /dlc-debug [error description or stack trace]
    /dlc-debug "TypeError: Cannot read property 'id' of undefined in auth/handler.ts"

## Phases

| Phase | What happens |
| --- | --- |
| **1 — Bootstrap** | Pre-gather stack trace context, recent commits, affected files |
| **2 — Investigate** | Parallel Investigator agents trace different hypotheses |
| **3 — Root Cause** | Synthesize findings, confirm root cause with evidence |
| **4 — Fix** | Minimal fix with test to prevent regression |
| **5 — Harden** | DX improvements to prevent class of issue recurring |
