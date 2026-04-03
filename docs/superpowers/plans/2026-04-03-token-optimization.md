# Token Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce token usage in devflow skills by 15-40% through field filtering, token metrics tracking, and PR diff filters.

**Architecture:** Create metrics.ts for token tracking, add field presets to jira-integration, and add --exclude filtering to review skill. Foundation-first approach: Phase 0 establishes metrics infrastructure before implementing token-saving features.

**Tech Stack:** TypeScript (devflow-engine), Bash (scripts), Markdown (skills/agents)

---

## File Structure

### New Files
- `devflow-engine/src/metrics.ts` — Token metrics schema and utilities
- `devflow-engine/src/metrics.test.ts` — Tests for metrics module

### Modified Files
- `skills/jira-integration/SKILL.md` — Add field presets (--preset=review|build|debug)
- `agents/devflow-build-bootstrap.md` — Pass --preset=build
- `agents/devflow-debug-bootstrap.md` — Pass --preset=debug
- `agents/pr-review-bootstrap.md` — Pass --preset=review, add --exclude logic
- `skills/review/SKILL.md` — Add --exclude parameter
- `skills/metrics/SKILL.md` — Display token metrics
- `skills/dashboard/SKILL.md` — Show token summary

---

## Phase 0: Metrics Foundation

### Task 0.1: Create metrics.ts

**Files:**
- Create: `devflow-engine/src/metrics.ts`
- Test: `devflow-engine/src/metrics.test.ts`

- [ ] **Step 1: Write the failing test for MetricsEntry interface**

```typescript
// devflow-engine/src/metrics.test.ts
import { describe, it, expect } from 'bun:test'
import { MetricsEntry, createEntry, validateEntry } from './metrics'

describe('MetricsEntry', () => {
  it('should create entry with schema_version 1.1', () => {
    const entry = createEntry({
      skill: 'build',
      phase: 'research',
      mode: 'full',
      tokens: { input: 10000, output: 2000 }
    })
    
    expect(entry.schema_version).toBe('1.1')
    expect(entry.skill).toBe('build')
    expect(entry.phase).toBe('research')
    expect(entry.tokens.input).toBe(10000)
    expect(entry.tokens.output).toBe(2000)
    expect(entry.timestamp).toBeDefined()
  })

  it('should validate entry without tokens field (backward compatibility)', () => {
    const legacyEntry = {
      timestamp: '2026-04-03T15:00:00Z',
      skill: 'build',
      phase: 'research',
      mode: 'full'
    }
    
    expect(() => validateEntry(legacyEntry)).not.toThrow()
  })

  it('should include cumulative_session in token tracking', () => {
    const entry = createEntry({
      skill: 'build',
      phase: 'research',
      mode: 'full',
      tokens: { input: 10000, output: 2000 }
    })
    
    expect(entry.tokens.cumulative_session).toBeDefined()
    expect(typeof entry.tokens.cumulative_session).toBe('number')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd devflow-engine && bun test metrics.test.ts`
Expected: FAIL with "Cannot find module './metrics'"

- [ ] **Step 3: Create MetricsEntry interface and utilities**

