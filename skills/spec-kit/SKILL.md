---
name: spec-kit
description: "Implements Spec-Driven Development (SDD) using spec-kit (github/spec-kit). Use when user mentions speckit, SDD, /speckit.* commands, 'write a spec', 'start a spec', 'spec this out', 'spec-first development', 'create a specification', or wants a structured planning-before-coding workflow for a new feature or service. Always trigger when the user wants formal requirements before implementation. Six-step workflow: constitution → specify → clarify → plan → tasks → implement."
argument-hint: "[feature-name]"
compatibility: "Requires specify CLI: npm install -g spec-kit"
model: opus
---

# spec-kit: Spec-Driven Development

SDD inverts the coding workflow: specifications are the primary artifact; code is their generated output. Never skip to `/speckit.plan` or `/speckit.implement` without completing earlier steps.

## Quick Reference: 6-Step Workflow

| Step | Command | Output |
| ------ | --------- | -------- |
| 1 | `/speckit.constitution` | `.specify/memory/constitution.md` |
| 2 | `/speckit.specify <what>` | `spec.md` + `checklists/requirements.md` + git branch |
| 3 | `/speckit.clarify` | Updates `spec.md` Clarifications |
| 4 | `/speckit.plan <tech stack>` | `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/` |
| 4.5 | *(plan validation)* | *(refined plan files)* |
| 5 | `/speckit.tasks` | `tasks.md` |
| 6 | `/speckit.implement` | Marked `[X]` tasks, working code |

**Optional quality gates** (run between steps 5 and 6):

- `/speckit.analyze` — read-only cross-artifact consistency check (CRITICAL/HIGH/MEDIUM/LOW, max 50 findings)
- `/speckit.checklist` — requirement quality checklists ("unit tests for English" — validates spec clarity, not system behavior)
- `/speckit.taskstoissues` — convert tasks to GitHub issues

## Project Bootstrap

```bash
# New project
specify init my-project --ai claude

# In current directory (for existing repos)
specify init . --ai claude
specify init --here --ai claude --ai-skills   # also install as agent skills

# Check environment
specify check
specify version
```

See [references/cli.md](references/cli.md) for full CLI reference including `specify extension` commands.

## Directory Layout (after init + full workflow)

```text
.specify/
  memory/constitution.md
  scripts/           # Helper scripts (check-prerequisites.sh, create-new-feature.sh, etc.)
  specs/001-feature-name/
    spec.md          # Step 2
    plan.md          # Step 4
    research.md      # Step 4
    data-model.md    # Step 4
    quickstart.md    # Step 4
    tasks.md         # Step 5
    contracts/       # Step 4 (api-spec.json, etc.)
    checklists/      # Step 2: requirements.md · Step 5b: domain files (/speckit.checklist, optional)
  templates/
    spec-template.md
    plan-template.md
    tasks-template.md
    CLAUDE-template.md
CLAUDE.md            # Agent instructions (varies by --ai flag)
```

## Common Mistakes to Avoid

See [references/common-mistakes.md](references/common-mistakes.md) for 12 common pitfalls (tech stack timing, clarification limits, plan validation, over-engineering, tools setup, and more).

## Intelligence Features

### 1. Detect Current Workflow Phase

When the user asks "where am I?", "what's next?", or seems unsure of their step, run the phase detection script from the project root:

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/detect-phase.sh
# Or with explicit feature: bash ${CLAUDE_SKILL_DIR}/scripts/detect-phase.sh 001-my-feature
```

Parse the JSON output: `current_step` tells you the phase, `next_action` is the recommended command, `missing_files` lists what's absent.

### 2. Spec Draft Assistant

When user says "help me write a spec", "create a spec for X", or "I want to build Y":

1. Do NOT immediately generate a spec
2. Check which of these are missing from their request: what it does, who uses it, why it matters, main flows, explicit out-of-scope
3. Ask only for what's missing (max 2-3 questions at a time)
4. Then draft the full `spec.md` using the format in [references/workflow.md](references/workflow.md)

**Note:** `/speckit.specify` validates the spec it generates and may ask up to **3 inline clarification questions** itself (for any [NEEDS CLARIFICATION] markers that remain after validation). This is distinct from `/speckit.clarify` — it happens within the same command invocation. After this, the spec is ready for `/speckit.clarify`.

See [references/spec-quality.md](references/spec-quality.md) for the draft process and anti-patterns.

### 3. Pre-Command Prerequisites

Before recommending any `/speckit.*` command, consult [references/prerequisites.md](references/prerequisites.md) and verify all conditions are met. If prerequisites are missing, explain what to do first.

### 4. Spec Quality Review

When user asks to "review my spec", "check the spec", or before recommending `/speckit.plan`:

Read `spec.md` and apply the quality criteria in [references/spec-quality.md](references/spec-quality.md). Report findings grouped by severity: CRITICAL → HIGH → MEDIUM → LOW.

### 5. Plan Validation (Step 4.5)

After `/speckit.plan` and before `/speckit.tasks`, prompt user to audit generated artifacts (sequence, over-engineering, tech research, constitution alignment). See [references/workflow.md](references/workflow.md) for the 4 audit prompts.

**Optional before implement:** Create a PR from the feature branch to main with a detailed description.

### 6. Review & Acceptance Checklist Validation

After `/speckit.clarify` (or `/speckit.specify`), validate spec against `checklists/requirements.md` before recommending `/speckit.plan`. See [references/workflow.md](references/workflow.md) for the validation prompt and checklist items. All must pass (or user explicitly accepts gaps) before proceeding.

---

## File Format Reference

See [references/workflow.md](references/workflow.md) for complete format specs for `spec.md`, `tasks.md`, and `plan.md`.
