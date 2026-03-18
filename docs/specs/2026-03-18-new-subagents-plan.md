# New DLC Subagents Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create two named Haiku agents (`review-consolidator` and `dlc-debug-bootstrap`) that integrate into the existing DLC skill suite to offload mechanical work from the main model.

**Architecture:** Two standalone agent `.md` files in `agents/` are created, then the three calling skills (dlc-build, dlc-review, dlc-debug) are updated to invoke them. `consolidation-prompt.md` is deleted once its content moves into the agent. No new directories needed.

**Tech Stack:** Markdown agent files, YAML frontmatter, Claude Code agent runtime, markdownlint-cli2 for validation.

**Spec:** `docs/specs/2026-03-18-new-subagents-design.md`

---

## File Map

| File | Action | Task |
| ------ | -------- | ------ |
| `agents/review-consolidator.md` | Create | 1 |
| `agents/dlc-debug-bootstrap.md` | Create | 4 |
| `skills/dlc-build/references/phase-4-review.md` | Modify line 48 | 2 |
| `skills/dlc-build/SKILL.md` | Modify reference table | 2 |
| `skills/dlc-build/CLAUDE.md` | Remove consolidation-prompt.md row | 2 |
| `skills/dlc-build/references/consolidation-prompt.md` | Delete | 2 |
| `skills/dlc-review/SKILL.md` | Modify Phase 4 Convergence | 3 |
| `skills/dlc-debug/SKILL.md` | Modify Phase 1 Bootstrap steps | 5 |

---

## Task 1: Create `review-consolidator` Agent

**Files:**

- Create: `agents/review-consolidator.md`

- [ ] **Step 1: Write the agent file**

````markdown
---
name: review-consolidator
description: "Mechanical dedup, pattern-cap, sort, and signal-check for multi-reviewer findings tables. Use after DLC review debate to consolidate raw findings into a single ranked output. Called by dlc-build Phase 4 iter 1 (3 reviewers) and dlc-review Phase 4 Convergence."
model: haiku
tools: Read
---

# Review Findings Consolidator

Consolidate raw review findings from multiple reviewers into a single ranked, deduplicated table.

## Input

Raw findings tables passed inline in this prompt (concatenated from all reviewers). For
unusually large reviews (>200 findings), the caller may pass a file path instead — use
the `Read` tool in that case.

## Process

Apply these steps strictly in order:

### 1. Confidence Filter

Drop findings below the role threshold. Hard Rule violations bypass this filter — always
keep them.

| Reviewer role | Min confidence |
| --- | --- |
| Correctness & Security | 75 |
| Architecture & Performance | 80 |
| DX & Testing | 85 |

### 2. Dedup

Same `file:line` across reviewers → keep one entry:

- Severity: keep the highest
- Evidence: merge from all reviewers into the Issue cell
- Do NOT merge findings with different root causes even if in the same file
- Do NOT upgrade or downgrade severity — preserve the highest found

### 3. Pattern Cap

Same violation type in more than 3 files → consolidate to 1 row with note:
`(+ N more files: file1.ts, file2.ts, ...)`

### 4. Sort

Order rows: 🔴 Critical → 🟡 Warning → 🔵 Info

### 5. Signal Check

Count surviving findings. If (🔴 + 🟡) / Total < 60% → prepend this line before the
table: `⚠ Low signal: fewer than 60% of findings are actionable — review for noise.`

The 60% threshold is from `review-conventions.md` §Signal check.

## Output Format

Format follows `review-output-format.md` Phase 3 Part 2 (emoji format is canonical):

```markdown
**Summary: 🔴 X · 🟡 Y · 🔵 Z** (after dedup)

#### Findings

| # | Sev | Rule | File | Line | Consensus | Issue |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 🔴 | #2 | `src/foo.ts` | 42 | 3/3 | Uses `as any` — should use type guard |
```

- `Consensus`: N/M where N = reviewers who raised this finding, M = **total** reviewers (not just surviving reviewers)
- If zero findings after filter: output `**Summary: ✅ No issues found**` (no table)

## Error Handling

