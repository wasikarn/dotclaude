import { describe, expect, test } from 'bun:test'
import { parseNpmAuditOutput } from './dependency-checker.js'

// ─── npm v6 format samples ────────────────────────────────────────────────────

const NPM_V6_SAMPLE = JSON.stringify({
  advisories: {
    '1234': {
      id: 1234,
      module_name: 'lodash',
      severity: 'high',
      overview: 'Prototype pollution vulnerability in lodash',
      recommendation: 'Update to version 4.17.21',
      patched_versions: '>=4.17.21',
    },
    '5678': {
      id: 5678,
      module_name: 'minimist',
      severity: 'critical',
      overview: 'Prototype pollution vulnerability in minimist',
      patched_versions: '>=1.2.3',
    },
  },
})

const NPM_V6_NO_FIX_SAMPLE = JSON.stringify({
  advisories: {
    '9999': {
      id: 9999,
      module_name: 'old-package',
      severity: 'moderate',
      overview: 'No fix available',
      patched_versions: '<0.0.0',
    },
  },
})

const NPM_V6_EMPTY = JSON.stringify({ advisories: {} })

// ─── npm v7+ format samples ───────────────────────────────────────────────────

const NPM_V7_SAMPLE = JSON.stringify({
  auditReportVersion: 2,
  vulnerabilities: {
    'follow-redirects': {
      name: 'follow-redirects',
      severity: 'moderate',
      isDirect: false,
      via: [
        {
          source: 1096682,
          name: 'follow-redirects',
          dependency: 'follow-redirects',
          title: 'Improper Input Validation in follow-redirects',
          severity: 'moderate',
          fixAvailable: true,
          range: '<1.15.4',
        },
      ],
      effects: ['axios'],
      range: '<1.15.4',
      nodes: ['node_modules/follow-redirects'],
      fixAvailable: { name: 'axios', version: '1.6.5', isSemVerMajor: false },
    },
    'semver': {
      name: 'semver',
      severity: 'high',
      isDirect: false,
      via: [
        {
          source: 1096693,
          name: 'semver',
          dependency: 'semver',
          title: 'semver vulnerable to Regular Expression Denial of Service',
          severity: 'high',
          fixAvailable: false,
          range: '<5.7.2',
        },
      ],
      effects: [],
      range: '<5.7.2',
      nodes: ['node_modules/semver'],
      fixAvailable: false,
    },
  },
})

const NPM_V7_EMPTY = JSON.stringify({ auditReportVersion: 2, vulnerabilities: {} })

const NPM_V7_VIA_STRING = JSON.stringify({
  vulnerabilities: {
    'transitive-pkg': {
      name: 'transitive-pkg',
      severity: 'low',
      via: ['parent-pkg'],
      fixAvailable: true,
    },
  },
})

describe('parseNpmAuditOutput — npm v6 format', () => {
  test('parses advisories into Vulnerability[]', () => {
    const result = parseNpmAuditOutput(NPM_V6_SAMPLE)
    expect(result).toHaveLength(2)
  })

  test('maps module_name to package field', () => {
    const result = parseNpmAuditOutput(NPM_V6_SAMPLE)
    const packages = result.map(v => v.package)
    expect(packages).toContain('lodash')
    expect(packages).toContain('minimist')
  })

  test('maps advisory id to string id field', () => {
    const result = parseNpmAuditOutput(NPM_V6_SAMPLE)
    const ids = result.map(v => v.id)
    expect(ids).toContain('1234')
    expect(ids).toContain('5678')
  })

  test('maps severity correctly', () => {
    const result = parseNpmAuditOutput(NPM_V6_SAMPLE)
    const lodash = result.find(v => v.package === 'lodash')
    const minimist = result.find(v => v.package === 'minimist')
    expect(lodash?.severity).toBe('high')
    expect(minimist?.severity).toBe('critical')
  })

  test('sets fixAvailable=true and fixVersion when patched_versions is valid', () => {
    const result = parseNpmAuditOutput(NPM_V6_SAMPLE)
    const lodash = result.find(v => v.package === 'lodash')
    expect(lodash?.fixAvailable).toBe(true)
    expect(lodash?.fixVersion).toBe('>=4.17.21')
  })

  test('sets fixAvailable=false when patched_versions is <0.0.0', () => {
    const result = parseNpmAuditOutput(NPM_V6_NO_FIX_SAMPLE)
    expect(result).toHaveLength(1)
    expect(result[0]?.fixAvailable).toBe(false)
    expect(result[0]?.fixVersion).toBeUndefined()
  })

  test('returns empty array for empty advisories', () => {
    const result = parseNpmAuditOutput(NPM_V6_EMPTY)
    expect(result).toHaveLength(0)
  })
})

