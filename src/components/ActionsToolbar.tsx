import { ChevronsDown, ChevronsUp, X, Trash2, Copy, CaseSensitive, Bookmark, EyeOff } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { copyToClipboard } from '@/utils/clipboard'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'
import { extractAllPaths, extractAllKeys, extractAllValues } from '@/utils/extract'

export function ActionsToolbar() {
  const {
    activeFeature,
    expandAll,
    collapseAll,
    clearJsonData,
    extractionMode,
    setExtractionMode,
    filterQuery,
    setFilterQuery,
    caseSensitive,
    toggleCaseSensitive,
    hideEmpty,
    toggleHideEmpty,
    jsonData,
    metadata,
    pathFormat,
    setCopyNotification,
    bookmarks,
    setIsBookmarksOpen,
  } = useAppStore()

  // For large files, "Expand All" will use depth-limited expansion
  const isLargeFile = metadata?.nodeCount && metadata.nodeCount > 5000

  // For Query & Extract: get filtered data to enable/disable Copy All
  const extractedData = useMemo(() => {
    if (!jsonData || activeFeature !== 'query') return null

    switch (extractionMode) {
      case 'paths':
        return extractAllPaths(jsonData, pathFormat)
      case 'keys':
        return extractAllKeys(jsonData, pathFormat)
      case 'values':
        return extractAllValues(jsonData, pathFormat)
    }
  }, [jsonData, extractionMode, pathFormat, activeFeature])

  const filteredData = useMemo(() => {
    if (!extractedData || !filterQuery.trim()) return extractedData

    const query = caseSensitive ? filterQuery : filterQuery.toLowerCase()

    switch (extractionMode) {
      case 'paths':
        return extractedData.filter((item) =>
          caseSensitive
            ? item.path.includes(query)
            : item.path.toLowerCase().includes(query)
        )
      case 'keys':
        return extractedData.filter((item) =>
          caseSensitive
            ? item.key.includes(query)
            : item.key.toLowerCase().includes(query)
        )
      case 'values':
        return extractedData.filter((item) => {
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

  const handleCopyAll = async () => {
    if (!filteredData) return

    let text = ''
    switch (extractionMode) {
      case 'paths':
        text = filteredData.map((item) => item.path).join('\n')
        break
      case 'keys':
        text = filteredData.map((item) => item.key).join('\n')
        break
      case 'values':
        text = filteredData
          .map((item) => `${item.path}: ${JSON.stringify(item.value)}`)
          .join('\n')
        break
    }

    const success = await copyToClipboard(text)
    if (success) {
      setCopyNotification(true, `Copied all ${filteredData.length} items`)
      setTimeout(() => setCopyNotification(false), 2000)
    }
  }

  return (
    <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5">
      {activeFeature === 'tree' ? (
        <>
          {/* Tree View Actions */}
          <button
            onClick={expandAll}
            className="inline-flex h-8 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            title={
              isLargeFile
                ? `Expand to depth 2 (large file: ${metadata?.nodeCount?.toLocaleString()} nodes)`
                : "Expand all nodes"
            }
          >
            <ChevronsDown className="h-4 w-4" />
            <span>Expand All</span>
          </button>

          <button
            onClick={collapseAll}
            className="inline-flex h-8 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            title="Collapse all nodes"
          >
            <ChevronsUp className="h-4 w-4" />
            <span>Collapse All</span>
          </button>

          {/* Hide Empty Button */}
          <button
            onClick={toggleHideEmpty}
            className={cn(
              'inline-flex h-8 items-center gap-2 rounded-md px-3 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              hideEmpty
                ? 'bg-primary text-primary-foreground border border-primary'
                : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
            )}
            title="Hide empty values, arrays, and objects"
          >
            <EyeOff className="h-4 w-4" />
            <span>Hide Empty</span>
          </button>

          {/* Bookmarks Button */}
          <button
            onClick={() => setIsBookmarksOpen(true)}
            className="inline-flex h-8 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            title="View bookmarks"
          >
            <Bookmark className="h-4 w-4" />
            <span>Bookmarks</span>
            {bookmarks.length > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                {bookmarks.length}
              </span>
            )}
          </button>

          {/* Filter Input */}
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter keys and values..."
              className="h-8 w-full rounded-md border border-input bg-background px-3 pr-8 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            {filterQuery && (
              <button
                onClick={() => setFilterQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Case Sensitive Toggle */}
          <button
            onClick={toggleCaseSensitive}
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold transition-colors',
              caseSensitive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
            )}
            title="Toggle case sensitive filter"
          >
            <CaseSensitive className="h-4 w-4" />
          </button>
        </>
      ) : (
        <>
          {/* Query & Extract Actions */}
          <span className="text-sm font-medium text-muted-foreground">Extract:</span>
          <div className="inline-flex items-center rounded-lg border bg-background p-0.5 shadow-sm">
            {(['paths', 'keys', 'values'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setExtractionMode(mode)}
                className={cn(
                  'rounded-md px-3 py-1 text-sm font-medium capitalize transition-all',
                  extractionMode === mode
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Filter Input */}
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter results..."
              className="h-8 w-full rounded-md border border-input bg-background px-3 pr-8 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            {filterQuery && (
              <button
                onClick={() => setFilterQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Case Sensitive Toggle */}
          <button
            onClick={toggleCaseSensitive}
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold transition-colors',
              caseSensitive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
            )}
            title="Toggle case sensitive filter"
          >
            <CaseSensitive className="h-4 w-4" />
          </button>

          <button
            onClick={handleCopyAll}
            disabled={!filteredData || filteredData.length === 0}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy All
          </button>
        </>
      )}

      <div className="flex-1" />

      {/* Clear Button (always visible) */}
      <button
        onClick={clearJsonData}
        className="inline-flex h-8 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium text-destructive shadow-sm transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        title="Clear JSON data"
      >
        <Trash2 className="h-4 w-4" />
        <span>Clear</span>
      </button>
    </div>
  )
}
