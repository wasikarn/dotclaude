# team-review-pr skill

Experimental Agent Teams-based PR review with adversarial debate.
Uses 3 reviewer teammates that challenge each other's findings instead of 7 parallel subagents.

## How It Differs from tathep-*-review-pr

| Aspect | tathep-*-review-pr | team-review-pr |
| --- | --- | --- |
| Execution | 7 subagents (report back only) | 3 teammates (debate each other) |
| False positive handling | Lead consolidation (Phase 3.5) | Adversarial debate + lead convergence |
| Project scope | Project-specific | Auto-detects project |
| Token cost | Lower (subagent results summarized) | Higher (each teammate = full session) |
| Feature status | Stable, production | Experimental |

## Docs Index

| Reference | When to use |
| --- | --- |
| `references/debate-protocol.md` | Modifying debate rules, round structure, or consensus criteria |
| `../../references/review-conventions.md` | Shared review conventions (labels, dedup, strengths) |
| `../../references/review-output-format.md` | Output format template |

## Skill Architecture

- `SKILL.md` — lead orchestration playbook; phases, team creation, debate flow
- `references/debate-protocol.md` — debate rules, round-robin assignment, consensus criteria
- Reuses shared `references/review-conventions.md` and `references/review-output-format.md`
- Project-specific Hard Rules loaded dynamically from `tathep-*-review-pr` skills

## Validate After Changes

```bash
# Lint all markdown in this skill
npx markdownlint-cli2 "skills/team-review-pr/**/*.md"

# Verify skill symlink exists
ls -la ~/.claude/skills/team-review-pr

# Test invocation (requires CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1):
# /team-review-pr <pr-number> [Author|Reviewer]
```

## Gotchas

- Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` — skill aborts gracefully if not set
- Agent teams have no session resumption for in-process teammates — recommend tmux mode
- Teammates are READ-ONLY during review and debate — code changes only in action phase
- Hard Rules cannot be dropped via debate — only reclassified with evidence
- Max 2 debate rounds enforced by lead — prevents runaway token usage
- Team cleanup must be done by lead, not teammates
- One team per session — cannot run multiple team-review-pr in parallel
