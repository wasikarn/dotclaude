# Design: dev-loop Adaptive Ceremony System

**Date:** 2026-03-27
**Status:** Approved — ready for implementation planning
**Scope:** dlc-build skill + supporting agents + hooks infrastructure

## Background

dev-loop currently offers 3 modes (Full/Quick/Hotfix) that must be explicitly passed as flags.
All pain points reported:
- Research phase too heavy for small tasks
- Review phase too heavy for small changes
- Plan approval loop creates friction even on well-understood tasks

Research into 7 frameworks (BMAD, SpecKit, OpenSpec, GSD, Superpowers, feature-dev,
pr-review-toolkit) and claude-code-best-practice revealed a clear **maturity ladder**:

```
dev-loop current position: between SpecKit and GSD
  Trigger:     CLI Command         (target: auto-detect + confirm)
  Execution:   Gated + partial par (target: dependency-aware waves)
  Enforcement: Medium gates        (target: persuasion-proof + confidence floor)
```

Reference research files:
- `references/research-agentic-frameworks-comparison.md`
- `references/research-framework-insights.md`

---

## Goal

**Right amount of ceremony for the task at hand** — auto-detected from task description,
user can confirm or override, with enforcement against unsafe downgrades.

Two outcomes:
1. Small tasks get significantly less friction (Micro mode — new)
2. Large tasks get significantly better quality gates (must_haves verification, confidence
   floor, conditional dispatch, dual-lens plan challenge)

---

## ClarifyQ and ArchOpts (current Full mode phases — subsumed)

The current Full mode includes two intermediate phases between Research and Plan:
**ClarifyQ** (clarifying questions) and **ArchOpts** (architecture options).

This design subsumes both:

| Current phase | Subsumed by |
| --------------- | ------------- |
| ClarifyQ | `[NEEDS CLARIFICATION: ...]` tokens in research.md (§2.3) — max 3, file:line evidence required |
| ArchOpts | plan-challenger dual-lens (§3.3) — minimal-lens + clean-lens challenge replaces competing architecture proposals |

**Result:** ClarifyQ and ArchOpts are **removed** as standalone phases in Full mode.
Their functions are embedded in Phase 1 (research) and Phase 2 (plan-challenger).

Implementation must remove the ClarifyQ and ArchOpts steps from `phase-2-*.md` (or
wherever they currently live) and update `phase-gates.md` to reflect the new Phase 1→2
transition that no longer passes through those steps.

---

## Non-Goals

- Cross-session Tasks system coordination (separate initiative)
- dlc-debug improvements: knowledge base + parallel debuggers (separate design)
- `isolation: "worktree"` for reviewer agents (defer — needs behavioral testing first)
- Auto-applying lens updates without user approval

---

## Architecture Overview

```
/dlc-build [task] [--micro|--quick|--full|--hotfix]
    │
    ├── Phase 0: Triage
    │   ├── Constitution check (hard-rules.md)
    │   ├── Live context injection (!command)
    │   ├── Blast-radius auto-score (5 factors → Micro/Quick/Full)
    │   └── Downgrade protection if user overrides
    │
    ├── Phase 1: Research          [Micro: skip | Quick: Lite | Full: Deep]
    │   ├── Explorer agents → file list (not content)
    │   ├── Lead reads files → research.md with delta markers
    │   ├── Token budget check (900–1600)
    │   └── GO/NO-GO verdict (Full only) → user confirmation required
    │
    ├── Phase 2: Plan              [Micro: skip gate | Quick: skip gate | Full: gate]
    │   ├── must_haves.truths block (Micro:1, Quick:2–3, Full:3–5)
    │   ├── key_links ("where is this most likely to break?")
    │   ├── [P] parallel task markers + TDD task ordering
    │   ├── plan-challenger: dual-lens (minimal + clean)
    │   └── Three-state readiness verdict
    │
    ├── Phase 3: Implement
    │   ├── Workers with rationalization blockers
    │   ├── TDD hard enforcement (delete-before-impl)
    │   ├── <files_to_read> blocks (paths only)
    │   └── Continuation agent pattern (multi-wave Full mode)
    │
    ├── Phase 3.5: Verify          ← NEW PHASE
    │   ├── Assert must_haves.truths (behavioral, not impl)
    │   ├── Verify key_links exist in code
    │   └── ALL PASS → Phase 4 | ANY FAIL → loop Phase 3 (max 1)
    │
    ├── Phase 4: Review
    │   ├── Stage 1: Spec compliance (Superpowers two-stage)
    │   ├── Stage 2: Code quality (conditional dispatch by diff type)
    │   ├── Confidence floor ≥80 on all findings
    │   ├── Criticality scaling 1–10
    │   └── Reviewers: Micro=1, Quick=2, Full=3 + debate
    │
    ├── Phase 5.5: Simplify        [Micro: skip | Quick: optional | Full: default]
    │   └── Only when Critical findings = 0
    │
    └── Phase 6: Archive
        ├── Change folder: {artifacts_dir}/{date}-{task-slug}/
        └── Post-ship: move to archive/
```

