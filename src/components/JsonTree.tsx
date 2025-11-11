import type { JsonValue } from '@/types'
import { JsonTreeNode } from './JsonTreeNode'
import { VirtualJsonTree } from './VirtualJsonTree'
import { getJsonType } from '@/utils/pathGenerator'
import { useAppStore } from '@/store/appStore'
import { getMatchingPaths, getEmptyPaths } from '@/utils/filter'
import { getTotalNodeCount } from '@/utils/treeFlattener'
import { useMemo } from 'react'

// Threshold for switching to virtual scrolling
const VIRTUAL_SCROLL_THRESHOLD = 500

interface JsonTreeProps {
  data: JsonValue
}

export function JsonTree({ data }: JsonTreeProps) {
  const { filterQuery, caseSensitive, pathFormat, hideEmpty, metadata } = useAppStore()

  // Calculate matching paths when filter is active
  const matchingPaths = useMemo(() => {
    if (!filterQuery.trim()) return new Set<string>()
    return getMatchingPaths(data, filterQuery, pathFormat, { caseSensitive })
  }, [data, filterQuery, pathFormat, caseSensitive])

  // Calculate empty paths when hideEmpty is active
  const emptyPaths = useMemo(() => {
    if (!hideEmpty) return new Set<string>()
    return getEmptyPaths(data, pathFormat)
  }, [data, pathFormat, hideEmpty])

  // Determine if we should use virtual scrolling
  const totalNodes = useMemo(() => {
    // Use metadata if available (from worker parsing)
    if (metadata?.nodeCount) {
      return metadata.nodeCount
    }
    // Otherwise calculate on-demand
    return getTotalNodeCount(data)
  }, [data, metadata])

  const useVirtualScrolling = totalNodes > VIRTUAL_SCROLL_THRESHOLD

  const valueType = getJsonType(data)
  const isObject = valueType === 'object'
  const isArray = valueType === 'array'

  // For root-level primitives
  if (!isObject && !isArray) {
    return (
      <div className="p-6 font-mono text-sm">
        <span className="text-gray-500">Root value: </span>
        {valueType === 'string' && (
          <span className="text-json-string-light dark:text-json-string-dark">"{data as string}"</span>
        )}
        {valueType === 'number' && (
          <span className="text-json-number-light dark:text-json-number-dark">{data as number}</span>
        )}
        {valueType === 'boolean' && (
          <span className="text-json-boolean-light dark:text-json-boolean-dark">{String(data)}</span>
        )}
        {valueType === 'null' && (
          <span className="text-json-null-light dark:text-json-null-dark">null</span>
        )}
      </div>
    )
  }

  // Use virtual scrolling for large datasets
  if (useVirtualScrolling) {
    return <VirtualJsonTree data={data} />
  }

  // For objects and arrays - use regular tree rendering
  const entries = isArray
    ? (data as JsonValue[]).map((item, index) => [String(index), item] as [string, JsonValue])
    : Object.entries(data as Record<string, JsonValue>)

  return (
    <div className="p-6">
      <div className="ml-2">
        {entries.map(([key, value], index) => (
          <JsonTreeNode
            key={key}
            nodeKey={key}
            value={value}
            pathSegments={[]}
            isLast={index === entries.length - 1}
            matchingPaths={matchingPaths}
            emptyPaths={emptyPaths}
            hideEmpty={hideEmpty}
          />
        ))}
      </div>
    </div>
  )
}
