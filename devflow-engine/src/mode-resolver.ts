import type { PRSignals, ReviewMode, LensCount, SpecialistTrigger, SpecialistType } from './types.js'
import { computeScore } from './risk-scorer.js'
import { getLensCount } from './lens-assigner.js'

export type CLIFlags = {
  readonly micro: boolean
  readonly quick: boolean
  readonly full: boolean
  readonly focused: string | null
}

export type ModeResolution = {
  readonly mode: ReviewMode          // 'focused' is now part of ReviewMode in types.ts
  readonly source: 'explicit-flag' | 'risk-score'
  readonly specialistTriggers: readonly SpecialistTrigger[]
  readonly lensCount: LensCount
  readonly score: number
  readonly reasons: readonly string[]
}

// ─── Specialist detection ─────────────────────────────────────────────────────

const FOCUSED_AREA_MAP: Record<string, SpecialistType> = {
  errors: 'silent-failure-hunter',
  types: 'type-design-analyzer',
  tests: 'test-quality-reviewer',
  api: 'api-contract-auditor',
  migrations: 'migration-reviewer',
}

function detectSpecialists(files: readonly string[], diffContent: string): readonly SpecialistTrigger[] {
  const triggers: SpecialistTrigger[] = []

  // P1–P3: first match wins (primary specialist)
  let primaryAdded = false
  if (!primaryAdded && files.some(f => /\.(test|spec)\.[jt]sx?$/.test(f))) {
    triggers.push({ type: 'test-quality-reviewer', priority: 1 })
    primaryAdded = true
  }
  if (!primaryAdded && files.some(f => /\.(controller|router|handler|route)\.[jt]sx?$|\/(controllers?|routes?|handlers?)\//.test(f))) {
    triggers.push({ type: 'api-contract-auditor', priority: 2 })
    primaryAdded = true
  }
  if (!primaryAdded && files.some(f => /\.migration\.[jt]sx?$|\/migrations\//.test(f))) {
    triggers.push({ type: 'migration-reviewer', priority: 3 })
    primaryAdded = true
  }

  // P4–P5: independent
  // Detect: try/catch, .catch(), optional chaining (?.), nullish coalescing (??)
  if (/\btry\s*\{|\.catch\s*\(|\?\?|\?\./.test(diffContent)) {
    triggers.push({ type: 'silent-failure-hunter', priority: 4 })
  }
  if (files.some(f => /\.(interface|types?)\.[jt]sx?$/.test(f))) {
    triggers.push({ type: 'type-design-analyzer', priority: 5 })
  }

  return triggers
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function resolveMode(flags: CLIFlags, signals: PRSignals): ModeResolution {
  const fileStrs = signals.changedFiles.map(String)
  const lensCount = getLensCount(fileStrs.length)
  const specialistTriggers = detectSpecialists(fileStrs, signals.diffContent)

  // Focused mode: bypass main reviewers, single specialist
  if (flags.focused !== null) {
    const specialistType = FOCUSED_AREA_MAP[flags.focused]
    return {
      mode: 'focused',
      source: 'explicit-flag',
      specialistTriggers: specialistType !== undefined
        ? [{ type: specialistType, priority: 1 as const }]
        : [],
      lensCount,
      score: 0,
      reasons: [`--focused ${flags.focused}`],
    }
  }

  // --full + --micro conflict → full wins (most conservative)
  if (flags.full) {
    return { mode: 'full', source: 'explicit-flag', specialistTriggers, lensCount, score: 0, reasons: ['--full flag'] }
  }
  if (flags.quick) {
    return { mode: 'quick', source: 'explicit-flag', specialistTriggers, lensCount, score: 0, reasons: ['--quick flag'] }
  }
  if (flags.micro) {
    return { mode: 'micro', source: 'explicit-flag', specialistTriggers, lensCount, score: 0, reasons: ['--micro flag'] }
  }

  // No explicit flag → use risk score
  const risk = computeScore(signals)
  return {
    mode: risk.mode,
    source: 'risk-score',
    specialistTriggers,
    lensCount,
    score: risk.total,
    reasons: risk.reasons,
  }
}
