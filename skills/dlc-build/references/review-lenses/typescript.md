# TypeScript Review Lens

Inject into reviewer prompts when diff touches: TypeScript files, type definitions, or generic utilities.

```text
TYPESCRIPT LENS (active for this review):
Check for TypeScript type safety anti-patterns:
- `any` proliferation: `as any`, `any` parameter types, implicit any from missing annotations
- Unsafe type assertions: `as X` without runtime validation, double-cast `as unknown as X`
- Missing discriminated unions: string/number enums for sum types instead of `{ type: 'A'; ... } | { type: 'B'; ... }`
- Incomplete type guards: `typeof x === 'string'` without exhaustive checks on union types
- Missing `null`/`undefined` handling: non-nullable types used without narrowing, optional chaining gaps
- `@ts-ignore` / `@ts-expect-error`: suppressions without explanation comment — why was TypeScript wrong?
- Leaking internals: exported types that expose implementation details (internal state, private DTOs)

THRESHOLD: Report at confidence ≥75. `any` with no justification: always report (treat as Hard Rule for TypeScript projects).
```
