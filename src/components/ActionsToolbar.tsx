import { ChevronsDown, ChevronsUp, X, Trash2, Copy, CaseSensitive, Bookmark, EyeOff, Filter, Search, ChevronLeft, ChevronRight, WrapText } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { copyToClipboard } from '@/utils/clipboard'
import { cn } from '@/lib/utils'
import { useMemo, useState, useEffect } from 'react'
import { extractAllPaths, extractAllKeys, extractAllValues } from '@/utils/extract'
import { findSearchMatches } from '@/utils/searchMatches'

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
    truncateValues,
    toggleTruncateValues,
    jsonData,
    metadata,
    pathFormat,
    setCopyNotification,
    bookmarks,
    setIsBookmarksOpen,
    isFilterOpen,
    setIsFilterOpen,
    searchQuery,
    setSearchQuery,
    searchCaseSensitive,
    toggleSearchCaseSensitive,
    isSearchOpen,
    setIsSearchOpen,
    currentSearchIndex,
    setCurrentSearchIndex,
    searchMatchCount,
    setSearchMatchCount,
  } = useAppStore()

  // For large files, "Expand All" will use depth-limited expansion
  const isLargeFile = metadata?.nodeCount && metadata.nodeCount > 5000

  // Local state for filter input (debounced to reduce latency)
  const [filterInputValue, setFilterInputValue] = useState(filterQuery)

  // Sync local state with store when filter is cleared externally
  useEffect(() => {
    if (filterQuery === '') {
      setFilterInputValue('')
    }
  }, [filterQuery])

  // Debounce the filter query update (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterQuery(filterInputValue)
    }, 300)

    return () => clearTimeout(timer)
  }, [filterInputValue, setFilterQuery])

  // Local state for search input (debounced to reduce latency)
  const [searchInputValue, setSearchInputValue] = useState(searchQuery)

  // Sync local state with store when search is cleared externally
  useEffect(() => {
    if (searchQuery === '') {
      setSearchInputValue('')
    }
  }, [searchQuery])

  // Debounce the search query update (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInputValue)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchInputValue, setSearchQuery])

  // Find search matches
  const searchMatches = useMemo(() => {
    if (!jsonData || !searchQuery.trim()) {
      return []
    }
    return findSearchMatches(jsonData, searchQuery, pathFormat, searchCaseSensitive)
  }, [jsonData, searchQuery, pathFormat, searchCaseSensitive])

  // Update match count in an effect
  useEffect(() => {
    setSearchMatchCount(searchMatches.length)
  }, [searchMatches, setSearchMatchCount])

  // Scroll to the current match
  const scrollToMatch = (index: number) => {
    // Small delay to ensure DOM is updated
    setTimeout(() => {
      // Get all search match elements
      const allMatches = document.querySelectorAll('[data-search-match]')
      if (allMatches.length > 0 && index < allMatches.length) {
        const targetMatch = allMatches[index] as HTMLElement
        targetMatch.scrollIntoView({ behavior: 'smooth', block: 'center' })

        // Briefly highlight the current match with a different color
        targetMatch.style.backgroundColor = '#fbbf24' // amber-400
        targetMatch.style.outline = '2px solid #f59e0b' // amber-500
        setTimeout(() => {
          targetMatch.style.backgroundColor = ''
          targetMatch.style.outline = ''
        }, 1000)
      }
    }, 100)
  }

  // Navigate to next search result
  const handleNextMatch = () => {
    if (searchMatchCount > 0) {
      const newIndex = (currentSearchIndex + 1) % searchMatchCount
      setCurrentSearchIndex(newIndex)
      scrollToMatch(newIndex)
    }
  }

  // Navigate to previous search result
  const handlePrevMatch = () => {
    if (searchMatchCount > 0) {
      const newIndex = (currentSearchIndex - 1 + searchMatchCount) % searchMatchCount
      setCurrentSearchIndex(newIndex)
      scrollToMatch(newIndex)
    }
  }

  // Scroll to first match when search query changes
  useEffect(() => {
    if (searchQuery && searchMatchCount > 0) {
      scrollToMatch(0)
    }
  }, [searchQuery, searchMatchCount])

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
    <>
      {/* Main Toolbar */}
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

            {/* Truncate Button */}
            <button
              onClick={toggleTruncateValues}
              className={cn(
                'inline-flex h-8 items-center gap-2 rounded-md px-3 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                truncateValues
                  ? 'bg-primary text-primary-foreground border border-primary'
                  : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
              )}
              title="Truncate long values with ellipsis"
            >
              <WrapText className="h-4 w-4" />
              <span>Truncate</span>
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

        {/* Search Button */}
        <button
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className={cn(
            'inline-flex h-8 items-center gap-2 rounded-md px-3 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            isSearchOpen || searchQuery
              ? 'bg-primary text-primary-foreground border border-primary'
              : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
          )}
          title="Toggle search"
        >
          <Search className="h-4 w-4" />
          <span>Search</span>
          {searchQuery && (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-foreground/20 px-1.5 text-[11px] font-semibold">
              ✓
            </span>
          )}
        </button>

        {/* Filter Button */}
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={cn(
            'inline-flex h-8 items-center gap-2 rounded-md px-3 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            isFilterOpen || filterQuery
              ? 'bg-primary text-primary-foreground border border-primary'
              : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
          )}
          title="Toggle filter"
        >
          <Filter className="h-4 w-4" />
          <span>Filter</span>
          {filterQuery && (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-foreground/20 px-1.5 text-[11px] font-semibold">
              ✓
            </span>
          )}
        </button>

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

      {/* Expandable Search Row */}
      {isSearchOpen && (
        <div className="border-b bg-muted/20 px-4 py-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Search and highlight:
            </label>
            <div className="relative flex-1 max-w-lg">
              <input
                type="text"
                value={searchInputValue}
                onChange={(e) => setSearchInputValue(e.target.value)}
                placeholder="Enter search text..."
                className="h-9 w-full rounded-md border border-input bg-background px-3 pr-8 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                autoFocus
              />
              {searchInputValue && (
                <button
                  onClick={() => {
                    setSearchInputValue('')
                    setSearchQuery('')
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  title="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Match count and navigation */}
            {searchQuery && (
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {searchMatchCount > 0 ? `${currentSearchIndex + 1} of ${searchMatchCount}` : 'No matches'}
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={handlePrevMatch}
                    disabled={searchMatchCount === 0}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                    title="Previous match"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleNextMatch}
                    disabled={searchMatchCount === 0}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                    title="Next match"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Case Sensitive Toggle */}
            <button
              onClick={toggleSearchCaseSensitive}
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                searchCaseSensitive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
              )}
              title="Toggle case sensitive search"
            >
              <CaseSensitive className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Expandable Filter Row */}
      {isFilterOpen && (
        <div className="border-b bg-muted/20 px-4 py-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              {activeFeature === 'tree' ? 'Filter keys and values:' : 'Filter results:'}
            </label>
            <div className="relative flex-1 max-w-lg">
              <input
                type="text"
                value={filterInputValue}
                onChange={(e) => setFilterInputValue(e.target.value)}
                placeholder={activeFeature === 'tree' ? 'Enter filter text...' : 'Enter filter text...'}
                className="h-9 w-full rounded-md border border-input bg-background px-3 pr-8 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                autoFocus={!isSearchOpen}
              />
              {filterInputValue && (
                <button
                  onClick={() => {
                    setFilterInputValue('')
                    setFilterQuery('')
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  title="Clear filter"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Case Sensitive Toggle */}
            <button
              onClick={toggleCaseSensitive}
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                caseSensitive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
              )}
              title="Toggle case sensitive filter"
            >
              <CaseSensitive className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