---

## Section 1 — Phase 0: Triage

### 1.1 Constitution Check (SpecKit)

First action before any scoring:
```bash
# Injected via !command at SKILL.md invoke time
!`[ -f ".claude/skills/review-rules/hard-rules.md" ] && echo "FOUND" || echo "MISSING"`
```

- FOUND → load hard-rules.md into context for the session
- MISSING → warn: "No hard-rules.md found — review gates will operate without project rules"
  → do not block, just warn

### 1.2 Live Context Injection (claude-code-best-practice `!command`)

Inject at SKILL.md header (substituted at invoke time):

```
!`git log --oneline -3 2>/dev/null || echo "no git history"`
!`git diff --name-only HEAD 2>/dev/null || echo "clean"`
!`git branch --show-current 2>/dev/null || echo "unknown"`
```

Gives scorer live context: what changed recently, what's already in flight.

### 1.3 Blast-Radius Auto-Scoring (BMAD)

Lead evaluates 5 factors from task description + live context injection:

| Factor | Score 1 if… |
| -------- | ------------- |
| **Scope** | Task touches >1 module or service boundary |
| **Risk** | Task involves auth / payment / DB migration / public API |
| **Novelty** | Pattern doesn't exist in codebase (new abstraction, new dependency) |
| **Dependencies** | Code being changed has known downstream consumers |
| **Ambiguity** | Task description is underspecified or has unclear acceptance criteria |

**Mode assignment:**
- Score 1–2 → **Micro** (isolated, zero blast radius)
- Score 3 → **Quick** (moderate, understood change)
- Score 4–5 → **Full** (cross-cutting, risky, or unclear)

Lead presents: "Task scored X/5 → suggesting [mode]. Proceed or override?"

### 1.3.1 Flag vs Score Precedence

CLI flags and blast-radius score interact as follows:

| Situation | Result |
| ----------- | -------- |
| `--hotfix` passed | Always Hotfix — no scoring, no override prompt |
| `--micro` / `--quick` / `--full` passed AND matches score | Use flag mode silently |
| `--micro` / `--quick` / `--full` passed AND flag is **lower** than score | Downgrade protection triggers (§1.4) |
| `--micro` / `--quick` / `--full` passed AND flag is **higher** than score | Use flag mode — over-ceremony is safe |
| No flag passed | Use blast-radius score result |

Note: The existing `workflow-modes.md` decision tree governs Hotfix classification and
flag precedence. It must be updated to add Micro mode definition and the blast-radius
auto-score path. See Implementation Scope.

### 1.4 Downgrade Protection (Superpowers persuasion-proof)

If user overrides toward lower ceremony (e.g., Full→Quick):

```
Lead responds:
"Overriding to [lower mode]. The following blast-radius factors scored 1:
  • [list each factor that scored 1 with brief explanation]

These increase the risk of rework or missed requirements.
Confirm override? (yes / no)"
```

Gates hold harder under urgency, not softer. Require explicit "yes" before proceeding.

### 1.5 Effort per Mode

Set in **subagent spawn calls** (not SKILL.md frontmatter — which is static):

- Micro workers → `effort: low`
- Quick workers → `effort: medium`
- Full workers → `effort: high`
- Lead (dlc-build itself) → always `effort: high` (unchanged)

---

## Section 2 — Phase 1: Research

### 2.1 Mode Behavior

| Mode | Research |
| ------ | ---------- |
| Micro | Skip entirely — proceed directly to Phase 2 (plan) |
| Quick | Lite: WHAT/WHY only, no HOW, ~250 lines target |
| Full | Deep: delta markers + [NEEDS CLARIFICATION] + GO/NO-GO verdict |

### 2.2 Explorer Pattern (feature-dev agent-returns-references + GSD `<files_to_read>`)

Explorer agents return a **structured file list**, not file contents:

