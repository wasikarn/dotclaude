# dotclaude

Personal Claude Code configuration — skills, agents, hooks, output styles, and scripts. Symlinked to `~/.claude/` for immediate effect across all sessions.

## Install as Plugin (recommended for teams)

```bash
# Install via GitHub
claude plugin install wasikarn/dotclaude

# Or in dev mode (local path)
claude --plugin-dir /path/to/dotclaude
```

Skills are namespaced after install: `/claude-code-skills:dlc-build`, `/claude-code-skills:dlc-review`, etc.

> **What's included automatically:** skills, agents, commands, output styles, and workflow hooks (skill routing, task gates, idle nudges, session context, file protection, shellcheck).
>
> **What requires manual setup:** `post-compact-context` hook (global `~/.claude/settings.json`), sound notifications, QMD semantic search (`qmd-pre-search`), and personal dotfiles (`zshrc`, `global-CLAUDE.md`). See [Global Hooks](#global-hooks) below.

## Personal Setup (symlink method)

```bash
# New machine setup
bash scripts/install.sh

# Link all assets (skills, agents, hooks, output-styles, commands, scripts, dotfiles)
bash scripts/link-skill.sh

# Link one skill
bash scripts/link-skill.sh <name>

# Check symlink status
bash scripts/link-skill.sh --list
```

## Contents

### Skills (8)

| Category | Skills | Description |
| --- | --- | --- |
| **DLC Workflows** | `dlc-build`, `dlc-review`, `dlc-respond`, `dlc-debug` | Full DLC — feature dev (`--quick`/`--hotfix`), adversarial PR review, respond to review comments, debug |
| **Thinking** | `systems-thinking` | Causal Loop Diagram analysis for architecture decisions and bottleneck diagnosis |
| **Utilities** | `optimize-context`, `env-heal`, `merge-pr` | CLAUDE.md optimizer, env var healing, git-flow merge and deploy (feature/hotfix/release) |

### Agents (7)

| Agent | Model | Purpose |
| --- | --- | --- |
| `commit-finalizer` | haiku | Fast git commit with conventional commits format |
| `dev-loop-bootstrap` | haiku | Pre-gather Phase 1 context before dlc-build explorer spawns |
| `dlc-debug-bootstrap` | haiku | Pre-gather debug context before dlc-debug Investigator spawns |
| `pr-review-bootstrap` | sonnet | Fetch PR diff + Jira AC in one pass before review |
| `review-consolidator` | haiku | Dedup/sort multi-reviewer findings into single ranked table |
| `skill-validator` | sonnet | Validates SKILL.md against best practices |
| `tathep-reviewer` | sonnet | Code reviewer with persistent memory + preloaded skills |

### Hooks (13)

> **Critical:** `skill-routing.sh` is required for reliable skill auto-triggering. Without it, skills activate only ~20% of the time. `install.sh` sets this up automatically via `settings.json`.

| Hook | Event | Purpose |
| --- | --- | --- |
| `skill-routing.sh` | UserPromptSubmit | **Critical** — Forces Claude to evaluate all skills before responding (~84% trigger rate) |
| `session-start-context.sh` | SessionStart | Inject git state + project detection |
| `session-start-mcp-cleanup.sh` | SessionStart | Kill orphaned MCP processes from force-closed sessions |
| `post-compact-context.sh` | SessionStart[compact] | Re-inject context after compaction |
| `bash-blockers.sh` | PreToolUse[Bash] | Block bash commands that have dedicated Claude tools (cat, head, grep, etc.) |
| `protect-files.sh` | PreToolUse[Edit\|Write] | Block edits to protected config files |
| `qmd-pre-search.sh` | PreToolUse[Grep] | Inject QMD semantic search results before grep |
| `auto-test-env.sh` | PostToolUse[Edit\|Write] | Auto-detect test framework after file edits |
| `shellcheck-written-scripts.sh` | PostToolUse[Write] | Auto-validate shell scripts after writing |
| `session-summary-hook.sh` | PostToolUse[Bash] | Track session activity |
| `idle-nudge.sh` | TeammateIdle | Nudge idle teammates (dev-loop, review-debate, respond, debug) |
| `task-gate.sh` | TaskCompleted | Gate task completions — verify file:line evidence |
| `play-sound.sh` | Notification/Stop | macOS sound feedback (CS:S sounds) |
| `patch-plugin-skills.sh` | — | Patch plugin skill files after updates |

### Output Styles (2)

| Style | Description |
| --- | --- |
| `thai-tech-lead` | Thai language, concise, architecture-focused |
| `coding-mentor` | Explains decisions inline while coding |

### Commands (1)

| Command | Description |
| --- | --- |
| `analyze-claude-features` | Analyze Claude Code features and capabilities |

### Scripts (6)

| Script | Description |
| --- | --- |
| `install.sh` | New machine setup — prerequisites, settings.json from template, symlinks |
| `link-skill.sh` | Symlink manager — links all asset types + dotfiles to `~/.claude/` |
| `detect-project.sh` | Auto-detect current project type for context injection |
| `pr-context.sh` | Fetch PR context (diff, Jira, AC) for review agents |
| `classify-env-gaps.sh` | Classify missing env vars by severity |
| `fix-tables.py` | Fix markdown table formatting |

### Dotfiles

| File | Symlink Target | Description |
| --- | --- | --- |
| `global-CLAUDE.md` | `~/.claude/CLAUDE.md` | Global instructions for all projects |
| `statusline.sh` | `~/.claude/statusline.sh` | Custom status line display |
| `zshrc` | `~/.zshrc` | Optimized zsh config — startup ~0.11s, evalcache, lazy NVM, atuin, fzf-tab |
| `global-settings.template.json` | *(template only)* | Settings template for new machine setup |

## Repo Structure

```text
dotclaude/
├── skills/           → ~/.claude/skills/
├── agents/           → ~/.claude/agents/
├── hooks/            → ~/.claude/hooks/
├── output-styles/    → ~/.claude/output-styles/
├── commands/         → ~/.claude/commands/
├── scripts/          → ~/.claude/scripts/
├── references/       # Shared reference docs (not symlinked)
├── global-CLAUDE.md  → ~/.claude/CLAUDE.md
├── statusline.sh     → ~/.claude/statusline.sh
├── zshrc             → ~/.zshrc
└── global-settings.template.json  # Template for settings.json
```

## Global Hooks

Hooks that require manual setup in `~/.claude/settings.json` (not bundled in the plugin because they are personal or have external dependencies):

| Hook | Event | Why manual |
| --- | --- | --- |
| `post-compact-context.sh` | SessionStart[compact] | Global scope only — must be in `~/.claude/settings.json` |
| `play-sound.sh` | Notification/Stop | Personal preference (macOS + CS:S sounds) |
| `qmd-pre-search.sh` | PreToolUse[Grep] | Requires [QMD](https://github.com/kobig/qmd) installed and indexed |
| `session-summary-hook.sh` | PostToolUse[Bash] | Requires claude-mem |

Use `global-settings.template.json` as a reference for configuring these.

## New Machine Setup

```bash
git clone git@github.com:wasikarn/dotclaude.git ~/Codes/Personals/dotclaude
cd ~/Codes/Personals/dotclaude
bash scripts/install.sh
```

The install script will:

1. Check prerequisites (git, jq, node/bun)
2. Generate `~/.claude/settings.json` from template
3. Create required directories
4. Run `link-skill.sh` to symlink everything
