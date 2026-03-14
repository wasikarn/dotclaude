# Session Research Summary — 2026-03-14

## Overview

Multi-session research and optimization across 8 projects. Focused on: evaluating external plugins/tools, extracting actionable knowledge, cross-pollinating patterns between projects, and reducing token costs.

---

## 1. wshobson/agents Plugin Marketplace — Evaluated & Rejected

**72 plugins, 112+ agents** — analyzed against existing setup.

### Decision: 0 plugins installed

| Angle | Finding |
| --- | --- |
| Quality | Mixed — some well-structured, many generic |
| Model assignment | Many use Opus (cost risk) |
| Agent vs Skill | Over-use of agents where skills suffice |
| Cost | High token overhead from agent spawning |
| Existing coverage | Our skills/hooks already cover 90%+ |

### Knowledge extracted (not plugins)

- **postgresql-schema-design** — new skill created from wshobson's content
  - FK columns: PostgreSQL does NOT auto-index FK columns
  - Avoid: `TIMESTAMP` (without tz), `VARCHAR(n)`, `CHAR(n)`, `SERIAL`, `FLOAT` for money
  - Index types: B-tree, Composite, Covering, Partial, Expression, GIN, GiST, BRIN
- **Debugging taxonomy** — added to team-debug skill
  - 6 failure modes: Logic, Data, State, Integration, Resource, Environment
  - Evidence classification: Direct, Correlational, Testimonial, Absence
  - Confidence thresholds: High >80%, Medium 50-80%, Low <50%

---

## 2. Claude Agent SDK — Analyzed & Not Adopted

**Agent SDK = Claude Code as a library** — same tools, same model, different billing.

| Aspect | Claude Code (current) | Agent SDK |
| --- | --- | --- |
| Billing | Subscription (Max/Pro) | API pay-per-token ($3/$15 MTok Sonnet) |
| Interface | Interactive CLI/VSCode | Programmatic (Python/TS) |
| Tools/Model | Same | Same |
| Skills/Hooks/Subagents | All available | All available |

### Conclusion

Agent SDK is for building products/services ON Claude, not for improving interactive Claude Code usage. Would ADD costs, not reduce them.

---

## 3. Medium Articles Analysis

### 3a. Systems Thinking + Critical Thinking (ODDS Team)

**Key concepts embedded into global CLAUDE.md:**

- 7 bottlenecks when AI enters software development:
  1. Code Review overload
  2. Integration/Merge conflicts
  3. Requirement Clarity gaps
  4. Test Strategy degradation
  5. Human Validation bottleneck
  6. Cognitive Load increase
  7. Maintainability debt
- 3 macro loops: R1 (Productivity), R2 (Bottleneck), B1 (Quality Control)
- Critical Thinking 6 components: Questioning, Reasoning, Fact vs Opinion, Bias Detection, Evidence Evaluation, Rational Judgment
- "AI confidence ≠ correctness" — firewall against trust spiral

**Actions taken:**

- Created `systems-thinking` skill with CLD methodology
- Updated global CLAUDE.md: 6-Angle Evaluation now includes "bottleneck shift" and "feedback loops"
- Added "AI suggested it" to Rationalizations table

### 3b. "I Made Claude 45% Smarter" (ichigo) — Debunked

7 "psychological prompting" techniques analyzed with Critical Thinking:

| Technique | Verdict | Reason |
| --- | --- | --- |
| $200 Tip | Gimmick | Pattern matching, not motivation; wastes tokens |
| "Take a deep breath" | Already covered | Skills + Plans force structured thinking |
| "I bet you can't" | Gimmick | Research on GPT-3.5/LLaMA 2023, not Claude 2026 |
| Emotional stakes | Waste tokens | Noise, no enforcement |
| Skip politeness | Already doing | Output style "Thai Tech Lead" = direct |
| Detailed persona | Already strong | Every skill has domain-specific context |
| Self-evaluation | Already covered | verification-before-completion skill |

