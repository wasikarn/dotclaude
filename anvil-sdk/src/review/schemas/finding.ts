import { z } from 'zod'

export const FindingSchema = z.object({
  severity: z.enum(['critical', 'warning', 'info']),
  rule: z.string(),
  file: z.string(),
  line: z.number().int().nullable(),
  confidence: z.number().int().min(0).max(100),
  issue: z.string(),
  fix: z.string(),
  isHardRule: z.boolean(),
  crossDomain: z.string().optional(),
})

export const FindingArraySchema = z.array(FindingSchema)

// Wrapped schema for SDK outputFormat — Claude API requires top-level type:object (not array)
export const FindingResultSchema = z.object({ findings: FindingArraySchema })
export const findingResultJsonSchema = z.toJSONSchema(FindingResultSchema)

export type Finding = z.infer<typeof FindingSchema>
