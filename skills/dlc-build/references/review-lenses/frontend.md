# Frontend Review Lens

Inject into reviewer prompts when diff touches: React components, Next.js pages, hooks, or UI code.

```text
FRONTEND LENS (active for this review):
Check for React/Next.js anti-patterns:
- Waterfall requests: sequential fetches that could be parallelized (Promise.all / parallel data fetching)
- Barrel imports: `import { X } from 'lib'` pulling entire index — prefer direct imports
- Missing Suspense boundaries: async components without fallback, no loading states
- Missing error boundaries: unhandled async errors silently swallowing failures
- Hook rules violations: hooks inside conditions/loops, missing dependency arrays
- Prop drilling: data passed through 3+ component levels — consider context or composition
- Accessibility: interactive elements missing aria labels, keyboard navigation broken, color contrast
- Missing key props: lists without stable keys, index-as-key on reorderable lists

THRESHOLD: Report at confidence ≥75.
```
