import type { JsonValue } from '@/types'

interface Position {
  line: number
  column: number
}

/**
 * Finds the position (line and column) of a value in the original JSON text
 * based on the JSON path segments
 */
export function findPositionInText(
  originalText: string,
  pathSegments: Array<{ key: string; isArrayIndex: boolean }>,
  value: JsonValue
): Position | null {
  if (!originalText || pathSegments.length === 0) {
    return null
  }

  try {
    // For simple values, try to find them by searching for the key and value
    const lastSegment = pathSegments[pathSegments.length - 1]
    const searchKey = lastSegment.key

    // Build a search pattern based on the value type
    let searchPattern: string | null = null

    if (typeof value === 'string') {
      searchPattern = `"${searchKey}"\\s*:\\s*"${escapeRegex(value)}"`
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      searchPattern = `"${searchKey}"\\s*:\\s*${value}`
    } else if (value === null) {
      searchPattern = `"${searchKey}"\\s*:\\s*null`
    } else if (Array.isArray(value) || typeof value === 'object') {
      // For objects and arrays, just search for the key
      searchPattern = `"${searchKey}"\\s*:`
    }

    if (!searchPattern) {
      return null
    }

    const regex = new RegExp(searchPattern, 'g')
    const matches = Array.from(originalText.matchAll(regex))

    if (matches.length === 0) {
      return null
    }

    // If there's only one match, use it
    // If there are multiple matches, we'd need more sophisticated logic to find the right one
    // For now, we'll use the first match
    const match = matches[0]
    const position = match.index!

    // Calculate line and column
    const textBeforeMatch = originalText.substring(0, position)
    const lines = textBeforeMatch.split('\n')
    const line = lines.length
    const column = lines[lines.length - 1].length + 1

    return { line, column }
  } catch (error) {
    console.error('Error finding position:', error)
    return null
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
