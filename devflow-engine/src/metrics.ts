/**
 * Token metrics tracking for devflow skills.
 * Schema v1.1 adds token tracking fields while maintaining backward compatibility.
 */

export interface TokenMetrics {
  input: number
  output: number
  cumulative_session: number
}

export interface MetricsEntry {
  schema_version: '1.0' | '1.1'
  timestamp: string
  skill: string
  phase: string
  mode: string
  tokens?: TokenMetrics
}

export interface CreateEntryOptions {
  skill: string
  phase: string
  mode: string
  tokens: { input: number; output: number }
  cumulative_session?: number
}

/**
 * Create a new metrics entry with schema v1.1
 */
export function createEntry(options: CreateEntryOptions): MetricsEntry {
  const { skill, phase, mode, tokens, cumulative_session = tokens.input + tokens.output } = options

  return {
    schema_version: '1.1',
    timestamp: new Date().toISOString(),
    skill,
    phase,
    mode,
    tokens: {
      input: tokens.input,
      output: tokens.output,
      cumulative_session
    }
  }
}

/**
 * Validate a metrics entry (supports both v1.0 and v1.1 schemas)
 */
export function validateEntry(entry: unknown): MetricsEntry {
  if (typeof entry !== 'object' || entry === null) {
    throw new Error('Invalid entry: must be an object')
  }

  const e = entry as Record<string, unknown>

  // Required fields
  if (typeof e.timestamp !== 'string') {
    throw new Error('Invalid entry: missing timestamp')
  }
  if (typeof e.skill !== 'string') {
    throw new Error('Invalid entry: missing skill')
  }
  if (typeof e.phase !== 'string') {
    throw new Error('Invalid entry: missing phase')
  }
  if (typeof e.mode !== 'string') {
    throw new Error('Invalid entry: missing mode')
  }

  // Schema version defaults to 1.0 if not present (backward compatibility)
  const schema_version = (e.schema_version as '1.0' | '1.1') || '1.0'

  // Tokens field is optional (v1.0 compatibility)
  let tokens: TokenMetrics | undefined
  if (e.tokens !== undefined) {
    const t = e.tokens as Record<string, unknown>
    if (typeof t.input !== 'number' || typeof t.output !== 'number') {
      throw new Error('Invalid entry: tokens.input and tokens.output must be numbers')
    }
    tokens = {
      input: t.input as number,
      output: t.output as number,
      cumulative_session: (t.cumulative_session as number) || (t.input as number + t.output as number)
    }
  }

  return {
    schema_version,
    timestamp: e.timestamp as string,
    skill: e.skill as string,
    phase: e.phase as string,
    mode: e.mode as string,
    ...(tokens !== undefined ? { tokens } : {})
  }
}

/**
 * Format entry as JSONL line
 */
export function formatEntry(entry: MetricsEntry): string {
  return JSON.stringify(entry)
}

/**
 * Parse JSONL line to MetricsEntry
 */
export function parseEntry(line: string): MetricsEntry {
  return validateEntry(JSON.parse(line))
}