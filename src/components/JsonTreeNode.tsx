import { ChevronRight, Bookmark, Copy } from 'lucide-react'
import type { JsonValue } from '@/types'
import { getJsonType } from '@/utils/pathGenerator'
import { useAppStore } from '@/store/appStore'
import { generatePath } from '@/utils/pathGenerator'
import { copyToClipboard } from '@/utils/clipboard'
import { shouldShowNode } from '@/utils/filter'
import { useMemo } from 'react'

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
}

export function JsonTreeNode({ nodeKey, value, pathSegments, isLast = false, matchingPaths }: JsonTreeNodeProps) {
  const { pathFormat, setCurrentPath, setCopyNotification, expandedPaths, togglePath, addBookmark } = useAppStore()

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
    return shouldShowNode(currentPath, matchingPaths)
  }, [currentPath, matchingPaths])

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
  // - If __EXPAND_ALL__ is active, expand everything
  // - If filter is active and node is on path to match, auto-expand
  // - Otherwise, only expanded if explicitly in expandedPaths
  const isExpanded = expandedPaths.has('__EXPAND_ALL__')
    ? true // Expand all mode
    : matchingPaths.size > 0 && isOnPathToMatch
      ? true // Auto-expand when filtering to show matches
      : expandedPaths.has(currentPath) // Progressive disclosure

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

  const handleToggle = () => {
    if (isExpandable) {
      togglePath(currentPath)
    }
  }

  const renderValue = () => {
    switch (valueType) {
      case 'string':
        return <span className="text-json-string-light dark:text-json-string-dark">"{value as string}"</span>
      case 'number':
        return <span className="text-json-number-light dark:text-json-number-dark">{value as number}</span>
      case 'boolean':
        return <span className="text-json-boolean-light dark:text-json-boolean-dark">{String(value)}</span>
      case 'null':
        return <span className="text-json-null-light dark:text-json-null-dark">null</span>
      default:
        return null
    }
  }

  const getChildEntries = (): [string, JsonValue][] => {
    if (isArray) {
      return (value as JsonValue[]).map((item, index) => [String(index), item])
    }
    return Object.entries(value as Record<string, JsonValue>)
  }

  const getPreview = () => {
    if (!isExpandable) return ''
    if (isArray) {
      return `Array(${(value as JsonValue[]).length})`
    }
    const keys = Object.keys(value as Record<string, JsonValue>)
    return keys.length === 0 ? '{}' : `{${keys.length} ${keys.length === 1 ? 'key' : 'keys'}}`
  }

  return (
    <div className="font-mono text-base">
      <div className="flex items-start hover:bg-gray-100 dark:hover:bg-gray-800 py-1 px-2 rounded group">
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
          className="text-json-key-light dark:text-json-key-dark cursor-pointer flex-shrink-0"
          onClick={handleCopyPath}
          title="Click to copy path"
        >
          {isArray && !isNaN(Number(nodeKey)) ? `[${nodeKey}]` : `"${nodeKey}"`}
        </span>
        <span className="mx-2 text-gray-500">:</span>

        {!isExpandable ? (
          <span className="truncate">{renderValue()}</span>
        ) : !isExpanded ? (
          <span
            className="truncate text-gray-500 dark:text-gray-400 cursor-pointer"
            onClick={handleToggle}
          >
            {getPreview()}
          </span>
        ) : (
          <span className="text-gray-500">{isArray ? '[' : '{'}</span>
        )}

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
      </div>

      {isExpandable && isExpanded && (
        <div className="ml-6 border-l border-border pl-2">
          {getChildEntries().map(([key, childValue], index, arr) => (
            <JsonTreeNode
              key={key}
              nodeKey={key}
              value={childValue}
              pathSegments={currentSegments}
              isLast={index === arr.length - 1}
              matchingPaths={matchingPaths}
            />
          ))}
        </div>
      )}

      {isExpandable && isExpanded && (
        <div className="ml-6 pl-2 text-gray-500">
          {isArray ? ']' : '}'}
          {!isLast && ','}
        </div>
      )}
    </div>
  )
}
