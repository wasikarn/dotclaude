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

## Shared Abstractions

### PhaseVerdict Schema

The three-state verdict (READY / NEEDS WORK / NOT READY) appears in three phases:
- §2.4 GO/NO-GO (Phase 1 research output)
- §3.2 Readiness Verdict (Phase 2 plan output)
- §5.2 Aggregate Verdict (Phase 3.5 verification output)

All three share the same schema and escalation contract. Defined once here:

```
PhaseVerdict:
  state: READY | NEEDS WORK | NOT READY
  evidence: [list of file:line citations, required for NEEDS WORK and NOT READY]
  escalation:
    READY: proceed automatically
    NEEDS WORK: present to user, wait for decision (proceed / address first)
    NOT READY: present blocking list, require explicit choice (a/b/c)
```

Implementation: each phase file references this schema by name — do not redefine inline.

### Mode Capability Matrix (single source of truth)

The per-phase behavior for each mode is defined ONCE in `workflow-modes.md`. All phase
files reference the matrix rather than redefining mode behavior inline. When a mode
changes, one file changes.

The full matrix is in `workflow-modes.md`. Summary for this spec:

| Phase | Micro | Quick | Full |
|-------|-------|-------|------|
| 0: Triage | Score → Micro auto | Score → confirm | Score → confirm |
| 1: Research | Skip | Lite (WHAT/WHY) | Deep (delta markers + GO/NO-GO) |
| 2: Plan | 1 truth, no gate | 2–3 truths, no gate | 3–5 truths, user gate |
| 2: Plan-challenger | Skip | Skip | Run (Full only) |
| 3: Implement | 1 worker wave | 1–2 waves | Multi-wave continuation |
| 3.5: Verify | Lightweight (1 truth, no loop) | Full (1 loop) | Full (1 loop) |
| 4: Review Stage 1 | Run | Run | Run |
| 4: Review Stage 2 | 1 reviewer | 2 reviewers | 3+ reviewers + debate |
| 5.5: Simplify | Skip | Optional | Default when Critical=0 |
| 6: metrics-analyst | Skip | Skip | Run (if ≥5 entries) |

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
| **Ambiguity** | Task description is underspecified or has unclear acceptance criteria. **Tie-break rule: if uncertain whether to score 0 or 1 → score 1.** Uncertainty about scope IS ambiguity. |

**Mode assignment:**
- Score 1–2 → **Micro** (isolated, zero blast radius)
- Score 3 → **Quick** (moderate, understood change)
- Score 4–5 → **Full** (cross-cutting, risky, or unclear)

Lead presents: "Task scored X/5 → suggesting [mode]. Proceed or override?"

### 1.2.5 Hotfix Mode — Unchanged by This Design

`--hotfix` mode bypasses Phase 0 triage entirely and is **not affected by this design**.
Hotfix has its own gate sequence defined in `references/modes/hotfix.md`:
- No blast-radius scoring
- No research phase
- No plan gate
- Direct to implementation on `main` branch with immediate review

The new Phase 0 blast-radius scoring, constitution check, and downgrade protection apply
to Micro/Quick/Full only. Hotfix is identified at Phase 0 entry by the `--hotfix` flag
and routed directly to the Hotfix mode file — it never enters the scoring path.

`workflow-modes.md` must preserve the Hotfix decision branch exactly as-is while
adding the new Micro mode and blast-radius auto-score path for the other modes.

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

**Explorer count:** spawn **one explorer** per research run unless research-validator flags
the file list as insufficient (fewer than 3 files for a non-trivial task). In that case,
spawn a second focused explorer for the gap area only. Never more than 2 explorers — the
lead reads files directly and does not benefit from parallel explorers flooding it with lists.

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

## Risks Found
<!-- REQUIRED: list ALL concerns before giving verdict, even minor ones.
     An empty Risks Found section is a valid output IF you can justify it.
     Format: - [concern] (file:line evidence)
     If you have no concerns, write: "None identified — [brief reason why]" -->