describe('parseNpmAuditOutput — npm v7+ format', () => {
  test('parses vulnerabilities object into Vulnerability[]', () => {
    const result = parseNpmAuditOutput(NPM_V7_SAMPLE)
    expect(result).toHaveLength(2)
  })

  test('maps package name correctly', () => {
    const result = parseNpmAuditOutput(NPM_V7_SAMPLE)
    const packages = result.map(v => v.package)
    expect(packages).toContain('follow-redirects')
    expect(packages).toContain('semver')
  })

  test('extracts source id from via[0]', () => {
    const result = parseNpmAuditOutput(NPM_V7_SAMPLE)
    const followRedirects = result.find(v => v.package === 'follow-redirects')
    expect(followRedirects?.id).toBe('1096682')
  })

  test('extracts description from via[0].title', () => {
    const result = parseNpmAuditOutput(NPM_V7_SAMPLE)
    const semver = result.find(v => v.package === 'semver')
    expect(semver?.description).toBe('semver vulnerable to Regular Expression Denial of Service')
  })

  test('sets fixAvailable=true and extracts fixVersion from object', () => {
    const result = parseNpmAuditOutput(NPM_V7_SAMPLE)
    const followRedirects = result.find(v => v.package === 'follow-redirects')
    expect(followRedirects?.fixAvailable).toBe(true)
    expect(followRedirects?.fixVersion).toBe('1.6.5')
  })

  test('sets fixAvailable=false when fixAvailable is false', () => {
    const result = parseNpmAuditOutput(NPM_V7_SAMPLE)
    const semver = result.find(v => v.package === 'semver')
    expect(semver?.fixAvailable).toBe(false)
    expect(semver?.fixVersion).toBeUndefined()
  })

  test('returns empty array for empty vulnerabilities', () => {
    const result = parseNpmAuditOutput(NPM_V7_EMPTY)
    expect(result).toHaveLength(0)
  })

  test('handles via as string (transitive dependency)', () => {
    const result = parseNpmAuditOutput(NPM_V7_VIA_STRING)
    expect(result).toHaveLength(1)
    expect(result[0]?.description).toBe('parent-pkg')
  })
})

describe('parseNpmAuditOutput — edge cases', () => {
  test('returns empty array for unrecognised format', () => {
    const result = parseNpmAuditOutput(JSON.stringify({ metadata: {}, something: {} }))
    expect(result).toHaveLength(0)
  })

  test('throws on invalid JSON', () => {
    expect(() => parseNpmAuditOutput('not json')).toThrow()
  })

  test('normalizes "medium" severity to "moderate"', () => {
    const input = JSON.stringify({
      advisories: {
        '1': {
          id: 1,
          module_name: 'pkg',
          severity: 'medium',
          overview: 'test',
          patched_versions: '>=1.0.0',
        },
      },
    })
    const result = parseNpmAuditOutput(input)
    expect(result[0]?.severity).toBe('moderate')
  })

  test('handles unknown severity as "low"', () => {
    const input = JSON.stringify({
      advisories: {
        '1': {
          id: 1,
          module_name: 'pkg',
          severity: 'info',
          overview: 'test',
          patched_versions: '',
        },
      },
    })
    const result = parseNpmAuditOutput(input)
    expect(result[0]?.severity).toBe('low')
  })
})