```markdown
## Key Files for This Task
- src/auth/middleware.ts — handles JWT validation (relevant: auth risk factor)
- src/users/UserService.ts — contains findById (will be modified)
- tests/auth/middleware.test.ts — existing test patterns to follow
[5–10 files max]
```

Lead reads files directly → writes research.md
Benefit: orchestrator context stays lean; lead controls what enters research

### 2.3 research.md Structure

**Quick mode (Lite):**
```markdown
## Context
[2–3 sentences: what exists, what the task changes]

## WHAT
[What must be true after this task — behaviors only, no tech stack]

## WHY
[Why this change is needed]

## Token Count: ~XXX
```

**Full mode (Deep):**
```markdown
## Context
[Existing architecture patterns relevant to this task]

## ADDED
[New files / patterns / dependencies this task introduces]

## MODIFIED
[Existing files / patterns that will change]
(Previously: X → will become: Y)

## REMOVED
[Anything being deprecated or deleted]

## [NEEDS CLARIFICATION: <specific question>] [file:line evidence]
[Max 3 — each must cite file:line. No hypothetical questions.]

## Token Count: ~XXX tokens
[<900: research may be incomplete | 900–1600: ✅ | >1600: context rot risk]

**Enforcement actions:**
- `<900`: research-validator flags which sections are thin or missing (Context / WHAT / WHY /
  ADDED / MODIFIED / REMOVED). Lead decides: expand those sections or accept as-is.
- `900–1600`: proceed automatically.
- `>1600`: lead identifies and removes sections that exceed their useful scope —
  typically verbose context explanations that repeat what the codebase already shows.
  Do not add new content; trim to reach 900–1600 range.

## GO/NO-GO Verdict
READY / NEEDS WORK / NOT READY
Reason: [specific evidence, not opinion]
```

### 2.4 GO/NO-GO Behavior (Full mode only — RPI pattern)

```
READY      → proceed to Phase 2 automatically

NEEDS WORK → present issues found
             "Research found X concerns before implementation:
              [list with file:line evidence]
             Proceed anyway or address first?"
             → wait for explicit user decision

NOT READY  → present blocking issues
             "Research found blocking issues:
              [list with file:line evidence]
             (a) Address these issues first
             (b) Proceed with known risks
             (c) Abort"
             → REQUIRE explicit choice — never auto-advance
```

---

## Section 3 — Phase 2: Plan

### 3.1 must_haves Block (GSD goal-backward)

Lead derives truths from task description + research.md before writing plan:

**Truth quality criteria:**
- Observable from user/API perspective (not implementation detail)
- Verifiable: can be checked by running a test or calling an endpoint
- Behavioral: "would fail if behavior changes unexpectedly"

**Truth count by mode:**
- Micro: 1 truth (minimum viable verification)
- Quick: 2–3 truths
- Full: 3–5 truths

### 3.2 plan.md Structure

```markdown
## must_haves

### Truths
- [ ] [observable behavior] (verify: [how to check])
- [ ] [observable behavior] (verify: [how to check])

### Key Links ("where is this most likely to break?")
- [ComponentA] → [ComponentB] via [mechanism]: [why this is critical]

## Tasks
<!-- TDD ordering enforced: tests precede impl for same story (SpecKit) -->
- [P] Test: write failing test for Truth 1     ← [P] = parallel-safe
- [P] Test: write failing test for Truth 2
- [ ] Impl: implement minimal feature
- [ ] Impl: make Truth 1 pass
- [ ] Impl: make Truth 2 pass
- [P] Verify: run full test suite

## Readiness Verdict
READY / NEEDS WORK / NOT READY
[Issues if not READY: specific items with file:line]
```

### 3.3 Plan-Challenger: Dual-Lens (feature-dev adapted — Full mode only)

**Scope: plan-challenger runs in Full mode only.** Micro and Quick modes do not invoke
plan-challenger — their plans are written directly by lead without a challenge step.
Running plan-challenger on Micro/Quick would add overhead that defeats their purpose.

plan-challenger agent receives the draft plan.md and challenges it from **two lenses**:

**Minimal-lens challenge:**
> "What can be removed and still satisfy ALL must_haves.truths?"
> Flag: tasks not directly enabling a truth, speculative abstractions,
> over-engineered solutions, YAGNI violations

**Clean-lens challenge:**
> "What should be refactored BEFORE implementing to avoid accruing debt?"
> Flag: existing code the plan touches that has known issues,
> architectural inconsistencies the new code would worsen,
> targeted pre-work that reduces implementation risk

