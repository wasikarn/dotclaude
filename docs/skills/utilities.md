# Utility Skills

Standalone skills for environment, context, and architecture work.

---

## optimize-context

Audit and optimize CLAUDE.md files — score quality, remove noise, fix structure.

    /optimize-context
    /optimize-context --dry-run

Checks: token budget, rule density, import usage, anti-patterns (unresolved TODOs,
project-specific trivia, generic advice).

---

## env-heal

Scan and fix environment variable mismatches across `.env`, `.env.example`, and
validation schemas.

    /env-heal

Auto-fixes: adds missing vars to schema, syncs `.env.example`, runs startup validation.

---

## systems-thinking

Deep Causal Loop Diagram analysis for architecture decisions and recurring problems.

    /systems-thinking [topic]
    /systems-thinking "why do our PRs keep getting blocked in review?"

Produces: CLD diagram, feedback loops identified, bottleneck shift analysis,
second-order effects, recommended intervention points.

---

## dlc-metrics

Retrospective report from `~/.claude/dlc-metrics.jsonl` — iteration counts,
recurring finding categories, Hard Rule candidates.

    /dlc-metrics
