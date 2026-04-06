# Phase 3: Reply to Threads

Post a reply for each thread. Comment labels per [../../df-review-conventions/SKILL.md](../../df-review-conventions/SKILL.md).

```bash
gh api repos/{owner}/{repo}/pulls/comments/{comment_id}/replies \
  -f body="{reply_body}"
```

**Before posting replies:** Lead verifies `rtk git log --oneline -10` — confirm that the sha in each planned reply matches the commit whose message references that thread. Mismatched sha → fix the reply before posting.

Reply format and PR summary template: [operational.md](operational.md#phase-3-reply-formats).

After all thread replies, post summary:

```bash
gh pr review {pr} --comment --body "{summary}"
```

Update `{artifacts_dir}/respond-context.md` progress section after each thread reply.

**GATE:** All threads replied. (See [phase-gates.md](phase-gates.md) Reply → Re-request gate.)