Lead reviews both lenses → decides what to accept/reject → updates plan.md
Lead does NOT spawn two separate agents — plan-challenger is still a single agent
with both lenses in its prompt.

### 3.4 Plan Gate

- Micro: no gate — lead proceeds to Phase 3 after writing plan
- Quick: no gate — lead proceeds to Phase 3 after writing plan
- Full: user reviews plan.md + readiness verdict → explicit approval required

---

## Section 4 — Phase 3: Implement

### 4.1 Rationalization Blockers in Worker Prompt (Superpowers)

Added as a named section at the top of every worker prompt:

```
── RATIONALIZATION BLOCKERS ──
If you notice yourself thinking any of the following, STOP:
• "This is too simple to need a test" → write the test first
• "I'll add tests after" → tests first, always, no exceptions
• "Let me just fix this quickly" → follow plan.md tasks in order
• "The test is obvious, I'll skip it" → write it explicitly
• User expressed urgency → gates hold harder under urgency, not softer

── TDD ENFORCEMENT ──
Required order: failing test → verify it fails for right reason → minimal impl → pass
Violation rule: if implementation exists before failing test → DELETE the implementation
               start over from the test. Not refactor — delete.

── TDD COMPLETION REPORT ──
At the end of your task, include in your completion message:
  TDD_COMPLIANCE: [FOLLOWED | VIOLATED]
  If VIOLATED: describe what happened and what you deleted/redid
```

Lead reads `TDD_COMPLIANCE` from each worker's completion message. If VIOLATED:
- Log the violation in `dev-loop-context.md` under `tdd_violations[]`
- Surface to user at Phase 6 summary (not as a blocker — for learning/metrics)

### 4.2 `<files_to_read>` Pattern (GSD)

Worker spawn prompts pass file paths, not content:

```
<files_to_read>
Read these files at the start of your task using the Read tool:
- {plan_file}                    (your assigned tasks)
- {research_file}                (context and delta markers)
- {relevant_source_files}        (files you will modify)
- .claude/skills/review-rules/hard-rules.md  (project rules)
</files_to_read>
```

Workers read files fresh with their own clean context.
Orchestrator never passes file contents directly → keeps lead context lean.

### 4.3 Continuation Agent Pattern (GSD — Full mode multi-wave)

For Full mode with multiple worker waves:
- Each wave = fresh agent spawn with explicit state injected
- State passed: `completed_tasks[]`, `must_haves`, `key_links`, `wave_number`
- Never resume a prior agent context — always fresh with injected state

```
Wave N spawn includes:
  completed_tasks: [task 1 ✅, task 2 ✅, ...]
  pending_tasks: [task 3, task 4]
  must_haves: [truth 1, truth 2]
  key_links: [A→B, C→D]
```

### 4.4 [P] Marker Wave Assignment (SpecKit)

Lead reads `[P]` markers from plan.md to determine parallel-safe tasks:
- Tasks with `[P]` = plan-time assessment: no expected file ownership conflict = same wave
- Tasks without `[P]` = sequential = own wave

Wave assignment is derived from plan.md, not manually decided.

**Important:** `[P]` markers are **plan-time hints**, not guarantees. They are set during Phase 2
before implementation begins, before the actual files are opened. A task marked `[P]` may still
cause a file conflict at write time if both workers touch the same file unexpectedly.

The existing spot-check mechanism (lead monitors per-commit file ownership) remains
**authoritative for conflict detection**. `[P]` markers reduce unnecessary serialization;
the spot-check prevents actual conflicts. Both mechanisms are needed.

---

## Section 5 — Phase 3.5: Verify (NEW PHASE)

This phase is **entirely new**. It runs after all workers complete, before Phase 4 review.
Lead agent runs this phase directly (no new subagent needed).

**dev-loop-context.md schema updates required:**
- `phase:` field: add `verify` as a valid value (set when entering Phase 3.5)
- New field: `tdd_violations: []` — populated from worker TDD_COMPLIANCE reports (§4.1)
- Progress tracker: add `- [ ] Phase 3.5: Verify` checkbox between Implement and Review

### 5.1 Mode Behavior

| Mode | Phase 3.5 behavior |
| ------ | ------------------- |
| Micro | Lightweight only: verify the 1 truth passes (run test / check output). No loop. On fail → escalate to user immediately (options: fix now or continue with known gap). |
| Quick | Full verification. Loop allowed (max 1). On STILL FAILING → escalate. |
| Full | Full verification. Loop allowed (max 1). On STILL FAILING → escalate with 3 options. |