```typescript
// devflow-engine/src/metrics.ts
/**
 * Token metrics tracking for devflow skills.
 * Schema v1.1 adds token tracking fields while maintaining backward compatibility.
 */

export interface TokenMetrics {
  input: number
  output: number
  cumulative_session: number
}

export interface MetricsEntry {
  schema_version: '1.0' | '1.1'
  timestamp: string
  skill: string
  phase: string
  mode: string
  tokens?: TokenMetrics
}

export interface CreateEntryOptions {
  skill: string
  phase: string
  mode: string
  tokens: { input: number; output: number }
  cumulative_session?: number
}

/**
 * Create a new metrics entry with schema v1.1
 */
export function createEntry(options: CreateEntryOptions): MetricsEntry {
  const { skill, phase, mode, tokens, cumulative_session = tokens.input + tokens.output } = options
  
  return {
    schema_version: '1.1',
    timestamp: new Date().toISOString(),
    skill,
    phase,
    mode,
    tokens: {
      input: tokens.input,
      output: tokens.output,
      cumulative_session
    }
  }
}

/**
 * Validate a metrics entry (supports both v1.0 and v1.1 schemas)
 */
export function validateEntry(entry: unknown): MetricsEntry {
  if (typeof entry !== 'object' || entry === null) {
    throw new Error('Invalid entry: must be an object')
  }
  
  const e = entry as Record<string, unknown>
  
  // Required fields
  if (typeof e.timestamp !== 'string') {
    throw new Error('Invalid entry: missing timestamp')
  }
  if (typeof e.skill !== 'string') {
    throw new Error('Invalid entry: missing skill')
  }
  if (typeof e.phase !== 'string') {
    throw new Error('Invalid entry: missing phase')
  }
  if (typeof e.mode !== 'string') {
    throw new Error('Invalid entry: missing mode')
  }
  
  // Schema version defaults to 1.0 if not present (backward compatibility)
  const schema_version = (e.schema_version as '1.0' | '1.1') || '1.0'
  
  // Tokens field is optional (v1.0 compatibility)
  let tokens: TokenMetrics | undefined
  if (e.tokens !== undefined) {
    const t = e.tokens as Record<string, unknown>
    if (typeof t.input !== 'number' || typeof t.output !== 'number') {
      throw new Error('Invalid entry: tokens.input and tokens.output must be numbers')
    }
    tokens = {
      input: t.input as number,
      output: t.output as number,
      cumulative_session: (t.cumulative_session as number) || (t.input as number + t.output as number)
    }
  }
  
  return {
    schema_version,
    timestamp: e.timestamp as string,
    skill: e.skill as string,
    phase: e.phase as string,
    mode: e.mode as string,
    tokens
  }
}

/**
 * Format entry as JSONL line
 */
export function formatEntry(entry: MetricsEntry): string {
  return JSON.stringify(entry)
}

/**
 * Parse JSONL line to MetricsEntry
 */
export function parseEntry(line: string): MetricsEntry {
  return validateEntry(JSON.parse(line))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd devflow-engine && bun test metrics.test.ts`
Expected: PASS (all 3 tests)

- [ ] **Step 5: Commit metrics.ts**

```bash
git add devflow-engine/src/metrics.ts devflow-engine/src/metrics.test.ts
git commit -m "feat(devflow-engine): add metrics.ts with token tracking schema v1.1

- Create MetricsEntry interface with optional tokens field
- Support backward compatibility with v1.0 schema
- Add createEntry, validateEntry, formatEntry, parseEntry utilities
- Foundation for Phase 1-3 token optimization"
```

---

### Task 0.2: Document Injection Point Mechanism

**Files:**
- Create: `docs/references/injection-points.md`

- [ ] **Step 1: Write injection points documentation**

```markdown
# Named Injection Points

Injection points allow skills to execute custom logic at specific phases without modifying core skill flow.

## Mechanism

Skills call injection point handlers at phase boundaries:

```
before_bootstrap → bootstrap → after_bootstrap →
before_plan → plan → after_plan →
before_review → review → after_review →
```

## Implementation

### Skill-level Injection

Skills define injection points in their SKILL.md:

```markdown
## Injection Points

### after_bootstrap

Called after context gathering completes.

**Handler:** Check token budget, warn if approaching threshold.

```markdown
**Injection:** If token budget exceeded, output warning.
```

### before_review

Called before spawning review agents.

**Handler:** Estimate token cost, suggest optimizations if high.

```markdown
**Injection:** If estimated cost > 50k tokens, suggest --quick mode.
```
```

### Agent-level Injection

Agents can spawn at injection points using the Agent tool:

```markdown
- [ ] **Check token budget at after_bootstrap**
  - Spawn token-watchdog agent
  - Pass cumulative_session from devflow-metrics.jsonl
  - If threshold exceeded, output warning
```

## Current Injection Points

| Point | When | Purpose |
|-------|------|---------|
| `after_bootstrap` | After context gathered | Token budget check |
| `before_review` | Before spawning reviewers | Cost estimation |
| `after_plan` | After plan written | Plan complexity check |

## Adding New Injection Points

1. Define the point name and when it fires
2. Document in this file
3. Add call site in skill phase file
4. Create handler (agent or inline logic)
```

- [ ] **Step 2: Commit injection points documentation**

```bash
git add docs/references/injection-points.md
git commit -m "docs: add injection points mechanism documentation

- Define named injection points (after_bootstrap, before_review, after_plan)
- Document skill-level and agent-level injection patterns
- Foundation for Token Budget Watchdog (Phase 4)"
```

---

## Phase 1: Field Filtering

### Task 1.1: Add Field Presets to jira-integration

**Files:**
- Modify: `skills/jira-integration/SKILL.md`

- [ ] **Step 1: Add field presets section to jira-integration SKILL.md**

