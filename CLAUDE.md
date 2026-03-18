# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

A collection of Claude Code skills (custom slash commands). Each skill is a self-contained prompt workflow installed into Claude Code via the skills system.

## Docs Index

Prefer reading source before editing — key references:

| Reference | Contents |
| --- | --- |
| [`references/skills-best-practices.md`](references/skills-best-practices.md) | Full frontmatter spec, description rules, substitutions (`$0`/`$1`/`!`), context budget |
| [`references/skill-creation-guide.md`](references/skill-creation-guide.md) | 5 golden rules, creation workflow, skill brief template, anti-patterns |
| `skills/<name>/references/checklist.md` | Per-skill review criteria with severity markers (review-pr skills) |
| `skills/<name>/references/examples.md` | Per-skill ✅/❌ code examples for all 12 rules (review-pr skills) |
| [`references/review-conventions.md`](references/review-conventions.md) | Comment labels, dedup protocol, strengths, PR size thresholds |

## Skill Structure

Each skill lives at `skills/<skill-name>/` with this layout:

```text
skills/<name>/
  SKILL.md          # Agent entry point — required; loaded when skill is invoked
  CLAUDE.md         # Contributor context — read by Claude when editing this repo
  references/       # Supporting docs loaded into agent context from SKILL.md
  scripts/          # Helper scripts referenced from SKILL.md or CLAUDE.md
```

### SKILL.md Frontmatter

Required: `name`, `description` (max 1024 chars, cover what + when + triggers). Optional: `argument-hint`, `disable-model-invocation`, `user-invocable`, `allowed-tools`, `model`, `context`, `agent`, `hooks`, `compatibility`. Substitutions: `$ARGUMENTS`, `$N`, `${CLAUDE_SKILL_DIR}`, `` !`command` ``.

Full spec + examples: [references/skills-best-practices.md](references/skills-best-practices.md)

## Skills in This Repo

| Skill | Purpose |
| --- | --- |
| `optimize-context` | Audit and optimize CLAUDE.md files |
| `env-heal` | Scan and fix environment variable mismatches |
| `merge-pr` | Git-flow merge and deploy (feature/hotfix/release modes) |
| `dlc-build` | Full development loop (Research → Plan → Implement → Review → Ship) |
| `dlc-review` | Adversarial PR review with 3-reviewer debate |
| `dlc-respond` | Address PR review comments as author |
| `dlc-debug` | Parallel root cause analysis + DX hardening |
| `systems-thinking` | Causal Loop Diagram analysis for architecture decisions |

Commands live at `commands/<name>.md` (symlinked to `~/.claude/commands/`). Current: `analyze-claude-features`.

## Agents

Custom subagents live at `agents/<name>.md` with YAML frontmatter. Symlinked to `~/.claude/agents/` via `link-skill.sh`.

Key fields: `description` (include "proactively" to auto-trigger), `memory` (`user`/`project`/`local` for cross-session persistence), `skills` (preload into agent context). All fields: `name`, `tools`/`disallowedTools`, `model`, `hooks`, `permissionMode`, `maxTurns`, `background`, `isolation`.

Current agents (7):

| Agent | Model | Purpose |
| --- | --- | --- |
| `commit-finalizer` | haiku | Fast git commit with conventional commits format |
| `dev-loop-bootstrap` | haiku | Pre-gather Phase 1 context before dlc-build explorer spawns |
| `dlc-debug-bootstrap` | haiku | Pre-gather debug context before dlc-debug Investigator spawns |
| `pr-review-bootstrap` | sonnet | Fetch PR diff + Jira AC in one pass before review |
| `review-consolidator` | haiku | Dedup/sort multi-reviewer findings into single ranked table |
| `skill-validator` | sonnet | Validates SKILL.md against best practices |
| `tathep-reviewer` | sonnet | Code reviewer with persistent memory + preloaded skills |

## Hooks

Lifecycle hooks automate actions at specific points. Configured in `.claude/settings.json` or `~/.claude/settings.json`.

Active hooks — `P` = `.claude/settings.json` (project), `G` = `~/.claude/settings.json` (global):

