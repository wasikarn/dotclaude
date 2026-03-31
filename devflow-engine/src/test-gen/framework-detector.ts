/**
 * Pure function — reads package.json content (string input, no file I/O)
 * and returns the detected test framework.
 *
 * Detection order (first match wins):
 *   vitest → jest → bun → japa → unknown
 */

export type TestFramework = 'vitest' | 'jest' | 'bun' | 'japa' | 'unknown'

interface PackageJson {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

/**
 * Detect the test framework from the content of a package.json file.
 * @param packageJsonContent - Raw string content of package.json
 * @returns The detected framework, or 'unknown' if none found
 */
export function detectFramework(packageJsonContent: string): TestFramework {
  let pkg: PackageJson
  try {
    pkg = JSON.parse(packageJsonContent) as PackageJson
  } catch {
    return 'unknown'
  }

  const allDeps: Record<string, string> = {
    ...(pkg.dependencies ?? {}),
    ...(pkg.devDependencies ?? {}),
  }

  const depNames = Object.keys(allDeps)

  if (depNames.some(d => d === 'vitest')) return 'vitest'
  if (depNames.some(d => d === 'jest' || d === '@jest/core')) return 'jest'
  if (depNames.some(d => d === 'bun-types' || d === 'bun')) return 'bun'
  if (depNames.some(d => d === 'japa' || d === '@japa/runner')) return 'japa'

  return 'unknown'
}
