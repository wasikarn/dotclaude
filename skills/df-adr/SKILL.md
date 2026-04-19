---
name: df-adr
description: Architecture Decision Record — document significant technical decisions with context, trade-offs, and consequences. Trigger when user says "record this decision", "create ADR", "write an ADR", "document why we chose", or at architecture pivot points requiring documentation. Do NOT trigger for questions asking why a decision was made.
type: agent
agent: executor
---

# df-adr: Architecture Decision Records

Document technical decisions with full context.

## When to Use

- Significant technology choice (framework, database, API style)
- Architecture change affecting multiple components
- "Why did we choose X over Y?"
- Need to capture decision context for future team

## ADR Structure

```markdown
# ADR-XXX: Title

## Status
Proposed / Accepted / Deprecated / Superseded by ADR-YYY

## Context
What is the problem we're solving?

## Decision
What we decided to do.

## Consequences
+ Positive outcomes
- Negative outcomes / trade-offs accepted

## Alternatives Considered
| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Option A | ... | ... | ... |
| Option B | ... | ... | ... |

## References
- Links to specs, discussions, related ADRs
```

## Workflow

1. **Identify** — Is this decision significant enough?
2. **Research** — Gather context, alternatives
3. **Draft** — Create ADR from template
4. **Review** — Team review (if applicable)
5. **Accept** — Mark status, link from index

## Usage

```bash
/df-adr "Use PostgreSQL over MongoDB for user data"
```

## Storage

```text
docs/adr/
├── README.md          # Index of all ADRs
├── 001-use-postgres.md
├── 002-graphql-over-rest.md
└── 003-microservices.md
```

## Notes

- Number sequentially, don't reuse numbers
- Superseded ADRs kept for history (link to replacement)
- Link from relevant code comments when helpful
- Confluence sync for visibility (optional)
