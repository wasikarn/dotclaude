# CLAUDE.md

Guidance for Claude Code when working with devflow.

**Plugin:** `devflow` · **Repo:** `wasikarn/devflow`

A Claude Code plugin for structured development workflows — skills, agents, hooks, and output styles.

## Principles

1. **Evidence over assumptions** — Verify before claiming complete
2. **YAGNI** — Plan challenger validates scope before implementation
3. **Shift Left** — Security and quality gates from design phase
4. **Adversarial debate** — Multiple reviewers challenge findings
5. **Cross-session memory** — Agents learn project patterns
6. **Adaptive ceremony** — Match process to complexity (micro/quick/full/hotfix)

## Quick Start

```bash
claude plugin install devflow
claude config set env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS 1
```

Workflow: `/df-start` → `/df-code` → `/df-ship`

See [`docs/getting-started.md`](docs/getting-started.md).

## Docs Index

| Reference | Contents |
| --- | --- |
| [`docs/getting-started.md`](docs/getting-started.md) | Quick start guide |
| [`docs/references/skills-catalog.md`](docs/references/skills-catalog.md) | Full skill list by phase |
| [`docs/references/skills-best-practices.md`](docs/references/skills-best-practices.md) | Frontmatter spec, context budget |
| [`docs/references/skill-creation-guide.md`](docs/references/skill-creation-guide.md) | 5 golden rules |
| `skills/<name>/references/` | Per-skill docs |

## Key Skills

| Skill | Purpose |
| --- | --- |
| `df-start` | Quick start — onboard + build |
| `df-code` | Dev loop — build + test |
| `df-ship` | Complete — review + merge |
| `df-build` | Full dev loop (R→P→I→R→S) |
| `df-review` | Adversarial PR review |
| `df-debug` | Root cause analysis |

See [skills-catalog.md](docs/references/skills-catalog.md) for all 33 skills.

## Skill Structure

`skills/<name>/SKILL.md` (entry) · `references/` (on-demand) · `scripts/` (helpers)

## Agents

Custom agents at `agents/<name>.md` with YAML frontmatter. See [`agents/`](agents/) — 27 total.

| Agent | Model | Purpose |
| --- | --- | --- |
| `falsification-agent` | sonnet | Challenges review findings |
| `plan-challenger` | sonnet | Validates YAGNI/scope |
| `code-reviewer` | sonnet | Review with memory |
| `review-consolidator` | haiku | Dedup findings |

## Hooks

Lifecycle hooks in `hooks/`, registered in `hooks.json`. See full list in [`hooks/hooks.json`](hooks/hooks.json) — 16 total.

| Event | Scripts |
| --- | --- |
| `SessionStart` | `check-deps.sh`, `session-start-context.sh` |
| `PreToolUse` | `protect-files.sh`, `safe-command-approver.sh` |
| `TaskCompleted` | `task-gate.sh` (evidence check) |

## Repo Commands

| Task | Command |
| --- | --- |
| Run QA | `bash scripts/qa-check.sh` |
| Bump version | `bash scripts/bump-version.sh <patch\|minor\|major>` |
| Validate plugin | `claude plugin validate` |

## Gotchas

- `context: fork` + `agent` runs in isolated subagent (only `env-heal` uses this)
- Pre-commit hook auto-fixes staged `.md` files
- **Never use `--no-verify`** — hooks enforce quality gates
- `user-invocable: false` hides from `/` menu but keeps auto-trigger

<important if="adding a new skill">

See [CONTRIBUTING.md](CONTRIBUTING.md). Rules:

- `description:` trigger-complete, max 1024 chars
- `compatibility:` for external tool deps
- Pre-commit hook auto-fixes — no manual lint needed

</important>

<!-- autoskills:start -->
<!-- autoskills:end -->