- [concern 1] (evidence)
- [concern 2] (evidence)

## GO/NO-GO Verdict
READY / NEEDS WORK / NOT READY
Reason: [based on Risks Found above — not independent opinion]
```

Rationale: The "Risks Found" block forces adversarial framing BEFORE verdict.
An LLM that lists 3 risks and then says READY must resolve that self-inconsistency.
READY requires "None identified" which demands explicit justification — harder to claim.

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
- [ ] [observable behavior]
      verify: [run test X | call endpoint Y | check output Z]  ← behavioral method only
      behavioral?: [yes — 1 sentence: what a user/caller observes, not what function runs]
- [ ] [observable behavior]
      verify: [run test X | call endpoint Y | check output Z]
      behavioral?: [yes — 1 sentence]

<!-- verify: must be a behavioral method. Prohibited: "read the code", "check the logic".
     Permitted: "run test", "call endpoint", "check output", "observe response".
     behavioral?: must confirm the truth describes external observable behavior, not
     internal implementation details (function calls, variable values, class structures). -->

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

**Output quota per lens (required):**
- Minimal-lens: MUST produce ≥2 findings (or explain why plan is already minimal)
- Clean-lens: MUST produce ≥1 finding (or explain why no pre-work is warranted)

Without quotas, one lens dominates in a single-agent context. The quota forces both lenses
to do real work. A finding manufactured to meet quota will be weak and the lead will reject
it — that is acceptable. The cost of a trivially weak finding is lower than zero coverage.

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

── TDD SEQUENCE REPORT ──
At the end of your task, report the SEQUENCE of your actions as evidence — not a
self-assessment. Self-assessment is unreliable; sequence evidence is checkable.

Required format in your <worker_completion> message:
  TDD_SEQUENCE:
    - first-test-write: [file:line] "[test description]"
    - first-test-run-FAIL: confirmed failing before impl (yes/no)
    - first-impl-write: [file:line]
    - test-run-PASS: [file:line]
  TDD_COMPLIANCE: FOLLOWED | VIOLATED
  If VIOLATED: what happened (implementation written before test — state specifically)
```

Lead reads `TDD_SEQUENCE` from each worker's completion message.
Lead infers compliance from the sequence order — not the label alone.
If VIOLATED or sequence is inconsistent:
- Log in `dev-loop-context.md` under `tdd_violations[]`
- Surface to user at Phase 6 summary (informational, not a blocker)

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

### 4.3 WorkerContext Schema (GSD continuation agent — Full mode multi-wave)

The worker contract is bidirectional. Both directions are defined here.

**Lead → Worker (spawn call):**
```
<worker_context>
  wave_number: N
  assigned_tasks: [task 3, task 4]    ← tasks for THIS worker only
  completed_tasks: [task 1 ✅, task 2 ✅]
  must_haves: [truth 1, truth 2]      ← full list — worker must not regress passing truths
  key_links: [A→B, C→D]
  files_to_read: [plan.md, research.md, src/...]
</worker_context>
```

**Worker → Lead (completion message, required fields):**
```
<worker_completion>
  assigned_tasks_status:
    - task 3: DONE / PARTIAL / BLOCKED
    - task 4: DONE / PARTIAL / BLOCKED
  files_modified: [src/auth.ts, tests/auth.test.ts]
  TDD_SEQUENCE: [first-test-write: line X | first-impl-write: line Y | test-run-pass: line Z]
  TDD_COMPLIANCE: FOLLOWED | VIOLATED
  blocker: [reason if BLOCKED, else null]
</worker_completion>
```

Lead reads `assigned_tasks_status` to update `completed_tasks[]` for Wave N+1.
PARTIAL or BLOCKED tasks are re-queued as new sequential tasks (no [P] marker).
A worker that terminates on error without emitting `<worker_completion>` is treated as
BLOCKED on all assigned tasks — lead does not assume completion.

