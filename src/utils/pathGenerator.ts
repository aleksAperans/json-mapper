import type { PathFormat } from '@/types'

/**
 * Escapes a key for use in a path based on the format
 *
 * JMESPath identifier rules (https://jmespath.org/specification.html#identifiers):
 * - Unquoted: Must start with [A-Za-z_] and contain only [A-Za-z0-9_]
 * - Quoted: All other identifiers must be wrapped in double quotes
 * - Escaping: Backslashes and double quotes must be escaped
 */
function escapeKey(key: string, format: PathFormat): string {
  switch (format) {
    case 'jmespath': {
      // Check if key matches unquoted identifier pattern per JMESPath spec
      const isValidUnquoted = /^[A-Za-z_][A-Za-z0-9_]*$/.test(key)

      if (isValidUnquoted) {
        return key
      }

      // Escape backslashes first, then double quotes
      const escaped = key
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')

      return `"${escaped}"`
    }

    case 'jsonpath':
      // JSONPath uses brackets with quotes
      return `['${key.replace(/'/g, "\\'")}']`

    case 'javascript': {
      // JavaScript can use dot notation or bracket notation
      const needsEscape = /[.\[\]\s-]/.test(key) || /^\d+$/.test(key)
      return needsEscape ? `['${key.replace(/'/g, "\\'")}']` : `.${key}`
    }

    case 'python':
      // Python uses bracket notation with quotes
      return `['${key.replace(/'/g, "\\'")}']`

    default:
      return key
  }
}

/**
 * Generates a path string from an array of path segments
 */
export function generatePath(
  segments: Array<{ key: string; isArrayIndex: boolean }>,
  format: PathFormat = 'jmespath'
): string {
  if (segments.length === 0) return ''

  let path = ''

  segments.forEach((segment, index) => {
    const { key, isArrayIndex } = segment

    if (isArrayIndex) {
      // Array index
      path += `[${key}]`
    } else {
      // Object key
      if (index === 0) {
        // First segment
        switch (format) {
          case 'jsonpath':
            path = '$' + escapeKey(key, format)
            break
          case 'javascript':
          case 'python':
            path = key
            break
          case 'jmespath':
            path = escapeKey(key, format)
            break
        }
      } else {
        // Subsequent segments
        const escaped = escapeKey(key, format)
        if (format === 'javascript' && !escaped.startsWith('[')) {
          path += escaped
        } else if (format === 'jmespath') {
          // Always add dot separator for JMESPath, even for quoted identifiers
          path += '.' + escaped
        } else {
          path += escaped
        }
      }
    }
  })

  return path
}

/**
 * Parses a path string into segments
 */
export function parsePath(path: string): Array<{ key: string; isArrayIndex: boolean }> {
  const segments: Array<{ key: string; isArrayIndex: boolean }> = []

  // Remove leading $ for JSONPath
  const cleanPath = path.startsWith('$') ? path.slice(1) : path

  // Split by dots and brackets
  const regex = /\.?([^.\[\]]+)|\[(\d+)\]/g
  let match

  while ((match = regex.exec(cleanPath)) !== null) {
    if (match[1] !== undefined) {
      // Object key
      segments.push({ key: match[1].replace(/^["']|["']$/g, ''), isArrayIndex: false })
    } else if (match[2] !== undefined) {
      // Array index
      segments.push({ key: match[2], isArrayIndex: true })
    }
  }

  return segments
}

/**
 * Gets the type of a JSON value
 */
export function getJsonType(value: unknown): 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'object') return 'object'
  return typeof value as 'string' | 'number' | 'boolean'
}

/**
 * Checks if a value is a primitive
 */
export function isPrimitive(value: unknown): boolean {
  return value === null || typeof value !== 'object'
}