**Conclusion:** Existing setup (domain-specific skills + structured workflows + verification gates) is systematically superior to psychological tricks.

### 3c. 4 Claude Code 2.1 Features (alirezarezvani)

| Feature | Already have? | Action |
| --- | --- | --- |
| `context: fork` in skills | Analyzed & intentionally removed (claude-mem #28236, #29201) | None |
| Deferred tool loading | `ENABLE_TOOL_SEARCH=true` already set | None |
| Subagent model override | `CLAUDE_CODE_SUBAGENT_MODEL=sonnet` already set | None |
| Permission scoping | Comprehensive allow/deny rules in place | None |

### 3d. Facebook Post "10 Tricks" — Evaluated

| # | Trick | Status |
| --- | --- | --- |
| 1 | `claude code insights` | Does not exist in official docs |
| 2 | AI-Generated Docs | spec-kit workflow covers this better |
| 3 | Context7 MCP | Already installed |
| 4 | Hooks guardrails | Already have 30+ hooks |
| 5 | `mcp_cli_mode` | Does not exist; `ENABLE_TOOL_SEARCH` is the real equivalent |
| 6 | Git Worktrees | Already have skill + worktree config |
| 7 | TypeScript Strict | Enforced in CLAUDE.md |
| 8 | User Stories Testing | dogfood skill + TDD skill |
| 9 | Adversarial Agents | pr-review-toolkit (5 agents) |
| 10 | Reverse Prompting | 6-Angle Evaluation + systems-thinking |

### 3e. "Soft Warning" in SKILL.md — Rejected

Facebook post suggested adding `COMPLEXITY WARNING` text to SKILL.md.

**Why rejected:** Text warnings have no enforcement. Our hooks (`exit 2` = hard block) and `permissions.deny` rules are systematically superior.

---

## 4. Model Configuration

### sonnet[1m] Discovery

| Alias | Context Window |
| --- | --- |
| `sonnet` | 200K (default) |
| `sonnet[1m]` | **1M** |
| `opus[1m]` | 1M |

**Action:** Changed `model` from `"sonnet"` to `"sonnet[1m]"` — 5x more context room, same Sonnet cost rate.

### effortLevel Removal (re-confirmed)

`effortLevel: "high"` was re-added at some point but removed again because:

- "high" is already the default
- Explicitly setting it risks enabling extended thinking budget (31,999 tokens/query billed as output)

---

## 5. CLI Tools Installed

```bash
brew install eza zoxide delta fd fzf direnv tlrc
```

| Tool | Purpose | Replaces |
| --- | --- | --- |
| `eza` | ls + git status + icons | `ls` |
| `zoxide` | Smart cd (remembers frequent dirs) | `cd` |
| `delta` | Git diff + syntax highlighting | `diff` |
| `fd` | Fast file finder | `find` |
| `fzf` | Fuzzy finder for everything | manual searching |
| `direnv` | Auto-load .envrc per directory | manual `source` |
| `tlrc` | Simplified man pages | `man` |

**Not recommended:** chezmoi (have dotclaude repo), htop/btop (nice-to-have), Warp terminal (use VSCode), Aider/Codex CLI (redundant with Claude Code).

---

## 6. RTK (Rust Token Killer)

Token-optimized CLI output compression. Auto-rewrite hook in global settings.

Key commands: `rtk discover` (find missed opportunities), `rtk gain` (savings stats).

Average savings: 60-90% token reduction on common dev operations.

---

## 7. Project Improvements

### jira-generator (10 changes)

| # | Change | Category |
| --- | --- | --- |
| 1 | Add `jira_batch_create_issues` to HR5/HR6/HR7 matchers | Critical gap |
| 2 | Move search-before-create to PreToolUse (blocking) | Security |
| 3 | sprint-planner: Opus → Sonnet + tools + skills | Cost |
| 4 | quality-gate: Haiku → Sonnet | Accuracy |
| 5 | Add acli transition/comment to HR6 patterns | Coverage |
| 6 | story-writer: add `memory: project` | Learning |
| 7 | Fix CLAUDE.md doc count 19 → 22 | Accuracy |
| 8 | Optimize troubleshooting.md (-42% tokens) | Token savings |
| 9 | Add `jira_transition_issue` pre-guard hook | Coverage |
| 10 | Add `fcntl.flock` file locking to hooks_state.py | Race condition prevention |

### tathep-platform-api (10 changes)

| # | Change | Category |
| --- | --- | --- |
| 1 | tathep-reviewer: add `memory: project` | Learning |
| 2 | tathep-reviewer: add `skills` (conventions preload) | Accuracy |
| 3 | Create `pre-test-file-protect.sh` hook | Security |
| 4 | Create `pre-migration-guard.sh` hook | Safety |
| 5 | Add Biome auto-format PostToolUse hook | Quality |
| 6 | Optimize Stop hook → command-based | Token savings |
| 7 | Add QMD auto-search hook | Coverage |
| 8 | Domain context for reviewer agent | Accuracy |
| 9 | Verify `mcp_cli_mode` → doesn't exist; `ENABLE_TOOL_SEARCH` is real equivalent | Clarification |
| 10 | Verify `claude code insights` → doesn't exist in official docs | Clarification |

### tathep-website (3 changes)

| # | Change |
| --- | --- |
| 1 | Add Biome auto-format PostToolUse hook |
| 2 | Add `pre-test-file-protect.sh` (protect vitest configs) |
| 3 | Optimize CLAUDE.md with project-specific context |

### tathep-admin (3 changes)

| # | Change |
| --- | --- |
| 1 | Add Biome auto-format PostToolUse hook |
| 2 | Add `pre-test-file-protect.sh` |
| 3 | Optimize CLAUDE.md |

### tathep-ai-agent-python (2 changes)

| # | Change |
| --- | --- |
| 1 | Add Ruff auto-format PostToolUse hook |
| 2 | Add Python-specific protected files |

### tathep-video-processing (2 changes)

| # | Change |
| --- | --- |
| 1 | Add Biome auto-format hook |
| 2 | Add protected files for FFmpeg configs |

### bd-vision-player (1 change)

| # | Change |
| --- | --- |
| 1 | Add Biome auto-format hook |

### amplitube-presets (1 change)

| # | Change |
| --- | --- |
| 1 | Add protected files for preset JSON schemas |

### Global settings (5 changes)

| # | Change |
| --- | --- |
| 1 | Model: `sonnet` → `sonnet[1m]` |
| 2 | Remove `effortLevel: "high"` (redundant, cost risk) |
| 3 | Remove empty hook arrays (token waste) |
| 4 | Fix `AGENT_BROWSER_ALLOWED_DOMAINS` (add bare `medium.com`) |
| 5 | Sync `global-settings.template.json` with actual settings |

### dotclaude repo

| # | Change |
| --- | --- |
| 1 | Rewrite README.md (full repo documentation) |
| 2 | Sync global-settings.template.json |
| 3 | Create this research summary |

---

## 8. Key Principles Reinforced

1. **Hard guardrails > soft warnings** — hooks with `exit 2` beat text warnings in SKILL.md
2. **Systematic approach > psychological tricks** — domain-specific skills + structured workflows > "$200 tip"
3. **DRY across projects** — cross-pollinate hooks/patterns via dotclaude repo
4. **Measure before optimizing** — verify claims with official docs before adopting
5. **Critical Thinking as firewall** — question AI-generated claims, verify evidence, separate fact from opinion
6. **Systems Thinking for architecture** — map loops before deciding, predict where stress moves
7. **Cost awareness** — Sonnet over Opus for agents, remove redundant settings, optimize token usage
