import type { JsonValue, PathFormat } from '@/types'
import { generatePath, type PathSegment } from './pathGenerator'

interface FilterOptions {
  caseSensitive?: boolean
}

/**
 * Get all paths that match the filter query (either key or value matches)
 */
export function getMatchingPaths(
  data: JsonValue,
  query: string,
  pathFormat: PathFormat = 'jmespath',
  options: FilterOptions = {}
): Set<string> {
  const { caseSensitive = false } = options
  const matchingPaths = new Set<string>()

  if (!query.trim()) return matchingPaths

  const normalizedQuery = caseSensitive ? query : query.toLowerCase()

  function matches(text: string): boolean {
    const normalizedText = caseSensitive ? text : text.toLowerCase()
    return normalizedText.includes(normalizedQuery)
  }

  function traverse(value: JsonValue, segments: PathSegment[] = []) {
    const currentPath = segments.length > 0 ? generatePath(segments, pathFormat) : ''

    // Check if current key matches (if we have segments)
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1]
      if (matches(lastSegment.key)) {
        matchingPaths.add(currentPath)
      }
    }

    if (value === null) {
      // Check if "null" matches
      if (matches('null')) {
        matchingPaths.add(currentPath)
      }
      return
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        traverse(item, [...segments, { key: String(index), isArrayIndex: true }])
      })
    } else if (typeof value === 'object') {
      Object.entries(value).forEach(([key, val]) => {
        traverse(val, [...segments, { key, isArrayIndex: false }])
      })
    } else {
      // Primitive value - check if it matches
      const stringValue = String(value)
      if (matches(stringValue)) {
        matchingPaths.add(currentPath)
      }
    }
  }

  traverse(data)
  return matchingPaths
}

/**
 * Get all paths that have empty values
 * Empty values include: empty string (""), empty array ([]), empty object ({}), null
 */
export function getEmptyPaths(
  data: JsonValue,
  pathFormat: PathFormat = 'jmespath'
): Set<string> {
  const emptyPaths = new Set<string>()

  function isEmptyValue(value: JsonValue): boolean {
    if (value === null) return true
    if (value === '') return true
    if (Array.isArray(value) && value.length === 0) return true
    if (typeof value === 'object' && Object.keys(value).length === 0) return true
    return false
  }

  function traverse(value: JsonValue, segments: PathSegment[] = []) {
    const currentPath = segments.length > 0 ? generatePath(segments, pathFormat) : ''

    // Check if current value is empty
    if (segments.length > 0 && isEmptyValue(value)) {
      emptyPaths.add(currentPath)
      return // Don't traverse into empty collections
    }

    // Traverse children
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        traverse(item, [...segments, { key: String(index), isArrayIndex: true }])
      })
    } else if (typeof value === 'object' && value !== null) {
      Object.entries(value).forEach(([key, val]) => {
        traverse(val, [...segments, { key, isArrayIndex: false }])
      })
    }
  }

  traverse(data)
  return emptyPaths
}

/**
 * Check if a node should be shown based on filter
 * A node should be shown if:
 * 1. It matches the filter itself, OR
 * 2. It's on the path to a matching node (ancestor of a match)
 * 3. It's not empty (if hideEmpty is active)
 *
 * Note: Search filter takes precedence - if a node matches search, show it even if empty
 */
export function shouldShowNode(
  nodePath: string,
  matchingPaths: Set<string>,
  emptyPaths: Set<string> = new Set(),
  hideEmpty: boolean = false
): boolean {
  // If hideEmpty is active and this node is empty
  if (hideEmpty && emptyPaths.has(nodePath)) {
    // If search is active, only hide if this node doesn't match the search
    if (matchingPaths.size > 0) {
      // Show it if it matches the search
      if (matchingPaths.has(nodePath)) {
        return true
      }
      // Hide it if it doesn't match
      return false
    }
    // No search active, hide empty nodes
    return false
  }

  // Standard search filter logic
  if (matchingPaths.size === 0) {
    // No filter active, show everything
    return true
  }

  // Check if this node itself matches
  if (matchingPaths.has(nodePath)) {
    return true
  }

  // Check if any matching path starts with this node's path
  // (meaning this node is an ancestor of a match)
  for (const matchPath of matchingPaths) {
    if (matchPath.startsWith(nodePath + '.') || matchPath.startsWith(nodePath + '[')) {
      return true
    }
  }

  return false
}
