# Jira Integration for team-* Skills

Shared Jira context injection for team-review-pr, team-dev-loop, and team-debug.
All Jira phases are optional — if no Jira key detected, skip entirely.

---

## Detection & Fetch

### Detect Jira Key

Scan all `$ARGUMENTS` for pattern `BEP-\d+` (case-insensitive). Position-agnostic — the key can appear anywhere in the arguments.

- Match found → extract key, proceed with fetch
- No match → skip all Jira sections, proceed as if no ticket

### Fetch Ticket

Try in order (stop at first success):

1. **`jira-cache-server`** → `cache_get_issue` with the detected key (preferred — cached, fast)
2. **`mcp-atlassian`** → `jira_get_issue` with the detected key (fallback — direct API)
3. **Neither available** → warn user "Jira MCP not configured, skipping ticket context" → skip Jira sections

If fetch fails (API error, ticket not found) → warn → skip Jira sections → proceed normally. Jira context is never blocking.

### Extract Fields

From the issue response, extract and summarize:

| Field | Source | Notes |
| --- | --- | --- |
| `summary` | Issue title | — |
| `description` | Issue body | Truncate to key info |
| `acceptance_criteria` | Parse from description | Look for "AC:", "Acceptance Criteria", checkbox lists `- [ ]` |
| `priority` | Issue priority field | Map to P0/P1/P2/P3 |
| `status` | Issue status | Current workflow state |
| `subtasks` | Subtask list | Keys + summaries only |
| `parent` | Parent link | Epic/story key if exists |
| `linked_issues` | Issue links | Type (blocks, relates-to) + key + summary |

---

## team-review-pr: AC Verification

**Phase 0.5: Ticket Understanding** (between Phase 0: Scope Assessment and Phase 1: Project Detection)

1. Fetch ticket per Detection & Fetch above
2. Summarize ticket context:
   - **Problem:** What issue does the ticket address?
   - **Value:** Why does this matter?
   - **Scope:** What's in/out of scope?
3. Parse AC into numbered checklist items
4. Map each AC to file(s) in the PR diff:
   - Code not found → `[Critical] AC not implemented`
   - Code found but incomplete → `[Critical] AC partially implemented`
   - No test covering the AC → `[Critical] Missing test for AC`
5. Pass AC summary to Phase 2 teammate prompts — teammates should verify AC coverage in their review area
6. Include AC verification table in final output (Phase 4)

---

## team-dev-loop: Scope & Planning

**Phase 0, Step 2.5: Jira Context** (after Step 2: Classify Mode, before Step 3: Create Context Artifact)

1. Fetch ticket per Detection & Fetch above
2. Extract AC → each becomes a task item constraint for Phase 2 plan
3. Extract subtasks → map to plan structure if subtasks exist
4. Add to `dev-loop-context.md`:

   ```markdown
   ## Jira Ticket
   Key: BEP-XXXX
   Summary: {summary}
   Priority: {priority}
   Status: {status}

   ## Acceptance Criteria
   - [ ] AC1: {description}
   - [ ] AC2: {description}
   ```

5. **Phase 2 constraint:** Plan must address every AC — unaddressed AC is a plan gap, flag before proceeding
6. **Phase 5 constraint:** Assess must verify each AC has corresponding implementation + test — unverified AC = Critical finding

---

## team-debug: Bug Enrichment

**Phase 0, Step 1.5: Jira Context** (after Step 1: Detect Project, before Step 2: Classify Severity)

1. Fetch ticket per Detection & Fetch above
2. Enrich bug description with ticket details:
   - Reproduction steps (from description)
   - Expected vs actual behavior
   - Environment details
   - User-reported symptoms
3. Check linked issues → related bugs may share root cause — include in Investigator context
4. Use ticket priority to inform severity classification (Step 2):
   - Jira P0/P1 → suggest P0/P1 severity
   - Jira P2/P3 → suggest P2 severity
   - Lead still makes final classification based on actual impact
5. Add to `debug-context.md`:

   ```markdown
   ## Jira Ticket
   Key: BEP-XXXX
   Summary: {summary}
   Priority: {priority}

   ## Linked Issues
   - BEP-YYYY: {summary} (relates-to)
   - BEP-ZZZZ: {summary} (is-blocked-by)
   ```

6. Include Jira context in Investigator prompt (Phase 1) — helps narrow search area
