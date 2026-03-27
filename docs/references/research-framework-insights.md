# Framework Insights & Concept Ideas

> Distilled from direct GitHub repo analysis of BMAD, SpecKit, OpenSpec, GSD, Superpowers, feature-dev, pr-review-toolkit, and claude-code-best-practice.
> Source comparison article: [`research-agentic-frameworks-comparison.md`](research-agentic-frameworks-comparison.md)

---

## BMAD — "Blast Radius Routing"

**Core insight:** ไม่ใช่ complexity scoring — แต่เป็น **binary blast radius check** ที่ intake:

> "ถ้า task นี้ผิดพลาด จะกระทบอะไรอื่นนอกจากตัวมันเองไหม?"

- Zero blast radius → One-shot (ไม่มี plan, ไม่มี review)
- Any blast radius → Full cycle

**Implementation patterns:**

| Pattern | Detail |
| --------- | -------- |
| **Blast-radius routing** | Binary check at intake: isolated vs. has side effects |
| **Spec token budget** | 900–1600 tokens target for specs — ต่ำกว่า = ambiguous, สูงกว่า = context rot downstream |
| **Three-state readiness verdict** | `READY / NEEDS WORK / NOT READY` แทน binary pass/fail |
| **Optional phases** | Analysis phase explicitly optional; small work jumps to Quick Flow |
| **Micro-file step architecture** | Each step is one markdown file; only current step loads — prevents context pollution |
| **User skill level injection** | `beginner/intermediate/expert` config var propagated to every agent |
| **`stepsCompleted` frontmatter tracking** | Workflow state persisted in file frontmatter, not memory — survives context compaction |

**Concept ideas สำหรับ dev-loop:**

- แทนที่จะให้ user เลือก `--quick`/`--full` → ถามคำถามเดียว: "scope ของ change นี้ชัดเจนและ isolated ไหม?"
- ใช้ spec token budget เป็น proxy สำหรับ research.md quality check
- เปลี่ยน plan approval จาก binary เป็น three-state verdict

---

## SpecKit — "Constitution as North Star"

**Core insight:** ทุก gate check อ้างอิง **constitution.md** — ไฟล์ที่ declare project-level non-negotiables ก่อนทุก phase เริ่ม

**`[NEEDS CLARIFICATION]` token concept:**

> Ambiguity มี syntax ของตัวเอง — เขียนลงใน spec โดยตรง, validate ด้วย script, cap ไว้ที่ 3 questions per phase

**WHAT/WHY vs HOW separation:**

> spec phase ห้าม HOW content เด็ดขาด — tech stack, framework, API names ไม่มีใน spec. HOW เข้าได้แค่ที่ plan phase เท่านั้น

**Implementation patterns:**

| Pattern | Detail |
| --------- | -------- |
| **Constitution file** | `.specify/memory/constitution.md` — loaded by every phase; plan has explicit constitution check section |
| **Script-as-truth-source** | Shell script outputs JSON with all paths; agent never hardcodes paths |
| **Frontmatter-declared handoffs** | Command files declare valid successors in YAML — creates navigable DAG |
| **Checklist files as phase gates** | Written at spec time, re-read at implement time; counts `- [ ]` vs `- [x]` |
| **`[NEEDS CLARIFICATION]` tokens** | Named token in spec template; validate step scans for it; max 3 per phase |
| **`[P]` parallel markers** | Text-native tag in tasks.md for parallel-safe tasks — agent-readable, no orchestration logic needed |
| **WHAT/WHY vs HOW separation** | Spec phase = behavior contracts only; HOW enters only at plan phase |
| **Extension/Preset override priority** | 4-tier precedence: project overrides > preset > extension > core |
| **TDD sequencing in task structure** | Test tasks structurally precede implementation tasks in tasks.md |

**Concept ideas สำหรับ dev-loop:**

- dev-loop มี `hard-rules.md` per project อยู่แล้ว → เพิ่ม **constitution check** เป็น step แรกของ Phase 0
- ใช้ `[NEEDS CLARIFICATION: question]` token ใน research.md แทนการถาม free-form
- เพิ่ม `[P]` markers ใน plan tasks สำหรับ worker wave assignment

---

## OpenSpec — "Change as Self-Contained Folder"