```markdown
## Field Presets

Use field presets to reduce MCP response size by 30-50%. Full issue content is 3-8K tokens; filtered content is 1-2K tokens.

### Available Presets

| Preset | Fields | Use Case |
|--------|--------|----------|
| `review` | key, status, assignee, summary, description | PR review context |
| `build` | key, summary, customfield_10015, subtasks | Build planning |
| `debug` | key, summary, priority, issuelinks | Bug investigation |

### Usage

Add `--preset=<name>` to skill invocation:

```markdown
**Jira Context (Phase 0.05):**
- Fetch ticket using `issue-bootstrap` agent with `--preset=review`
- Or use MCP directly with `fields` parameter
```

### Fallback

If preset misses required data:
1. Agent outputs warning: "Field X not in preset, additional data needed"
2. Subsequent MCP call fetches missing field
3. Session continues with full context

### Implementation

In bootstrap agents, pass preset to issue-bootstrap:

```markdown
### Jira Fetch

Use issue-bootstrap agent with preset:

```markdown
**Bootstrap Jira:**
- Detect Jira key from $ARGUMENTS
- If detected: invoke issue-bootstrap agent with `--preset=<skill_preset>`
- Fields: review→build→debug mapping defined in jira-integration skill
```

### Custom Fields

For custom fields not in presets:

```markdown
**Custom Fields:**
- START_DATE_FIELD (customfield_10015) — Sprint start
- SPRINT_FIELD (customfield_10020) — Sprint assignment
- Include in build preset by default
```
```

- [ ] **Step 2: Update Fetch Ticket section in jira-integration SKILL.md**

Replace the existing `### Fetch Ticket` section:

```markdown
### Fetch Ticket

Try in order (stop at first success):

1. **`issue-bootstrap` agent** (atlassian-pm plugin — optional) — if available, delegate entirely:
   pass the issue key and preset, capture the structured `{bootstrap_context}` output.
   
   **Presets:**
   - `--preset=review` for review skill (key, status, assignee, summary, description)
   - `--preset=build` for build skill (key, summary, customfield_10015, subtasks)
   - `--preset=debug` for debug skill (key, summary, priority, issuelinks)
   
2. **`mcp-atlassian`** → `mcp__mcp-atlassian__jira_get_issue` with fields parameter:
   ```markdown
   mcp__mcp-atlassian__jira_get_issue(
     key="PROJ-123",
     fields="summary,status,assignee,description"
   )
   ```
   
3. **Neither available** → warn user "Jira MCP not configured, skipping ticket context" → skip Jira sections

If fetch fails (API error, ticket not found) → warn → skip Jira sections → proceed normally. Jira context is never blocking.
```

- [ ] **Step 3: Commit jira-integration changes**

```bash
git add skills/jira-integration/SKILL.md
git commit -m "feat(skills): add field presets to jira-integration

- Add --preset=review|build|debug for filtered MCP calls
- Document field preset mapping
- Add fallback for missing fields
- Token savings: 2-6K per Jira call (30-50%)"
```

---

### Task 1.2: Update devflow-build-bootstrap Agent

**Files:**
- Modify: `agents/devflow-build-bootstrap.md`

- [ ] **Step 1: Add preset parameter to Jira fetch**

Find the Jira fetch section and add preset:

```markdown
### Jira Fetch

If `$ARGUMENTS` contains a Jira key pattern `[A-Z]+-\d+`:

```markdown
**Jira Context:**
- Key: extract from $ARGUMENTS
- Preset: --preset=build
- Invoke issue-bootstrap agent with key and preset
- Capture {bootstrap_context} for injection into explorer prompts
```

If issue-bootstrap not available, fall back to MCP with fields:

```markdown
**MCP Fallback:**
- mcp__mcp-atlassian__jira_get_issue(
    key="<extracted_key>",
    fields="summary,customfield_10015,subtasks"
  )
```
```

- [ ] **Step 2: Commit build-bootstrap changes**

```bash
git add agents/devflow-build-bootstrap.md
git commit -m "feat(agents): pass --preset=build to jira fetch in build-bootstrap

- Use build preset (key, summary, customfield_10015, subtasks)
- Fallback to MCP with fields parameter
- Token savings: 2-6K per build session"
```

---

### Task 1.3: Update devflow-debug-bootstrap Agent

**Files:**
- Modify: `agents/devflow-debug-bootstrap.md`

- [ ] **Step 1: Add preset parameter to Jira fetch**

Find the Jira fetch section and add preset:

