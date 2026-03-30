import type { PRSignals, ReviewMode, Score, Bonus } from './types.js'
import { toScore, toBonus } from './types.js'

// ─── Internal types ───────────────────────────────────────────────────────────

export type ScoreBreakdown = {
  readonly loc: number
  readonly fileType: number
  readonly semantic: number
  readonly contextBonus: number
}

export type RiskResult = {
  readonly total: number
  readonly breakdown: ScoreBreakdown
  readonly mode: ReviewMode
  readonly reasons: readonly string[]
}

// ─── Component scorers ────────────────────────────────────────────────────────

function computeLocScore(loc: number): Score {
  return toScore(Math.min(40, Math.floor((loc / 400) * 40)))
}

const FILE_TYPE_PATTERNS: Array<{ pattern: RegExp; score: number; reason: string }> = [
  { pattern: /\/(auth|migrations)\//i, score: 35, reason: 'auth/migrations file' },
  { pattern: /^\.github\/.+\.yml$/, score: 25, reason: 'CI/CD config' },
  { pattern: /\.(controller|router|handler|route)\.[jt]sx?$|\/(controllers?|routes?|handlers?)\//, score: 15, reason: 'controller/route handler' },
  { pattern: /\.(test|spec)\.[jt]sx?$/, score: 5, reason: 'test file' },
]

function computeFileTypeScore(files: readonly string[]): { score: Score; reason: string } {
  let max = 0
  let reason = ''
  for (const file of files) {
    for (const { pattern, score, reason: r } of FILE_TYPE_PATTERNS) {
      if (pattern.test(file) && score > max) {
        max = score
        reason = r
      }
    }
  }
  return { score: toScore(max), reason }
}

const SEMANTIC_PATTERNS: Array<{ pattern: RegExp; score: number; reason: string }> = [
  { pattern: /\b(password|api_key|secret|private_key)\b/i, score: 30, reason: 'secret pattern in diff' },
  { pattern: /\b(CREATE TABLE|ALTER TABLE|DROP TABLE)\b/i, score: 20, reason: 'SQL DDL in diff' },
  { pattern: /\b(jwt|bearer|access_token|refresh_token)\b/i, score: 15, reason: 'auth token pattern in diff' },
]

function computeSemanticScore(diffContent: string): { score: Score; reason: string } {
  let max = 0
  let reason = ''
  for (const { pattern, score, reason: r } of SEMANTIC_PATTERNS) {
    if (pattern.test(diffContent) && score > max) {
      max = score
      reason = r
    }
  }
  return { score: toScore(max), reason }
}

function computeContextBonus(
  hasJiraKey: boolean,
  dismissedPatterns: readonly string[],
  diffContent: string,
): Bonus {
  let bonus = 0
  if (hasJiraKey) bonus += 10
  const matchCount = dismissedPatterns.filter(p => diffContent.includes(p)).length
  if (matchCount > 0) bonus -= 10  // floor at -10 regardless of match count
  return toBonus(bonus)
}

function scoreToMode(score: number): ReviewMode {
  if (score >= 55) return 'full'
  if (score >= 30) return 'quick'
  return 'micro'
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function computeScore(signals: PRSignals): RiskResult {
  const locScore = computeLocScore(signals.loc)
  const { score: fileTypeScore, reason: fileTypeReason } = computeFileTypeScore(
    signals.changedFiles.map(String),
  )
  const { score: semanticScore, reason: semanticReason } = computeSemanticScore(signals.diffContent)
  const contextBonus = computeContextBonus(
    signals.hasJiraKey,
    signals.dismissedPatterns,
    signals.diffContent,
  )

  const rawTotal = locScore + fileTypeScore + semanticScore + contextBonus
  const total = Math.min(100, Math.max(0, rawTotal))
  const mode = scoreToMode(total)

  const reasons: string[] = []
  if (locScore > 0) reasons.push(`LOC ${signals.loc} → score ${locScore}`)
  if (fileTypeScore > 0) reasons.push(fileTypeReason)
  if (semanticScore > 0) reasons.push(semanticReason)
  if (contextBonus !== 0) reasons.push(`context bonus: ${contextBonus > 0 ? '+' : ''}${contextBonus}`)

  return {
    total,
    breakdown: { loc: locScore, fileType: fileTypeScore, semantic: semanticScore, contextBonus },
    mode,
    reasons,
  }
}
