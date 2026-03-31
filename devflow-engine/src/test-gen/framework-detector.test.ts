import { describe, expect, test } from 'bun:test'
import { detectFramework } from './framework-detector.js'

// ─── helper to build package.json strings ────────────────────────────────────

function makePkg(devDeps: Record<string, string> = {}, deps: Record<string, string> = {}): string {
  return JSON.stringify({ devDependencies: devDeps, dependencies: deps })
}

describe('detectFramework — vitest', () => {
  test('detects vitest in devDependencies', () => {
    expect(detectFramework(makePkg({ vitest: '^1.0.0' }))).toBe('vitest')
  })

  test('detects vitest in dependencies', () => {
    expect(detectFramework(makePkg({}, { vitest: '^1.0.0' }))).toBe('vitest')
  })

  test('vitest takes priority over jest when both present', () => {
    expect(detectFramework(makePkg({ vitest: '^1.0.0', jest: '^29.0.0' }))).toBe('vitest')
  })
})

describe('detectFramework — jest', () => {
  test('detects jest in devDependencies', () => {
    expect(detectFramework(makePkg({ jest: '^29.0.0' }))).toBe('jest')
  })

  test('detects jest in dependencies', () => {
    expect(detectFramework(makePkg({}, { jest: '^29.0.0' }))).toBe('jest')
  })

  test('detects @jest/core in devDependencies', () => {
    expect(detectFramework(makePkg({ '@jest/core': '^29.0.0' }))).toBe('jest')
  })

  test('jest takes priority over bun when both present', () => {
    expect(detectFramework(makePkg({ jest: '^29.0.0', 'bun-types': '^1.0.0' }))).toBe('jest')
  })
})

describe('detectFramework — bun', () => {
  test('detects bun-types in devDependencies', () => {
    expect(detectFramework(makePkg({ 'bun-types': '^1.3.0' }))).toBe('bun')
  })

  test('detects bun in devDependencies', () => {
    expect(detectFramework(makePkg({ bun: '^1.0.0' }))).toBe('bun')
  })

  test('detects bun-types in dependencies', () => {
    expect(detectFramework(makePkg({}, { 'bun-types': '^1.0.0' }))).toBe('bun')
  })

  test('bun takes priority over japa when both present', () => {
    expect(detectFramework(makePkg({ 'bun-types': '^1.0.0', japa: '^3.0.0' }))).toBe('bun')
  })
})

describe('detectFramework — japa', () => {
  test('detects japa in devDependencies', () => {
    expect(detectFramework(makePkg({ japa: '^3.0.0' }))).toBe('japa')
  })

  test('detects @japa/runner in devDependencies', () => {
    expect(detectFramework(makePkg({ '@japa/runner': '^3.0.0' }))).toBe('japa')
  })

  test('detects japa in dependencies', () => {
    expect(detectFramework(makePkg({}, { japa: '^3.0.0' }))).toBe('japa')
  })
})

describe('detectFramework — unknown', () => {
  test('returns unknown when no test framework found', () => {
    expect(detectFramework(makePkg({ typescript: '^5.0.0', zod: '^3.0.0' }))).toBe('unknown')
  })

  test('returns unknown for empty package.json', () => {
    expect(detectFramework(JSON.stringify({}))).toBe('unknown')
  })

  test('returns unknown when only dependencies key is absent', () => {
    expect(detectFramework(JSON.stringify({ name: 'my-pkg', version: '1.0.0' }))).toBe('unknown')
  })

  test('returns unknown for invalid JSON', () => {
    expect(detectFramework('not json')).toBe('unknown')
  })

  test('returns unknown for empty string input', () => {
    expect(detectFramework('')).toBe('unknown')
  })
})

describe('detectFramework — priority order', () => {
  test('vitest > jest > bun > japa', () => {
    const all = makePkg({
      vitest: '^1.0.0',
      jest: '^29.0.0',
      'bun-types': '^1.0.0',
      japa: '^3.0.0',
    })
    expect(detectFramework(all)).toBe('vitest')
  })

  test('jest > bun > japa when vitest absent', () => {
    const nVitest = makePkg({
      jest: '^29.0.0',
      'bun-types': '^1.0.0',
      japa: '^3.0.0',
    })
    expect(detectFramework(nVitest)).toBe('jest')
  })

  test('bun > japa when vitest and jest absent', () => {
    const nJest = makePkg({
      'bun-types': '^1.0.0',
      japa: '^3.0.0',
    })
    expect(detectFramework(nJest)).toBe('bun')
  })
})