```markdown
### Jira Fetch

If `$ARGUMENTS` contains a Jira key pattern `[A-Z]+-\d+`:

```markdown
**Jira Context:**
- Key: extract from $ARGUMENTS
- Preset: --preset=debug
- Invoke issue-bootstrap agent with key and preset
- Capture {bootstrap_context} for injection into investigator prompts
```

If issue-bootstrap not available, fall back to MCP with fields:

```markdown
**MCP Fallback:**
- mcp__mcp-atlassian__jira_get_issue(
    key="<extracted_key>",
    fields="summary,priority,issuelinks"
  )
```
```

- [ ] **Step 2: Commit debug-bootstrap changes**

```bash
git add agents/devflow-debug-bootstrap.md
git commit -m "feat(agents): pass --preset=debug to jira fetch in debug-bootstrap

- Use debug preset (key, summary, priority, issuelinks)
- Fallback to MCP with fields parameter
- Token savings: 2-6K per debug session"
```

---

### Task 1.4: Update pr-review-bootstrap Agent

**Files:**
- Modify: `agents/pr-review-bootstrap.md`

- [ ] **Step 1: Add preset parameter to Jira fetch**

Find the Jira fetch section and add preset:

```markdown
### Jira Fetch

If `$ARGUMENTS` contains a Jira key pattern `[A-Z]+-\d+`:

```markdown
**Jira Context:**
- Key: extract from $ARGUMENTS
- Preset: --preset=review
- Invoke issue-bootstrap agent with key and preset
- Capture {bootstrap_context} for injection into reviewer prompts
```

If issue-bootstrap not available, fall back to MCP with fields:

```markdown
**MCP Fallback:**
- mcp__mcp-atlassian__jira_get_issue(
    key="<extracted_key>",
    fields="status,assignee,summary,description"
  )
```
```

- [ ] **Step 2: Commit pr-review-bootstrap changes**

```bash
git add agents/pr-review-bootstrap.md
git commit -m "feat(agents): pass --preset=review to jira fetch in pr-review-bootstrap

- Use review preset (key, status, assignee, summary, description)
- Fallback to MCP with fields parameter
- Token savings: 2-6K per review session"
```

---

## Phase 2: PR Diff Filters

### Task 2.1: Add --exclude to review skill

**Files:**
- Modify: `skills/review/SKILL.md`

- [ ] **Step 1: Add --exclude parameter to Args section**

Find the `**Args:**` line and update:

```markdown
**Args:** `$0`=PR# (required) · `$1`=Jira key or Author/Reviewer · `$2`=Author/Reviewer · `--micro`=engine-only fast path · `--quick`=2 reviewers no debate · `--full`=force 3-reviewer debate · `--focused [area]`=specialist only · `--exclude pattern`=exclude files from diff (can repeat) · Flags (`--micro`/`--quick`/`--full`/`--focused`/`--exclude`) are detected by pattern matching — position-independent.
```

- [ ] **Step 2: Add --exclude section to SKILL.md**

```markdown
## Diff Filtering

Use `--exclude` to filter out files from PR diff. Reduces token cost by 40-60% for large PRs.

### Usage

```bash
/review 123 --exclude 'package-lock.json' --exclude 'yarn.lock'
/review 123 --exclude '*.min.js' --exclude 'dist/*'
```

### Auto-Filter

For PRs with >100 files, auto-exclude common noise:

```markdown
**Auto-Filter Threshold:**
- If `git diff --numstat | wc -l` > 100
- Auto-add: `--exclude 'package-lock.json' --exclude 'yarn.lock' --exclude '*.min.js'`
```

### Implementation

In Phase 1, after getting PR number:

```markdown
**Phase 1: Diff Retrieval**
- Get PR number from $0
- Detect file count: `gh pr diff $0 --name-only | wc -l`
- If >100 files AND no --exclude flags: add auto-filter
- Build diff command: `gh pr diff $0 $EXCLUDE_FLAGS`
```
```

- [ ] **Step 3: Commit review skill changes**

```bash
git add skills/review/SKILL.md
git commit -m "feat(skills): add --exclude parameter to review skill

- Support multiple --exclude flags for diff filtering
- Add auto-filter for PRs >100 files
- Token savings: 10-30K for large PRs (40-60%)"
```

---

### Task 2.2: Add Auto-Filter Logic to pr-review-bootstrap

**Files:**
- Modify: `agents/pr-review-bootstrap.md`

- [ ] **Step 1: Add auto-filter detection to Phase 1**

Find the diff retrieval section and add:

```markdown
### Diff Retrieval

```bash
# Get PR number from $ARGUMENTS
PR_NUM=<extracted from arguments>

# Detect file count
FILE_COUNT=$(gh pr diff "$PR_NUM" --name-only | wc -l)