Micro never loops back to Phase 3 — it has no user-approved plan as anchor, so a loop
would be unanchored. Instead, surface the failure immediately.

### 5.2 Verification Process

```
For each truth in must_haves.truths:
  1. State: "Verifying Truth N: [description]"
  2. Method: run tests / read code / check output / call endpoint
  3. Result: ✅ PASS with evidence | ❌ FAIL with specific reason

For each key_link:
  1. Verify: the connection exists in the actual code (file:line)
  2. Verify: error case is handled at the link

Aggregate verdict:
  ALL PASS → proceed to Phase 4

  ANY FAIL (Quick/Full):
    → return to Phase 3 with specific failure list (max 1 loop)

  ANY FAIL (Micro):
    → escalate immediately: "Truth N failed: [reason]. Fix now or continue to review?"
    → wait for user decision — do NOT loop

  STILL FAILING after loop (Quick/Full):
    → escalate: present 3 options to user
      (a) Continue to review with known gaps
      (b) Redesign — go back to Phase 2 (see §5.3 for what this means)
      (c) Abort
```

### 5.3 Redesign Path (option b — "go back to Phase 2")

When STILL FAILING and user picks option (b):

**Artifact handling:**
- `research.md` — regenerate (Phase 3 attempt may have changed code; research may be stale)
- `plan.md` — regenerate (truths may need revision; implementation that failed is evidence)
- `verify-results.md` — preserved as input to re-plan (it contains the failure evidence)
- All code changes from the failed Phase 3 attempt — lead decides: revert or keep as scaffolding

**Truth audit before re-planning:**
Lead must audit `must_haves.truths` before entering Phase 2:
- A truth that cannot be verified may be incorrectly specified (spec bug, not impl bug)
- Lead must explicitly confirm: "Is this truth still the right behavioral requirement?"
- Truths may be revised — but only with explicit reasoning, not to make them easier to pass

**Phase gates note:**
Implementation must add a `Phase 3.5 → Phase 2` entry to `phase-gates.md` with:
- Trigger: STILL FAILING after loop AND user picks option (b)
- Artifacts: verify-results.md preserved; research.md and plan.md marked for regeneration
- Iteration: loop counter reset for new planning cycle; prior attempt archived with date suffix

### 5.4 Behavioral Framing (pr-review-toolkit)

Each truth is evaluated as:
> "Would this fail if behavior changes unexpectedly — NOT if implementation details change?"

Implementation-detail checks belong in Phase 4, not Phase 3.5.

### 5.5 Output

`verify-results.md` written to `{artifacts_dir}`:

```markdown
## Phase 3.5 Verification Results

### Truth 1: [description]
Status: ✅ PASS
Evidence: tests/auth.test.ts:42 passes — verified

### Truth 2: [description]
Status: ❌ FAIL
Reason: POST /api/messages returns 500 when body is empty (expected 400)
Evidence: curl -X POST /api/messages → HTTP 500

### Key Links
- AuthMiddleware → UserService.findById: ✅ null guard at middleware.ts:67
```

---

## Section 6 — Phase 4: Review

### 6.1 Stage 1 — Spec Compliance (Superpowers two-stage, always first)

Before any code quality review, spec compliance reviewer checks:

1. **must_haves coverage**: all truths from Phase 3.5 confirmed in diff?
2. **hard-rules.md compliance**: every rule respected? (cite violations with file:line)
3. **Scope fidelity**: mode-dependent check:
   - Full: does diff match ADDED/MODIFIED/REMOVED from research.md? Any out-of-scope changes?
   - Quick: does diff stay within the files identified in research.md's Context section?
     (Quick has no ADDED/MODIFIED/REMOVED — use file-level scope instead)
   - Micro: skip scope fidelity check (no research.md exists for Micro)

**Gate:** Stage 1 FAIL → return to Phase 3 immediately
Do NOT proceed to Stage 2 — avoids wasting review capacity on non-compliant code.

**Iteration counter interaction:**
Stage 1 FAIL counts as a full iteration in `dev-loop-context.md`'s iteration counter —
the same counter used for the Phase 3→4 implement-review loop (max 3 total).

Rationale: Stage 1 failure is a Phase 3 failure surfaced at Phase 4. Counting it prevents
the following bypass: loop Phase 3→3.5→3→3.5 twice (2 loops) then hit Stage 1 failure
(uncounted) — which would allow 5+ total fix attempts behind the max-3 protection.