Never resume a prior agent context — always fresh with injected WorkerContext.

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
  2. Method (preference order): run tests → call endpoint → check output → read code
     Note: "read code" is weakest — only use if no test exists yet. Always prefer
     executable verification (test run or endpoint call) over static inspection.
  3. Result: ✅ PASS with evidence | ❌ FAIL with specific reason

  4. TEST MEANINGFULNESS CHECK (when truth verified via test run):
     Read the test file. Does the test contain at least one behavioral assertion?
     - ✅ MEANINGFUL: has expect/assert on output/response/side-effect
     - ❌ SHALLOW: only checks mock call counts, or has no assertions at all
     A SHALLOW test that passes does NOT constitute a truth PASS — log as ❌ FAIL:
     "Test passes but only asserts mock calls / zero assertions — truth not verified"

For each key_link:
  1. Verify: the connection exists in the actual code (file:line)
  2. Verify: error case is handled at the link

Aggregate verdict:
  ALL PASS → proceed to Phase 4

  ANY FAIL (Quick/Full):
    → return to Phase 3 — TARGETED re-implementation only:
      Lead spawns workers for ONLY the tasks that cover the failed truths.
      Identify: which plan.md tasks are responsible for Truth N?
      Spawn one worker per failed truth's task group.
      Do NOT re-spawn workers for truths that already PASS — risk of regression.
      This targeted re-entry counts as 1 loop (max 1 Phase 3.5 loop allowed).
      The Phase 3.5 loop ALSO increments the global iteration_count (max 3 shared counter).
      Rationale: a Phase 3.5 failure is a Phase 3 failure — it must count against max-3.

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

**Redesign cycle global cap: max 1 redesign cycle.**
If STILL FAILING after the second full redesign cycle, present only options (a) and (c)
— (b) is no longer available. Unlimited redesign cycles are not permitted.

**Phase gates note:**
Implementation must add a `Phase 3.5 → Phase 2` entry to `phase-gates.md` with:
- Trigger: STILL FAILING after loop AND user picks option (b) AND redesign_count < 1
- Artifacts: verify-results.md preserved; research.md and plan.md marked for regeneration
- Iteration: shared iteration_count reset for new planning cycle; prior attempt archived
  with date suffix (e.g., `plan-attempt-1.md`, `research-attempt-1.md`)
- redesign_count: new field in `dev-loop-context.md`, incremented at each redesign entry
- If redesign_count ≥ 1 when user picks (b): offer (a) or (c) only — no second redesign

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
3. **Test file presence (TDD enforcement)**: for every new behavior in the diff, is there
   a corresponding test file change? A diff with only production code changes (no test file)
   fails Stage 1 immediately. Exception: Micro mode with no test framework in the project.
4. **Scope fidelity**: mode-dependent check:
   - Full: does diff match ADDED/MODIFIED/REMOVED from research.md? Any out-of-scope changes?
   - Quick: does diff stay within the files identified in research.md's Context section?
     (Quick has no ADDED/MODIFIED/REMOVED — use file-level scope instead)
   - Micro: skip scope fidelity check (no research.md exists for Micro)

**Gate:** Stage 1 FAIL → return to Phase 3 immediately
Do NOT proceed to Stage 2 — avoids wasting review capacity on non-compliant code.

**Mandatory path after Stage 1 FAIL:**
Phase 3 (fix) → **Phase 3.5 (verify again)** → Phase 4 Stage 1 (check again)
Phase 3.5 MUST run again before Phase 4 re-entry. Skipping Phase 3.5 after a
Stage 1 loop is not permitted — spec compliance cannot be assumed without re-verification.

**Iteration counter interaction:**
There is ONE shared `iteration_count` in `dev-loop-context.md` (max 3). Every time a
Phase 3 → Phase 3.5 cycle completes and something fails, that counts as 1 iteration:

