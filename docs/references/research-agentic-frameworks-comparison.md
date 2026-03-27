# Agentic Coding Frameworks Comparison

> Source: [The Great Framework Showdown: Superpowers vs. BMAD vs. SpecKit vs. GSD](https://ai.plainenglish.io/the-great-framework-showdown-superpowers-vs-bmad-vs-speckit-vs-gsd-360983101c10)
> Author: Rick Hightower | Mar 17, 2026 | Article 2 of 5 in "Agentic Software Engineering" series

## Key Thesis

"The vibe coding era is over." 5 frameworks with 170,000+ combined GitHub stars are competing to define what replaces it. Each makes a different bet on how much structure AI agents need.

## Shared Triad (All frameworks)

All 5 frameworks implement the same 3 primitives, just with different terminology:

| Primitive | Purpose |
| ----------- | --------- |
| **Agents** | Bounded contexts of expertise with defined responsibilities |
| **Workflows** | Sequences connecting agents into pipelines |
| **Skills** | Reusable units of work with defined inputs/outputs |

---

## Framework Profiles

### 1. BMAD Method — Enterprise Team Simulator

40.2k stars | v6.0.4 | MIT

Simulates a full agile team with 12+ specialized AI personas (Analyst, Architect, Developer, Scrum Master). Docs are first-class artifacts — PRD, architecture sketches, user stories persist alongside code.

- **Party Mode**: multiple personas collaborate in a single session
- **Scale-adaptive intelligence**: adjusts ceremony based on project complexity
- Four-phase cycle: Analysis → Planning → Solutioning → Implementation

#### Trade-off: Comprehensiveness vs. Agility

| ✅ Use when | ❌ Avoid when |
| ------------ | -------------- |
| Enterprise software, audit trails | Solo dev, side projects |
| Compliance/regulatory requirements | Need to ship fast |
| Multi-team handoffs | Simple, well-understood changes |

---

### 2. SpecKit — Gated Specification Process

75.9k stars (highest) | v0.1.4 | MIT | from GitHub

Philosophy: "Specifications don't serve code; code serves specifications." Enforces strict sequential workflow with explicit checkpoints.

Gated phases:

1. `/speckit.constitution` — governing principles
2. `/speckit.specify` — requirements + user journeys
3. `/speckit.plan` — produces plan.md, research.md
4. `/speckit.tasks` — actionable task list
5. `/speckit.implement` — execute via connected agent

Supports 20+ AI tools (Claude Code, Copilot, Cursor, Gemini CLI, Windsurf).

#### Trade-off: Assumes over-specifying always beats under-specifying

| ✅ Use when | ❌ Avoid when |
| ------------ | -------------- |
| Greenfield, unclear requirements | Bug fixes, config changes |
| Can invest 1–3 hrs/feature upfront | Mature codebase, well-understood changes |

---

### 3. OpenSpec — Brownfield-First Alternative

29.5k stars | v1.2.0 | MIT

Designed for existing codebases. Uses **delta markers** (`ADDED`, `MODIFIED`, `REMOVED`) instead of rewriting full specs. Each change gets its own folder (`openspec/changes/<name>/`).

- ~250 lines output/change vs SpecKit's ~800
- `/opsx:ff` fast-forward command scaffolds all artifacts at once
- Supports 20+ AI tools

#### Trade-off: Specification depth vs. Velocity

| ✅ Use when | ❌ Avoid when |
| ------------ | -------------- |
| Brownfield, iterative maintenance | Greenfield needing full arch docs |
| 5+ changes/day to production systems | First system design |

---

### 4. GSD (Get "Stuff" Done) — Context Engineering Powerhouse

28.1k stars | Active dev | MIT

Solves **context rot** — quality degradation as context window fills:

- 0–30% utilization: peak quality
- 50%+: starts rushing, skipping details
- 70%+: hallucinations increase
- 80%+: may forget early requirements

**Solution: spawn fresh subagent contexts per task**, organized in dependency-ordered waves:

- Wave 1: independent tasks in parallel
- Wave 2: tasks depending on Wave 1 in parallel
- Wave 3: sequential

Agent fleet: 4 parallel researchers + planner + plan checker + wave executors + verifiers + debugger agents (uses hypothesis testing: "what must be TRUE for this to work?")

#### Trade-off: Token cost vs. Output quality

A 50-task feature: ~$5 in single session → ~$25–40 with GSD. Context isolation guarantees consistent quality across all tasks.

| ✅ Use when | ❌ Avoid when |
| ------------ | -------------- |
| Complex features, many components | Budget-constrained teams |
| Long development sessions | Simple, quick tasks |
| Quality must be consistent across 50+ tasks | |

---

### 5. Superpowers — The Discipline Enforcer

Growing stars | MIT

Closest to GSD but more rigid in TDD enforcement. Not a spec framework, not an enterprise simulator — it's a **discipline enforcement system**.

Three key differentiators:

1. **Interactive brainstorming as a hard gate** — no code until design is approved, no escape hatch (unlike GSD where planning can be skipped)
2. **TDD as iron law** — production code before failing test = code gets **deleted**, not adapted
3. **Persuasion-based guardrails** — blocks AI rationalizations ("this is too simple to test", "I'll write tests after") by naming and preemptively blocking them

Also: fresh subagent contexts (like GSD) + two-stage review per subagent (spec compliance + code quality).

#### Trade-off: Reliability vs. Velocity

A 10-minute raw Claude Code task → ~30 minutes through Superpowers pipeline.

| ✅ Use when | ❌ Avoid when |
| ------------ | -------------- |
| Production systems where bugs are expensive | Prototypes, throwaway code |
| Code quality is priority #1 | Need to move fast |
| Want highest reliability of any framework | |

---

## Decision Matrix

| Framework | Primary strength | Core trade-off |
| ----------- | ----------------- | ---------------- |
| **BMAD** | Traceability, audit trails | Comprehensiveness vs. Agility |
| **SpecKit** | Rigorous specification | Thoroughness vs. Ceremony cost (1–3h/feature) |
| **OpenSpec** | Lightweight brownfield changes | Velocity vs. Spec depth |
| **GSD** | Context isolation, parallel execution | Token cost vs. Quality consistency |
| **Superpowers** | TDD discipline, two-stage review | Reliability vs. Velocity |

> "In many categories, if another tool is best at something, GSD is always second best. If you have to pick one quickly, GSD is the one you should start with."

---

## Hybrid Combinations

Frameworks are composable — they share the same Agent/Workflow/Skill triad:

| Combination | When to use |
| ------------- | ------------ |
| **SpecKit + GSD** | Strongest spec layer + strongest execution; migrating SDD projects to GSD |
| **BMAD + Superpowers** | Enterprise traceability + TDD code quality guarantees |
| **OpenSpec + Superpowers** | Brownfield + testing discipline, lowest ceremony that still enforces TDD |

---

## Relevance to dev-loop

Superpowers' design directly mirrors several dev-loop patterns:

| Superpowers concept | dev-loop equivalent |
| -------------------- | --------------------- |
| Brainstorming as hard gate | `superpowers:brainstorming` skill |
| TDD iron law (delete-before-code) | `superpowers:test-driven-development` skill |
| Subagent dispatch + two-stage review | `dlc-build` Phase 3→4 (plan-challenger → reviewers) |
| Persuasion-based guardrails | Hard rules in `skills/dlc-build/references/` |
| Context isolation per subagent | Agent Teams in dlc-build/dlc-review |