Lead increments `iteration_count` in `dev-loop-context.md` before returning to Phase 3.
If `iteration_count` reaches 3 at Stage 1 failure: present options to user instead of looping.

### 6.2 Stage 2 — Code Quality (Conditional Dispatch — pr-review-toolkit)

Lead checks diff before spawning reviewers:

```bash
# Use broader check — workers may not have committed yet at Phase 4
git diff --name-only HEAD 2>/dev/null; git diff --name-only --cached 2>/dev/null
```

(Implementation note: combine both staged and unstaged diffs to catch all changed files
regardless of commit state. Deduplicate the combined list before checking conditions.)

| Condition | Reviewer spawned |
| ----------- | ----------------- |
| `**/migrations/**` present | migration-reviewer |
| `**/routes/**` or `**/controllers/**` present | api-contract-auditor |
| `try\|catch\|async` present in diff | error-handling reviewer |
| `.ts` type definitions (`interface\|type\|enum`) | typescript reviewer |
| Always | general code-reviewer |

Skip inapplicable reviewers — reduce wasted tokens for PRs that don't touch those domains.

### 6.3 Confidence Floor ≥80 (feature-dev + pr-review-toolkit)

Before emitting any finding, every reviewer must reason through 3 questions:
1. Can I cite a specific `file:line` where this is a problem?
2. Is this a pre-existing issue unrelated to this diff?
3. Could I be wrong about the context (missing information, wrong assumption)?

If any answer is uncertain → do not emit. If all three answered confidently → emit with
confidence score label: `[C:92]`, `[C:81]`, etc.

The numeric label is for reader triage, not as a gate that can be gamed by asserting
a high number. The gate is the reasoning process above.

### 6.4 Criticality Scaling 1–10 (pr-review-toolkit)

Every finding includes a criticality score:
- **9–10**: data loss / security vulnerability / breaking API contract
- **7–8**: correctness bug — wrong behavior, missing error handling
- **5–6**: performance issue / maintainability debt
- **3–4**: style inconsistency / minor improvement
- **1–2**: optional suggestion

### 6.5 Error-Handling Reviewer — "Hidden Error Types" Field (pr-review-toolkit)

When spawned (catch/async present in diff), error-handling reviewer must include
for every finding:

```
Finding: [description]
Hidden error types: [specific exception/error types that could be swallowed]
Scenario: [when this would silently fail]
```

"catch is too broad" is NOT sufficient — must name what's lost.

### 6.6 TypeScript Reviewer — 4-Dimension Scoring (pr-review-toolkit)

When spawned (type definitions in diff), score each new/modified type:

| Dimension | Score 1–10 | Question |
| ----------- | :----------: | --------- |
| Encapsulation | | Can internals change without breaking consumers? |
| Invariant Expression | | Does the type make invalid states unrepresentable? |
| Usefulness | | Does it add value over primitive types? |
| Enforcement | | Does TypeScript actually enforce the constraints? |

Overall type health = average of 4 dimensions. Scores below 5 in any dimension = finding.

### 6.7 Reviewer Scaling

| Mode | Reviewers | Debate |
| ------ | :---------: | :------: |
| Micro | 1 (general only) | ❌ |
| Quick | 2 (general + 1 conditional) | ❌ |
| Full | 3 (general + all applicable conditional) | ✅ |

---

## Section 7 — Phase 5.5: Simplify

**Sequencing rule (pr-review-toolkit):**
code-simplifier runs ONLY after Critical findings (score ≥7) = 0.
Rationale: fix correctness first, then improve clarity — never mix the two.

| Mode | Simplify |
| ------ | :--------: |
| Micro | Skip |
| Quick | Optional (user can request) |
| Full | Default when Critical = 0 |

code-simplifier does NOT change behavior — strictly clarity improvements:
naming, nesting reduction, redundant comment removal, dead code.

---

## Section 8 — Phase 6: Archive

### 8.1 Change Folder Structure (OpenSpec)

All artifacts for a task live together:

```
{artifacts_dir}/{date}-{task-slug}/
  research.md           (Phase 1 output)
  plan.md               (Phase 2 output)
  verify-results.md     (Phase 3.5 output — NEW)
  review-findings-1.md  (Phase 4 iteration 1)
  review-findings-2.md  (Phase 4 iteration 2, if any)
```

After ship: move entire folder to `archive/{date}-{task-slug}/`