| Event | Increments iteration_count? |
|-------|-----------------------------|
| Phase 3.5 ANY FAIL → loop back to Phase 3 | Yes — targeted re-entry |
| Phase 4 Stage 1 FAIL → loop back to Phase 3 | Yes |
| Phase 4 Critical finding → loop back to Phase 3 | Yes |

The Phase 3.5 max-1-loop is a *type-specific* cap: you may only do 1 Phase 3.5-triggered
re-entry. But it still counts against the shared max-3. Example worst case:
- Iteration 1: Phase 3.5 FAIL → targeted re-entry → Phase 3.5 PASS → Phase 4 Stage 1 FAIL
- Iteration 2: Stage 1 FAIL loop → Phase 3 → Phase 3.5 PASS → Phase 4 PASS
- Iteration 3: any remaining review loop

Lead increments `iteration_count` before returning to Phase 3.
If `iteration_count` reaches 3: present options to user instead of looping.

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
| `*.test.*` or `*.spec.*` present in diff | **test-quality-reviewer** (T1–T9 checks) |
| Always | general code-reviewer |

Skip inapplicable reviewers — reduce wasted tokens for PRs that don't touch those domains.

### 6.3 Confidence Floor ≥80 (feature-dev + pr-review-toolkit)

Before emitting any finding, every reviewer must complete a **structured evidence block**.
The block is the gate — invisible reasoning is insufficient because it cannot be checked.

Required format before each emitted finding:
```
Citation: [file:line — specific location of the problem]
Pre-existing: [yes — existed before this diff at commit HASH | no — introduced in this diff]
Assumption: [one sentence: what I am assuming about context that could be wrong]
Confidence: [C:NN]
```

Emit only if:
- Citation: can be filled with a specific file:line (not "somewhere in the file")
- Pre-existing: is "no" (pre-existing issues belong in a separate tech-debt report)
- Assumption: is low-risk or verifiable

The `[C:NN]` label is for reader triage. The structured block is the actual gate.
Filling in "pre-existing: no" when unsure is a violation — if commit history is unclear,
check `git log -p [file]` before claiming the issue is diff-introduced.

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
| Full | 3 (general + all applicable conditional) | ✅ (see `../../references/debate-protocol.md`) |

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

**All artifacts for a task live in a single folder from the start** — not written to
scattered locations then merged later. This eliminates the dual-path ambiguity where
`plan.md` lives at `~/.claude/plans/` while other artifacts live at `{artifacts_dir}`.

**New canonical path for ALL artifacts:**
```
{artifacts_dir}/{date}-{task-slug}/
  dev-loop-context.md   (Phase 0 — session state, iteration_count, redesign_count)
  research.md           (Phase 1 output)
  plan.md               (Phase 2 output — written HERE, not to ~/.claude/plans/)
  verify-results.md     (Phase 3.5 output — NEW)
  review-findings-1.md  (Phase 4 iteration 1)
  review-findings-2.md  (Phase 4 iteration 2, if any)
```

**Migration from `~/.claude/plans/`:**
Implementation must change Phase 2 to write `plan.md` directly to
`{artifacts_dir}/{date}-{task-slug}/plan.md` instead of `~/.claude/plans/`.
The `plan_file:` entry in `dev-loop-context.md` must point to the new path.
`~/.claude/plans/` is no longer used by dlc-build for new runs.

All downstream consumers (Phase 3.5 truth reads, Phase 4 Stage 1 spec compliance reads,
Phase 6 archive) must reference `plan.md` from `{artifacts_dir}` — one consistent path.

After ship: move entire folder to `archive/{date}-{task-slug}/`

Redesign cycle: prior attempt artifacts renamed with suffix before regeneration:
`plan.md → plan-attempt-1.md`, `research.md → research-attempt-1.md`

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

