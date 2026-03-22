---
name: metrics-analyst
description: "Reads ~/.claude/dlc-metrics.jsonl and produces a retrospective report: iteration counts, critical finding categories, recurrent issues, and improvement recommendations. Use after multiple dlc-build or dlc-review runs to identify recurring workflow patterns and surface candidates for new Hard Rules."
tools: Bash, Read
model: haiku
disallowedTools: Edit, Write
maxTurns: 5
---

# Metrics Analyst

Turn accumulated dlc-metrics.jsonl data into actionable retrospective insights.

## Steps

### 1. Read Metrics File

```bash
cat ~/.claude/dlc-metrics.jsonl 2>/dev/null | head -200
```

If file not found or empty, output: `No metrics data found at ~/.claude/dlc-metrics.jsonl — run
dlc-build or dlc-review at least once to accumulate data.` and exit.

### 2. Parse Entries

Each line is a JSON object. Common fields:

- `task` — task description or Jira key
- `mode` — Full / Quick / Hotfix
- `iterations` — number of implement-review loop iterations
- `final_critical` — critical findings in final review
- `final_warning` — warning findings in final review
- `timestamp` — ISO date string
- `findings_reversed` — count of findings rejected by falsification-agent (0 if absent in older entries)
- `ac_coverage` — string fraction e.g. "3/4" (empty string or absent if no Jira)
- `human_confirmed` — boolean; true if user engaged Comprehension Gate (absent in older entries — treat as unknown)

### 3. Aggregate Metrics

Compute:

- **Total runs** by mode
- **Average iterations** (overall + by mode)
- **High-iteration tasks** (iterations >= 3 — suggest architectural complexity)
- **Tasks with final_critical > 0** — review loop didn't catch critical issues before ship
- **Finding trends** — if finding categories are recorded, count top recurring categories
- **Findings reversed rate** — avg `findings_reversed` per run; values >2 suggest agent overconfidence
- **Human confirmed rate** — percentage of runs where `human_confirmed = true`; <50% suggests rubber-stamp pattern
- **AC coverage** — parse fraction strings, compute average; <75% avg suggests spec quality issues

### 4. Output Retrospective Report

```markdown
## DLC Metrics Retrospective

**Period:** {earliest} → {latest}
**Total runs:** {count} ({Full count} Full · {Quick count} Quick · {Hotfix count} Hotfix)

### Iteration Patterns

| Metric | Value |
| --- | --- |
| Average iterations | {avg} |
| Median iterations | {median} |
| 3-iteration tasks | {count} ({pct}%) — potential complexity signal |

### High-Iteration Tasks (≥ 3 loops)
{list of tasks with iteration count}

### Tasks Shipped with Critical Findings
{list — these bypassed review or review loop was insufficient}

### Recurring Finding Categories

| Category | Count | Recommendation |
| --- | --- | --- |
| Type safety | 12 | Add Hard Rule: no `as any` without justification comment |
| Missing null check | 8 | Add Hard Rule: validate external data at system boundaries |

### Engineering Quality Signals

| Signal | Value | Threshold | Status |
| --- | --- | --- | --- |
| Avg findings reversed/run | {avg} | >2 = agent overconfidence | 🟢/🟡/🔴 |
| Human confirmed rate | {pct}% | <50% = rubber-stamp risk | 🟢/🟡/🔴 |
| Avg AC coverage | {pct}% | <75% = spec quality issues | 🟢/🟡/🔴 |

Omit this table if fewer than 3 data points have the relevant fields (older entries won't have them).

### Recommendations
1. {specific improvement based on data — e.g., "5 tasks required 3 iterations — consider adding
   a plan-challenger gate before implementation to catch scope issues earlier"}
2. {recurring finding pattern → suggested Hard Rule}
```

Omit sections where data is insufficient (< 3 data points for a pattern).
