# Analyze Claude Features

Read and analyze each documentation source below, then assess what can be concretely applied or improved in this project.

Before starting, check if the following sources are already available in your context or cache.
Fetch only what is missing — do not re-fetch sources already loaded.

**Sources:**

Extensibility:

- <https://code.claude.com/docs/en/features-overview.md>
- <https://code.claude.com/docs/en/skills.md>
- <https://code.claude.com/docs/en/sub-agents.md>
- <https://code.claude.com/docs/en/output-styles.md>

Memory & Rules:

- <https://code.claude.com/docs/en/memory.md>

Configuration:

- <https://code.claude.com/docs/en/settings.md>
- <https://code.claude.com/docs/en/permissions.md>

Automation:

- <https://code.claude.com/docs/en/hooks-guide.md>
- <https://code.claude.com/docs/en/hooks.md>
- <https://code.claude.com/docs/en/scheduled-tasks.md>

Distribution:

- <https://code.claude.com/docs/en/plugins.md>
- <https://code.claude.com/docs/en/mcp.md>

Coordination:

- <https://code.claude.com/docs/en/agent-teams.md>

Best Practices:

- <https://www.notion.so/Skill-Claude-BestPractice-31cff5ab8d4680429ecbc56504c6293c>

---

## Thinking Process (follow in order)

**Step 1 — Comprehend Sources**
For each source, extract: core concept, key capabilities, and intended use cases.

Checklist:

- [ ] features-overview.md — decision matrix, feature comparison, context costs
- [ ] skills.md — frontmatter fields, substitutions, bundled skills, `context: fork`
- [ ] sub-agents.md — configuration, tools, memory, hooks, isolation
- [ ] output-styles.md — frontmatter, `keep-coding-instructions`, built-in styles
- [ ] memory.md — CLAUDE.md scoping, `.claude/rules/`, `@import`, auto memory, `claudeMdExcludes`
- [ ] settings.md — settings hierarchy, all fields, environment variables
- [ ] permissions.md — allow/deny/ask rules, tool-specific syntax, managed settings
- [ ] hooks-guide.md — hook types, lifecycle events, patterns
- [ ] hooks.md — all event schemas, input/output formats, exit codes
- [ ] scheduled-tasks.md — `/loop`, cron scheduling
- [ ] plugins.md — plugin manifest, packaging, distribution, marketplaces
- [ ] mcp.md — MCP server config, tool search, scope hierarchy
- [ ] agent-teams.md — team coordination, shared tasks, messaging
- [ ] Notion BestPractice — 5 golden rules, skill brief template, anti-patterns

---

**Step 2 — Audit Project Structure (carefully)**
Do NOT assume or infer structure. Verify everything.

Checklist:

- [ ] Read CLAUDE.md — architecture, conventions, declared constraints
- [ ] Verify top-level directory structure via listing
- [ ] Confirm tech stack from package.json / config files (not assumption)
- [ ] Locate and review existing scripts, hooks, automation files
- [ ] Check `.claude/settings.json` — existing hooks, permissions, env vars
- [ ] Check for `.claude/rules/` directory — path-specific rules
- [ ] Check for CI/CD config files (.github/, Jenkinsfile, etc.)
- [ ] Note anything unconfirmed as [UNVERIFIED]

---

**Step 3 — Identify Confirmed Context**
Before gap analysis, explicitly state only what is verified:

Checklist:

- [ ] Tech stack confirmed (language, framework, runtime versions)
- [ ] Project structure mapped (key directories and their roles)
- [ ] Existing workflows identified (scripts, hooks, CI/CD)
- [ ] Known pain points captured (from CLAUDE.md, README, or comments)
- [ ] All [UNVERIFIED] items listed with reason

---

**Step 4 — Gap Analysis**
Compare each source's capabilities against confirmed context only.
Do NOT propose improvements based on assumed or unverified state.

Checklist:

- [ ] features-overview — is the right feature used for each concern? (CLAUDE.md vs rules vs skills)
- [ ] skills — frontmatter fields, substitutions, bundled skills adoption
- [ ] sub-agents — agent configuration, memory, hooks, isolation
- [ ] output-styles — styles coverage, `keep-coding-instructions` usage
- [ ] memory & rules — `.claude/rules/` for path-specific instructions, `@import` syntax, `CLAUDE.local.md`
- [ ] settings — env vars, config fields not yet used
- [ ] permissions — allow/deny/ask rules in settings.json
- [ ] hooks — all event types vs. currently configured hooks
- [ ] scheduled-tasks — recurring workflows that could use `/loop`
- [ ] plugins — packaging opportunity for distribution
- [ ] mcp — external tool integration gaps
- [ ] agent-teams — coordination needs (experimental — note stability)
- [ ] BestPractice — skill quality, description triggers

---

**Step 5 — Decision Matrix Validation**
For each existing configuration, verify it uses the right feature type:

| Content Type | Should Be | Not |
| --- | --- | --- |
| "Always do X" rules | CLAUDE.md | skill |
| Path-specific guidelines | `.claude/rules/` with `paths` | CLAUDE.md (bloat) |
| Reference docs loaded sometimes | skill | CLAUDE.md (always loaded) |
| Repeatable workflows | skill with `disable-model-invocation` | CLAUDE.md |
| Deterministic automation | hook | skill or agent |
| External service access | MCP | bash scripts |

Flag any misplacement found.

---

**Step 6 — Opportunity Mapping**
For each confirmed gap, define: what to change, add, or automate — and which files/areas it affects.

Checklist:

- [ ] Each opportunity linked to a specific confirmed gap
- [ ] Affected files or areas identified
- [ ] No opportunity from [UNVERIFIED] context without conditional flag

---

**Step 7 — Prioritize**
Score each opportunity: Impact (H/M/L) × Effort (H/M/L) → rank and justify.

Checklist:

- [ ] Every opportunity scored on Impact and Effort
- [ ] Final ranking justified with reasoning
- [ ] Quick wins (Low Effort / High Impact) highlighted separately

---

**Step 8 — Recommend**
Propose a sequenced adoption plan: what to implement first, why, and what it unlocks next.
Flag any recommendation that depends on [UNVERIFIED] context as conditional.

Checklist:

- [ ] Adoption sequence with clear ordering rationale
- [ ] Dependencies between recommendations explicit
- [ ] Conditional recommendations flagged
- [ ] Quick wins highlighted separately

---

## Output

Per-source summary (Step 1), gap analysis table (Step 4), decision matrix validation (Step 5), top improvements with rationale, and recommended adoption sequence with dependencies.
