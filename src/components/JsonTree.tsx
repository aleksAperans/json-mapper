import type { JsonValue } from '@/types'
import { JsonTreeNode } from './JsonTreeNode'
import { getJsonType } from '@/utils/pathGenerator'
import { useAppStore } from '@/store/appStore'
import { getMatchingPaths, getEmptyPaths } from '@/utils/filter'
import { useMemo } from 'react'

interface JsonTreeProps {
  data: JsonValue
}

export function JsonTree({ data }: JsonTreeProps) {
  const { filterQuery, caseSensitive, pathFormat, hideEmpty } = useAppStore()

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

  // For objects and arrays
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