**Core insight:** spec ไม่ใช่ document เดียวที่ grow ตลอด — แต่เป็น **folder per change** ที่มีทุกอย่างในตัวเอง พอเสร็จก็ archive

**Delta marker mechanics:**

```markdown
## ADDED Requirements
### Requirement: Two-Factor Authentication

## MODIFIED Requirements
### Requirement: Session Expiration
The system MUST expire sessions after 15 minutes of inactivity.
(Previously: 30 minutes)

## REMOVED Requirements
### Requirement: Remember Me
(Deprecated in favor of 2FA.)
```

Parser merges surgical — 2 changes สามารถ touch ไฟล์เดียวกันได้ถ้า modify คนละ requirement

**Progressive rigor rule:**

> Lite spec = default. Full spec = opt-in เมื่อ cross-team, API contract change, migration, security/privacy concern เท่านั้น

**Implementation patterns:**

| Pattern | Detail |
| --------- | -------- |
| **Change-as-folder** | `changes/<name>/` มี proposal.md, specs/, design.md, tasks.md ทั้งหมดด้วยกัน |
| **Delta markers** | `## ADDED/MODIFIED/REMOVED` sections — surgical merge, conflict-safe |
| **Archive with date prefix** | Completed changes → `archive/2025-01-24-<name>/` — chronological, full context preserved |
| **Progressive rigor** | Lite (default) vs Full (opt-in) — explicit criteria for escalation |
| **`/opsx:ff` fast-forward** | Generates all planning artifacts in dependency order at once |
| **Artifact DAG** | proposal → specs/design → tasks — dependency graph enables ff or continue modes |
| **Quick test for spec purity** | "If implementation can change without changing externally visible behavior, it doesn't belong in the spec" |

**Concept ideas สำหรับ dev-loop:**

- **dlc-build output เป็น change folder** — `{artifacts_dir}/{date}-{task-slug}/` archive หลัง ship
- research.md ควรมี **ADDED/MODIFIED/REMOVED sections** บอกว่าอะไร net-new vs existing pattern
- **Lite research mode** สำหรับ Quick mode — behavior contracts เท่านั้น ไม่มี implementation detail

---

## GSD — "Goal-Backward Verification"

**Core insight:**

> แทนที่จะถาม "task ครบไหม?" → ถาม "อะไรต้องเป็น TRUE จาก user perspective เพื่อให้ goal นี้ถือว่าสำเร็จ?"

**Must-haves structure ใน PLAN.md frontmatter:**

```yaml
must_haves:
  truths:
    - "User can see existing messages"   # Observable from browser/CLI
    - "Messages persist on refresh"
  artifacts:
    - path: "src/components/Chat.tsx"
      provides: "Message list rendering"
  key_links:
    - from: "Chat.tsx"
      to: "/api/chat"
      via: "fetch in useEffect"
      # "Where is this most likely to break?"
```

**Hypothesis-based debug — 5 phases:**

| Phase | What happens |
| ------- | ------------- |
| 0 — Knowledge Base | Check past solutions by keyword |
| 1 — Evidence Gathering | Read files, run tests, APPEND to Evidence |
| 2 — Form Hypothesis | Must be SPECIFIC + FALSIFIABLE: "What would prove me wrong?" Generate 3+ before investigating any |
| 3 — Test Hypothesis | ONE test at a time, record result |
| 4 — Evaluate | CONFIRMED → fix; ELIMINATED → append, form new hypothesis, back to Phase 2 |

**Falsifiability requirement:**

```text
Bad: "Something is wrong with the state"
Good: "User state is reset because component remounts when route changes"
```

**Implementation patterns:**

| Pattern | Detail |
| --------- | -------- |
| **Goal-backward must_haves** | Truths derived from user perspective, stored in plan frontmatter, checked by verifier |
| **Key links** | "Where is this most likely to break?" — critical connections identified at planning time |
| **Wave assignment via file ownership** | `creates`/`needs` per task → dependency graph → wave number = `max(dep waves) + 1` |
| **`<files_to_read>` in subagent prompts** | Pass paths only, not content — subagents read fresh; keeps orchestrator at 10–15% context |
| **Continuation agent (not resume)** | Fresh agent with explicit state injected — more reliable than resume for parallel contexts |
| **Debug file as persistent brain** | Append-only log structure survives `/clear`; Current Focus section overwritten before every action |
| **Debug knowledge base** | `.planning/debug/knowledge-base.md` — keyword-indexed cross-session pattern memory |
| **Parallel debuggers per gap** | One `gsd-debugger` per UAT gap spawned simultaneously — diagnose only, no fixing |
| **`/clear` between phases** | Recommended explicitly; orchestrator context stays minimal throughout |

