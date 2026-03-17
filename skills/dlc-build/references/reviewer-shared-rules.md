# Shared Reviewer Rules

Common rules and output format shared across all reviewer roles. Referenced from each reviewer template to avoid duplication.

## Rules (all reviewers)

1. Read actual code before flagging — no speculation without file:line evidence
2. Score confidence 0-100 for each finding
3. Only report findings above your role's domain threshold (see reviewer-prompts.md for thresholds)
4. Hard Rule violations bypass confidence filter — always report
5. Review ONLY changed files — not pre-existing issues
6. If confidence is below threshold due to missing context, send a CONTEXT-REQUEST to team lead before submitting: `CONTEXT-REQUEST: Need [specific file/info] to assess [finding] — should I proceed without it or wait?`

## Output Format

| # | Sev | File | Line | Confidence | Issue | Fix |
| --- | --- | --- | --- | --- | --- | --- |

Sev values: 🔴 Critical | 🟡 Warning | 🔵 Info

Send findings to team lead when done.
