/**
 * Thin subprocess wrapper that runs the security-reviewer agent via `claude -p`.
 * Follows the pattern established in src/review/agents/reviewer.ts.
 */
import { runClaudeSubprocess } from '../../claude-subprocess.js'
import { MODEL_ID } from '../../config.js'
import type { ResolvedConfig } from '../../config.js'
import { VulnerabilityArraySchema } from '../schemas/vulnerability.js'
import type { Vulnerability } from '../schemas/vulnerability.js'

const SECURITY_SCANNER_MAX_TURNS = 15

const SECURITY_SCANNER_PROMPT = `You are a security scanner agent. Your task is to identify security vulnerabilities in a codebase.

Scan the target path for:
- Hardcoded secrets, API keys, tokens, or passwords
- Injection vulnerabilities (SQL, command, XSS, etc.)
- Insecure dependencies or outdated packages
- Authentication and authorization flaws
- Sensitive data exposure
- Use of deprecated or insecure crypto

Return findings as a JSON array of vulnerability objects. Each object must have:
- id: unique identifier string (e.g. "SEC-001")
- package: affected package or file name
- severity: one of "critical", "high", "moderate", "low"
- description: clear description of the vulnerability
- fixAvailable: boolean indicating whether a fix is known
- fixVersion: (optional) version that fixes the vulnerability`

const vulnerabilityArrayJsonSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      package: { type: 'string' },
      severity: { type: 'string', enum: ['critical', 'high', 'moderate', 'low'] },
      description: { type: 'string' },
      fixAvailable: { type: 'boolean' },
      fixVersion: { type: 'string' },
    },
    required: ['id', 'package', 'severity', 'description', 'fixAvailable'],
  },
} as const

// Claude API requires top-level type:object — wrap array in result envelope
const securityScannerOutputSchema = {
  type: 'object',
  properties: {
    vulnerabilities: vulnerabilityArrayJsonSchema,
  },
  required: ['vulnerabilities'],
} as const

/**
 * Run the security scanner agent on the given path.
 * Returns an empty array on subprocess failure (non-fatal — caller decides).
 */
export async function runSecurityScanner(params: {
  targetPath: string
  config: ResolvedConfig
}): Promise<{ vulnerabilities: Vulnerability[]; cost: number; tokens: number }> {
  let result: Awaited<ReturnType<typeof runClaudeSubprocess>>
  try {
    result = await runClaudeSubprocess({
      systemPrompt: SECURITY_SCANNER_PROMPT,
      userMessage: `Scan for security vulnerabilities at path: ${params.targetPath}\n\nReturn all findings as JSON.`,
      allowedTools: ['Read', 'Grep', 'Glob'],
      outputSchema: securityScannerOutputSchema as Record<string, unknown>,
      maxTurns: SECURITY_SCANNER_MAX_TURNS,
      maxBudgetUsd: params.config.maxBudgetPerReviewer,
      model: MODEL_ID[params.config.model],
    })
  } catch (err) {
    console.warn(`[sdk-audit] security-scanner failed: ${String(err)}`)
    return { vulnerabilities: [], cost: 0, tokens: 0 }
  }

  const raw = result.structuredOutput
  if (raw === undefined || raw === null) {
    console.warn('[sdk-audit] security-scanner returned no structured output — returning empty')
    return { vulnerabilities: [], cost: result.costUsd, tokens: result.tokens }
  }

  const envelope = raw as { vulnerabilities?: unknown }
  const parsed = VulnerabilityArraySchema.safeParse(envelope.vulnerabilities)
  if (!parsed.success) {
    console.warn(`[sdk-audit] security-scanner schema failed — returning empty: ${JSON.stringify(parsed.error.issues)}`)
    return { vulnerabilities: [], cost: result.costUsd, tokens: result.tokens }
  }

  return {
    vulnerabilities: parsed.data,
    cost: result.costUsd,
    tokens: result.tokens,
  }
}