**Concept ideas สำหรับ dev-loop:**

- เพิ่ม **assertions block** หลัง plan approval: 3–5 truths ที่ต้อง TRUE → verifier check ก่อน Phase 4
- **Debug knowledge base** ใน dlc-debug — บันทึก root cause patterns ข้าม session
- **File ownership wave assignment** — orchestrator วิเคราะห์ dependency แทนการ assign wave manual
- **Continuation agent pattern** สำหรับ dlc-respond และ multi-session work

---

## Superpowers — "Persuasion-Proof Gates"

**Core insight:**

> Gates ต้อง stress-test ต่อ social engineering — ถ้า user บอก "urgency" หรือ "this is too simple" → gate ยิ่งต้องถือ ไม่ใช่ยิ่งอ่อน

**Named rationalization blockers (built into prompts):**

- "this is too simple to test"
- "I'll write tests after"
- "let me just fix this quickly"
- urgency simulation

**Hard delete rule:**

> Production code ที่เขียนก่อน failing test → **delete ทิ้ง ไม่ใช่ refactor** — strongest TDD enforcement ของทุก framework

**Implementation patterns:**

| Pattern | Detail |
| --------- | -------- |
| **Rationalization blockers** | Named excuses listed in prompt — preemptively blocked, not caught after |
| **Persuasion-based guardrails** | Creator deliberately tries to social-engineer the agent to skip steps |
| **Hard delete rule** | Pre-test code = delete, not adapt — no "I'll add tests to existing code" |
| **Two-stage subagent review** | Spec compliance check BEFORE code quality — sequential, not parallel |
| **Interactive brainstorming as hard gate** | No escape hatch for "too simple" — even 3-line changes go through design |

**Concept ideas สำหรับ dev-loop:**

- เมื่อ auto-score = Full แต่ user force `--quick` → warn พร้อม explicit blast radius list
- เปลี่ยน Phase 4 reviewers จาก all-parallel → **spec compliance first, then code quality** (sequential two-stage)
- เพิ่ม rationalization blockers ใน worker prompt: block "this is straightforward, skipping tests"

---

## feature-dev (Anthropic) — "Competing Architects, Decisive Agents"

**Core insight:** Diversity of perspectives เกิดที่ **orchestration layer** ไม่ใช่ agent layer — แต่ละ agent ภายในถูกสั่งให้ decisive ("make confident choices, don't present multiple options") แต่ orchestrator spawn 3 agents ที่มี lens ต่างกัน จึงได้ options โดยไม่มี agent ไหน hedge

**Confidence-gated review:**

> Reviewer ใช้ 0–100 scale มี hard floor ที่ ≥80 ก่อน emit finding — 0–25 = "likely false positive"

**Agent-returns-references pattern:**

> Explorer agents return file list (5–10 files) → orchestrator reads files เอง — ไม่ให้ agent dump content กลับมา ช่วยรักษา orchestrator context

**Implementation patterns:**

| Pattern | Detail |
| --------- | -------- |
| **Competing architect agents** | 3 agents พร้อมกัน: minimal / clean / pragmatic — แต่ละตัว decisive ภายใน |
| **Confidence scoring (0–100, floor ≥80)** | Hard cutoff ก่อน emit; <25 = likely false positive — กรอง noise ก่อนถึง user |
| **Agent returns references, not content** | Explorer returns file paths; orchestrator reads — ป้องกัน context flood |
| **Phase 3 non-skippable guard** | "CRITICAL: DO NOT SKIP" — explicit instruction ใน SKILL.md ป้องกัน AI ข้ามขั้นตอน |
| **"Whatever you think is best" handler** | ถ้า user punt → ให้ recommendation แล้ว require explicit confirmation ก่อนไปต่อ |
| **Conditional dispatch by diff type** | Check `git diff --name-only` → skip inapplicable agents |
| **Scope guard in README** | "Don't use for" list: single-line fixes, trivial changes, urgent hotfixes |
| **$ARGUMENTS pre-seeding** | Feature description flows directly into Phase 1 context |

