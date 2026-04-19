# Skill Reference

Complete skill catalog for devflow.

## All Skills

| Skill | Purpose |
| --- | --- |
| `df-start` | **Quick start** — onboard project + build with minimal ceremony |
| `df-code` | **Dev loop** — build + test cycle for rapid iteration |
| `df-ship` | **Complete** — review + merge to close the loop |
| `df-build` | Full development loop (Research → Plan → Implement → Review → Ship) |
| `df-review` | Adversarial PR review with 3-reviewer debate |
| `df-debug` | Parallel root cause analysis + DX hardening |
| `df-respond` | Address PR review comments as author |
| `df-merge` | Git-flow merge and deploy (feature/hotfix/release modes) |
| `df-refactor` | Safe refactoring — runs tests before/after |
| `df-tests` | Framework-aware test generation |
| `df-docs` | API, README, and inline documentation generation |
| `df-audit` | Security + dependency audit |
| `df-metrics` | Retrospective report from devflow-metrics.jsonl |
| `df-dashboard` | Terminal-friendly metrics summary |
| `df-status` | Show active Devflow session artifacts |
| `df-onboard` | Bootstrap a new project |
| `df-qa` | Run QA check suite |
| `df-setup` | Post-install setup |
| `df-optimize` | Audit and optimize CLAUDE.md files |
| `df-analyze` | Audit project against Claude Code features |
| `df-promote` | Review Hard Rule candidates |
| `df-systems` | Causal Loop Diagram analysis |
| `df-adr` | Architecture Decision Record |
| `df-env-heal` | Fix environment variable mismatches |
| `df-careful` | Enter careful mode |
| `df-freeze` | Freeze file from editing |
| `df-test-patterns` | Test quality patterns |
| `df-review-rules` | _(background)_ 12-point review framework |
| `df-review-conventions` | _(background)_ Comment labels, dedup protocol |
| `df-review-output` | _(background)_ PR review output format |
| `df-review-examples` | _(background)_ Code pattern examples |
| `df-debate` | _(background)_ Adversarial debate rules |
| `df-jira` | _(background)_ Jira integration |
| `df-debate-protocol` | _(background)_ Debate consensus criteria |

## Skills by Phase

```text
DEFINE ──┬─ df-systems, df-adr
PLAN ────┬─ df-onboard, df-status
BUILD ───┬─ df-build, df-code, df-start, df-refactor
VERIFY ──┬─ df-tests, df-test-patterns, df-debug
REVIEW ──┬─ df-review, df-respond, df-ship
SHIP ────┬─ df-merge-pr, df-docs
MAINTAIN ┬─ df-audit, df-metrics, df-dashboard, df-optimize, df-env-heal, df-promote
UTILITY ─┬─ df-careful, df-freeze, df-qa, df-setup
```

## Skill Comparison

| Aspect | review | build | debug | respond |
| --- | --- | --- | --- | --- |
| Scope | PR review + debate | Full dev loop | Debug + DX | PR comment response |
| Execution | 3 teammates | Dynamic roster | Investigator + DX + Fixer | 1 Fixer per file |
| Loop | None | Max 3 iter | Max 3 attempts | Max 3 per thread |

All require `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` (degrades gracefully).
