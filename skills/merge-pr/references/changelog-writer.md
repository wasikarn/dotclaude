# CHANGELOG Writer

Hybrid CHANGELOG generation algorithm. Runs automatically — no `AskUserQuestion`. Shows output in
progress log. Reads `changelog-format.md` for format rules.

---

## Step 1: Detect CHANGELOG file

Check in order: `CHANGELOG.md` → `CHANGES.md` → `HISTORY.md`

If none found → create `CHANGELOG.md` with this content:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
```

Store detected path as `{changelog_file}`.

---

## Step 2: Extract \[Unreleased\] entries

Read `{changelog_file}`. If a `## [Unreleased]` section exists, extract all lines between it and the
next `## [` heading. Store as `{unreleased_entries}` (may be empty). Mark the section for removal
after the new version section is inserted.

---

## Step 3: Get git log for range

```bash
# Mode 2 (hotfix) — list specific fix commits:
git log --pretty=format:"%s" $fix_shas   # unquoted: shell word-splitting enumerates SHAs

# Mode 3 (release):
git log --pretty=format:"%s" origin/main..HEAD
```

Store subject lines as `{raw_commits}`.

---

## Step 4: Categorize commits

Map each subject line to a CHANGELOG section. Skip noise commits entirely.

| Prefix | Section |
| --- | --- |
| `feat:` / `add:` | `### Added` |
| `fix:` / `bug:` | `### Fixed` |
| `perf:` / `refactor:` / `imp:` | `### Changed` |
| `security:` | `### Security` |
| `chore:` / `ci:` / `test:` / `docs:` / `bump:` / `merge:` / `revert:` | **SKIP** |
| no prefix | Claude judgment — include if user-facing, skip if implementation detail |

---

## Step 5: Write user-facing descriptions

For each kept commit:

- Strip the conventional prefix (`"feat: "` → `""`)
- Title-case the first word
- Remove inline ticket numbers from the subject (e.g., `"ABC-123 "` prefix or `" (ABC-123)"` suffix)
- Keep PR references: `"(#456)"` stays
- Format as `- {description}`

Example: `"feat: add health check endpoint (#87)"` → `"- Add health check endpoint (#87)"`

---

## Step 6: Deduplicate against \[Unreleased\]

For each categorized git log entry, skip it if an entry in `{unreleased_entries}` is semantically
equivalent (same action described, regardless of wording differences).

---

## Step 7: Build new version section

```markdown
## [{next_version}] - {today_date YYYY-MM-DD}
```

Mode 2 (hotfix): include `### Fixed` only.
Mode 3 (release): include all sections that have entries (`### Added`, `### Changed`, `### Fixed`, `### Security`).

Merge `{unreleased_entries}` + deduplicated git log entries under the appropriate section headers.

---

## Step 8: Handle empty entries

If both `{unreleased_entries}` is empty AND git log produces zero categorized entries:

- Insert placeholder: `- Release v{next_version}` under the `### Fixed` (Mode 2) or `### Added` (Mode 3) header
- Warn in progress output: `[!] No changelog entries found — added placeholder. Update manually.`

---

## Step 9: Write to CHANGELOG file

1. Remove the `## [Unreleased]` section and its contents (entries have been moved)
2. Insert the new version section immediately after the `# Changelog` header line (or at the top if no header)
3. Do not modify any existing version entries

Show the generated section in the progress output before proceeding.
