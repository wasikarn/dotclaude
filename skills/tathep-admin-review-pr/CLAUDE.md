# tathep-admin-review-pr skill

PR review skill for tathep-admin (Next.js 14 Pages Router + Tailwind + Headless UI + Vitest).
SKILL.md is the agent entry point; references/ provides supporting detail.

## Docs Index

Prefer reading before editing — key references:

| Reference | When to use |
| --- | --- |
| `references/checklist.md` | Adding/updating review criteria for a rule |
| `references/examples.md` | Adding ✅/❌ code examples for a rule |

## Skill Architecture

- `SKILL.md` — agent entry point; defines phase workflow, Hard Rules, and 7-agent dispatch
- `references/checklist.md` — 12-rule criteria with 🔴/🟡/🔵 severity markers; loaded by Phase 3 agents
- `references/examples.md` — ✅/❌ code examples per rule; evidence agents use when flagging issues

## Validate After Changes

```bash
# Lint all markdown in this skill
npx markdownlint-cli2 "skills/tathep-admin-review-pr/**/*.md"

# Verify skill symlink exists
ls -la ~/.claude/skills/tathep-admin-review-pr

# Invoke skill (run in tathep-admin repo):
# /tathep-admin-review-pr <pr-number> [jira-key?] [Author|Reviewer]

# Project validate (run in tathep-admin repo):
# npm run ts-check && npm run lint@fix && npm run test
```

## Skill System

SKILL.md frontmatter controls how Claude invokes this skill:

- `description:` — Claude matches user intent; prefer trigger-complete descriptions — wrong description = skill never auto-triggers
- `name:` — the slash command name (`/tathep-admin-review-pr`)
- `disable-model-invocation: true` — manual invocation only (heavy 7-agent dispatch)

## Project Context

- **GitHub repo:** `100-Stars-Co/bluedragon-eye-admin`
- **Jira key format:** `BEP-XXXX`
- **Validate command:** `npm run ts-check && npm run lint@fix && npm run test`
- **Scope:** `git diff develop...HEAD` — changed files only

## Gotchas

- **Phase 0 (PR Scope Assessment)** runs before ticket fetch — classifies PR size, adapts review behavior for large PRs
- **Phase 3.5 (Consolidation)** is explicit sub-phase after CHECKPOINT — dedup, verify, remove false positives
- **Shared conventions** in `references/review-conventions.md` — comment labels, dedup protocol, strengths guidelines, PR size thresholds
- This CLAUDE.md is **tracked in git** — changes here are shared with the team
- **`lint@fix` uses `@` not `:`** — `npm run lint@fix` (NOT `lint:fix`) — easy to confuse with web skill
- **Pages Router project** — App Router patterns (RSC, Server Components, `React.cache()`) do NOT apply
- Reviewer comments must be in Thai mixed with English technical terms (casual Slack/PR tone)
- Submit all inline comments + decision in ONE `gh api` call — not one-by-one
- Phase 3 agents are READ-ONLY — code edits only happen in Phase 4 (Author mode)
- Hard Rules in SKILL.md bypass confidence filter — always reported unconditionally; keep criteria precise
