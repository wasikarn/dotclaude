# Skill Creation Guide — Best Practices

> Source: Synthesized from Anthropic's `skill-creator` tool and Skill Authoring Best Practices docs.

## Overview

A **Skill** is a reusable prompt workflow stored as `SKILL.md` that Claude loads before executing a task. Unlike ad-hoc prompting, Skills encode context once and apply it consistently across every invocation — no re-explaining required.

> **Analogy:** Ad-hoc prompt = hiring a new employee every day and retraining from scratch each time. Skill = a job manual that the employee reads before starting work — no repeated explanations needed.

### Skill vs. Ad-hoc Prompt

| Aspect | Ad-hoc Prompt | Skill |
| --- | --- | --- |
| Context | Repeated every time | Loaded once, applied always |
| Consistency | Varies per session | Identical across invocations |
| Trigger | Manual | Auto-detected from description |
| Maintainability | None | Version-controlled |

## Skill File Structure

```text
skill-name/
├── SKILL.md          # Required — agent entry point
├── references/       # Supporting docs (loaded on demand)
├── scripts/          # Executable helpers (no context cost)
└── assets/           # Templates, fonts, static files
```

### Loading Levels (Progressive Disclosure)

| Level | Content | When Loaded |
| --- | --- | --- |
| 1 — Metadata | `name` + `description` (~100 tokens) | Always in context |
| 2 — Body | `SKILL.md` content | On skill trigger |
| 3 — Resources | `references/`, `scripts/`, `assets/` | On demand only |

**Rule:** Keep body under 500 lines. Move anything beyond that to `references/`.

**Concise example — omit what Claude already knows:**

```text
# Bad (~150 tokens — Claude already knows what PDF is)
"PDF (Portable Document Format) files are a common file format
that contains text, images... blah blah... To extract text you need
a library... there are many libraries available..."

# Good (~50 tokens — 3x reduction)
"Use pdfplumber for text extraction:" + code example
```

## Creation Workflow

### Step 1 — Capture Intent

Answer these four questions before writing anything:

1. **What does this skill enable Claude to do?**
2. **When should it trigger?** (user phrases, contexts)
3. **What is the expected output format?**
4. **Are test cases needed?**
   - Objectively verifiable outputs (file transforms, code generation) → yes
   - Subjective outputs (writing style, tone) → human review instead

### Step 2 — Interview Yourself

Surface edge cases and repeated work before drafting:

- What inputs could be malformed or ambiguous?
- What reference material does Claude need?
- What did you always re-explain when prompting manually? → that goes in the Skill

> **Key insight:** If you've worked with Claude on this task before, look back at what you kept re-explaining and what you had to correct repeatedly. That friction is your unwritten SOP — just write it down. The Skill is built from what you already say every time, finally captured once.

### Skill Brief Template

Use before writing any Skill to define scope upfront. Can be given directly to Claude to generate the Skill.

```markdown
Use skill-creator to build a skill for the following:

## Purpose
[1–2 sentences: what the skill does and what the output is]

## Trigger Conditions
Claude should auto-invoke this skill when:
- [keyword / scenario 1]
- [keyword / scenario 2]

Claude should NOT invoke when:
- [false positive case]

## Constraints
- Invocation: [auto / manual]
- Max output length: [e.g. 200 lines]

## Output Format
[markdown / JSON / plain text / file]
[Example structure]

## Example Inputs / Outputs
Input: [example]
Expected output: [example]

## Edge Cases to Handle
- [special case 1]
- [special case 2]
```

**Filled-in example (Facebook content skill):**

```markdown
Use skill-creator to build a skill for the following:

## Purpose
Create long-form Facebook content for Brand Innovation Vantage.
Output is a ready-to-post text with emoji, hashtags, and CTA.

## Trigger Conditions
Claude should auto-invoke this skill when:
- User mentions "write content", "create a post", "write a caption"
- User mentions "Facebook post", "FB post"

Claude should NOT invoke when:
- Asking about content marketing strategy (not writing content)
- Asking about website content (different kind of "content")

## Constraints
- Invocation: auto
- Max output length: 500 lines

## Output Format
Facebook-friendly markdown (no tables).
Structure: Hook → Body → CTA → Hashtags

## Example Inputs / Outputs
Input: Write content about AI helping SME businesses
Expected output: Long-form post (800-2000 words), casual but on-brand voice.
Emoji in summary, hashtags in body, closing with CTA.

## Edge Cases to Handle
- If no topic specified → ask first
- If topic is highly technical → simplify language for general audience
- If prompt is too brief, e.g. "write a post" → ask what topic
```

### Step 3 — Write the Skill

#### `description` field