**Concept ideas สำหรับ dev-loop:**

- **Competing architect pattern** → ใน Full mode ให้ plan-challenger เป็น 2 agents: minimal-lens vs. clean-lens แทน single adversarial probe
- **Confidence floor ≥80** → เพิ่มใน code-reviewer agent: ถ้า confidence <80 ไม่ emit — ลด false positive noise ใน Phase 4
- **Agent-returns-references** → explorers Phase 1 ส่งกลับมาเป็น file list → lead reads เอง แทนที่จะ dump content ใน subagent message
- **Scope guard** → เพิ่ม "don't use /dlc-build for" examples ใน SKILL.md description

---

## pr-review-toolkit (Anthropic) — "Specialist Isolation + Conditional Dispatch"

**Core insight:** No consolidator, no debate, no inter-agent communication — **flat coordination**: orchestrator dispatches specialist agents, แต่ละตัวมี charter แคบมากและไม่ overlap, orchestrator รวม output เอง

**Conditional dispatch:**

> Check diff file types ก่อน → skip inapplicable agents — ไม่ run type-design-analyzer ถ้า diff ไม่มี type definitions

**Silent-failure-hunter "hidden error types" field:**

> ไม่พอแค่บอกว่า "catch too broad" — ต้องระบุว่า exception type ไหนที่อาจถูก swallow และ scenario ไหน

**Implementation patterns:**

| Pattern | Detail |
| --------- | -------- |
| **Conditional agent dispatch** | Diff content check → run only applicable agents (types, tests, errors, comments) |
| **Confidence gate ≥80** | code-reviewer: hard cutoff ก่อน emit; 0–25 = likely false positive |
| **Criticality scaling (1–10)** | pr-test-analyzer: 9–10 = data loss/security; 1–2 = optional — reader triage โดยไม่ต้องอ่านทุกข้อ |
| **4-dimension type scoring** | Encapsulation / Invariant Expression / Usefulness / Enforcement ต่างกัน 1–10 — pinpoints weak dimension |
| **"Hidden error types" mandatory field** | silent-failure-hunter: ต้องระบุ exception types ที่อาจ swallowed — actionable กว่า "catch too broad" |
| **Adversarial comment posture** | comment-analyzer: assumes comments are wrong until proven accurate |
| **code-simplifier sequencing** | Runs *after* review passes — fix correctness first, improve clarity second |
| **Model assignment** | code-reviewer + code-simplifier = opus; others = inherit — high-judgment tasks get strongest model |
| **Advisory-only constraint** | comment-analyzer: "analyze only, do not modify" — explicit write-access restriction |
| **Behavioral test framing** | "Would this test fail when behavior changes unexpectedly?" — single evaluative question |

**Concept ideas สำหรับ dev-loop:**

- **Conditional reviewer dispatch** → dlc-review ปัจจุบัน run ทุก reviewer เสมอ — เพิ่ม diff-content check: skip migration-reviewer ถ้าไม่มี migration files, skip api-contract-auditor ถ้าไม่มี route/controller changes
- **"Hidden error types" field** → เพิ่มใน error-handling lens ใน `skills/dlc-build/references/review-lenses/error-handling.md`
- **code-simplifier sequencing rule** → document ว่า code-simplifier ใน dev-loop run หลัง Critical findings = 0 เท่านั้น
- **4-dimension type scoring** → เพิ่มใน TypeScript lens สำหรับ type-heavy PRs
- **Behavioral test framing** → เพิ่มเป็น primary question ใน test-quality-reviewer agent

---

## Concept Map สำหรับ dev-loop improvements

