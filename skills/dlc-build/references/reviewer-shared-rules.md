# Shared Reviewer Rules

Common rules and output format shared across all reviewer roles. Referenced from each reviewer template to avoid duplication.

## Confidence Thresholds (by role)

| Reviewer role | Threshold | Notes |
| --- | --- | --- |
| Correctness & Security | 75 | Security findings: 70 (false positives acceptable) |
| Architecture & Performance | 80 | |
| DX & Testing | 85 | |

Hard Rule violations bypass all thresholds — always report regardless of confidence.

> **dlc-review divergence:** `dlc-review/references/teammate-prompts.md` uses a flat threshold of 80 for all teammates (not per-role). This is intentional — dlc-review runs adversarial debate to filter noise post-review, so a uniform threshold is sufficient. dlc-build has no debate phase, so per-role calibration matters more.

## Rules (all reviewers)

1. Read actual code before flagging — no speculation without file:line evidence
2. Score confidence 0-100 for each finding
3. Only report findings above your role's domain threshold (see table above)
4. Hard Rule violations bypass confidence filter — always report
5. Review ONLY changed files — not pre-existing issues
6. If confidence is below threshold due to missing context, send a CONTEXT-REQUEST to team lead before submitting: `CONTEXT-REQUEST: Need [specific file/info] to assess [finding] — should I proceed without it or wait?`

## Generic Hard Rules (Fallback)

Use these when `.claude/skills/review-rules/hard-rules.md` does not exist in the target project.

1. No secrets or credentials in source code — env vars only
2. No raw SQL string concatenation with user input — use parameterized queries
3. No empty catch blocks — errors must be logged or re-thrown
4. No `as any` without justification comment — use proper typing
5. No missing null checks on external data — validate at system boundaries

## Output Format

| # | Sev | File | Line | Confidence | Issue | Fix |
| --- | --- | --- | --- | --- | --- | --- |

Sev values: 🔴 Critical | 🟡 Warning | 🔵 Info

Send findings to team lead when done.
