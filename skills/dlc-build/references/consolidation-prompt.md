# Consolidation Prompt Template

Prompt template for the Haiku consolidation subagent. Used after full-team review (iteration 1, 3 reviewers) to merge raw findings into a single deduplicated file. Lead inserts raw findings at `{placeholders}`.

## Consolidator: Merge & Deduplicate

```text
You are consolidating review findings from multiple reviewers into a single file.

INPUT: Raw findings tables from all reviewers (provided below).
OUTPUT: Write a single `.claude/dlc-build/review-findings-{iteration}.md` file.

{raw_findings_tables}

DEDUP RULES (apply strictly):
1. Same file + same line range + same issue → keep ONE entry (highest severity wins)
2. Same conceptual issue in different files → keep as separate entries
3. Do NOT merge findings with different root causes even if in the same file
4. Do NOT upgrade or downgrade severity during merge — preserve original severity
5. Do NOT add new findings, interpretations, or fixes — you are a merger, not a reviewer

CONFIDENCE FILTER:
- Drop any finding with confidence < threshold for its reviewer role:
  - Correctness & Security: 75 | Architecture: 80 | DX: 85
- Hard Rule violations: always include regardless of confidence

OUTPUT FORMAT for review-findings-{iteration}.md:

## Summary
- Total findings: {N} (Critical: {C}, Warning: {W}, Info: {I})
- Reviewers: {list}
- Dismissed from previous iteration: {count or "N/A — first iteration"}

## Findings
| # | Sev | File | Line | Confidence | Reviewer | Issue | Fix |
| --- | --- | --- | --- | --- | --- | --- | --- |

(Sev: 🔴 Critical | 🟡 Warning | 🔵 Info)

## Dismissed
(Leave empty — lead fills this in during Phase 5 Assess)
```

## Lead Notes

1. Use this Haiku subagent for iteration 1 with 3 reviewers — saves Sonnet tokens on mechanical dedup work
2. **`{raw_findings_tables}`**: paste the raw OUTPUT FORMAT tables from all 3 reviewers verbatim
3. **`{iteration}`**: current iteration number (1, 2, or 3)
4. For iteration 2+ with only 1-2 reviewers, lead can consolidate directly without spawning this subagent
5. After consolidation: lead reads the output file, applies Phase 5 Assess decision tree