```text
Phase 0 (Triage)
├── Constitution check (SpecKit) — hard-rules.md loaded?
├── Blast radius routing (BMAD) — zero/non-zero?
└── Auto-score → suggest mode → user confirms (Hybrid)

Phase 1 (Research)
├── Lite mode: WHAT/WHY only, no HOW (SpecKit)
├── Delta sections: ADDED/MODIFIED/REMOVED (OpenSpec)
├── [NEEDS CLARIFICATION] tokens, max 3 (SpecKit)
└── Token budget target: 900–1600 (BMAD)

Phase 2 (Plan)
├── must_haves truths block (GSD) ← NEW
├── [P] parallel task markers (SpecKit)
└── Three-state readiness: READY/NEEDS WORK/NOT READY (BMAD)

Phase 3 (Implement)
└── Rationalization blockers in worker prompt (Superpowers)

Phase 3.5 (Verify) ← NEW PHASE
├── Assert must_haves.truths ทีละข้อ (GSD)
└── Pass → Phase 4 | Fail → loop Phase 3

Phase 4 (Review)
├── Conditional dispatch — skip inapplicable reviewers (pr-review-toolkit)
├── Confidence floor ≥80 before emit (feature-dev / pr-review-toolkit)
├── Spec compliance first, then code quality (Superpowers two-stage)
└── Scale reviewers: Micro=1, Quick=2, Full=3

Phase 5 (Simplify) — only when Critical=0
└── code-simplifier after passing review, not before (pr-review-toolkit)

Phase 6 (Archive)
└── Change folder with date prefix (OpenSpec)
```

---

## claude-code-best-practice (shanraisshan) — "Living Knowledge Base + Claude Code Internals"

**Core insight:** ไม่ใช่ framework — แต่เป็น **meta-reference** ที่ document Claude Code internals อย่างละเอียดจาก Boris Cherny (creator) พร้อมโชว์ patterns ที่ใช้จริงใน production — repo อัปเดตตัวเองด้วย Claude agents

**Philosophy:** "Practice makes Claude perfect" — ไม่มี one correct setup; ทดลองและวัดผล

---

### Command → Agent → Skill Hierarchy

Pattern สามชั้นที่ชัดเจนที่สุดในทุก repos ที่อ่านมา:

```text
User types /command
  → Command (entry point, user-initiated, inline context)
      → invokes Agent via Task tool (separate fresh context, autonomous)
          → Agent uses preloaded Skill (full content injected at startup)
      → invokes Skill via Skill tool (inline, same context)
```

**Resolution priority:** Skill (inline) → Agent (separate context) → Command (never auto-invokes)

**สองโหมดของ skill deployment:**

- **Preloaded via `skills:` frontmatter** — full content injected into agent context at startup (ไม่ใช่แค่ made available)
- **Invokable at runtime via `Skill(skill: "name")`** — loads on demand

---

### Implementation Patterns

#### Agent Frontmatter — Fields ที่ไม่ค่อยถูก document

| Field | Detail |
| ------- | -------- |
| `isolation: "worktree"` | รัน agent ใน temp git worktree — auto-cleaned ถ้าไม่มี changes |
| `initialPrompt` | Auto-submitted เป็น first user turn เมื่อ agent เป็น main session (`--agent` flag) |
| `color` | CLI output color (`green`, `magenta`) — functional แต่ไม่อยู่ใน official table |
| `effort: "low\|medium\|high\|max"` | Per-agent effort override แยกจาก session default |
| `background: true` | Always run as background task |
| `memory: "user\|project\|local"` | Persistent cross-session memory (v2.1.33+) |
| `skills` | Full content injected at startup — ไม่ใช่แค่ made available |

#### Agent Memory — 3 scopes (v2.1.33+)

| Scope | Path | ลักษณะ |
| ------- | ------ | -------- |
| `user` | `~/.claude/agent-memory/<name>/MEMORY.md` | Cross-project, ไม่ share ระหว่าง agents |
| `project` | `.claude/agent-memory/<name>/MEMORY.md` | Version-controlled, team-shared |
| `local` | `.claude/agent-memory-local/<name>/MEMORY.md` | Project-scoped, git-ignored |

First 200 lines inject เข้า system prompt — เกิน 200 บรรทัด agent จัดเป็น topic files

**Critical distinction:**

- CLAUDE.md: manually written, readable by main + all agents
- Auto-memory: self-written by main Claude, readable only by main Claude
- Agent memory: written and readable by only that specific agent

#### Self-Evolving Agent Pattern

`presentation-curator` agent มี **Self-Evolution Protocol**: หลังทุก execution ต้องอัปเดต skill files ของตัวเอง — ป้องกัน knowledge degradation เมื่อ underlying content เปลี่ยน