Note: `plan.md` is currently written to `~/.claude/plans/` during Phase 2. For archiving, copy
it into the change folder at Phase 6. The source at `~/.claude/plans/` is not moved — it stays
for session reference. Implementation must handle this copy step explicitly.

### 8.2 Skill Evolution Protocol (claude-code-best-practice — suggest only)

After dlc-build completes, metrics-analyst runs **Full mode only** — Micro and Quick skip this
step. Micro runs are too lightweight to produce meaningful recurring-pattern data; Quick adds
minimal review data. Running metrics-analyst on every build would add cost that defeats
Micro's purpose.

Additional trigger condition: only run if `dlc-metrics.jsonl` has ≥5 entries (insufficient
history produces false positives in pattern detection).

When triggered:
1. Reads `review-findings-*.md` for this session
2. Checks `dlc-metrics.jsonl` for same pattern in last 5 sessions
3. If pattern recurs ≥3 times:
   - Creates `lens-update-suggestion.md` in `{artifacts_dir}`
   - Notifies user: "Recurring pattern found in [lens]. Suggestion saved to {path}."

**Never auto-applies lens changes — user reviews and approves first.**

---

## Section 9 — Infrastructure

### 9.1 Hook Upgrades (claude-code-best-practice)

**`subagent-stop-gate.sh` → `type: "agent"` hook**

Current: bash exit code check
New: multi-turn agent that inspects actual files before approving subagent completion

```json
{
  "event": "SubagentStop",
  "type": "agent",
  "prompt": "Review the subagent's output files in {artifacts_dir}.
             Check: (1) required files exist, (2) no placeholder content,
             (3) findings are evidence-based (file:line citations present).
             Return {ok: true/false, reason: '...'}",
  "matcher": "review-debate|dev-loop|respond"
}
```

**`stop-failure-log.sh` → add `additionalContext`**

Current: writes to log file, optionally sends macOS notification
New: also returns `additionalContext` with failure summary injected into Claude's conversation

```json
{
  "additionalContext": "Previous attempt failed: [failure type]\nLast error: [message]\nSuggested next step: [action]"
}
```

**New: `InstructionsLoaded` hook for hard-rules.md staleness**

```bash
# fires when CLAUDE.md or rules files load
# IMPLEMENTATION PREREQUISITE: verify the exact env var name before writing this hook.
# Check Claude Code hook documentation for InstructionsLoaded event variables.
# If the env var is named differently or the event doesn't expose the file path,
# the hook must degrade gracefully (exit 0, no output) rather than producing errors.
# Add a test invocation step in the implementation plan for this hook.
FILE="${CLAUDE_LOADED_PATH:-}"   # adjust var name after verification
if [[ -z "$FILE" ]]; then exit 0; fi   # graceful degrade if var not available
if [[ "$FILE" == *"hard-rules.md"* ]]; then
  DAYS=$(( ($(date +%s) - $(stat -f%m "$FILE" 2>/dev/null || echo 0)) / 86400 ))
  if [ "$DAYS" -gt 30 ]; then
    echo '{"additionalContext": "hard-rules.md last updated '"$DAYS"' days ago. Consider reviewing with /optimize-context."}'
  fi
fi
```

### 9.2 Skill Usage Tracking → dlc-metrics

PreToolUse hook on Skill tool → append to `dlc-metrics.jsonl`:

```json
{"ts": "2026-03-27T10:00:00Z", "skill": "dlc-build", "mode": "quick",
 "project": "tathep-platform-api", "score": 3}
```

Enables metrics-analyst to compute: mode distribution, score accuracy over time,
which skills are under-triggered.

### 9.3 Descoped (separate initiatives)

- **Cross-session Tasks system** — requires architectural change to parallel coordination
- **dlc-debug: knowledge base** — separate design for dlc-debug skill
- **dlc-debug: parallel debuggers per gap** — separate design for dlc-debug skill
- **`isolation: "worktree"` for reviewers** — needs behavioral testing before adoption

---

## Implementation Scope

Changes span:

