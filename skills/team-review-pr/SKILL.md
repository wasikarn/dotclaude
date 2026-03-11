---
name: team-review-pr
description: "Agent Teams PR review with adversarial debate — 3 reviewer teammates review independently then challenge each other's findings to reduce false positives. Use when: reviewing complex PRs, high-stakes changes where false positive reduction matters, or multi-perspective review with cross-validation. Triggers: team review, debate review, /team-review-pr."
argument-hint: "[pr-number] [Author|Reviewer?]"
compatibility: "Requires gh CLI, git, and CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 enabled in settings"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash(gh *), Bash(git *)
---

# Team PR Review — Adversarial Debate

Invoke as `/team-review-pr [pr-number] [Author|Reviewer]`

## References

| File |
| --- |
| [debate-protocol.md](references/debate-protocol.md) |
| [review-output-format.md](../../references/review-output-format.md) |
| [review-conventions.md](../../references/review-conventions.md) |

---

**PR:** #$0 | **Mode:** $1 (default: Author)
**Today:** !`date +%Y-%m-%d`
**Diff stat:** !`git diff HEAD~1...HEAD --stat 2>/dev/null || git diff main...HEAD --stat 2>/dev/null | tail -10`
**PR title:** !`gh pr view $0 --json title,body,labels,author --jq '{title,body,labels: [.labels[].name],author: .author.login}' 2>/dev/null`
**Changed files:** !`gh pr diff $0 --name-only 2>/dev/null`

**Args:** `$0`=PR# (required) · `$1`=Author/Reviewer (default: Author)
**Modes:** Author = fix code · Reviewer = comment only (in Thai)
**Role:** Tech Lead — improve code health via architecture, mentoring, team standards.

Read CLAUDE.md first — auto-loaded, contains project patterns and conventions.
**Output format:** Follow [review-output-format.md](../../references/review-output-format.md) for base format, with debate additions described below.

---

## Prerequisite Check

Before anything, verify agent teams are available:

```text
If TeamCreate tool is not available → ABORT with message:
"⚠️ Agent Teams not enabled. Set CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 in settings.
Alternatively, use project-specific review skills: /tathep-api-review-pr, /tathep-web-review-pr, etc."
```

---

## Phase 0: PR Scope Assessment

Parse `Diff stat` from header. Classify per [review-conventions.md](../../references/review-conventions.md) size thresholds:

| Size | Lines | Behavior |
| --- | --- | --- |
| Normal | <=400 | Full review with debate |
| Large | 401-1000 | Full review + suggest split |
| Massive | >1000 | Hard Rules only, skip debate, warn prominently |

If Massive: skip to simplified single-session review (debate overhead not worth it for scope-limited review).

---

## Phase 1: Project Detection

Auto-detect project from repo context (remote URL, CLAUDE.md, directory name):

| Project | Repo pattern | Hard Rules source | Validate command |
| --- | --- | --- | --- |
| tathep-platform-api | `bd-eye-platform-api` | AdonisJS + Effect-TS rules | `npm run validate:all` |
| tathep-website | `bluedragon-eye-website` | Next.js Pages Router rules | `npm run ts-check && npm run lint:fix && npm test` |
| tathep-admin | `bluedragon-eye-admin` | Next.js + Tailwind rules | `npm run ts-check && npm run lint@fix && npm run test` |
| tathep-ai-agent | `tathep-ai-agent-python` | Python + FastAPI rules | `uv run black --check . && uv run mypy .` |
| tathep-video | `tathep-video-processing` | Bun + Hono + Effect rules | `bun run check && bun run test` |
| Unknown | — | Generic TypeScript/Python | Project's test command |

Load project-specific Hard Rules from the corresponding `tathep-*-review-pr` skill's SKILL.md if available. Otherwise use generic rules:

**Generic Hard Rules** (flag unconditionally):

- `as any` / `as unknown as T` → Critical (destroys type safety)
- empty `catch {}` / swallowed errors → Critical (silent failures)
- nesting > 1 level → Critical (use guard clauses, extract function, or lookup table)
- query inside loop → Critical (N+1)
- `console.log` in production code → Critical (use structured logger)

---

## Phase 2: Create Team and Independent Review

### Step 1: Create the team

Create an agent team named `review-pr-$0` with 3 reviewer teammates:

**Teammate 1 — Correctness & Security:**

```text
You are reviewing PR #$0 for correctness and security issues.

YOUR FOCUS: Functional correctness (#1, #2), type safety (#10), error handling (#12), and all Hard Rules.

SCOPE: Only review files in the PR diff. Do NOT flag issues in unchanged files.

RULES:
- READ-ONLY — do not modify any files
- Every finding MUST cite file:line with actual code evidence
- Hard Rules: [insert project Hard Rules here]
- Non-Hard-Rule findings require confidence >= 80 (scale 0-100)

OUTPUT FORMAT: For each finding, provide:
1. Severity: Critical/Warning/Info
2. Rule: checklist item number
3. File and line
4. What's wrong + evidence (quote the code)
5. Why it matters
6. Concrete fix

After review, message your findings to the team lead.
```

**Teammate 2 — Architecture & Performance:**

