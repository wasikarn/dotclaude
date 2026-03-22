# dlc-review — Development Loop Cycle: PR Review

Adversarial PR review using 3 parallel reviewer agents + falsification + debate.

## When to use

Use `/dlc-review` when reviewing a PR — especially large PRs (30+ files) or
security-sensitive changes.

## Invocation

    /dlc-review [PR number or branch]
    /dlc-review 42
    /dlc-review feature/auth-refactor

## Phases

| Phase | What happens |
| --- | --- |
| **1 — Bootstrap** | Fetch PR diff + Jira AC in one pass |
| **2 — Parallel Review** | 3 reviewers check different concerns (logic, security, tests) |
| **3 — Debate** | Reviewers challenge each other's findings |
| **4 — Falsify** | Falsification agent rejects weak findings |
| **5 — Consolidate** | review-consolidator deduplicates and ranks |
| **5.5 — Comprehension Gate** | Author verifies they understand each finding |
| **6 — Report** | Structured output with severity: Critical / Warning / Suggestion |

## Output format

Findings are ranked by severity. Each finding includes:

- Rule ID (e.g., T6, A3, M2)
- File:line reference
- Verdict: SUSTAINED / DOWNGRADED / REJECTED
