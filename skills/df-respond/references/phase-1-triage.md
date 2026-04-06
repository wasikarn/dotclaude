# Phase 1: Triage (Lead Only)

## Step 1: Detect Project

Use the `Project` JSON from the header. Load project-specific Hard Rules from `{project_root}/.claude/skills/review-rules/hard-rules.md` if present.

## Step 2: Jira Context (if `$1` present)

If `$1` matches `ABC-\d+`, follow `## respond` section in [../../df-jira-integration/SKILL.md](../../df-jira-integration/SKILL.md) to fetch AC and enrich thread prioritization.

## Step 3: Fetch Threads

**Bash:** Fetch all open threads — see [operational.md](operational.md#phase-1-thread-fetch-commands) for gh API commands. Fetch both: inline review comments (by line) and review-level comments (CHANGES_REQUESTED + COMMENTED).

## Step 4: Load Dismissed Patterns

Issue Steps 3 and 4 in the same tool call round — they are independent reads.

**Read:** Load `{review_memory_dir}/review-dismissed.md` if present. Threads matching dismissed patterns → note as "Previously dismissed" in triage table (still include — reviewer may have re-raised with new evidence).

## Step 5: Classify Threads

Build triage table.

✅ **Good** — specific file+line, clear issue summary, correct severity:

```markdown
## Thread Triage

| # | File | Line | Reviewer | Severity | Issue Summary | Status | AC |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | src/auth/user.service.ts | 42 | reviewer-a | 🔴 Critical | Missing null check on `user.profile` — causes crash for pre-2024 users | Open | AC2 |
| 2 | src/utils/format.ts | 15 | reviewer-b | 🟡 Important | Date format uses `MM/DD/YYYY` — project standard is `YYYY-MM-DD` | Open | — |
| 3 | src/auth/user.service.ts | 91 | reviewer-a | 🔵 Suggestion | Variable name `d` unclear — consider `daysUntilExpiry` | Open | — |
```

❌ **Bad** — no line number, vague summary, severity not assigned:

```markdown
## Threads

| # | File | Issue | Status |
| --- | --- | --- | --- |
| 1 | user.service.ts | reviewer wants changes | Open |
| 2 | format.ts | fix this | Open |
```

`AC` column: populated only when `$1` Jira key provided — `AC1`, `AC2`, etc. for threads relating to an AC item; `—` for unrelated threads.

**Severity inference:**

- 🔴 Critical: Hard Rule violation, security issue, data loss risk, incorrect business logic, missing AC implementation
- 🟡 Important: Code quality, maintainability, incomplete fix, AC-related suggestion
- 🔵 Suggestion: Style, naming, optional improvement

**Conventional Comments decoration overrides** (scan thread body first):

- `(non-blocking)` in thread body → override to 🔵 Suggestion regardless of content
- `(blocking)` in thread body → override to 🔴 Critical regardless of content
- No decoration → use severity inference above

## Step 6: Cluster Analysis

Before routing threads to Fixers, group threads that share the same file:

- Add a `GROUP` column to the triage table (from Step 5)
- Assign `[GROUP-N]` to all threads touching the same file (N = sequential number per file)
- Threads touching unique files → leave `GROUP` as `—`
- Max 5 threads per group: if a file has >5 threads, split into `GROUP-Xa` (Critical/Important) and `GROUP-Xb` (Suggestion)

**Updated triage table format:**

| # | File | Line | GROUP | Reviewer | Severity | Issue Summary | Status | AC |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | auth.service.ts | 42 | GROUP-1 | reviewer | 🔴 | Missing null check | Open | — |
| 3 | auth.service.ts | 91 | GROUP-1 | reviewer | 🟡 | Inconsistent error msg | Open | — |
| 2 | user.mapper.ts | 15 | — | reviewer | 🟡 | Wrong date format | Open | — |

**Routing rule (used in Phase 2):**

- Threads sharing a GROUP → assign to a single Fixer (sequential, not parallel) so it reads the file once and fixes all related threads
- Independent threads (GROUP = —) → parallel Fixers as before

Why file-based only: semantic grouping requires extra reasoning and adds complexity without proportional benefit. File-based grouping is deterministic and sufficient.

## Step 7: Write `respond-context.md`

Write to `{artifacts_dir}/respond-context.md` — thread triage table, project info, validate command, Jira context if fetched. Required for context compression recovery.

**GATE:** Call AskUserQuestion (see [phase-gates.md](phase-gates.md) Triage → Fix gate) → proceed.
