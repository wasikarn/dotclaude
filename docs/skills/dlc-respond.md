# dlc-respond — Development Loop Cycle: Respond to PR Review

Address PR reviewer comments systematically — fetches all open threads, groups by file,
applies fixes, verifies intent, posts replies.

## When to use

Use `/dlc-respond` after receiving PR review comments you want to address.

## Invocation

    /dlc-respond [PR number]
    /dlc-respond 42

## Phases

| Phase | What happens |
| --- | --- |
| **1 — Bootstrap** | Fetch all open PR threads + affected file contents |
| **2 — Fix** | Fixer agents address each thread (parallel by file group) |
| **3 — Verify** | fix-intent-verifier checks ADDRESSED / PARTIAL / MISALIGNED |
| **4 — Reply** | Post reply comments to each resolved thread |
| **5 — Commit** | Stage and commit fixes with conventional commit message |
