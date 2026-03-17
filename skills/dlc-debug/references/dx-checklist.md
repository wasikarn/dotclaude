# DX Checklist

DX audit categories for the DX Analyst teammate. Also provides condensed Quick mode checklist for the Fixer.

## Full Audit Categories

### 1. Error Handling

| # | Sev | Pattern | What to look for |
| --- | --- | --- | --- |
| E1 | Critical | Silent failure | Empty `catch {}`, swallowed errors, `catch (e) { return null }` |
| E2 | Critical | Unhelpful error message | Generic "something went wrong", no context for debugging |
| E3 | Warning | Missing error context | No stack trace logged, no input data in error, no request ID |
| E4 | Warning | Inconsistent error handling | Some paths throw, others return null, no pattern |

### 2. Observability

| # | Sev | Pattern | What to look for |
| --- | --- | --- | --- |
| O1 | Warning | Missing logging | No log at key decision points (auth, data mutation, external calls) |
| O2 | Warning | Unstructured logging | `console.log` instead of project's structured logger |
| O3 | Info | Missing traces | No tracing context for cross-service debugging |

### 3. Prevention

| # | Sev | Pattern | What to look for |
| --- | --- | --- | --- |
| P1 | Critical | Type safety hole | `as any`, `as unknown as T`, unvalidated external input |
| P2 | Warning | Missing boundary validation | No input validation at API/service boundary |
| P3 | Warning | Test coverage gap | Affected code path has no test or only happy-path test |
| P4 | Info | Missing edge case test | No test for null, empty, concurrent, or malformed input |

## Quick Mode Condensed Checklist

When DX Analyst is skipped (`--quick` mode), append these 5 checks to the Fixer prompt:

```text
DX QUICK CHECK — while fixing, also look for these in the affected area:
1. Silent failures: empty catch blocks or swallowed errors near the bug (→ E1 Critical)
2. Unhelpful errors: generic messages that would make this bug harder to find (→ E2 Critical)
3. Missing logging: no structured log at the key decision point where bug occurs (→ O1 Warning)
4. Type safety: `as any` or unvalidated input near the bug (→ P1 Critical)
5. Missing test: no existing test covers the code path that broke (→ P3 Warning)
If you find any Critical items (1, 2, 4), fix them. Warning items are optional in Quick mode.
```

## Severity Definitions

| Severity | Meaning | Action |
| --- | --- | --- |
| Critical | Actively hides bugs or causes silent data corruption | Must fix |
| Warning | Makes debugging harder or allows bugs to slip through | Fix if scope reasonable |
| Info | Nice to have, improves DX but not urgent | Skip unless user requests |

## Remediation Quick-Reference

Use these patterns when writing the Recommendation column for Critical findings:

| Code | Concrete Remediation |
| --- | --- |
| E1 | Re-throw with context: `throw new AppError('msg', { cause: err })` or `logger.error({ err, input }, 'context'); throw err` |
| E2 | Replace generic message with context: `'Failed to process ${entity.id}: ${err.message}'` — include entity ID, operation, and input shape |
| P1 | Replace `as T` cast with: branded type, generic constraint `<T extends Schema>`, or runtime validation (zod/valibot parse at boundary) |
| P2 | Add boundary validation: schema parse on entry, explicit null/undefined guard, or guard function before processing |