**Governance pattern:** agent owns a file + เป็น sole authorized editor — consistency enforced via preloaded skills

#### Hook System — Non-Obvious Details

| Hook feature | Detail |
| ------------- | -------- |
| `type: "prompt"` | Sends prompt to Claude for judgment → returns `{"ok": bool, "reason": "..."}` — สำหรับ decisions ที่ต้องการ judgment ไม่ใช่ deterministic rules |
| `type: "agent"` | Spawns multi-turn subagent สำหรับ file inspection — ดีกว่า bash สำหรับ complex verification |
| `type: "http"` (v2.1.63) | POSTs JSON to URL; env var interpolation in headers |
| `UserPromptSubmit` | สามารถ **modify** prompt ก่อน submit — returns modified prompt via stdout JSON |
| `additionalContext` output field | Injects text into Claude's conversation from any hook — ส่ง dynamic context กลับโดยไม่ต้องให้ user ทำอะไร |
| `autoAllow: true` in PreToolUse | Auto-approves future uses of same tool ใน session |
| `once: true` | Hook fires only once per session — **สำหรับ skills เท่านั้น** ไม่ใช่ agents |
| Hook in agent frontmatter | `SubagentStop` ไม่ใช่ `Stop` — documented quirk |
| Config split | `hooks-config.json` (team, committed) + `hooks-config.local.json` (personal, ignored) |

#### Tasks System vs TodoWrite (v2.1.16+)

| Feature | TodoWrite (เก่า) | Tasks (ใหม่) |
| --------- | ----------------- | ------------- |
| Scope | Single session | Cross-session, cross-agent |
| Dependencies | ไม่มี | Full dependency graph with blocking |
| Storage | In-memory | `~/.claude/tasks/` (filesystem) |
| Persistence | หายตอน session จบ | Survives restarts |
| Multi-session | ไม่ได้ | via `CLAUDE_CODE_TASK_LIST_ID` env var |

Multiple sessions share tasks: `CLAUDE_CODE_TASK_LIST_ID=my-project tasks claude`

#### RPI Workflow Pattern

Feature folders ที่ `rpi/{feature-slug}/` + REQUEST.md:

- `/rpi:research` — 6 agents (product managers + technical advisors) → **GO/NO-GO verdict**
- `/rpi:plan` — 4 agents (engineering, product, UX, docs) → pm.md + ux.md + eng.md + PLAN.md
- `/rpi:implement` — 3 agents (execution + code review) → IMPLEMENT.md

**GO/NO-GO gate** ระหว่าง research และ plan — ป้องกัน implement งานที่ไม่ feasible

#### Advanced Tool Use Patterns (API-level)

| Pattern | Benefit |
| --------- | --------- |
| **Programmatic Tool Calling (PTC)** | Claude writes Python to orchestrate tools in sandbox — ~37% token reduction |
| **Dynamic Filtering for Web Search** | Filters irrelevant HTML before entering context — saves ~24% tokens, +13–16% accuracy |
| **Tool Search Tool** | Defers loading rarely-used tools — ~85% token reduction in tool definitions |
| **Tool Use Examples** | Concrete usage patterns in tool definitions — improves accuracy 72% → 90% |

#### CLAUDE.md Best Practices

- Target under 200 lines per file; split large instructions ไปที่ `.claude/rules/`
- Wrap domain rules ใน `<important if="...">` tags — ป้องกัน Claude ignore เมื่อไฟล์ยาว
- `settings.json` for harness-enforced behavior — ไม่ใส่ใน CLAUDE.md สิ่งที่ settings ทำได้
- Litmus test: developer ใหม่ open Claude → say "run the tests" → works first try

#### Surprising / Non-Obvious Findings