```text
You are reviewing PR #$0 for architecture and performance issues.

YOUR FOCUS: N+1 prevention (#3), DRY & simplicity (#4), flatten structure (#5), small functions & SOLID (#6), elegance (#7), and all Hard Rules.

SCOPE: Only review files in the PR diff. Do NOT flag issues in unchanged files.

RULES:
- READ-ONLY — do not modify any files
- Every finding MUST cite file:line with actual code evidence
- Hard Rules: [insert project Hard Rules here]
- Non-Hard-Rule findings require confidence >= 80 (scale 0-100)

OUTPUT FORMAT: [same as above]

After review, message your findings to the team lead.
```

**Teammate 3 — DX & Testing:**

```text
You are reviewing PR #$0 for developer experience and test quality.

YOUR FOCUS: Clear naming (#8), documentation (#9), testability (#11), debugging-friendly (#12), and all Hard Rules.

SCOPE: Only review files in the PR diff. Do NOT flag issues in unchanged files.

RULES:
- READ-ONLY — do not modify any files
- Every finding MUST cite file:line with actual code evidence
- Hard Rules: [insert project Hard Rules here]
- Non-Hard-Rule findings require confidence >= 80 (scale 0-100)

OUTPUT FORMAT: [same as above]

After review, message your findings to the team lead.
```

### Step 2: Wait for all reviews

Wait for all 3 teammates to complete their independent review. Track progress:

```markdown
### Phase 2: Independent Review

| Teammate | Status | Findings |
| --- | --- | --- |
| Correctness & Security | ... | ... |
| Architecture & Performance | ... | ... |
| DX & Testing | ... | ... |
```

**CHECKPOINT** — all 3 reviews must complete before proceeding to debate.

---

## Phase 3: Adversarial Debate

Follow [debate-protocol.md](references/debate-protocol.md) exactly.

### Step 1: Broadcast findings

Send each teammate the compiled findings from all three reviews:

```text
All reviews are complete. Here are the findings from all teammates:

[Correctness findings]
[Architecture findings]
[DX findings]

Your task: Review the findings from the teammate assigned to you.
For each finding, respond with: Agree, Challenge (with evidence), or Escalate.
See debate-protocol.md for rules.
```

### Step 2: Round-robin debate

Create debate tasks per [debate-protocol.md](references/debate-protocol.md):

- Correctness reviews Architecture's findings
- Architecture reviews DX's findings
- DX reviews Correctness's findings

### Step 3: Check for consensus

After Round 1:

- If all findings have consensus (agree or clear majority) → proceed to Phase 4
- If unresolved disagreements exist → Round 2 (targeted debate on those findings only)
- After Round 2 → lead decides any remaining disputes based on evidence quality

### Step 4: Output debate summary

```markdown
### Phase 3: Debate Summary

| # | Finding | Raised By | Challenged By | Outcome |
| --- | --- | --- | --- | --- |
| 1 | ... | ... | ... | ... |
```

Show: Consensus (N/3), Dropped (with reason), or Lead decided (with rationale).

---

## Phase 4: Convergence

Consolidate surviving findings per [review-conventions.md](../../references/review-conventions.md):

1. **Dedup** by file:line — merge evidence from debate
2. **Pattern cap** — same violation in >3 files → consolidate + "and N more"
3. **Sort** — Critical → Warning → Info
4. **Signal check** — if (Critical+Warning)/Total < 60%, review for noise

Output the consolidated findings table per [review-output-format.md](../../references/review-output-format.md).

Replace the "Agents" column with "Consensus":

```markdown
**Summary: Critical X / Warning Y / Info Z** (after debate)

#### Findings

| # | Sev | Rule | File | Line | Consensus | Issue |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Critical | #2 | `src/foo.tsx` | 42 | 3/3 | Uses `as any` — should use type guard |
```

---

## Phase 5: Action

### Author Mode

1. Fix all Critical findings first, then Warning, then Info
2. Run project validate command (detected in Phase 1)
3. Output fixes table per [review-output-format.md](../../references/review-output-format.md)

### Reviewer Mode

As **Tech Lead**: focus on architecture, patterns, team standards, and mentoring.

1. Collect surviving findings: file path + line number + comment body
2. Add strengths (1-3, with evidence)
3. Submit to GitHub in ONE `gh api` call
4. Comment language: Thai mixed with English technical terms

**Comment labels:** Per [review-conventions.md](../../references/review-conventions.md) — prefix every comment with `issue:`/`suggestion:`/`nitpick:`/`praise:`.

---

## Phase 6: Cleanup

After action phase completes:

1. Shut down all teammates
2. Clean up the team

Output final verdict per [review-output-format.md](../../references/review-output-format.md).

---

## Constraints

- Investigate: read files before making claims — no speculation without evidence
- Every recommendation must be feasible within the project's patterns
- Teammates are READ-ONLY during Phase 2-3 — code changes only in Phase 5
- Max 3 teammates — more adds cost without proportional value
- Max 2 debate rounds — prevents infinite discussion
- Hard Rules cannot be dropped via debate (only reclassified with evidence)

## Success Criteria

- [ ] Agent team created with 3 teammates
- [ ] All 3 independent reviews completed (CHECKPOINT)
- [ ] Debate round(s) completed with summary table
- [ ] Findings consolidated with consensus indicators
- [ ] Critical issues: zero (Author) or documented (Reviewer)
- [ ] Author: validate passes / Reviewer: review submitted
- [ ] Team cleaned up
