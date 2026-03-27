import { z } from 'zod'

export const VerdictSchema = z.object({
  findingIndex: z.number().int().min(0),
  originalSummary: z.string(),
  verdict: z.enum(['SUSTAINED', 'DOWNGRADED', 'REJECTED']),
  newSeverity: z.enum(['critical', 'warning', 'info']).optional(),
  rationale: z.string(),
})

export const VerdictArraySchema = z.array(VerdictSchema)

// Wrapped schema for SDK outputFormat — Claude API requires top-level type:object (not array)
export const VerdictResultSchema = z.object({ verdicts: VerdictArraySchema })
export const verdictResultJsonSchema = z.toJSONSchema(VerdictResultSchema)

export type Verdict = z.infer<typeof VerdictSchema>