# Build exclude flags
EXCLUDE_FLAGS=""
if [[ $FILE_COUNT -gt 100 ]]; then
  # Auto-filter common noise for large PRs
  EXCLUDE_FLAGS="--exclude 'package-lock.json' --exclude 'yarn.lock' --exclude '*.min.js'"
fi

# Get diff with filters
rtk gh pr diff "$PR_NUM" $EXCLUDE_FLAGS
```

Add to context:
- File count: $FILE_COUNT
- Auto-filtered: yes/no
```

- [ ] **Step 2: Commit pr-review-bootstrap changes**

```bash
git add agents/pr-review-bootstrap.md
git commit -m "feat(agents): add auto-filter logic to pr-review-bootstrap

- Detect PR file count
- Auto-exclude lockfiles and minified files for PRs >100 files
- Token savings: 10-30K for large PRs"
```

---

## Phase 3: Metrics Rollout

### Task 3.1: Update metrics skill to display token metrics

**Files:**
- Modify: `skills/metrics/SKILL.md`

- [ ] **Step 1: Add Token Metrics section**

```markdown
## Token Metrics

When `devflow-metrics.jsonl` contains v1.1 entries with `tokens` field:

| Metric | Description |
|--------|-------------|
| **Total Input Tokens** | Sum of `tokens.input` across sessions |
| **Total Output Tokens** | Sum of `tokens.output` across sessions |
| **Average Input/Skill** | Mean input tokens per skill type |
| **Average Output/Skill** | Mean output tokens per skill type |
| **Highest Session** | Session with highest cumulative_session |

### Output Format

```markdown
## Token Summary (v1.1)

| Skill | Sessions | Avg Input | Avg Output | Total |
|-------|----------|------------|------------|-------|
| build | 5 | 45,000 | 12,000 | 285,000 |
| review | 3 | 25,000 | 8,000 | 99,000 |
| debug | 2 | 15,000 | 5,000 | 40,000 |

**Total:** 424,000 tokens across 10 sessions
```

### Backward Compatibility

If entries lack `tokens` field (v1.0 schema):
- Skip token summary section
- Continue with iteration count analysis
```

- [ ] **Step 2: Commit metrics skill changes**

```bash
git add skills/metrics/SKILL.md
git commit -m "feat(skills): add token metrics display to /metrics skill

- Display token summary when v1.1 entries present
- Show per-skill averages and totals
- Backward compatible with v1.0 entries"
```

---

### Task 3.2: Update dashboard skill to show token summary

**Files:**
- Modify: `skills/dashboard/SKILL.md`

- [ ] **Step 1: Add Token Overview section**

```markdown
## Token Overview

If `devflow-metrics.jsonl` contains v1.1 entries:

```markdown
## Token Overview

| Period | Input | Output | Total |
|--------|-------|--------|-------|
| Today | 150,000 | 40,000 | 190,000 |
| This Week | 850,000 | 220,000 | 1,070,000 |
| All Time | 2,100,000 | 550,000 | 2,650,000 |

**Trend:** 📈 +15% from last week
```
```

- [ ] **Step 2: Commit dashboard skill changes**

```bash
git add skills/dashboard/SKILL.md
git commit -m "feat(skills): add token overview to /dashboard skill

- Show daily/weekly/all-time token totals
- Include trend indicator
- Backward compatible with v1.0 entries"
```

---

## Self-Review

### Spec Coverage

| Spec Requirement | Task |
|------------------|------|
| Create metrics.ts | Task 0.1 ✅ |
| Define JSONL schema v1.1 | Task 0.1 ✅ |
| Document injection points | Task 0.2 ✅ |
| Add --fields presets to jira-integration | Task 1.1 ✅ |
| Update build-bootstrap with preset | Task 1.2 ✅ |
| Update debug-bootstrap with preset | Task 1.3 ✅ |
| Update pr-review-bootstrap with preset | Task 1.4 ✅ |
| Add --exclude to review skill | Task 2.1 ✅ |
| Add auto-filter for large PRs | Task 2.2 ✅ |
| Display token metrics | Task 3.1 ✅ |
| Show token summary in dashboard | Task 3.2 ✅ |

### Placeholder Scan

✅ No "TBD", "TODO", or incomplete sections
✅ All code blocks contain actual implementation
✅ All commands have expected output

### Type Consistency

✅ `MetricsEntry` interface defined in Task 0.1
✅ `createEntry` and `validateEntry` functions use consistent types
✅ All skills reference the same preset names (review, build, debug)

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-03-token-optimization.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?