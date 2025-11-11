import type { JsonValue, PathFormat } from '@/types'
import { generatePath, type PathSegment } from './pathGenerator'

export interface ExtractedPath {
  path: string
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
}

export interface ExtractedKey {
  key: string
  count: number
  paths: string[]
}

export interface ExtractedValue {
  path: string
  value: JsonValue
  type: 'string' | 'number' | 'boolean' | 'null'
}

/**
 * Extract all paths from JSON data
 */
export function extractAllPaths(
  data: JsonValue,
  pathFormat: PathFormat = 'jmespath'
): ExtractedPath[] {
  const paths: ExtractedPath[] = []

  function traverse(value: JsonValue, segments: PathSegment[] = []) {
    if (value === null) {
      if (segments.length > 0) {
        paths.push({
          path: generatePath(segments, pathFormat),
          type: 'null',
        })
      }
      return
    }

    if (Array.isArray(value)) {
      if (segments.length > 0) {
        paths.push({
          path: generatePath(segments, pathFormat),
          type: 'array',
        })
      }
      value.forEach((item, index) => {
        traverse(item, [
          ...segments,
          { key: String(index), isArrayIndex: true },
        ])
      })
    } else if (typeof value === 'object') {
      if (segments.length > 0) {
        paths.push({
          path: generatePath(segments, pathFormat),
          type: 'object',
        })
      }
      Object.entries(value).forEach(([key, val]) => {
        traverse(val, [...segments, { key, isArrayIndex: false }])
      })
    } else {
      // Primitive value
      paths.push({
        path: generatePath(segments, pathFormat),
        type: typeof value as 'string' | 'number' | 'boolean',
      })
    }
  }

  traverse(data)
  return paths
}

/**
 * Extract all unique keys from JSON data
 */
export function extractAllKeys(
  data: JsonValue,
  pathFormat: PathFormat = 'jmespath'
): ExtractedKey[] {
  const keysMap = new Map<string, { count: number; paths: string[] }>()

  function traverse(value: JsonValue, segments: PathSegment[] = []) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          traverse(item, [
            ...segments,
            { key: String(index), isArrayIndex: true },
          ])
        })
      }
      return
    }

    Object.entries(value).forEach(([key, val]) => {
      const currentPath = generatePath(
        [...segments, { key, isArrayIndex: false }],
        pathFormat
      )

      if (!keysMap.has(key)) {
        keysMap.set(key, { count: 0, paths: [] })
      }

      const entry = keysMap.get(key)!
      entry.count++
      entry.paths.push(currentPath)

      traverse(val, [...segments, { key, isArrayIndex: false }])
    })
  }

  traverse(data)

  return Array.from(keysMap.entries())
    .map(([key, { count, paths }]) => ({
      key,
      count,
      paths,
    }))
    .sort((a, b) => b.count - a.count) // Sort by count descending
}

/**
 * Extract all primitive values from JSON data
 */
export function extractAllValues(
  data: JsonValue,
  pathFormat: PathFormat = 'jmespath'
): ExtractedValue[] {
  const values: ExtractedValue[] = []

  function traverse(value: JsonValue, segments: PathSegment[] = []) {
    if (value === null) {
      values.push({
        path: generatePath(segments, pathFormat),
        value: null,
        type: 'null',
      })
      return
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        traverse(item, [
          ...segments,
          { key: String(index), isArrayIndex: true },
        ])
      })
    } else if (typeof value === 'object') {
      Object.entries(value).forEach(([key, val]) => {
        traverse(val, [...segments, { key, isArrayIndex: false }])
      })
    } else {
      // Primitive value
      values.push({
        path: generatePath(segments, pathFormat),
        value,
        type: typeof value as 'string' | 'number' | 'boolean',
      })
    }
  }

  traverse(data)
  return values
}
