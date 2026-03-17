# Performance Review Lens

Inject into reviewer prompts when diff touches: data fetching, list rendering, event handlers, caching, or any hot path code.

```text
PERFORMANCE LENS (active for this review):
Check for common performance anti-patterns:
- N+1 queries: database queries inside loops or rendering iterations
- Missing memoization: expensive computations recalculated on every render/call
- Unbounded data: queries without LIMIT, lists without pagination, accumulating arrays
- Missing indexes: WHERE/ORDER BY columns without index, JOIN conditions unindexed
- Bundle size: large dependencies added without tree-shaking, synchronous imports of heavy modules
- Web Vitals (frontend): blocking renders, layout shifts, unoptimized images, missing lazy loading
- Memory leaks: event listeners not cleaned up, closures retaining large objects, accumulating cache

THRESHOLD: Report at confidence ≥75.
```
