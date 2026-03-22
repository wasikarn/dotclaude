# dlc-build — Development Loop Cycle: Build

Full structured development workflow: Research → Plan → Implement → Review → Ship.

## When to use

Use `/dlc-build` when implementing a feature, bugfix, or refactor that needs
structured phases with quality gates — not for quick one-line edits.

## Invocation

    /dlc-build [feature description or Jira key]
    /dlc-build BEP-123
    /dlc-build "add retry logic to API client"

## Phases

| Phase | What happens |
| --- | --- |
| **0 — Triage** | Reads Jira AC (if key given), checks if task is clear |
| **1 — Research** | Bootstrap + Explorer agents map affected files |
| **2 — Plan** | Plan-challenger reviews the implementation plan |
| **3 — Implement** | Implementer agents write code with TDD |
| **4 — Review** | 3 parallel reviewer agents debate findings |
| **5 — Falsify** | Falsification agent challenges findings |
| **6 — Ship** | Consolidate, commit, optional Jira sync |

## Modes

| Flag | Mode |
| --- | --- |
| `--quick` | Skip debate, single reviewer, fast iteration |
| `--feature` | Full feature mode with Jira AC gate |
| `--hotfix` | Hotfix mode — minimal research, fast ship |

## Requirements

- `gh` CLI authenticated
- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
- `jq` installed
