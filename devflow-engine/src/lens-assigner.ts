import type { LensCount, Lens, LensAssignmentResult } from './types.js'

export type LensAssignment = {
  readonly teammate: 'correctness' | 'architecture' | 'dx'
  readonly lenses: readonly Lens[]
}

const FULL_ASSIGNMENTS: readonly { readonly teammate: 'correctness' | 'architecture' | 'dx'; readonly lenses: readonly Lens[] }[] = [
  { teammate: 'correctness', lenses: ['security', 'error-handling'] },
  { teammate: 'architecture', lenses: ['performance', 'database'] },
  { teammate: 'dx', lenses: ['typescript', 'observability'] },
]

const REDUCED_ASSIGNMENTS: readonly { readonly teammate: 'correctness' | 'architecture' | 'dx'; readonly lenses: readonly Lens[] }[] = [
  { teammate: 'correctness', lenses: ['security'] },
  { teammate: 'architecture', lenses: ['performance'] },
  { teammate: 'dx', lenses: ['typescript'] },
]

export function getLensCount(fileCount: number): LensCount {
  if (fileCount === 0 || fileCount > 50) return 'skip'
  if (fileCount >= 30) return 'reduced'
  return 'full'
}

export function assignLenses(fileCount: number): LensAssignmentResult {
  if (fileCount === 0) {
    return { kind: 'skipped', reason: 'No changed files' }
  }
  if (fileCount > 50) {
    return {
      kind: 'skipped',
      reason: `Large diff (${fileCount} files) — lenses skipped, Hard Rules only`,
    }
  }
  if (fileCount >= 30) {
    return { kind: 'reduced', assignments: REDUCED_ASSIGNMENTS }
  }
  return { kind: 'full', assignments: FULL_ASSIGNMENTS }
}
