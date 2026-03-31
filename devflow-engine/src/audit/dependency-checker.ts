/**
 * Pure parser for `npm audit --json` output.
 * Accepts the raw JSON string from npm audit and returns Vulnerability[].
 * No file I/O or execSync — caller is responsible for obtaining the JSON.
 *
 * Handles two npm audit formats:
 *   - npm v6 (legacy): top-level `advisories` object, keyed by advisory ID
 *   - npm v7+ (modern): top-level `vulnerabilities` object, keyed by package name
 */
import type { Vulnerability } from './schemas/vulnerability.js'

// ─── npm v6 advisory format ───────────────────────────────────────────────────

interface NpmV6Advisory {
  id: number
  module_name: string
  severity: string
  overview: string
  recommendation?: string
  patched_versions?: string
}

interface NpmV6Output {
  advisories?: Record<string, NpmV6Advisory>
}

// ─── npm v7+ vulnerability format ─────────────────────────────────────────────

interface NpmV7Via {
  source?: number
  name?: string
  dependency?: string
  title?: string
  severity?: string
  fixAvailable?: boolean
  range?: string
  url?: string
}

interface NpmV7Vulnerability {
  name?: string
  severity?: string
  isDirect?: boolean
  via?: Array<NpmV7Via | string>
  effects?: string[]
  range?: string
  nodes?: string[]
  fixAvailable?: boolean | { name: string; version: string; isSemVerMajor?: boolean }
}

interface NpmV7Output {
  vulnerabilities?: Record<string, NpmV7Vulnerability>
}

// ─── severity normalizer ──────────────────────────────────────────────────────

type VulnSeverity = 'critical' | 'high' | 'moderate' | 'low'

function normalizeSeverity(raw: string | undefined): VulnSeverity {
  const s = (raw ?? '').toLowerCase()
  if (s === 'critical') return 'critical'
  if (s === 'high') return 'high'
  if (s === 'moderate' || s === 'medium') return 'moderate'
  return 'low'
}

// ─── parsers ──────────────────────────────────────────────────────────────────

function parseV6(data: NpmV6Output): Vulnerability[] {
  if (data.advisories === undefined) return []

  return Object.values(data.advisories).map((advisory): Vulnerability => {
    const fixVersion = advisory.patched_versions !== undefined
      && advisory.patched_versions !== '<0.0.0'
      && advisory.patched_versions.trim() !== ''
      ? advisory.patched_versions
      : undefined

    return {
      id: String(advisory.id),
      package: advisory.module_name,
      severity: normalizeSeverity(advisory.severity),
      description: advisory.overview,
      fixAvailable: fixVersion !== undefined,
      ...(fixVersion !== undefined && { fixVersion }),
    }
  })
}

function parseV7(data: NpmV7Output): Vulnerability[] {
  if (data.vulnerabilities === undefined) return []

  return Object.entries(data.vulnerabilities).map(([pkgName, vuln]): Vulnerability => {
    const fixAvailableRaw = vuln.fixAvailable
    const fixAvailable = fixAvailableRaw !== false && fixAvailableRaw !== undefined

    let fixVersion: string | undefined
    if (typeof fixAvailableRaw === 'object' && fixAvailableRaw !== null) {
      fixVersion = fixAvailableRaw.version
    }

    // Derive description from first via entry that has a title
    let description = ''
    if (vuln.via !== undefined && vuln.via.length > 0) {
      const first = vuln.via[0]
      if (typeof first === 'object' && first !== null && first.title !== undefined) {
        description = first.title
      } else if (typeof first === 'string') {
        description = first
      }
    }
    if (description === '') description = `Vulnerability in ${pkgName}`

    // Derive a stable ID: prefer source ID from first via, fall back to package name
    let id = pkgName
    if (vuln.via !== undefined && vuln.via.length > 0) {
      const first = vuln.via[0]
      if (typeof first === 'object' && first !== null && first.source !== undefined) {
        id = String(first.source)
      }
    }

    return {
      id,
      package: vuln.name ?? pkgName,
      severity: normalizeSeverity(vuln.severity),
      description,
      fixAvailable,
      ...(fixVersion !== undefined && { fixVersion }),
    }
  })
}

// ─── public API ───────────────────────────────────────────────────────────────

/**
 * Parse the JSON output of `npm audit --json` into Vulnerability[].
 * Throws if the input is not valid JSON.
 * Returns an empty array if no vulnerabilities are found or the format is unrecognised.
 */
export function parseNpmAuditOutput(jsonStr: string): Vulnerability[] {
  const data = JSON.parse(jsonStr) as Record<string, unknown>

  // npm v6 produces `advisories` key
  if ('advisories' in data) {
    return parseV6(data as NpmV6Output)
  }

  // npm v7+ produces `vulnerabilities` key
  if ('vulnerabilities' in data) {
    return parseV7(data as NpmV7Output)
  }

  // Unrecognised format — return empty rather than throw (npm may change formats)
  return []
}