| Event | Matcher | Script | What it does | Loc |
| --- | --- | --- | --- | --- |
| `SessionStart` | `startup` | `session-start-context.sh` | Inject git state on fresh session | P |
| `SessionStart` | `compact` | `post-compact-context.sh` | Re-inject context after compaction | G |
| `PreToolUse` | `Edit\|Write` | `protect-files.sh` | Block edits to `.claude/settings.json` | P |
| `PostToolUse` | `Edit\|Write` | _(inline)_ | Auto-lint `.md` files after edits | P |
| `Stop` | — | _(prompt)_ | Verify tasks complete before stopping (with `stop_hook_active` guard) | G |
| `TaskCompleted` | `review-debate` | `task-gate.sh` | Verify file:line evidence in review/debate task completions | P |
| `TaskCompleted` | `dev-loop` | `task-gate.sh` | Verify file:line evidence in dev-loop task completions | P |
| `TaskCompleted` | `respond` | `task-gate.sh` | Verify file:line evidence in respond task completions | P |
| `TeammateIdle` | `review-pr` | `idle-nudge.sh` | Nudge idle teammates during debate rounds | P |
| `TeammateIdle` | `dev-loop` | `idle-nudge.sh` | Nudge idle dev-loop teammates to stay on task | P |
| `TeammateIdle` | `respond` | `idle-nudge.sh` | Nudge idle Fixer teammates | P |
| `TeammateIdle` | `debug-` | `idle-nudge.sh` | Nudge idle Investigator teammates | P |
| `Notification` | `*` | _(inline)_ | macOS desktop alert when input needed | G |

Hook scripts live at `hooks/` and are symlinked to `~/.claude/hooks/` via `link-skill.sh`. `task-gate.sh` and `idle-nudge.sh` are parameterized via env vars in each matcher's command string.

## Output Styles

Custom output styles live at `output-styles/<name>.md` with frontmatter (`name`, `description`, `keep-coding-instructions`). Symlinked to `~/.claude/output-styles/` via `link-skill.sh`.

Output styles replace the default system prompt's coding instructions unless `keep-coding-instructions: true`. Use for consistent formatting/tone across sessions.

Current styles: `thai-tech-lead` (Thai language tech lead mode), `coding-mentor` (explains architecture decisions inline while coding)

## Global CLAUDE.md

`global-CLAUDE.md` at repo root is a tracked copy of `~/.claude/CLAUDE.md` — serves as version-controlled backup and reference. Not auto-loaded; sync manually when updating the global file.

## Plugin

Plugin manifest at `.claude-plugin/plugin.json` packages this skills collection for distribution. Install via `gh` or direct clone — see [Claude Code plugins docs](https://code.claude.com/docs/en/plugins.md).

## Adding a New Skill

1. Create `skills/<name>/SKILL.md` with YAML frontmatter
2. Add `argument-hint` if the skill takes arguments; add `compatibility` for prerequisite tools
3. Add `references/` docs if the skill needs supporting material
4. Keep `description:` trigger-complete (what + when + keywords) — max 1024 chars
5. Use `disable-model-invocation: true` for side-effect skills (deploy, PR review)
6. Create `skills/<name>/CLAUDE.md` with contributor context: architecture overview, validate commands, gotchas specific to this skill
7. Install symlink: `bash scripts/link-skill.sh <name>` (or `--list` to check, no args to link all)
8. Lint: `npx markdownlint-cli2 "skills/<name>/**/*.md"` — pre-commit hook auto-fixes staged `.md` files

## Repo Commands

| Task | Command |
| --- | --- |
| Lint all markdown | `npx markdownlint-cli2 "**/*.md"` |
| Link one skill | `bash scripts/link-skill.sh <name>` |
| Link everything | `bash scripts/link-skill.sh` (skills, agents, hooks, output-styles) |
| Check all links | `bash scripts/link-skill.sh --list` |
| Sync docs cache | `bash scripts/sync-docs.sh` (fetches Claude Code official docs to `~/.claude/docs/`) |

## Gotchas

- `context: fork` + `agent` field runs skills in isolated subagent — available but not used in this repo (removed for real-time streaming visibility and follow-up interaction)
- Pre-commit hook auto-fixes staged `.md` files — runs `scripts/fix-tables.sh` + `markdownlint-cli2 --fix`; no manual fix needed before commit
- `disable-model-invocation: true` removes description from context entirely (skill never auto-triggers); `user-invocable: false` hides from menu but keeps context — different effects
- Run `/optimize-context` when this file feels stale
