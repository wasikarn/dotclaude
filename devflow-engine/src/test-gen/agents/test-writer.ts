/**
 * Thin subprocess wrapper that runs the generate-tests skill via `claude -p`.
 * Follows the pattern established in src/review/agents/reviewer.ts.
 */
import { runClaudeSubprocess } from '../../claude-subprocess.js'
import { MODEL_ID } from '../../config.js'
import type { ResolvedConfig } from '../../config.js'
import { TestPlanSchema } from '../schemas/test-plan.js'
import type { TestPlan } from '../schemas/test-plan.js'

const TEST_WRITER_MAX_TURNS = 20

const TEST_WRITER_PROMPT = `You are a test generation agent. Your task is to generate unit tests for the given target files.

Guidelines:
- Test behavior, not implementation details
- Use the detected framework conventions
- Generate tests for all public functions and edge cases
- Each test file should be named <source-file>.test.<ext>
- Mock only external I/O (file system, network, database)
- Include tests for: happy path, edge cases, error cases

Return a test plan as JSON with:
- framework: detected test framework ("vitest", "jest", "bun", "japa", or "unknown")
- targetFiles: array of source file paths that were analyzed
- generatedFiles: array of test file paths that were created
- testCount: total number of test cases generated`

const testPlanOutputSchema = {
  type: 'object',
  properties: {
    framework: { type: 'string', enum: ['vitest', 'jest', 'bun', 'japa', 'unknown'] },
    targetFiles: { type: 'array', items: { type: 'string' } },
    generatedFiles: { type: 'array', items: { type: 'string' } },
    testCount: { type: 'integer', minimum: 0 },
  },
  required: ['framework', 'targetFiles', 'generatedFiles', 'testCount'],
} as const

/**
 * Run the test writer agent on the given target files.
 * Returns a TestPlan on success, or throws on subprocess failure.
 */
export async function runTestWriter(params: {
  targetFiles: string[]
  packageJsonPath?: string
  config: ResolvedConfig
}): Promise<{ plan: TestPlan; cost: number; tokens: number }> {
  const fileList = params.targetFiles.join('\n')
  const pkgContext = params.packageJsonPath !== undefined
    ? `\npackage.json location: ${params.packageJsonPath}`
    : ''

  let result: Awaited<ReturnType<typeof runClaudeSubprocess>>
  try {
    result = await runClaudeSubprocess({
      systemPrompt: TEST_WRITER_PROMPT,
      userMessage: `Generate tests for the following files:\n${fileList}${pkgContext}\n\nReturn the test plan as JSON.`,
      allowedTools: ['Read', 'Grep', 'Glob', 'Write', 'Edit'],
      outputSchema: testPlanOutputSchema as Record<string, unknown>,
      maxTurns: TEST_WRITER_MAX_TURNS,
      maxBudgetUsd: params.config.maxBudgetPerReviewer,
      model: MODEL_ID[params.config.model],
    })
  } catch (err) {
    throw new Error(`[sdk-test-gen] test-writer failed: ${String(err)}`)
  }

  const raw = result.structuredOutput
  if (raw === undefined || raw === null) {
    throw new Error('[sdk-test-gen] test-writer returned no structured output')
  }

  const parsed = TestPlanSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(`[sdk-test-gen] test-writer schema failed: ${JSON.stringify(parsed.error.issues)}`)
  }

  return {
    plan: parsed.data,
    cost: result.costUsd,
    tokens: result.tokens,
  }
}
