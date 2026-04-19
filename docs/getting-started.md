# Getting Started with devflow

Production-grade development workflows for Claude Code.

## Quick Start (5 minutes)

### 1. Install Plugin

```bash
claude plugin install devflow
claude config set env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS 1
```

### 2. Verify Installation

```bash
claude config get env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS
# Should output: 1
```

### 3. Start Working

```bash
/df-start    # Onboard + quick build
/df-code     # Iterate
/df-ship     # Review + merge
```

## Core Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/df-start` | Onboard + quick build | Starting new project |
| `/df-code` | Build + test loop | Rapid iteration |
| `/df-build` | Full dev loop | Complete feature work |
| `/df-review` | PR review | Code review needed |
| `/df-ship` | Review + merge | Ready to deploy |
| `/df-debug` | Root cause analysis | Something broken |
| `/df-respond` | Fix PR comments | Addressing review |

## Mode Quick Reference

| Mode | Speed | Quality | Use Case |
|------|-------|---------|----------|
| `--micro` | Fastest | Minimal | Spikes, prototypes |
| `--quick` | Fast | Standard | Most feature work |
| `--full` | Standard | Thorough | Complex changes |
| `--hotfix` | Fastest | Safety-first | Production incidents |

## Project Structure

After `/df-start`, your project has:

```text
.claude/
├── hard-rules.md        # Project-specific rules
├── build/               # Session artifacts
└── skills/              # Project skill overrides (optional)

```

## Principles

1. **Evidence over assumptions** — Verify before claiming complete
2. **YAGNI** — Plan challenger asks before implement
3. **Shift Left** — Quality gates from design phase
4. **Adversarial debate** — Multiple reviewers challenge findings
5. **Cross-session memory** — Agents learn project patterns

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Agent teams not enabled" | Run: `claude config set env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS 1` |
| Skills not appearing | Run: `claude plugin install devflow` again |
| Permission errors | Check `.claude/` directory permissions |

## Next Steps

- Read `/skills/df-build/SKILL.md` for full dev loop
- Read `/skills/df-review/SKILL.md` for review process
- Run `/df-onboard` to customize project rules

## Documentation

- [Skill Best Practices](references/skills-best-practices.md)
- [Skill Creation Guide](references/skill-creation-guide.md)
- [Contributing](../CONTRIBUTING.md)