| Finding | Detail |
| --------- | -------- |
| **`/fast` always bills Extra Usage** | ไม่ count against subscription limits — ต้องมี Extra Usage funded ก่อน |
| **Skill descriptions cost tokens ทุก session** | Injected at startup ไม่ว่าจะถูก invoke ไหม — monitor ด้วย `/context` |
| **Task(…) = Agent(…)** | Renamed in v2.1.63; old name still works |
| **Subagents ไม่สามารถ invoke subagents via bash** | ต้องใช้ Agent tool เท่านั้น |
| **Agentic search beats RAG for code** | Boris ทดลองและ discard vector databases — code drifts out of sync |
| **p50 PR size: 118 lines** | Boris ran 141 PRs ใน 1 วัน (45K lines); heavily right-skewed distribution |
| **6 hooks fire ใน agent frontmatter** | PreToolUse, PostToolUse, PermissionRequest, PostToolUseFailure, Stop, SubagentStop |
| **LLM degradation คือ infra bugs** | ±8–14% quality swing จาก MoE routing variance — ไม่ใช่ intentional nerfing |

---

### Concept Ideas สำหรับ dev-loop

| Idea | Detail |
| ------ | -------- |
| **Skill self-evolution protocol** | dlc-build lenses + code-reviewer memory ควรมี post-execution step อัปเดต reference files ตัวเอง (เหมือน presentation-curator) |
| **`!command` dynamic injection ใน SKILL.md** | Inject live state ณ เวลา invoke: `` !`git log --oneline -3` `` หรือ `` !`jira sprint status` `` เพื่อให้ skill เห็น context ล่าสุดโดยอัตโนมัติ |
| **Hook `type: "agent"` สำหรับ quality gates** | เปลี่ยน `subagent-stop-gate.sh` จาก bash → `type: "agent"` hook เพื่อ multi-turn file inspection ก่อน approve subagent completion |
| **`additionalContext` ใน Stop hook** | `stop-failure-log.sh` ส่ง failure analysis กลับเป็น `additionalContext` → Claude เห็น context ทันทีโดยไม่ต้องให้ user เล่า |
| **`isolation: "worktree"` สำหรับ reviewers** | dlc-review adversarial reviewers รันใน isolated worktrees — ไม่มี shared state pollution |
| **Skill usage tracking → dlc-metrics** | PreToolUse hook บน Skill tool → log ไปยัง `dlc-metrics.jsonl` อัตโนมัติ ไม่ต้อง manual instrumentation |
| **`InstructionsLoaded` hook สำหรับ CLAUDE.md staleness** | Check last-modified date → inject warning ถ้าไฟล์ไม่ได้ update ใน N วัน |
| **`effort` override per skill** | High-effort skills (dlc-build Phase 3) vs low-effort (commit-finalizer) ควรมี effort ใน frontmatter แทนที่จะ inherit session default |
| **Research verdict gate (GO/NO-GO)** | เพิ่ม `research-verdict.md` gate ระหว่าง Phase 1 → Phase 2 ใน dlc-build — ป้องกัน implement งาน infeasible |
| **Cross-session task coordination** | ใช้ Tasks system (`CLAUDE_CODE_TASK_LIST_ID`) แทน file-based coordination ใน parallel phase execution |

---

## Universal Triad Analysis — ภาพ Infographic จากบทความ

> Source: infographic จาก "The Great Framework Showdown" article (Rick Hightower, Mar 2026)

### โครงสร้างที่ diagram เผย

ทุก framework converge บน **Triad เดียวกัน** แต่ตั้งชื่อต่างกัน:

| Triad Primitive | BMAD | SpecKit | GSD | Superpowers |
| ---------------- | ------ | --------- | ----- | ------------- |
| **Agents** | 12+ Personas (Analyst, Architect, Developer, Scrum Master) | CLI-embedded behavior per phase | Specialized Subagents (Researchers, Planners, Executors, Verifiers) | Contextual Skills auto-triggered per phase |
| **Workflows** | 4-Phase Agile (Analysis → Planning → Solutioning → Implementation) | 5 Gated Phases (Constitution → Specify → Plan → Tasks → Implement) | Wave-Based Execution (dependency-ordered parallel) | Gated Pipeline (Brainstorm → TDD → Implement → Review) |
| **Skills** | 34+ Core Workflows (PRD, Stories, Architecture Docs) | Artifact generation (spec.md, plan.md, tasks.md, contracts) | Artifact generation (spec.md, plan.md, research.md, contracts) | Quality Enforcement (TDD delete rule, two-stage review) |

**Conclusion:** naming เป็นแค่ marketing — structure เดียวกันทั้งหมด

---

### 3 Axes of Evolution

