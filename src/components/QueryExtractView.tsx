import { useState, useMemo } from 'react'
import { Copy, Check } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { extractAllPaths, extractAllKeys, extractAllValues } from '@/utils/extract'
import { copyToClipboard } from '@/utils/clipboard'

export function QueryExtractView() {
  const { jsonData, pathFormat, setCopyNotification, extractionMode, filterQuery, caseSensitive } = useAppStore()
  const [copiedItem, setCopiedItem] = useState<string | null>(null)

  const extractedData = useMemo(() => {
    if (!jsonData) return null

    switch (extractionMode) {
      case 'paths':
        return extractAllPaths(jsonData, pathFormat)
      case 'keys':
        return extractAllKeys(jsonData, pathFormat)
      case 'values':
        return extractAllValues(jsonData, pathFormat)
    }
  }, [jsonData, extractionMode, pathFormat])

  const filteredData = useMemo(() => {
    if (!extractedData || !filterQuery.trim()) return extractedData

    const query = caseSensitive ? filterQuery : filterQuery.toLowerCase()

    switch (extractionMode) {
      case 'paths':
        return (extractedData as ReturnType<typeof extractAllPaths>).filter((item) =>
          caseSensitive
            ? item.path.includes(query)
            : item.path.toLowerCase().includes(query)
        )
      case 'keys':
        return (extractedData as ReturnType<typeof extractAllKeys>).filter((item) =>
          caseSensitive
            ? item.key.includes(query)
            : item.key.toLowerCase().includes(query)
        )
      case 'values':
        return (extractedData as ReturnType<typeof extractAllValues>).filter((item) => {
          const pathMatch = caseSensitive
            ? item.path.includes(query)
            : item.path.toLowerCase().includes(query)
          const valueMatch = caseSensitive
            ? String(item.value).includes(query)
            : String(item.value).toLowerCase().includes(query)
          return pathMatch || valueMatch
        })
    }
  }, [extractedData, filterQuery, extractionMode, caseSensitive])

  const handleCopy = async (text: string, displayText?: string) => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopiedItem(text)
      setCopyNotification(true, `Copied: ${displayText || text}`)
      setTimeout(() => {
        setCopiedItem(null)
        setCopyNotification(false)
      }, 2000)
    }
  }

  if (!jsonData) {
    return null
  }

  const count = filteredData?.length || 0

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900">
      {/* Results */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {count} {extractionMode} found
              {filterQuery && ` (filtered from ${extractedData?.length})`}
            </p>
          </div>

          {count === 0 ? (
            <div className="flex items-center justify-center py-12 text-center text-muted-foreground">
              <p>No {extractionMode} found{filterQuery && ' matching your filter'}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {extractionMode === 'paths' &&
                (filteredData as ReturnType<typeof extractAllPaths>).map((item, index) => (
                  <div
                    key={index}
                    className="group flex items-center justify-between rounded-md border bg-card px-3 py-2 text-sm hover:bg-accent"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <code className="font-mono truncate">{item.path}</code>
                      <span className="text-xs text-muted-foreground">({item.type})</span>
                    </div>
                    <button
                      onClick={() => handleCopy(item.path)}
                      className="ml-2 opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-primary transition-opacity"
                    >
                      {copiedItem === item.path ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                ))}

              {extractionMode === 'keys' &&
                (filteredData as ReturnType<typeof extractAllKeys>).map((item, index) => (
                  <div
                    key={index}
                    className="group flex items-center justify-between rounded-md border bg-card px-3 py-2 text-sm hover:bg-accent"
                  >
                    <div className="flex items-center gap-3">
                      <code className="font-mono font-semibold">{item.key}</code>
                      <span className="text-xs text-muted-foreground">
                        ({item.count} occurrence{item.count !== 1 ? 's' : ''})
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(item.key)}
                      className="ml-2 opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-primary transition-opacity"
                    >
                      {copiedItem === item.key ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                ))}

              {extractionMode === 'values' &&
                (filteredData as ReturnType<typeof extractAllValues>).map((item, index) => (
                  <div
                    key={index}
                    className="group flex items-start justify-between rounded-md border bg-card px-3 py-2 text-sm hover:bg-accent"
                  >
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <code className="font-mono text-xs text-muted-foreground truncate">
                        {item.path}
                      </code>
                      <div className="flex items-center gap-2">
                        <code className="font-mono">
                          {item.type === 'string' ? `"${item.value}"` : String(item.value)}
                        </code>
                        <span className="text-xs text-muted-foreground">({item.type})</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(String(item.value), `${item.path}: ${String(item.value)}`)}
                      className="ml-2 opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-primary transition-opacity"
                    >
                      {copiedItem === String(item.value) ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
