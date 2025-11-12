/**
 * Tree Flattener Utility
 * Converts hierarchical JSON tree into a flat list for virtual scrolling
 */

import type { JsonValue } from '@/types'
import { getJsonType } from './pathGenerator'

export interface PathSegment {
  key: string
  isArrayIndex: boolean
}

export interface FlatTreeNode {
  key: string
  value: JsonValue
  pathSegments: PathSegment[]
  path: string // JMESPath format for tracking
  depth: number
  isExpandable: boolean
  isExpanded: boolean
  hasChildren: boolean
  childCount: number
  index: number // Position in flat array
}

interface FlattenOptions {
  expandedPaths: Set<string>
  collapsedPaths?: Set<string>
  matchingPaths?: Set<string>
  emptyPaths?: Set<string>
  hideEmpty?: boolean
  maxDepth?: number
}

/**
 * Flatten a JSON tree into a list of visible nodes based on expanded paths
 */
export function flattenTree(
  data: JsonValue,
  options: FlattenOptions
): FlatTreeNode[] {
  const flatNodes: FlatTreeNode[] = []
  const { expandedPaths, matchingPaths, emptyPaths, hideEmpty, maxDepth, collapsedPaths } = options

  // Check for depth-based expansion flag
  const depthFlag = Array.from(expandedPaths).find(flag => flag.startsWith('__EXPAND_TO_DEPTH_'))
  const expandToDepth = depthFlag ? parseInt(depthFlag.replace('__EXPAND_TO_DEPTH_', '').replace('__', '')) : 0

  function buildPath(segments: PathSegment[]): string {
    if (segments.length === 0) return ''

    let path = ''
    for (const segment of segments) {
      if (segment.isArrayIndex) {
        path += `[${segment.key}]`
      } else {
        path += path ? `.${segment.key}` : segment.key
      }
    }
    return path
  }

  function shouldShowNode(path: string): boolean {
    // If hideEmpty is enabled, check if this path is in emptyPaths
    if (hideEmpty && emptyPaths?.has(path)) {
      return false
    }

    // If filter is active, show only matching paths and their ancestors
    if (matchingPaths && matchingPaths.size > 0) {
      if (matchingPaths.has(path)) {
        return true
      }

      // Check if this node is an ancestor of a match
      for (const matchPath of matchingPaths) {
        if (matchPath.startsWith(path + '.') || matchPath.startsWith(path + '[')) {
          return true
        }
      }

      return false
    }

    return true
  }

  function isOnPathToMatch(path: string): boolean {
    if (!matchingPaths || matchingPaths.size === 0) return false

    for (const matchPath of matchingPaths) {
      if (matchPath.startsWith(path + '.') || matchPath.startsWith(path + '[')) {
        return true
      }
    }
    return false
  }

  function traverse(
    value: JsonValue,
    segments: PathSegment[],
    depth: number
  ): void {
    const valueType = getJsonType(value)
    const isExpandable = valueType === 'object' || valueType === 'array'

    if (!isExpandable) return

    const entries: [string, JsonValue][] =
      valueType === 'array'
        ? (value as JsonValue[]).map((item, index) => [String(index), item])
        : Object.entries(value as Record<string, JsonValue>)

    for (let i = 0; i < entries.length; i++) {
      const [key, childValue] = entries[i]
      const isArrayIndex = valueType === 'array'

      const childSegments: PathSegment[] = [
        ...segments,
        { key, isArrayIndex }
      ]

      const childPath = buildPath(childSegments)

      // Check if node should be shown (filter/hideEmpty logic)
      if (!shouldShowNode(childPath)) {
        continue
      }

      const childType = getJsonType(childValue)
      const childIsExpandable = childType === 'object' || childType === 'array'
      const childCount = childIsExpandable
        ? childType === 'array'
          ? (childValue as JsonValue[]).length
          : Object.keys(childValue as Record<string, JsonValue>).length
        : 0

      // Determine if this node should be expanded
      // Priority: explicitly collapsed > explicitly expanded > depth-based > filter-based
      const shouldExpand = collapsedPaths && collapsedPaths.has(childPath)
        ? false // Explicitly collapsed
        : expandedPaths.has(childPath) && childPath !== depthFlag
          ? true // Explicitly expanded
          : depth <= expandToDepth
            ? true // Depth-based expansion
            : matchingPaths && matchingPaths.size > 0 && isOnPathToMatch(childPath)
              ? true // Filter-based expansion
              : false // Default collapsed

      // Add node to flat list
      flatNodes.push({
        key,
        value: childValue,
        pathSegments: childSegments,
        path: childPath,
        depth,
        isExpandable: childIsExpandable,
        isExpanded: shouldExpand,
        hasChildren: childCount > 0,
        childCount,
        index: flatNodes.length
      })

      // If node is expanded and has children, traverse its children
      if (shouldExpand && childIsExpandable && childCount > 0) {
        // Check depth limit if specified
        if (maxDepth === undefined || depth < maxDepth) {
          traverse(childValue, childSegments, depth + 1)
        }
      }
    }
  }

  // Handle root-level primitives
  const rootType = getJsonType(data)
  if (rootType !== 'object' && rootType !== 'array') {
    return []
  }

  // Start traversal at root
  traverse(data, [], 1)

  return flatNodes
}

/**
 * Get total node count in a JSON structure (without filtering)
 */
export function getTotalNodeCount(data: JsonValue): number {
  const type = getJsonType(data)

  if (type !== 'object' && type !== 'array') {
    return 0
  }

  let count = 0

  function countNodes(value: JsonValue): void {
    const valueType = getJsonType(value)

    if (valueType === 'array') {
      const arr = value as JsonValue[]
      count += arr.length
      for (const item of arr) {
        countNodes(item)
      }
    } else if (valueType === 'object') {
      const obj = value as Record<string, JsonValue>
      const keys = Object.keys(obj)
      count += keys.length
      for (const key of keys) {
        countNodes(obj[key])
      }
    }
  }

  countNodes(data)
  return count
}

/**
 * Calculate estimated height for a node (for virtual scrolling)
 */
export function getNodeHeight(_node: FlatTreeNode): number {
  // Base height for a single node row in pixels
  const BASE_HEIGHT = 32 // Matches the tree node height

  // For now, return constant height
  // In the future, could calculate based on content length, etc.
  return BASE_HEIGHT
}
