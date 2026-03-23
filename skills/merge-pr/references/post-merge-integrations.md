# Post-merge Integrations

Runs automatically after `git push origin v{next_version}` succeeds. Both integrations are
**non-blocking** — failure warns but does not abort (all git operations have already succeeded).

---

## Step 1: Detect repo name

```bash
REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner')
```

Store as `{repo}`.

---

## Step 2: Create GitHub Release

Extract the new version's section from `{changelog_file}`:

```bash
NOTES=$(awk "/^## \[{next_version}\]/{found=1; next} found && /^## \[/{exit} found{print}" {changelog_file})
```

Create the release:

```bash
gh release create "v{next_version}" \
  --title "v{next_version}" \
  --notes "$NOTES"
```

If this fails → warn in progress output and continue:

```text
[!] GitHub Release creation failed — create manually at https://github.com/{repo}/releases/new
```

---

## Step 3: Jira comment (conditional)

Only run if a Jira key was detected in `$ARGUMENTS` (format: `[A-Z]+-[0-9]+`, e.g. `BEP-123`).

Use MCP `jira_add_comment`:

```yaml
key:  {jira_key}
body: |
  ✅ Merged to {target_branch}
  PR: #{pr_number}
  Version: v{next_version}
  Tag: v{next_version}
  GitHub Release: https://github.com/{repo}/releases/tag/v{next_version}
```

If this fails → warn in progress output and continue:

```text
[!] Jira comment failed for {jira_key} — add manually.
```
