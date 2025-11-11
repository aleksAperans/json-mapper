import { useAppStore } from '@/store/appStore'
import { useMemo } from 'react'
import type { JsonValue } from '@/types'
import { generatePath } from '@/utils/pathGenerator'
import { getJsonType } from '@/utils/pathGenerator'

interface TableRow {
  path: string
  key: string
  type: string
  value: string
  depth: number
}

export function TableView() {
  const { jsonData, pathFormat } = useAppStore()

  const tableData = useMemo(() => {
    if (!jsonData) return []

    const rows: TableRow[] = []

    const flatten = (
      data: JsonValue,
      pathSegments: Array<{ key: string; isArrayIndex: boolean }> = [],
      depth = 0
    ) => {
      if (data === null || typeof data !== 'object') {
        // Leaf node
        const lastSegment = pathSegments[pathSegments.length - 1]
        rows.push({
          path: generatePath(pathSegments, pathFormat),
          key: lastSegment?.key || 'root',
          type: getJsonType(data),
          value: JSON.stringify(data),
          depth
        })
        return
      }

      if (Array.isArray(data)) {
        data.forEach((item, index) => {
          const newSegments = [
            ...pathSegments,
            { key: String(index), isArrayIndex: true }
          ]
          flatten(item, newSegments, depth + 1)
        })
      } else {
        // Object
        Object.entries(data).forEach(([key, value]) => {
          const newSegments = [
            ...pathSegments,
            { key, isArrayIndex: false }
          ]

          // For objects and arrays, add a row for the container itself
          if (value !== null && typeof value === 'object') {
            rows.push({
              path: generatePath(newSegments, pathFormat),
              key,
              type: Array.isArray(value) ? 'array' : 'object',
              value: Array.isArray(value)
                ? `[${value.length} items]`
                : `{${Object.keys(value).length} keys}`,
              depth
            })
          }

          flatten(value, newSegments, depth + 1)
        })
      }
    }

    flatten(jsonData)
    return rows
  }, [jsonData, pathFormat])

  if (!jsonData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No data to display</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto bg-white dark:bg-gray-900">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm border-b">
          <tr>
            <th className="text-left p-3 font-semibold text-sm">Path</th>
            <th className="text-left p-3 font-semibold text-sm">Key</th>
            <th className="text-left p-3 font-semibold text-sm">Type</th>
            <th className="text-left p-3 font-semibold text-sm">Value</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, index) => (
            <tr
              key={index}
              className="border-b hover:bg-muted/50 transition-colors"
            >
              <td className="p-3 font-mono text-sm text-muted-foreground">
                {row.path}
              </td>
              <td className="p-3 font-mono text-sm" style={{ paddingLeft: `${row.depth * 16 + 12}px` }}>
                <span className="text-json-key-light dark:text-json-key-dark">
                  {row.key}
                </span>
              </td>
              <td className="p-3 text-sm">
                <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-muted">
                  {row.type}
                </span>
              </td>
              <td className="p-3 font-mono text-sm">
                {row.type === 'string' && (
                  <span className="text-json-string-light dark:text-json-string-dark">
                    {row.value}
                  </span>
                )}
                {row.type === 'number' && (
                  <span className="text-json-number-light dark:text-json-number-dark">
                    {row.value}
                  </span>
                )}
                {row.type === 'boolean' && (
                  <span className="text-json-boolean-light dark:text-json-boolean-dark">
                    {row.value}
                  </span>
                )}
                {row.type === 'null' && (
                  <span className="text-json-null-light dark:text-json-null-dark">
                    {row.value}
                  </span>
                )}
                {(row.type === 'object' || row.type === 'array') && (
                  <span className="text-muted-foreground italic">
                    {row.value}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