The description is the **primary trigger mechanism**. Claude auto-invokes a Skill based on it.

```text
# Bad — too vague
"Helps with documents"

# Good — trigger-complete
"Creates long-form Facebook content in the brand's style.
Use when the user asks to write content, create a post,
write a caption, or mentions Facebook post."
```

**Rules for description:**

- Write in third person (not "I can help...")
- Include both **what it does** and **when to use it**
- Include keywords users are likely to type
- Lean slightly **pushy** — Claude has a natural undertrigger bias (Anthropic observation)
- Max 1024 characters

#### Body content

- Every token must earn its place — omit what Claude already knows
- Prefer tables and one-liners over prose
- Explain **why** behind rules, not just what — Claude has theory of mind and performs better with reasoning than commands
- Avoid `ALWAYS`/`NEVER` in all-caps — that's a signal to reframe as reasoning instead

#### Degrees of Freedom

Match constraint level to task risk:

| Risk Level | Example Tasks | Approach |
| --- | --- | --- |
| High (irreversible) | DB migration, file deletion | Exact commands, no deviation allowed |
| Medium | Report generation | Template + configurable parameters |
| Low (exploratory) | Code review, content writing | High-level guidance, Claude decides |

### Step 4 — Add Patterns

#### Output Template

Define exact structure when consistency matters:

```markdown
## Report Structure
# [Title]
## Executive Summary
## Key Findings
## Recommendations
```

#### Examples

2–3 concrete input/output pairs outperform lengthy prose descriptions:

```text
Input: Write a caption about AI for business
Output: "AI isn't here to replace you..." [emoji, hashtags, CTA]
```

#### Workflow Checklist

Prevents step-skipping in multi-phase workflows:

```markdown
Progress:
- [ ] Phase 1: Analyze
- [ ] Phase 2: Draft
- [ ] Phase 3: Review
- [ ] Phase 4: Deliver
```

#### Conditional Routing

Branch behavior without user intervention:

```text
If creating new → follow path A
If modifying existing → follow path B
```

### Step 5 — Test & Iterate

**Core loop:** Draft → Run real prompts → Observe → Revise → Repeat

**Critical:** Generalize from test cases, don't overfit to them. A Skill must work across thousands of prompts, not just the 3 you tested.

**Signs of over-constraining:**

- `ALWAYS`/`NEVER` in all-caps throughout
- Rigid structures that don't adapt to context
- Instructions the model follows mechanically without understanding intent

> **Anthropic's note:** If you find yourself writing `ALWAYS` or `NEVER` in all-caps — that's a yellow flag. Try explaining the *why* instead. Claude has theory of mind; it performs better when it understands the reason behind a rule than when it's just commanded.

### Step 6 — Optimize Description

Test the description against two query types:

| Query Type | Purpose | Example |
| --- | --- | --- |
| Should Trigger | Confirm skill fires correctly | "Write a Facebook post about AI, long-form, with emoji and hashtags" |
| Should NOT Trigger | Catch false positives | "The website content loads slowly, how do I fix it?" |

Near-miss negatives (same keywords, different intent) are the most valuable test cases. The harder the negative test, the more precise your description.

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
| --- | --- | --- |
| All logic in one file | Body exceeds 500 lines → slow load, noise | Move to `references/` |
| Deeply nested references | Claude won't traverse more than 1 level reliably | Reference directly from `SKILL.md` only |
| Too many options (A/B/C/D/E) | Claude paralysis on which to choose | Provide one default + escape hatch for edge cases |
| Time-bound conditions | "Before August 2025, use old method" — breaks as time passes | Remove; update the Skill instead |
| Inconsistent terminology | Switching between "output" / "result" / "response" → confusion | Pick one term per concept, use it throughout |
| ALWAYS/NEVER commands | Brittle; ignores context; Claude follows mechanically | Replace with reasoning — explain *why* the rule exists |

## 5 Golden Rules

| # | Rule | Key Point |
| --- | --- | --- |
| 1 | **Concise is Key** | Every token costs context budget shared with all Skills, chat history, and system prompt. Omit what Claude already knows. |
| 2 | **Progressive Disclosure** | 3 layers: Metadata (always in context) → Body (on trigger) → References (on demand). Don't preload everything. |
| 3 | **Degrees of Freedom** | Match constraint tightness to task risk — don't over-lock exploratory tasks or under-specify irreversible ones. |
| 4 | **Explain the Why** | Claude has theory of mind. Reasoning outperforms commands — "don't use X because Y breaks" beats "NEVER use X". |
| 5 | **Test & Iterate** | Generalize from feedback. Optimize for 10,000 prompts, not 3 test cases. Avoid overfitting to examples. |
