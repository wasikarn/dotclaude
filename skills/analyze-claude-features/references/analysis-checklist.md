# Analysis Checklists

## Step 1: Comprehend Sources

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
- [ ] agent-teams.md — team coordination, shared tasks, messaging
- [ ] Notion BestPractice — 5 golden rules, skill brief template, anti-patterns

## Step 2: Audit Project Structure

- [ ] Read CLAUDE.md — architecture, conventions, declared constraints
- [ ] Verify top-level directory structure via listing
- [ ] Confirm tech stack from package.json / config files (not assumption)
- [ ] Locate and review existing scripts, hooks, automation files
- [ ] Check `.claude/settings.json` — existing hooks, permissions, env vars
- [ ] Check for `.claude/rules/` directory — path-specific rules
- [ ] Check for CI/CD config files (.github/, Jenkinsfile, etc.)
- [ ] Note anything unconfirmed as [UNVERIFIED]

## Step 3: Identify Confirmed Context

- [ ] Tech stack confirmed (language, framework, runtime versions)
- [ ] Project structure mapped (key directories and their roles)
- [ ] Existing workflows identified (scripts, hooks, CI/CD)
- [ ] Known pain points captured (from CLAUDE.md, README, or comments)
- [ ] All [UNVERIFIED] items listed with reason

## Quality Gate 1: Context Completeness

Do NOT proceed to gap analysis until all checks pass:

| Check | Pass Criteria |
| --- | --- |
| Sources fetched | ≥12 of 13 sources successfully read |
| CLAUDE.md read | Full file read (not skimmed) |
| Directory verified | `tree` or `ls` output captured |
| Settings checked | `.claude/settings.json` content confirmed |
| Unverified items | All listed with reason |

Gate: PASS ✅ or FAIL ❌ — resolve failures before continuing.

## Step 4: Gap Analysis

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
- [ ] agent-teams — coordination needs (experimental — note stability)
- [ ] BestPractice — skill quality, description triggers

## Step 6: Opportunity Mapping

- [ ] Each opportunity linked to a specific confirmed gap
- [ ] Affected files or areas identified
- [ ] No opportunity from [UNVERIFIED] context without conditional flag

## Quality Gate 2: Opportunity Validity

| Check | Pass Criteria |
| --- | --- |
| Evidence-linked | Every opportunity traces to a specific gap |
| No duplicates | No two opportunities address the same gap |
| Feasibility | Affected files/paths confirmed to exist |
| Not already done | Feature not already implemented |
| Conditional flagged | [UNVERIFIED]-based opportunities marked |

Remove or merge opportunities that fail. Gate: PASS ✅ or FAIL ❌.

## Step 7: Prioritize

- [ ] Every opportunity scored on Impact and Effort
- [ ] Final ranking justified with reasoning
- [ ] Quick wins (Low Effort / High Impact) highlighted separately

## Step 8: Recommend

- [ ] Adoption sequence with clear ordering rationale
- [ ] Dependencies between recommendations explicit
- [ ] Conditional recommendations flagged
- [ ] Quick wins highlighted separately

## Step 9: Verify & Score

- [ ] **Source coverage** — every source appears in gap analysis or has "no gap found" note
- [ ] **Traceability** — each recommendation chains: Source → Gap → Opportunity → Recommendation
- [ ] **No phantom features** — all referenced files/paths verified to exist (or marked "to create")
- [ ] **Decision matrix consistent** — no recommendation contradicts Step 5
- [ ] **No stale references** — URLs, file paths, config keys all current
- [ ] **Completeness** — no source silently dropped between steps
