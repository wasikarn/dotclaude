export type { Finding } from './review/schemas/finding.js'
export type { Verdict } from './review/schemas/verdict.js'

import type { Finding } from './review/schemas/finding.js'
import type { Verdict } from './review/schemas/verdict.js'

export type ReviewRole = 'correctness' | 'architecture' | 'dx'
export type PRComplexity = 'trivial' | 'standard' | 'complex'
export type Severity = Finding['severity']
export type VerdictType = Verdict['verdict']

export interface FileDiff {
  path: string
  hunks: string
  language: string
  /** Total lines in the diff (additions + deletions). Used for workload estimation. */
  diffLineCount: number
}

export interface DiffBucket {
  role: ReviewRole
  files: FileDiff[]
  totalLines: number
}

export interface ConsolidatedFinding extends Finding {
  consensus: string
  patternNote?: string
}

export interface ReviewReport {
  pr: string
  summary: Record<Severity, number>
  findings: ConsolidatedFinding[]
  strengths: string[]
  verdict: 'APPROVE' | 'REQUEST_CHANGES'
  noiseWarning?: boolean
  /** Complexity classification used to determine reviewer count. trivial = 1 reviewer ran. */
  complexity: PRComplexity
  cost: { total_usd: number; per_reviewer: number[]; falsification_usd: number }
  tokens: { total: number; per_reviewer: number[]; falsification: number }
}

export interface TriagedFindings {
  autoPass: Finding[]
  autoDrop: Finding[]
  mustFalsify: Finding[]
}

export interface ReviewerResult {
  findings: Finding[]
  strengths: string[]
  cost: number
  tokens: number
}

// ─── Engine: branded primitives ──────────────────────────────────────────────

export type Score = number & { readonly _brand: 'Score' }
export type FilePath = string & { readonly _brand: 'FilePath' }
export type Bonus = number & { readonly _brand: 'Bonus' }

export function toScore(n: number): Score {
  if (n < 0 || n > 100) throw new RangeError(`Score out of range [0,100]: ${n}`)
  return n as Score
}
export function toFilePath(s: string): FilePath {
  if (s.trim().length === 0) throw new Error('FilePath must not be empty or whitespace')
  return s as FilePath
}
export function toBonus(n: number): Bonus {
  return Math.max(-10, Math.min(10, n)) as Bonus
}

// ─── Engine: domain types ─────────────────────────────────────────────────────

export type ReviewMode = 'micro' | 'quick' | 'full' | 'focused'  // 'focused' = specialist-only mode
export type LensCount = 'full' | 'reduced' | 'skip'

export type Lens =
  | 'security' | 'performance' | 'frontend' | 'database'
  | 'typescript' | 'error-handling' | 'api-design' | 'observability'

export type SpecialistType =
  | 'test-quality-reviewer'
  | 'api-contract-auditor'
  | 'migration-reviewer'
  | 'silent-failure-hunter'
  | 'type-design-analyzer'

export type SpecialistPriority = 1 | 2 | 3 | 4 | 5

export type SpecialistTrigger = {
  readonly type: SpecialistType
  readonly priority: SpecialistPriority
}

/** All signals needed to compute a risk score and review decision */
export type PRSignals = {
  readonly loc: number
  readonly changedFiles: readonly FilePath[]
  readonly hasJiraKey: boolean
  readonly dismissedPatterns: readonly string[]
  readonly diffContent: string
}

export type LensAssignmentResult =
  | { readonly kind: 'full'; readonly assignments: readonly { readonly teammate: 'correctness' | 'architecture' | 'dx'; readonly lenses: readonly Lens[] }[] }
  | { readonly kind: 'reduced'; readonly assignments: readonly { readonly teammate: 'correctness' | 'architecture' | 'dx'; readonly lenses: readonly Lens[] }[] }
  | { readonly kind: 'skipped'; readonly reason: string }
