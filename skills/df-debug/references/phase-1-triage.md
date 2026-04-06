# Phase 1: Triage (Lead Only)

## Step 1: Detect Project

Use the `Project` JSON from the header (output of `detect-project.sh`). It contains: `project`, `repo`, `validate`, `base_branch`, `branch`.

Check for project-specific Hard Rules at `{project_root}/.claude/skills/review-rules/hard-rules.md`. If it exists, load it.

## Step 2: Jira Context (skip if no Jira)

Scan `$ARGUMENTS` for Jira key (`ABC-\d+`). If found, follow [jira-integration](../../df-jira-integration/SKILL.md) §debug:

1. Fetch ticket — enrich bug description with ticket details
2. Check linked issues — related bugs may share root cause
3. Use ticket priority to inform severity classification (Step 2)
4. Add Jira context to `debug-context.md` (Step 5) and Investigator prompt (Phase 2)

If Jira unreachable → proceed with user-provided description only; note "Jira unavailable" in debug-context.md Jira Context section.

If no Jira key — skip to Step 3.

## Step 3: Classify Severity

| Severity | Criteria | Effect |
| --- | --- | --- |
| **P0 — Outage** | Production down, data loss | Full mode forced, skip mode confirmation only (fix plan approval still required) |
| **P1 — Critical** | Major feature broken, workaround exists | Full mode default |
| **P2 — Minor** | Edge case, cosmetic, non-blocking | Quick mode default |

**P0 gate clarification:** Only the mode confirmation gate is skipped (auto-Full). All other gates remain.

## Step 4: Classify Mode

- `--quick` flag or P2 severity → **Quick mode** (skip DX Analyst)
- P0/P1, multi-file, cross-cutting → **Full mode**
- Ambiguous → ask user

## Step 5: Create Context Artifact

Write `{artifacts_dir}/debug-context.md` — format: [artifact-templates.md](artifact-templates.md#debug-context.md). Includes: bug description, severity, mode, project, validate command, reproduction steps, hard rules, Jira context (if applicable), shared context (populated in Phase 1 Bootstrap), and progress checkboxes.

Lead updates the progress checkboxes at the start of each phase.

**GATE:** Call AskUserQuestion to confirm mode (P0: auto-Full, skip this):

- question: "Confirm debug mode?"
- header: "Mode"
- options: [{ label: "Full", description: "Multi-file, cross-cutting — includes DX Analyst" },
             { label: "Quick", description: "P2 / simple fix — skip DX Analyst" }]
  (pre-select the classified mode as first option)
→ proceed.
