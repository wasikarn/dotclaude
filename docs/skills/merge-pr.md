# merge-pr — Git-Flow Merge and Deploy

Safe PR merge with preflight checks, changelog update, and optional deploy trigger.

## When to use

Use `/merge-pr` to merge a PR after it's approved — runs preflight safety checks
before any irreversible git operations.

## Invocation

    /merge-pr [PR number]
    /merge-pr 42

## Preflight checks (via merge-preflight agent)

- CI status: all required checks must pass
- Draft state: PR must not be draft
- Merge conflicts: branch must be up to date
- CHANGELOG: entry must exist for this change
- No concurrent hotfix branches (for feature merges)

## Modes

| Mode | Trigger |
| --- | --- |
| `feature` | Default — merge feature branch to main |
| `hotfix` | Merge hotfix to main + back-merge to develop |
| `release` | Tag + GitHub release creation |
