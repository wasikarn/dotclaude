export const DEFAULT_CONFIG = {
  effort: 'high' as const,
  maxBudgetPerReviewer: 0.15,
  maxBudgetFalsification: 0.08,
  maxTurnsReviewer: 20,
  maxTurnsFalsification: 5,
  model: 'sonnet' as const,
  confidenceThreshold: 80,
  autoPassConfidence: 90,
  autoDropMaxConfidence: 80,
  patternCapCount: 3,
  signalThreshold: 0.6,
}

export type EffortLevel = 'low' | 'medium' | 'high'

export interface ReviewConfig {
  effort?: EffortLevel
  budgetUsd?: number
  hardRulesPath?: string
  noFalsification?: boolean
}