diagram reveal **maturity ladder** ใน 3 axis อิสระ:

#### Axis 1: Trigger Mechanism

```text
Manual              →  CLI Command        →  Auto-Triggered
BMAD (user picks       SpecKit (/cmds)       Superpowers
persona manually)                            (contextual skills fire
                                              by development phase)
```

#### Axis 2: Execution Model

```text
Sequential          →  Gated Sequential   →  Wave-Based Parallel
BMAD                   SpecKit               GSD
(phases run one at     (explicit gate        (dependency graph →
 a time, no gates)      between phases)       tasks run in waves)
```

#### Axis 3: Enforcement Level

```text
Suggestive          →  Gated              →  Iron Law
BMAD                   SpecKit / dev-loop    Superpowers
(optional phases,       (can't advance        (pre-test code deleted,
 lightweight)           without approval)      no escape hatch)
```

---

### Insights ที่ Diagram เผย แต่บทความไม่ได้พูดตรงๆ

#### 1. Skills ถูก invoke ได้จาก 2 paths แยกกัน

จาก arrows ใน diagram:

- Agents **invoke** Skills โดยตรง
- Workflows **invoke** Skills ผ่าน orchestration
- Agents ↔ Workflows เป็น **bidirectional** (orchestrate กันได้ทั้งสองทาง)

→ ตรงกับ `claude-code-best-practice` ที่แยก preloaded skills vs runtime invocable skills

#### 2. GSD เป็นเจ้าเดียวที่ resolve ทั้ง 3 triad elements ด้วย automation

- Agents = spawned automatically by wave planner (ไม่ต้อง user เลือก)
- Workflows = dependency-graph execution (ไม่ต้อง user กด next phase)
- Skills = artifact generation เป็น output (ไม่ต้อง user trigger)

ที่เหลือ (BMAD, SpecKit, Superpowers) ยังต้องการ human เป็น trigger อย่างน้อย 1 จุด

#### 3. OpenSpec หายไปจาก diagram

บทความ cover 5 frameworks แต่ diagram แสดงแค่ 4 (BMAD, SpecKit, GSD, Superpowers) โดย Superpowers ปรากฏ 2 ครั้ง — ผู้เขียน diagram เห็นว่า OpenSpec overlap กับ SpecKit มากพอจนไม่ต้อง show แยก

#### 4. SpecKit ใช้ "CLI Commands" เป็น Agent implementation

SpecKit ไม่มี agents แยก — embed agent behavior ลงใน CLI commands โดยตรง (`/speckit.specify` = "Specify agent") นี่คือ pattern ที่ dev-loop ใช้กับ commands อยู่แล้ว แต่ไม่ได้ frame ว่าเป็น agent

---

### dev-loop Maturity Position

```text
                    BMAD    SpecKit   dev-loop   GSD    Superpowers
Trigger:            Manual  CLI       CLI        Auto   Auto
Execution:          Seq     Gated     Gated+Par  Wave   Gated+Par
Enforcement:        Low     Medium    Medium     Low    High
Artifact Gen:       Heavy   Heavy     Moderate   Heavy  Moderate
Context Isolation:  None    None      Subagent   Wave   Subagent
```

**dev-loop อยู่ระหว่าง SpecKit และ GSD** — มี gated pipeline + partial parallelism + subagent isolation แต่ยังขาด:

- Auto-triggered skills ตาม development phase (Superpowers SP1)
- Dependency-based wave assignment (GSD G2)
- Iron-law enforcement / rationalization blockers (Superpowers SP3)

---

### Maturity Roadmap สำหรับ dev-loop

| Gap | Target state | Source pattern |
| ----- | ------------- | ---------------- |
| Manual mode selection | Blast-radius auto-detect + confirm | BMAD routing |
| Fixed 3-reviewer setup | Conditional dispatch by diff type | pr-review-toolkit |
| No pre-implementation verdict | GO/NO-GO gate after research | RPI pattern |
| Wave assignment is manual | Dependency graph → auto-wave | GSD G2 |
| No enforcement against downgrade | Blast-radius warning on `--quick` override | Superpowers SP3 |
| No goal-backward verification | must_haves truths block before review | GSD verification |
| Skill auto-trigger is implicit | Contextual skill dispatch by phase | Superpowers SP1 |
