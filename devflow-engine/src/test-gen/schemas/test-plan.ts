import { z } from 'zod'

export const TestPlanSchema = z.object({
  framework: z.enum(['vitest', 'jest', 'bun', 'japa', 'unknown']),
  targetFiles: z.array(z.string()),
  generatedFiles: z.array(z.string()),
  testCount: z.number().int().nonnegative(),
})
export type TestPlan = z.infer<typeof TestPlanSchema>
