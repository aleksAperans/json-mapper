import type { JsonValue, PathFormat } from '@/types'
import { generatePath } from './pathGenerator'

export interface SearchMatch {
  path: string
  key: string
  value: string
  type: 'key' | 'value'
}

interface PathSegment {
  key: string
  isArrayIndex: boolean
}

/**
 * Recursively find all search matches in the JSON data
 */
export function findSearchMatches(
  data: JsonValue,
  searchQuery: string,
  pathFormat: PathFormat,
  caseSensitive: boolean
): SearchMatch[] {
  if (!searchQuery.trim()) {
    return []
  }

  const matches: SearchMatch[] = []
  const query = caseSensitive ? searchQuery : searchQuery.toLowerCase()

  function traverse(
    value: JsonValue,
    pathSegments: PathSegment[] = []
  ): void {
    if (value === null || value === undefined) {
      return
    }

    const valueType = typeof value

    if (valueType === 'object') {
      if (Array.isArray(value)) {
        // Array
        value.forEach((item, index) => {
          const newSegments = [
            ...pathSegments,
            { key: String(index), isArrayIndex: true }
          ]
          traverse(item, newSegments)
        })
      } else {
        // Object
        Object.entries(value as Record<string, JsonValue>).forEach(([key, val]) => {
          const newSegments = [
            ...pathSegments,
            { key, isArrayIndex: false }
          ]

          // Check if key matches
          const keyToSearch = caseSensitive ? key : key.toLowerCase()
          if (keyToSearch.includes(query)) {
            matches.push({
              path: generatePath(newSegments, pathFormat),
              key,
              value: key,
              type: 'key'
            })
          }

          // Traverse the value
          traverse(val, newSegments)
        })
      }
    } else {
      // Primitive value (string, number, boolean)
      const stringValue = String(value)
      const valueToSearch = caseSensitive ? stringValue : stringValue.toLowerCase()

      if (valueToSearch.includes(query)) {
        matches.push({
          path: generatePath(pathSegments, pathFormat),
          key: pathSegments[pathSegments.length - 1]?.key || '',
          value: stringValue,
          type: 'value'
        })
      }
    }
  }

  traverse(data)
  return matches
}