**⚠️ IMPLEMENTATION PREREQUISITE — Verify before building:**
The following three hook features are drawn from research but have NOT been confirmed
against actual Claude Code hook documentation. The current `hooks/hooks.json` contains
only `type: "command"` entries. Before implementing any of the three items below, the
implementer MUST verify:
1. Does `type: "agent"` exist as a hook type in Claude Code?
2. Does `additionalContext` work as a hook stdout output that Claude reads?
3. Does the `InstructionsLoaded` event exist and expose file-path env vars?

If unverified: keep the existing bash implementations as primary. The items below are
**aspirational upgrades** — do not replace working bash gates with unverified mechanisms.

---

**`subagent-stop-gate.sh` — current bash gate (keep as primary)**

Current bash implementation works and must remain functional. If `type: "agent"` is
confirmed to exist, the gate may be upgraded to a multi-turn agent:

```json
{
  "SubagentStop": [{
    "type": "agent",
    "prompt": "Review the subagent's output files in {artifacts_dir}.
               Check: (1) required files exist, (2) no placeholder content,
               (3) findings are evidence-based (file:line citations present).
               Return {ok: true/false, reason: '...'}",
    "matcher": "review-debate|dev-loop|respond"
  }]
}
```

Note: The hook JSON structure above uses the existing schema (event as top-level key,
array value) — not an inline `"event"` field. Verify against hooks.json schema before use.

**`stop-failure-log.sh` — `additionalContext` (verify before implementing)**

If `additionalContext` is confirmed as a valid hook output field:

```bash
# Use jq for safe JSON construction (never shell string concat for JSON)
jq -n \
  --arg type "$FAILURE_TYPE" \
  --arg msg "$LAST_ERROR" \
  '{additionalContext: ("Previous attempt failed: " + $type + "\nLast error: " + $msg)}'
```

Until confirmed: keep existing file-logging + macOS notification behavior unchanged.

**`InstructionsLoaded` hook (DEFERRED — event existence unconfirmed)**

The hard-rules.md staleness warning concept is sound but requires:
1. Confirm `InstructionsLoaded` event fires in Claude Code
2. Confirm what env vars it exposes (file path)
3. Fix macOS-only `stat -f%m` → use portable: `python3 -c "import os,sys; print(int(os.path.getmtime(sys.argv[1])))" "$FILE"` or detect OS

Implement only after all three are confirmed. Degrade gracefully to no-op if unconfirmed.

### 9.2 Skill Usage Tracking → dlc-metrics

**Mechanism: lead writes directly at Phase 0 completion** — NOT via PreToolUse hook.

The PreToolUse hook fires before the skill executes; `mode` and `score` are not yet
known at that point (they are computed during Phase 0 blast-radius scoring). The hook
cannot capture these runtime values.

Instead: dlc-build lead appends to `dlc-metrics.jsonl` after Phase 0 completes and mode
is confirmed:

```json
{"ts": "2026-03-27T10:00:00Z", "skill": "dlc-build", "mode": "quick",
 "project": "tathep-platform-api", "score": 3}
```

The existing `skill-usage-tracker.sh` PreToolUse hook continues to log basic invocations
(`TIMESTAMP\tSKILL_NAME`) — that log is unchanged. The `dlc-metrics.jsonl` is a separate,
richer log written by the lead agent, not the hook.

Enables metrics-analyst to compute: mode distribution, score accuracy over time,
blast-radius calibration (predicted mode vs user-confirmed mode).

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
| `skills/dlc-build/references/phase-0-*.md` | Lead writes `dlc-metrics.jsonl` entry after Phase 0 mode confirmation |
| `hooks/hooks.json` | Aspirational: upgrade SubagentStop + add InstructionsLoaded — **only after event verification** |
| `hooks/subagent-stop-gate.sh` | Keep bash gate as primary; migrate to type:agent only if confirmed to exist in Claude Code |
| `hooks/stop-failure-log.sh` | Add additionalContext output only if confirmed; use `jq` not shell string concat |
| `hooks/instructions-loaded-staleness.sh` | NEW FILE — implement only after InstructionsLoaded event confirmed + portability fix |

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
