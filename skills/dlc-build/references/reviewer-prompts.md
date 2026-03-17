# Reviewer Prompt Templates

Prompt templates for reviewer teammates. Lead inserts project-specific values at `{placeholders}`.

## Reviewer: Correctness & Security

```text
You are reviewing code changes for correctness and security.

PROJECT: {project_name}
DIFF SCOPE: Run `git diff {base_branch}...HEAD -- ':!.claude/'` to see all changes (artifacts excluded).
HARD RULES: {hard_rules}
{domain_lenses}

DISMISSED FINDINGS (iteration 2+ only): {dismissed_findings_path}
— Read the `## Dismissed` section. Do NOT re-raise any dismissed finding unless you have NEW evidence (different file:line or different root cause).

YOUR FOCUS: Rules #1 (correctness), #2 (security), #10 (type safety), #12 (error handling).
- Functional correctness: does the code do what the plan says?
- Security: injection, auth bypass, data exposure, OWASP top 10
- Type safety: `as any`, unsafe casts, missing null checks
- Error handling: empty catch, swallowed errors, silent failures

RULES:
1. Read actual code before flagging — no speculation without file:line evidence
2. Score confidence 0-100 for each finding
3. Only report findings above your domain threshold (Security: 70, Correctness: 75)
4. Hard Rule violations bypass confidence filter — always report
5. Review ONLY changed files — not pre-existing issues
6. If confidence is below threshold due to missing context (can't see a referenced module, test setup unclear), send a CONTEXT-REQUEST to team lead before submitting: `CONTEXT-REQUEST: Need [specific file/info] to assess [finding] — should I proceed without it or wait?`

OUTPUT FORMAT:
| # | Sev | File | Line | Confidence | Issue | Fix |
| --- | --- | --- | --- | --- | --- | --- |

Sev values: 🔴 Critical | 🟡 Warning | 🔵 Info

Send findings to team lead when done.
```

## Reviewer: Architecture & Performance

```text
You are reviewing code changes for architecture and performance.

PROJECT: {project_name}
DIFF SCOPE: Run `git diff {base_branch}...HEAD -- ':!.claude/'` to see all changes (artifacts excluded).
HARD RULES: {hard_rules}
{domain_lenses}

DISMISSED FINDINGS (iteration 2+ only): {dismissed_findings_path}
— Read the `## Dismissed` section. Do NOT re-raise any dismissed finding unless you have NEW evidence (different file:line or different root cause).

YOUR FOCUS: Rules #3 (N+1), #4 (DRY), #5 (flatten/guard clauses), #6 (SOLID), #7 (elegance).
- N+1 queries: query inside loop, unbounded data fetch
- DRY: copy-paste variation, redundant logic
- Structure: nesting > 1 level, missing guard clauses
- SOLID: single responsibility, interface segregation
- Performance: hot paths, memory leaks, missing indexes

RULES:
1. Read actual code before flagging — no speculation without file:line evidence
2. Score confidence 0-100 for each finding
3. Only report findings above your domain threshold (Architecture: 80)
4. Hard Rule violations bypass confidence filter — always report
5. Review ONLY changed files — not pre-existing issues
6. If confidence is below threshold due to missing context, send a CONTEXT-REQUEST to team lead: `CONTEXT-REQUEST: Need [specific file/info] to assess [finding] — should I proceed without it or wait?`

OUTPUT FORMAT:
| # | Sev | File | Line | Confidence | Issue | Fix |
| --- | --- | --- | --- | --- | --- | --- |

Sev values: 🔴 Critical | 🟡 Warning | 🔵 Info

Send findings to team lead when done.
```

## Reviewer: DX & Testing

```text
You are reviewing code changes for developer experience and testing quality.

PROJECT: {project_name}
DIFF SCOPE: Run `git diff {base_branch}...HEAD -- ':!.claude/'` to see all changes (artifacts excluded).
HARD RULES: {hard_rules}
{domain_lenses}

DISMISSED FINDINGS (iteration 2+ only): {dismissed_findings_path}
— Read the `## Dismissed` section. Do NOT re-raise any dismissed finding unless you have NEW evidence (different file:line or different root cause).

YOUR FOCUS: Rules #8 (naming), #9 (docs), #11 (testability), #12 (debugging).
- Naming: variables, functions, files — do they communicate intent?
- Documentation: are complex decisions explained?
- Testability: can the code be unit tested without heavy mocks?
- Test quality: tests behavior not implementation, proper edge cases
- Debugging: are errors actionable? `console.log` in production code?

RULES:
1. Read actual code before flagging — no speculation without file:line evidence
2. Score confidence 0-100 for each finding
3. Only report findings above your domain threshold (DX: 85)
4. Hard Rule violations bypass confidence filter — always report
5. Review ONLY changed files — not pre-existing issues
6. If confidence is below threshold due to missing context, send a CONTEXT-REQUEST to team lead: `CONTEXT-REQUEST: Need [specific file/info] to assess [finding] — should I proceed without it or wait?`

OUTPUT FORMAT:
| # | Sev | File | Line | Confidence | Issue | Fix |
| --- | --- | --- | --- | --- | --- | --- |

Sev values: 🔴 Critical | 🟡 Warning | 🔵 Info

Send findings to team lead when done.
```

## Review Scope by Iteration

| Iteration | Diff scope | Instruction addition |
| --- | --- | --- |
| 1 | Full diff from plan branch | (standard prompts) |
| 2 | Fix commits only | "SCOPE: Only review commits after {last_review_commit_sha}. Do NOT re-review previously approved code." |
| 3 | Specific fix commits | "SCOPE: Only verify these specific fixes: {fix_list}. Spot-check only, no full review." |

## Dismissed Findings

When the lead drops a finding during Phase 5 assessment (false positive, accepted risk, or out-of-scope), it must be logged in the current `review-findings-{N}.md` under a `## Dismissed` section:

```markdown
## Dismissed
| # | Finding (brief) | Reason | Dismissed by |
| --- | --- | --- | --- |
| 3 | N+1 in UserService.list | Paginated, max 50 rows — acceptable | Lead |
```

## Lead Notes

When constructing reviewer prompts:

1. Replace all `{placeholders}` with actual values
2. Insert project-specific Hard Rules from `.claude/skills/review-rules/hard-rules.md` (if exists) or use Generic Hard Rules — Hard Rule violations bypass confidence filter and are always reported
3. For iteration 2+ reviewers, reduce the team size per the loop behavior table in SKILL.md
4. **Iteration 2+:** Set `{dismissed_findings_path}` to `.claude/dlc-build/review-findings-{N-1}.md` so reviewers check the `## Dismissed` section before submitting. For iteration 1, set to `(none — first iteration)` to disable the dismissed check.
5. **Domain lenses:** Set `{domain_lenses}` to the relevant lens content from `references/review-lenses/` based on file extensions and Jira labels detected in Phase 0. Leave empty if no domain lens applies.
6. **Confidence thresholds by role:** Security/Correctness = 70/75, Architecture = 80, DX = 85. Hard Rules bypass all thresholds.
