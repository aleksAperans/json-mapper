/**
 * Virtual JSON Tree Component
 * Uses virtual scrolling to efficiently render large JSON trees
 */

import { useRef, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ChevronRight, Bookmark, Copy, ChevronsDown } from 'lucide-react'
import type { JsonValue } from '@/types'
import { useAppStore } from '@/store/appStore'
import { getJsonType, generatePath } from '@/utils/pathGenerator'
import { copyToClipboard } from '@/utils/clipboard'
import { flattenTree, type FlatTreeNode } from '@/utils/treeFlattener'
import { getMatchingPaths, getEmptyPaths } from '@/utils/filter'

interface VirtualJsonTreeProps {
  data: JsonValue
}

export function VirtualJsonTree({ data }: VirtualJsonTreeProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const {
    pathFormat,
    setCurrentPath,
    setCopyNotification,
    expandedPaths,
    togglePath,
    addBookmark,
    removeBookmark,
    bookmarks,
    expandSubtree,
    jsonData,
    filterQuery,
    caseSensitive,
    hideEmpty,
    truncateValues,
    searchQuery,
    searchCaseSensitive
  } = useAppStore()

  // Calculate matching and empty paths for filtering
  const matchingPaths = useMemo(() => {
    if (!filterQuery.trim()) return new Set<string>()
    return getMatchingPaths(data, filterQuery, pathFormat, { caseSensitive })
  }, [data, filterQuery, pathFormat, caseSensitive])

  const emptyPaths = useMemo(() => {
    if (!hideEmpty) return new Set<string>()
    return getEmptyPaths(data, pathFormat)
  }, [data, pathFormat, hideEmpty])

  // Flatten tree to visible nodes
  const flatNodes = useMemo(() => {
    return flattenTree(data, {
      expandedPaths,
      matchingPaths,
      emptyPaths,
      hideEmpty
    })
  }, [data, expandedPaths, matchingPaths, emptyPaths, hideEmpty])

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

    while (index !== -1) {
      // Add text before match
      if (index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, index)}
          </span>
        )
      }

      // Calculate a unique ID for this match based on position
      const matchId = `match-virtual-${matchType}-${lastIndex}-${index}`

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

  // Virtual scrolling
  const virtualizer = useVirtualizer({
    count: flatNodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36, // Estimated row height
    overscan: 5 // Render 5 extra items above/below viewport
  })

  const virtualItems = virtualizer.getVirtualItems()

  // Render methods for node values
  const renderValue = (value: JsonValue) => {
    const valueType = getJsonType(value)

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

  const getPreview = (node: FlatTreeNode) => {
    if (!node.isExpandable) return ''

    const valueType = getJsonType(node.value)
    if (valueType === 'array') {
      return `Array[${node.childCount}]`
    }
    return node.childCount === 0 ? '{}' : `(${node.childCount} ${node.childCount === 1 ? 'key' : 'keys'})`
  }

  // Event handlers
  const handleCopyPath = async (node: FlatTreeNode, e: React.MouseEvent) => {
    e.stopPropagation()
    const path = generatePath(node.pathSegments, pathFormat)
    const success = await copyToClipboard(path)
    if (success) {
      setCurrentPath(path)
      setCopyNotification(true, `Copied: ${path}`)
      setTimeout(() => setCopyNotification(false), 2000)
    }
  }

  const handleBookmark = (node: FlatTreeNode, e: React.MouseEvent) => {
    e.stopPropagation()
    const path = generatePath(node.pathSegments, pathFormat)

    // Check if already bookmarked
    const existingBookmark = bookmarks.find(b => b.path === path)

    if (existingBookmark) {
      // Remove bookmark
      removeBookmark(existingBookmark.id)
      setCopyNotification(true, `Removed bookmark: ${path}`)
    } else {
      // Add bookmark
      addBookmark(path, node.value, pathFormat)
      setCopyNotification(true, `Bookmarked: ${path}`)
    }

    setTimeout(() => setCopyNotification(false), 2000)
  }

  const handleExpandSubtree = (node: FlatTreeNode, e: React.MouseEvent) => {
    e.stopPropagation()
    if (node.isExpandable && jsonData) {
      expandSubtree(node.path, jsonData)
      setCopyNotification(true, `Expanded all children of ${node.key}`)
      setTimeout(() => setCopyNotification(false), 2000)
    }
  }

  const handleToggle = (node: FlatTreeNode) => {
    if (node.isExpandable) {
      togglePath(node.path)
    }
  }

  if (flatNodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-muted-foreground">No items to display</p>
      </div>
    )
  }

  return (
    <div
      ref={parentRef}
      className="w-full h-full overflow-auto p-6"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualItems.map((virtualItem) => {
          const node = flatNodes[virtualItem.index]
          const isArray = getJsonType(node.value) === 'array'
          const nodeKey = node.key

          // Check if this node is bookmarked
          const nodePath = generatePath(node.pathSegments, 'jmespath')
          const isBookmarked = bookmarks.some(bookmark => bookmark.path === nodePath)

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
                paddingLeft: `${Math.max(0, (node.depth - 1) * 24 + 8)}px`
              }}
            >
              {/* Render vertical lines for each depth level */}
              {Array.from({ length: node.depth - 1 }, (_, i) => (
                <div
                  key={`border-${i}`}
                  style={{
                    position: 'absolute',
                    left: `${i * 24 + 8}px`,
                    top: 0,
                    bottom: 0,
                    width: '1px',
                    backgroundColor: 'hsl(var(--border))'
                  }}
                />
              ))}

              <div className={`flex items-start py-1 px-2 rounded group font-mono text-sm ${
                isBookmarked
                  ? 'bg-blue-50 dark:bg-blue-950/30 border-l-2 border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}>
                {node.isExpandable ? (
                  <button
                    onClick={() => handleToggle(node)}
                    className="mr-1.5 flex-shrink-0 w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${node.isExpanded ? 'rotate-90' : ''}`}
                    />
                  </button>
                ) : (
                  <span className="w-5 flex-shrink-0" />
                )}

                <span
                  className="cursor-pointer flex-shrink-0"
                  onClick={(e) => handleCopyPath(node, e)}
                  title="Click to copy path"
                >
                  {highlightText(
                    isArray && !isNaN(Number(nodeKey)) ? `[${nodeKey}]` : nodeKey,
                    'text-json-key-light dark:text-json-key-dark',
                    'key'
                  )}
                </span>
                <span className="mx-2 text-gray-500">:</span>

                {!node.isExpandable ? (
                  <span className={truncateValues && !searchQuery.trim() ? 'truncate' : ''}>{renderValue(node.value)}</span>
                ) : !node.isExpanded ? (
                  <span
                    className="truncate text-gray-500 dark:text-gray-400 cursor-pointer"
                    onClick={() => handleToggle(node)}
                  >
                    {getPreview(node)}
                  </span>
                ) : null}

                <button
                  onClick={(e) => handleCopyPath(node, e)}
                  className="ml-2 opacity-0 group-hover:opacity-100 flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded border border-border text-xs text-muted-foreground hover:text-primary hover:border-primary transition-all"
                  title="Copy path"
                >
                  <Copy className="w-3 h-3" />
                  <span>copy</span>
                </button>

                <button
                  onClick={(e) => handleBookmark(node, e)}
                  className={`ml-1 flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded border text-xs transition-all ${
                    isBookmarked
                      ? 'opacity-100 text-blue-600 border-blue-600'
                      : 'opacity-0 group-hover:opacity-100 border-border text-muted-foreground hover:text-primary hover:border-primary'
                  }`}
                  title={isBookmarked ? 'Remove bookmark' : 'Bookmark path'}
                >
                  <Bookmark className={`w-3 h-3 ${isBookmarked ? 'fill-blue-600' : ''}`} />
                  <span>bookmark</span>
                </button>

                {node.isExpandable && (
                  <button
                    onClick={(e) => handleExpandSubtree(node, e)}
                    className="ml-1 opacity-0 group-hover:opacity-100 flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded border border-border text-xs text-muted-foreground hover:text-primary hover:border-primary transition-all"
                    title="Expand all children"
                  >
                    <ChevronsDown className="w-3 h-3" />
                    <span>expand all</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