- No findings from a reviewer → proceed with remaining reviewers; note `[no findings from reviewer N]` in Summary line
- If this agent errors → calling skill lead performs consolidation inline (see skill's fallback note)

````

- [ ] **Step 2: Lint the new file**

```bash
npx markdownlint-cli2 "agents/review-consolidator.md"
```

Expected: `0 errors` — fix any reported issues before continuing.

- [ ] **Step 3: Validate with skill-validator**

```bash
# In Claude Code, invoke:
# Agent(subagent_type: "skill-validator", prompt: "Validate /path/to/dotclaude/agents/review-consolidator.md")
```

Expected: No Critical issues. Address any Critical findings before continuing.

- [ ] **Step 4: Commit**

```bash
git add agents/review-consolidator.md
git commit -m "feat(agents): add review-consolidator Haiku agent"
```

---

## Task 2: Integrate `review-consolidator` into dlc-build

**Files:**

- Modify: `skills/dlc-build/references/phase-4-review.md` (line 48)
- Modify: `skills/dlc-build/SKILL.md` (reference table)
- Modify: `skills/dlc-build/CLAUDE.md` (Docs Index table)
- Delete: `skills/dlc-build/references/consolidation-prompt.md`

- [ ] **Step 1: Update phase-4-review.md**

In `skills/dlc-build/references/phase-4-review.md`, find the `## Review Output` section.

Replace this sentence:

```text
Full mode iter 1 with 3 reviewers: load [consolidation-prompt.md](consolidation-prompt.md) and delegate consolidation + dedup to a Haiku subagent — removes main context bias from ranking and saves Sonnet tokens on mechanical dedup work.
```

With:

```text
Full mode iter 1 with 3 reviewers: run `review-consolidator` agent with raw findings inline — removes main context bias from ranking and saves Sonnet tokens on mechanical dedup work. For 1–2 reviewer cases, lead consolidates inline (no agent).
```

- [ ] **Step 2: Add agent to dlc-build SKILL.md reference table**

In `skills/dlc-build/SKILL.md`, find the reference table row for `consolidation-prompt.md`:

```text
| [references/consolidation-prompt.md](references/consolidation-prompt.md) | Phase 4 iter 1 with 3 reviewers |
```

Replace it with:

```text
| `review-consolidator` agent | Phase 4 iter 1 (3 reviewers) — consolidate findings |
```

- [ ] **Step 3: Remove from dlc-build CLAUDE.md Docs Index and Skill Architecture**

In `skills/dlc-build/CLAUDE.md`, find and delete the Docs Index table row:

```text
| `references/consolidation-prompt.md` | Haiku consolidation subagent prompt (Phase 4 iter 1) |
```

Also in `skills/dlc-build/CLAUDE.md`, find the Skill Architecture line:

```text
- Role-specific prompt files: explorer, worker, fixer, reviewer, consolidation
```

Replace with:

```text
- Role-specific prompt files: explorer, worker, fixer, reviewer
```

- [ ] **Step 4: Delete consolidation-prompt.md**

```bash
git rm skills/dlc-build/references/consolidation-prompt.md
```

- [ ] **Step 5: Lint changed files**

```bash
npx markdownlint-cli2 "skills/dlc-build/SKILL.md" "skills/dlc-build/CLAUDE.md" "skills/dlc-build/references/phase-4-review.md"
```

Expected: `0 errors`

- [ ] **Step 6: Commit**

```bash
git add skills/dlc-build/references/phase-4-review.md
git add skills/dlc-build/SKILL.md
git add skills/dlc-build/CLAUDE.md
git commit -m "feat(dlc-build): use review-consolidator agent in Phase 4 iter 1"
```

---

## Task 3: Integrate `review-consolidator` into dlc-review

**Files:**

- Modify: `skills/dlc-review/SKILL.md` (Phase 4 Convergence section)

- [ ] **Step 1: Read the current Phase 4 Convergence section**

Read `skills/dlc-review/SKILL.md` and locate `## Phase 4: Convergence`. It currently contains 4 inline steps: Dedup, Pattern cap, Sort, Signal check (lines ~142–152). Note the exact text — you will replace these 4 steps.

- [ ] **Step 2: Replace inline consolidation steps with agent call**

In `skills/dlc-review/SKILL.md` Phase 4, find and replace this exact block:

```markdown
Consolidate surviving findings per [review-conventions.md](../../references/review-conventions.md):

1. **Dedup** by file:line — merge evidence from debate
2. **Pattern cap** — same violation in >3 files → consolidate + "and N more"
3. **Sort** — Critical → Warning → Info
4. **Signal check** — if (Critical+Warning)/Total < 60%, review for noise
```

Replace with:

```markdown
Dispatch `review-consolidator` agent with the surviving debate findings passed inline in
the prompt. Capture the agent's output as the consolidated findings table.

If agent errors → perform dedup, pattern-cap, sort, and signal-check inline per
[review-conventions.md](../../references/review-conventions.md).
```

Keep everything after this block unchanged: the `Output the consolidated findings table...` line, the Dismissed Findings Log, the column replacement note, and the GATE line.

- [ ] **Step 3: Lint**

```bash
npx markdownlint-cli2 "skills/dlc-review/SKILL.md"
```

Expected: `0 errors`

- [ ] **Step 4: Commit**

```bash
git add skills/dlc-review/SKILL.md
git commit -m "feat(dlc-review): use review-consolidator agent in Phase 4 Convergence"
```

---

## Task 4: Create `dlc-debug-bootstrap` Agent

**Files:**

- Create: `agents/dlc-debug-bootstrap.md`

- [ ] **Step 1: Write the agent file**

````markdown
---
name: dlc-debug-bootstrap
description: "Pre-gather shared debug context before dlc-debug Phase 1: reads dlc-build artifacts when present, maps affected files from stack trace or description, collects recent commits and code structure. Run at the start of any debug session to avoid redundant reads by Investigator agents."
model: haiku
tools: Read, Glob, Bash, Grep
compatibility: fd, ast-grep
---

# Debug Bootstrap

Pre-gather shared context and write `## Shared Context` to `debug-context.md` before
dlc-debug Phase 1 spawns Investigator and DX Analyst teammates.

## Input

Passed inline in this prompt with labeled fields:

```text
Bug: {bug description or Jira key}
Project Root: {absolute path to target project root}
```

## Steps

### Step 1: Check for dlc-build Artifacts

```bash
# Check if a recent dlc-build session left artifacts
ls {project_root}/.claude/dlc-build/dev-loop-context.md 2>/dev/null
```

If found: read `dev-loop-context.md` and extract plan items and modified files that are
relevant to the bug area (match file names or area keywords from bug description).

If not found: skip — omit "Recent Build Context" section from output.

### Step 2: Map Affected Files

Parse the bug description for file paths, module names, or stack trace entries (max 5 files).

```bash
# If stack trace contains file paths, extract them directly
# If description names a module/feature area, search for files:
fd -t f "{keyword}" {project_root}/src --max-depth 5 | head -5
```

Fallback if `fd` unavailable:

```bash
# Using Glob tool: search for files matching the keyword pattern
```

If no files found: note "affected files unknown — Investigator must determine".

### Step 3: Recent Commits in Affected Area

```bash
git -C {project_root} log --oneline -10 -- {affected_file_1} {affected_file_2}
```

Skip this step if affected files are unknown.

### Step 4: Scan Code Structure (NOT full file content)

For each affected file, collect function signatures and key class/interface names only —
do not read entire files.

```bash
ast-grep -p 'function $NAME($$$) $$$' {affected_file} 2>/dev/null | head -10
ast-grep -p 'class $NAME $$$' {affected_file} 2>/dev/null | head -5
```

Fallback if `ast-grep` unavailable:

```bash
rtk grep -n "^export|^class|^function|^const.*=.*=>" --include="*.ts" {affected_file} | head -15
```

### Step 5: Append to debug-context.md

`debug-context.md` is created by dlc-debug Phase 0 Step 4 before this agent runs.
Append the following section using Bash:

```bash
cat >> {project_root}/debug-context.md << 'EOF'

## Shared Context
**Gathered:** {timestamp}

### Recent Build Context (from dlc-build)
{include only if Step 1 found relevant artifacts; omit section entirely otherwise}

### Affected Files
{list each file with line range and one-line description}

### Recent Commits
{git log output from Step 3}

### Code Structure Notes
{function signatures and key class names from Step 4}
EOF
```

If `debug-context.md` does not exist (crash recovery path): create a skeleton first:

```bash
printf '# Debug Context\n**Bug:** %s\n' "{bug_description}" > {project_root}/debug-context.md
```

Then append as above.

## Required Sections in Output

All sub-sections are required EXCEPT:

- "Recent Build Context" — only when dlc-build artifacts found AND relevant
- "Code Structure Notes" — omit if no meaningful structure found in affected files

## Error Handling

- `ast-grep` unavailable → use `rtk grep` fallback (note in Code Structure Notes)
- `fd` unavailable → use Glob tool fallback
- dlc-build artifacts found but unrelated to bug area → omit Recent Build Context
- Affected files not determinable → write "affected files unknown" in Affected Files section
- **Call-site fallback:** if this agent errors, dlc-debug lead executes Phase 1 Bootstrap
  Steps 1–4 inline

````

- [ ] **Step 2: Lint the new file**

```bash
npx markdownlint-cli2 "agents/dlc-debug-bootstrap.md"
```

Expected: `0 errors` — fix any reported issues.

- [ ] **Step 3: Validate with skill-validator**

```bash
# In Claude Code, invoke:
# Agent(subagent_type: "skill-validator", prompt: "Validate /path/to/dotclaude/agents/dlc-debug-bootstrap.md")
```

Expected: No Critical issues.

- [ ] **Step 4: Commit**

```bash
git add agents/dlc-debug-bootstrap.md
git commit -m "feat(agents): add dlc-debug-bootstrap Haiku agent"
```

---

## Task 5: Integrate `dlc-debug-bootstrap` into dlc-debug

**Files:**

- Modify: `skills/dlc-debug/SKILL.md` (Phase 1 Bootstrap section)

- [ ] **Step 1: Read the current Phase 1 Bootstrap section**

Read `skills/dlc-debug/SKILL.md` and locate `### Bootstrap (Lead — before spawning teammates)` under `## Phase 1: Investigate + DX Audit`. It currently contains 5 inline steps (lines ~116–128). Note the exact text block — all 5 steps will be replaced.

- [ ] **Step 2: Replace inline bootstrap steps with agent call**

Replace the entire `### Bootstrap (Lead — before spawning teammates)` block (Steps 1–4) with:

````markdown
### Bootstrap (Lead — before spawning teammates)

Dispatch `dlc-debug-bootstrap` agent. Pass labeled input inline:

```text
Bug: {bug description from $ARGUMENTS}
Project Root: {project_root from Phase 0 detect-project output}
```

The agent appends `## Shared Context` to `debug-context.md` — include that section
path in each teammate's prompt when constructing them (Step 1).

**Call-site fallback:** if agent errors → execute original Steps 1–4 inline:

1. `rtk git log --oneline -10` — recent commits near affected area
2. List primary affected files (max 5) from error/stack trace
3. Read key sections of each file (structure only, not full content)
4. Append `## Shared Context` to `debug-context.md`

````

Keep everything else in Phase 1 unchanged (Step 1: Create Team, Step 2: Wait for Teammates, Step 3: Convergence).

- [ ] **Step 3: Lint**

```bash
npx markdownlint-cli2 "skills/dlc-debug/SKILL.md"
```

Expected: `0 errors`

- [ ] **Step 4: Commit**

```bash
git add skills/dlc-debug/SKILL.md
git commit -m "feat(dlc-debug): use dlc-debug-bootstrap agent in Phase 1 Bootstrap"
```

---

## Task 6: Link Agents and Final Validation

**Files:**

- Run: `scripts/link-skill.sh` (links all agents)

- [ ] **Step 1: Link all agents**

```bash
bash scripts/link-skill.sh
```

Expected output includes lines like:

```text
✓ agents/review-consolidator → ~/.claude/agents/review-consolidator.md
✓ agents/dlc-debug-bootstrap → ~/.claude/agents/dlc-debug-bootstrap.md
```

- [ ] **Step 2: Verify symlinks exist**

```bash
bash scripts/link-skill.sh --list
```

Expected: both `review-consolidator` and `dlc-debug-bootstrap` appear in the agents list.

- [ ] **Step 3: Lint all changed files together**

```bash
npx markdownlint-cli2 "agents/review-consolidator.md" "agents/dlc-debug-bootstrap.md" "skills/dlc-build/**/*.md" "skills/dlc-review/SKILL.md" "skills/dlc-debug/SKILL.md"
```

Expected: `0 errors`

- [ ] **Step 4: Smoke test review-consolidator**

In a Claude Code session, invoke the agent with sample findings inline:

```text
Run review-consolidator agent with this input:

Reviewer 1 (Correctness & Security, confidence 80):
| 1 | 🔴 | #2 | `src/foo.ts` | 42 | — | Uses `as any` |

Reviewer 2 (Architecture & Performance, confidence 85):
| 1 | 🔴 | #2 | `src/foo.ts` | 42 | — | Same `as any` issue |
| 2 | 🟡 | #6 | `src/bar.ts` | 15 | — | SRP violation |

Reviewer 3 (DX & Testing, confidence 60):
| 1 | 🔵 | #9 | `src/baz.ts` | 88 | — | Missing doc comment |
```

Expected output:

- Row 1 deduplicated (2/3 Correctness+Architecture raised it)
- Reviewer 3's Info finding kept (above DX threshold of 85? No — 60 < 85, so dropped)
- `**Summary: 🔴 1 · 🟡 1 · 🔵 0**`

If output doesn't match: check confidence threshold logic in agent body.

- [ ] **Step 5: Final commit**

```bash
git add .
git status  # confirm only docs/specs/2026-03-18-new-subagents-plan.md is untracked
git commit -m "chore: verify agent integration and symlinks"
```
