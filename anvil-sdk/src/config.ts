export const DEFAULT_CONFIG = {
  effort: 'high' as const,
  maxBudgetPerReviewer: 0.30,
  maxBudgetFalsification: 0.15,
  maxBudgetVerification: 0.10,
  maxTurnsReviewer: 20,
  model: 'sonnet' as ModelName,
  autoPassThreshold: 90,
  autoDropThreshold: 79,
  patternCapCount: 3,
  signalThreshold: 0.6,
}

export type EffortLevel = 'low' | 'medium' | 'high' | 'max'
export type ModelName = 'sonnet' | 'opus' | 'haiku'

// Short aliases — resolve to latest model of each family automatically.
// 'sonnet' and 'opus' are documented claude -p --model aliases.
// 'haiku' follows the same pattern (resolves to latest haiku).
export const MODEL_ID: Record<ModelName, string> = {
  opus: 'opus',
  sonnet: 'sonnet',
  haiku: 'haiku',
}

// Effort controls model selection + turn budgets + spend limits.
// User overrides (--budget, explicit model flags) always take precedence over preset.
const EFFORT_PRESETS: Record<EffortLevel, {
  model: ModelName
  maxTurnsReviewer: number
  maxBudgetPerReviewer: number
  maxBudgetFalsification: number
}> = {
  low:    { model: 'haiku',  maxTurnsReviewer: 8,  maxBudgetPerReviewer: 0.10, maxBudgetFalsification: 0.05 },
  medium: { model: 'sonnet', maxTurnsReviewer: 15, maxBudgetPerReviewer: 0.20, maxBudgetFalsification: 0.10 },
  high:   { model: 'sonnet', maxTurnsReviewer: 20, maxBudgetPerReviewer: 0.30, maxBudgetFalsification: 0.15 },
  max:    { model: 'opus',   maxTurnsReviewer: 30, maxBudgetPerReviewer: 0.60, maxBudgetFalsification: 0.25 },
}

export interface ReviewConfig {
  effort?: EffortLevel
  budgetUsd?: number
  hardRulesPath?: string
  noFalsification?: boolean
}

export interface ResolvedConfig {
  effort: EffortLevel
  maxBudgetPerReviewer: number
  maxBudgetFalsification: number
  maxBudgetVerification: number
  maxTurnsReviewer: number
  model: ModelName
  autoPassThreshold: number
  autoDropThreshold: number
  patternCapCount: number
  signalThreshold: number
  hardRulesPath?: string
  noFalsification?: boolean
}

export function resolveConfig(userConfig?: ReviewConfig): ResolvedConfig {
  const effort = userConfig?.effort ?? DEFAULT_CONFIG.effort
  const preset = EFFORT_PRESETS[effort]

  return {
    ...DEFAULT_CONFIG,
    ...preset,              // effort preset overrides model, turns, budgets
    effort,
    ...(userConfig?.budgetUsd !== undefined && {
      // 80% split across 3 reviewers, 20% for falsification — stays within stated total
      maxBudgetPerReviewer: (userConfig.budgetUsd * 0.8) / 3,
      maxBudgetFalsification: userConfig.budgetUsd * 0.2,
      // fix-intent-verify uses budgetUsd as a direct ceiling (single-agent call)
      maxBudgetVerification: userConfig.budgetUsd,
    }),
    ...(userConfig?.hardRulesPath !== undefined && { hardRulesPath: userConfig.hardRulesPath }),
    ...(userConfig?.noFalsification !== undefined && { noFalsification: userConfig.noFalsification }),
  }
}
