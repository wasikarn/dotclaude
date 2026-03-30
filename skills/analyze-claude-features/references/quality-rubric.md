# Quality Rubric

## Analysis Quality (100 points)

| Criterion | Weight | Min |
| --- | --- | --- |
| Source coverage | 15 | 10 |
| Context verification | 15 | 10 |
| Gap analysis depth | 15 | 10 |
| Decision matrix accuracy | 15 | 10 |
| Traceability | 15 | — |
| Actionability | 15 | — |
| Prioritization quality | 10 | — |

Grades: A (90-100), B (70-89), C (50-69), D (30-49), F (0-29).

### Critical Minimums

Any criterion below its minimum → must fix before final score:

| Criterion | Min |
| --- | --- |
| Source coverage | 10/15 |
| Context verification | 10/15 |
| Gap analysis depth | 10/15 |
| Decision matrix accuracy | 10/15 |

## Project Coverage: Applicability Table

| Category | Applicable When | Not Applicable When |
| --- | --- | --- |
| CLAUDE.md | Always | — |
| `.claude/rules/` | Project has path-specific conventions | Single-purpose project, no path variance |
| Skills | Repeatable workflows exist | No repeatable workflows |
| Subagents | Tasks benefit from delegation | Simple project, no delegation needs |
| Output styles | Consistent tone/format needed | Default output sufficient |
| Hooks | Deterministic automation needed | No automation benefits |
| Permissions | Security-sensitive operations | Personal project, all tools trusted |
| Settings | Custom env vars or config needed | Defaults work fine |
| Scheduled tasks | Recurring monitoring needed | No recurring needs |
| Plugins | Distribution to others needed | Personal/single-project use |
| Agent teams | Complex parallel coordination needed | Sequential or simple tasks |

## Score Adoption Rubric (0-3 per category)

- **3 — Fully adopted:** Feature used correctly, follows best practices, no gaps
- **2 — Partially adopted:** Feature used but with gaps or misconfigurations
- **1 — Minimal:** Feature exists but underutilized or poorly configured
- **0 — Missing:** Applicable feature not used at all

Formula: `Project Coverage = (sum of scores / (applicable categories × 3)) × 100`

Example: 8 applicable categories, scores sum to 22 → 22/24 × 100 = 92/100

## Output Format Templates

### Analysis Quality Score (Step 9a)

```markdown
| Criterion | Score | Status | Notes |
| --- | --- | --- | --- |
| Source coverage | XX/15 | ✅ or ⚠️ CRITICAL (if <10) | ... |
| Context verification | XX/15 | ✅ or ⚠️ CRITICAL (if <10) | ... |
| Gap analysis depth | XX/15 | ✅ or ⚠️ CRITICAL (if <10) | ... |
| Decision matrix accuracy | XX/15 | ✅ or ⚠️ CRITICAL (if <10) | ... |
| Traceability | XX/15 | ✅ | ... |
| Actionability | XX/15 | ✅ | ... |
| Prioritization quality | XX/10 | ✅ | ... |

Analysis Quality: XX/100 (Grade X)
Critical check: PASS ✅ — all criteria above minimums
```

If FAIL → go back to the failing step and fix before re-scoring.

### Project Coverage Score (Step 9b)

```markdown
| Category | Applicable? | Score | Evidence |
| --- | --- | --- | --- |
| CLAUDE.md | ✅/❌ | X/3 | ... |
| ... | ... | ... | ... |

Project Coverage: XX/100 (Grade X)
Applicable: X/11 categories
```
