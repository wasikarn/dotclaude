# Database Review Lens

Inject into reviewer prompts when diff touches: migrations, ORM queries, raw SQL, or repository layer code.

```text
DATABASE LENS (active for this review):
Check for SQL/ORM anti-patterns:
- SELECT *: fetching all columns when only subset needed
- OFFSET pagination: O(n) scan for deep pages — prefer cursor-based pagination for large datasets
- Correlated subqueries: subquery referencing outer query per row — usually rewritable as JOIN
- Missing transaction: multiple related writes without atomic transaction — partial failure risk
- N+1 ORM: loading relations inside loops, missing `.include()`/`.with()` eager loading
- Unindexed filter: WHERE/ORDER BY on column without index — verify with EXPLAIN ANALYZE for any query on tables >10k rows
- Missing constraint: unique/foreign key constraints that should be enforced at DB level, not application level
- Unsafe migration: DROP COLUMN, ALTER TYPE, or adding NOT NULL without default on live table

THRESHOLD: Report at confidence ≥75. For unsafe migrations: always report (treat as Hard Rule).
```
