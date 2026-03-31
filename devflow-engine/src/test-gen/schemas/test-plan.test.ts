import { describe, expect, test } from 'bun:test'
import { TestPlanSchema } from './test-plan.js'

describe('TestPlanSchema', () => {
  test('accepts valid test plan with all fields', () => {
    const result = TestPlanSchema.safeParse({
      framework: 'vitest',
      targetFiles: ['src/utils.ts', 'src/parser.ts'],
      generatedFiles: ['src/utils.test.ts', 'src/parser.test.ts'],
      testCount: 12,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.framework).toBe('vitest')
      expect(result.data.testCount).toBe(12)
      expect(result.data.targetFiles).toHaveLength(2)
      expect(result.data.generatedFiles).toHaveLength(2)
    }
  })

  test('accepts all valid framework values', () => {
    const frameworks = ['vitest', 'jest', 'bun', 'japa', 'unknown'] as const
    for (const framework of frameworks) {
      const result = TestPlanSchema.safeParse({
        framework,
        targetFiles: [],
        generatedFiles: [],
        testCount: 0,
      })
      expect(result.success).toBe(true)
    }
  })

  test('accepts zero testCount', () => {
    const result = TestPlanSchema.safeParse({
      framework: 'bun',
      targetFiles: ['src/foo.ts'],
      generatedFiles: [],
      testCount: 0,
    })
    expect(result.success).toBe(true)
  })

  test('accepts empty arrays for targetFiles and generatedFiles', () => {
    const result = TestPlanSchema.safeParse({
      framework: 'unknown',
      targetFiles: [],
      generatedFiles: [],
      testCount: 0,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.targetFiles).toHaveLength(0)
      expect(result.data.generatedFiles).toHaveLength(0)
    }
  })

  test('rejects invalid framework value', () => {
    const result = TestPlanSchema.safeParse({
      framework: 'mocha', // not in enum
      targetFiles: [],
      generatedFiles: [],
      testCount: 0,
    })
    expect(result.success).toBe(false)
  })

  test('rejects negative testCount', () => {
    const result = TestPlanSchema.safeParse({
      framework: 'jest',
      targetFiles: [],
      generatedFiles: [],
      testCount: -1,
    })
    expect(result.success).toBe(false)
  })

  test('rejects non-integer testCount', () => {
    const result = TestPlanSchema.safeParse({
      framework: 'jest',
      targetFiles: [],
      generatedFiles: [],
      testCount: 3.5,
    })
    expect(result.success).toBe(false)
  })

  test('rejects missing required fields', () => {
    const result = TestPlanSchema.safeParse({
      framework: 'vitest',
      // missing targetFiles, generatedFiles, testCount
    })
    expect(result.success).toBe(false)
  })

  test('rejects non-string items in targetFiles', () => {
    const result = TestPlanSchema.safeParse({
      framework: 'jest',
      targetFiles: [42, 'valid.ts'], // 42 is not a string
      generatedFiles: [],
      testCount: 0,
    })
    expect(result.success).toBe(false)
  })
})
