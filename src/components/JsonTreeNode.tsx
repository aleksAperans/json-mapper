import { ChevronRight, Bookmark, Copy, Plus, ChevronsDown } from 'lucide-react'
import type { JsonValue } from '@/types'
import { getJsonType } from '@/utils/pathGenerator'
import { useAppStore } from '@/store/appStore'
import { generatePath } from '@/utils/pathGenerator'
import { copyToClipboard } from '@/utils/clipboard'
import { shouldShowNode } from '@/utils/filter'
import { findPositionInText } from '@/utils/positionCalculator'
import { useMemo, useState, useEffect } from 'react'

// Lazy loading configuration
const LAZY_LOAD_THRESHOLD = 100 // Start paginating when children exceed this
const LAZY_LOAD_BATCH_SIZE = 50 // Load this many items per batch

interface PathSegment {
  key: string
  isArrayIndex: boolean
}

interface JsonTreeNodeProps {
  nodeKey: string
  value: JsonValue
  pathSegments: PathSegment[]
  isLast?: boolean
  matchingPaths: Set<string>
  emptyPaths?: Set<string>
  hideEmpty?: boolean
}

export function JsonTreeNode({
  nodeKey,
  value,
  pathSegments,
  isLast = false,
  matchingPaths,
  emptyPaths = new Set(),
  hideEmpty = false
}: JsonTreeNodeProps) {
  const {
    pathFormat,
    setCurrentPath,
    setCopyNotification,
    expandedPaths,
    collapsedPaths,
    togglePath,
    addBookmark,
    expandSubtree,
    jsonData,
    truncateValues,
    searchQuery,
    searchCaseSensitive,
    currentSearchIndex,
    originalText,
    setHoverPosition
  } = useAppStore()

  const valueType = getJsonType(value)
  const isExpandable = valueType === 'object' || valueType === 'array'
  const isArray = valueType === 'array'


  const currentSegments = [
    ...pathSegments,
    { key: nodeKey, isArrayIndex: !isNaN(Number(nodeKey)) && pathSegments.length > 0 }
  ]

  const currentPath = generatePath(currentSegments, 'jmespath')
  const pathDepth = currentSegments.length

  // Check if this node should be shown based on filter
  const shouldShow = useMemo(() => {
    return shouldShowNode(currentPath, matchingPaths, emptyPaths, hideEmpty)
  }, [currentPath, matchingPaths, emptyPaths, hideEmpty])

  // Check if this node is on the path to a match (for auto-expand)
  const isOnPathToMatch = useMemo(() => {
    if (matchingPaths.size === 0) return false
    for (const matchPath of matchingPaths) {
      if (matchPath.startsWith(currentPath + '.') || matchPath.startsWith(currentPath + '[')) {
        return true
      }
    }
    return false
  }, [currentPath, matchingPaths])

  // If filter is active and this node doesn't match, hide it
  if (!shouldShow) {
    return null
  }

  // Determine if this node should be expanded
  // - If explicitly collapsed, always collapse (overrides everything)
  // - If __EXPAND_ALL__ is active, expand everything
  // - If __EXPAND_TO_DEPTH_2__ is active, expand up to depth 2
  // - If filter is active and node is on path to match, auto-expand
  // - Otherwise, only expanded if explicitly in expandedPaths
  const isExpanded = collapsedPaths.has(currentPath)
    ? false // Explicitly collapsed in Expand All mode
    : expandedPaths.has('__EXPAND_ALL__')
      ? true // Expand all mode
      : expandedPaths.has('__EXPAND_TO_DEPTH_2__') && pathDepth <= 2
        ? true // Depth-limited expansion for large files
        : matchingPaths.size > 0 && isOnPathToMatch
          ? true // Auto-expand when filtering to show matches
          : expandedPaths.has(currentPath) // Progressive disclosure

  // Helper function to get child entries
  const getChildEntries = (): [string, JsonValue][] => {
    if (isArray) {
      return (value as JsonValue[]).map((item, index) => [String(index), item])
    }
    return Object.entries(value as Record<string, JsonValue>)
  }

  // Lazy loading state for large arrays/objects
  const childEntries = useMemo(() => getChildEntries(), [value, isArray])
  const totalChildren = childEntries.length
  const requiresPagination = totalChildren > LAZY_LOAD_THRESHOLD

  const [displayedCount, setDisplayedCount] = useState(() =>
    requiresPagination ? LAZY_LOAD_BATCH_SIZE : totalChildren
  )

  // Reset displayed count when node is collapsed/expanded or when filtering changes
  useMemo(() => {
    if (!isExpanded) {
      setDisplayedCount(requiresPagination ? LAZY_LOAD_BATCH_SIZE : totalChildren)
    }
  }, [isExpanded, requiresPagination, totalChildren])

  const hasMore = displayedCount < totalChildren
  const remainingCount = totalChildren - displayedCount

  const handleLoadMore = () => {
    setDisplayedCount(prev => Math.min(prev + LAZY_LOAD_BATCH_SIZE, totalChildren))
  }

  const handleLoadAll = () => {
    setDisplayedCount(totalChildren)
  }

  const handleCopyPath = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const path = generatePath(currentSegments, pathFormat)
    const success = await copyToClipboard(path)
    if (success) {
      setCurrentPath(path)
      setCopyNotification(true, `Copied: ${path}`)
      setTimeout(() => setCopyNotification(false), 2000)
    }
  }

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation()
    const path = generatePath(currentSegments, pathFormat)
    addBookmark(path, value, pathFormat)
    setCopyNotification(true, `Bookmarked: ${path}`)
    setTimeout(() => setCopyNotification(false), 2000)
  }

  const handleExpandSubtree = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isExpandable && jsonData) {
      expandSubtree(currentPath, jsonData)
      setCopyNotification(true, `Expanded all children of ${nodeKey}`)
      setTimeout(() => setCopyNotification(false), 2000)
    }
  }

  const handleToggle = () => {
    if (isExpandable) {
      togglePath(currentPath)
    }
  }

  const handleMouseEnter = () => {
    if (originalText) {
      const position = findPositionInText(originalText, currentSegments, value)
      if (position) {
        setHoverPosition(position)
      }
    }
  }

  const handleMouseLeave = () => {
    setHoverPosition(null)
  }

  // Keep track of match indices for this node
  const [matchIndices] = useState<number[]>([])

  // Helper function to highlight search matches in text
  const highlightText = (text: string, className: string, matchType: 'key' | 'value' = 'value') => {
    if (!searchQuery.trim()) {
      return <span className={className}>{text}</span>
    }

    const query = searchCaseSensitive ? searchQuery : searchQuery.toLowerCase()
    const textToSearch = searchCaseSensitive ? text : text.toLowerCase()

    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let index = textToSearch.indexOf(query)
    let matchCount = 0

    while (index !== -1) {
      // Add text before match
      if (index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, index)}
          </span>
        )
      }

      // Calculate a unique ID for this match based on path and position
      const matchId = `match-${currentPath}-${matchType}-${index}`

      // Add highlighted match
      parts.push(
        <mark
          key={`mark-${index}`}
          id={matchId}
          data-search-match={matchId}
          className="bg-yellow-300 dark:bg-yellow-600/80 text-gray-900 dark:text-gray-100 px-0.5 rounded"
        >
          {text.substring(index, index + query.length)}
        </mark>
      )

      matchCount++
      lastIndex = index + query.length
      index = textToSearch.indexOf(query, lastIndex)
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex)}
        </span>
      )
    }

    return <span className={className}>{parts}</span>
  }

  const renderValue = () => {
    switch (valueType) {
      case 'string': {
        const stringValue = value as string
        const highlighted = highlightText(stringValue, 'text-json-string-light dark:text-json-string-dark', 'value')
        return (
          <>
            <span className="text-json-string-light dark:text-json-string-dark">"</span>
            {highlighted}
            <span className="text-json-string-light dark:text-json-string-dark">"</span>
          </>
        )
      }
      case 'number':
        return highlightText(String(value), 'text-json-number-light dark:text-json-number-dark', 'value')
      case 'boolean':
        return highlightText(String(value), 'text-json-boolean-light dark:text-json-boolean-dark', 'value')
      case 'null':
        return <span className="text-json-null-light dark:text-json-null-dark">null</span>
      default:
        return null
    }
  }

  const getPreview = () => {
    if (!isExpandable) return ''
    if (isArray) {
      return `Array[${(value as JsonValue[]).length}]`
    }
    const keys = Object.keys(value as Record<string, JsonValue>)
    return keys.length === 0 ? '{}' : `(${keys.length} ${keys.length === 1 ? 'key' : 'keys'})`
  }

  return (
    <div className="font-mono text-base">
      <div
        className="flex items-start hover:bg-gray-100 dark:hover:bg-gray-800 py-1 px-2 rounded group"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {isExpandable && (
          <button
            onClick={handleToggle}
            className="mr-1.5 flex-shrink-0 w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          </button>
        )}
        {!isExpandable && <span className="w-5 flex-shrink-0" />}

        <span
          className="cursor-pointer flex-shrink-0"
          onClick={handleCopyPath}
          title="Click to copy path"
        >
          {highlightText(
            isArray && !isNaN(Number(nodeKey)) ? `[${nodeKey}]` : nodeKey,
            'text-json-key-light dark:text-json-key-dark',
            'key'
          )}
        </span>
        <span className="mx-2 text-gray-500">:</span>

        {!isExpandable ? (
          <span className={truncateValues && !searchQuery.trim() ? 'truncate' : ''}>{renderValue()}</span>
        ) : !isExpanded ? (
          <span
            className="truncate text-gray-500 dark:text-gray-400 cursor-pointer"
            onClick={handleToggle}
          >
            {getPreview()}
          </span>
        ) : null}

        <button
          onClick={handleCopyPath}
          className="ml-2 opacity-0 group-hover:opacity-100 flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded border border-border text-xs text-muted-foreground hover:text-primary hover:border-primary transition-all"
          title="Copy path"
        >
          <Copy className="w-3 h-3" />
          <span>copy</span>
        </button>

        <button
          onClick={handleBookmark}
          className="ml-1 opacity-0 group-hover:opacity-100 flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded border border-border text-xs text-muted-foreground hover:text-primary hover:border-primary transition-all"
          title="Bookmark path"
        >
          <Bookmark className="w-3 h-3" />
          <span>bookmark</span>
        </button>

        {isExpandable && (
          <button
            onClick={handleExpandSubtree}
            className="ml-1 opacity-0 group-hover:opacity-100 flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded border border-border text-xs text-muted-foreground hover:text-primary hover:border-primary transition-all"
            title="Expand all children"
          >
            <ChevronsDown className="w-3 h-3" />
            <span>expand all</span>
          </button>
        )}
      </div>

      {isExpandable && isExpanded && (
        <div className="ml-6 border-l border-border pl-2">
          {childEntries.slice(0, displayedCount).map(([key, childValue], index) => (
            <JsonTreeNode
              key={key}
              nodeKey={key}
              value={childValue}
              pathSegments={currentSegments}
              isLast={index === displayedCount - 1 && !hasMore}
              matchingPaths={matchingPaths}
              emptyPaths={emptyPaths}
              hideEmpty={hideEmpty}
            />
          ))}

          {/* Load more buttons for pagination */}
          {hasMore && (
            <div className="flex gap-2 py-2 px-2 my-1">
              <button
                onClick={handleLoadMore}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors border border-border"
                title={`Load ${Math.min(LAZY_LOAD_BATCH_SIZE, remainingCount)} more items`}
              >
                <Plus className="w-3 h-3" />
                <span>
                  Load {Math.min(LAZY_LOAD_BATCH_SIZE, remainingCount)} more
                </span>
                <span className="text-muted-foreground">
                  ({remainingCount} remaining)
                </span>
              </button>

              <button
                onClick={handleLoadAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary transition-colors border border-primary/20"
                title="Load all remaining items"
              >
                <ChevronsDown className="w-3 h-3" />
                <span>Load all</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