| Component | Changes |
| ----------- | --------- |
| `skills/dlc-build/SKILL.md` | `!command` injections, mode tier table, Phase 3.5 reference |
| `skills/dlc-build/references/phase-0-*.md` | Blast-radius scoring, constitution check, downgrade warning, flag vs score precedence table |
| `skills/dlc-build/references/workflow-modes.md` | Add Micro mode definition (phases skipped, effort levels), blast-radius auto-score path, `--micro` flag |
| `skills/dlc-build/references/phase-1-*.md` | Lite/Deep tiers, delta markers, explorer pattern, GO/NO-GO |
| `skills/dlc-build/references/phase-2-*.md` | must_haves structure, [P] markers, TDD ordering, dual-lens |
| `skills/dlc-build/references/phase-3-*.md` | Rationalization blockers, `<files_to_read>`, continuation agent |
| `skills/dlc-build/references/phase-35-verify.md` | NEW FILE — Phase 3.5 full instructions |
| `skills/dlc-build/references/phase-gates.md` | Add `Phase 3.5 → Phase 2` entry; document Stage 1 → Phase 3 interaction with iteration counter |
| `skills/dlc-build/references/phase-0-*.md` | Update `dev-loop-context.md` schema: add `verify` as valid `phase:` value; add `tdd_violations[]` field; add Phase 3.5 checkbox to progress tracker |
| `skills/dlc-build/references/phase-4-*.md` | Two-stage, conditional dispatch, confidence floor, criticality |
| `skills/dlc-build/references/phase-55-simplify.md` | Sequencing rule |
| `skills/dlc-build/references/phase-6-*.md` | Change folder structure, evolution protocol |
| `agents/plan-challenger.md` | Dual-lens prompt (minimal + clean) |
| `agents/research-validator.md` | Token budget check, delta marker validation |
| `agents/metrics-analyst.md` | Lens update suggestion logic |
| `skills/dlc-build/references/review-lenses/error-handling.md` | Hidden error types mandatory field |
| `skills/dlc-build/references/reviewer-prompts.md` | Confidence floor ≥80, criticality scaling |
| `hooks/hooks.json` | SubagentStop type:agent, stop-failure-log additionalContext, InstructionsLoaded |
| `hooks/subagent-stop-gate.sh` | Migrate to type:agent |
| `hooks/stop-failure-log.sh` | Add additionalContext output |
| `hooks/instructions-loaded-staleness.sh` | NEW FILE |

---

## Research → Design Traceability

| Pattern | Source | Section |
| --------- | -------- | --------- |
| Blast-radius routing | BMAD | §1.3 |
| Scale-adaptive ceremony | BMAD | §1, ceremony tiers table |
| Spec token budget 900–1600 | BMAD | §2.3 |
| Three-state readiness | BMAD | §3.2 |
| Constitution check | SpecKit | §1.1 |
| [NEEDS CLARIFICATION] tokens | SpecKit | §2.3 |
| WHAT/WHY vs HOW separation | SpecKit | §2.1 Lite |
| [P] parallel markers | SpecKit | §3.2, §4.4 |
| TDD task ordering | SpecKit | §3.2 |
| Delta markers ADDED/MODIFIED/REMOVED | OpenSpec | §2.3 |
| Progressive rigor (Lite/Full) | OpenSpec | §2.1 |
| Change folder + date archive | OpenSpec | §8.1 |
| must_haves.truths | GSD | §3.1, §5 |
| key_links | GSD | §3.2, §5.1 |
| `<files_to_read>` pattern | GSD | §4.2 |
| Continuation agent | GSD | §4.3 |
| Goal-backward verification | GSD | §5 |
| Rationalization blockers | Superpowers | §4.1 |
| TDD hard delete rule | Superpowers | §4.1 |
| Persuasion-proof gates | Superpowers | §1.4 |
| Two-stage review (spec→code) | Superpowers | §6.1 |
| Dual-lens plan challenger | feature-dev | §3.3 |
| Confidence floor ≥80 | feature-dev + pr-review-toolkit | §6.3 |
| Agent returns references | feature-dev | §2.2 |
| Conditional reviewer dispatch | pr-review-toolkit | §6.2 |
| Criticality scaling 1–10 | pr-review-toolkit | §6.4 |
| Hidden error types field | pr-review-toolkit | §6.5 |
| 4-dimension type scoring | pr-review-toolkit | §6.6 |
| Simplifier sequencing rule | pr-review-toolkit | §7 |
| `!command` dynamic injection | claude-code-best-practice | §1.2 |
| Effort per subagent | claude-code-best-practice | §1.5 |
| Hook type:agent for gates | claude-code-best-practice | §9.1 |
| `additionalContext` in hooks | claude-code-best-practice | §9.1 |
| Skill usage tracking | claude-code-best-practice | §9.2 |
| GO/NO-GO verdict gate | RPI (claude-code-best-practice) | §2.4 |
| Maturity axes → mode design | Universal Triad analysis | §1 overall |
