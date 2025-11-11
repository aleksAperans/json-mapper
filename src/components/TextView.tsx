import { useAppStore } from '@/store/appStore'
import { useMemo, useEffect } from 'react'
import { ChevronRight, Copy, Bookmark } from 'lucide-react'
import type { JsonValue } from '@/types'
import { generatePath } from '@/utils/pathGenerator'
import { copyToClipboard } from '@/utils/clipboard'
import { cn } from '@/lib/utils'
import { getMatchingPaths, getEmptyPaths } from '@/utils/filter'

interface TextLine {
  lineNumber: number
  indentLevel: number
  content: string
  pathSegments: Array<{ key: string; isArrayIndex: boolean }>
  value?: JsonValue
  isExpandable: boolean
  isExpanded?: boolean
}

export function TextView() {
  const {
    jsonData,
    expandedPaths,
    collapsedPaths,
    pathFormat,
    setCurrentPath,
    setCopyNotification,
    addBookmark,
    setHoverPosition,
    truncateValues,
    togglePath,
    searchQuery,
    searchCaseSensitive,
    filterQuery,
    caseSensitive,
    hideEmpty,
    setSearchMatchCount,
  } = useAppStore()

  // Calculate matching and empty paths for filtering
  const matchingPaths = useMemo(() => {
    if (!jsonData || !filterQuery.trim()) return new Set<string>()
    return getMatchingPaths(jsonData, filterQuery, 'jmespath', { caseSensitive })
  }, [jsonData, filterQuery, caseSensitive])

  const emptyPaths = useMemo(() => {
    if (!jsonData || !hideEmpty) return new Set<string>()
    return getEmptyPaths(jsonData, 'jmespath')
  }, [jsonData, hideEmpty])

  // Generate lines from JSON data and count search matches
  const { lines: renderedLines, searchMatchCount } = useMemo(() => {
    if (!jsonData) return { lines: [], searchMatchCount: 0 }

    const result: TextLine[] = []
    let lineNumber = 1
    let totalSearchMatches = 0

    // Helper to count search matches in text
    const countMatches = (text: string): number => {
      if (!searchQuery.trim()) return 0
      const query = searchCaseSensitive ? searchQuery : searchQuery.toLowerCase()
      const textToSearch = searchCaseSensitive ? text : text.toLowerCase()
      let count = 0
      let index = textToSearch.indexOf(query)
      while (index !== -1) {
        count++
        index = textToSearch.indexOf(query, index + query.length)
      }
      return count
    }

    // Check if a path should be expanded
    const isPathExpanded = (path: string): boolean => {
      // If explicitly collapsed (in Expand All mode), it should be collapsed
      if (collapsedPaths.has(path)) return false

      // Auto-expand paths that contain filter matches
      if (matchingPaths.size > 0) {
        // Check if this path or any child path is a match
        for (const matchPath of matchingPaths) {
          if (matchPath.startsWith(path + '.') || matchPath.startsWith(path + '[') || matchPath === path) {
            return true
          }
        }
      }

      if (expandedPaths.has('__EXPAND_ALL__')) return true
      if (expandedPaths.has('__EXPAND_TO_DEPTH_2__')) {
        const depth = path.split(/[.\[\]]/).filter(Boolean).length
        return depth <= 2
      }
      return expandedPaths.has(path)
    }

    // Check if a line should be shown based on filter
    const shouldShowLine = (pathSegments: Array<{ key: string; isArrayIndex: boolean }>): boolean => {
      if (matchingPaths.size === 0 && !hideEmpty) return true

      const path = generatePath(pathSegments, 'jmespath')

      // Show if path matches filter
      if (matchingPaths.has(path)) return true

      // Show if any child matches filter
      for (const matchPath of matchingPaths) {
        if (matchPath.startsWith(path + '.') || matchPath.startsWith(path + '[')) {
          return true
        }
      }

      // Hide if empty and hideEmpty is true
      if (hideEmpty && emptyPaths.has(path)) return false

      return matchingPaths.size === 0
    }

    const formatValue = (value: JsonValue): string => {
      if (value === null) return 'null'
      if (typeof value === 'string') {
        let str = JSON.stringify(value)
        if (truncateValues && str.length > 100) {
          str = str.substring(0, 100) + '..."'
        }
        return str
      }
      return JSON.stringify(value)
    }

    const processValue = (
      value: JsonValue,
      pathSegments: Array<{ key: string; isArrayIndex: boolean }>,
      indentLevel: number,
      keyPrefix: string = ''
    ) => {
      const currentPath = generatePath(pathSegments, 'jmespath')

      if (value === null || typeof value !== 'object') {
        // Primitive value - single line
        const content = `${keyPrefix}${formatValue(value)}`
        totalSearchMatches += countMatches(content)
        result.push({
          lineNumber: lineNumber++,
          indentLevel,
          content,
          pathSegments,
          value,
          isExpandable: false,
        })
      } else if (Array.isArray(value)) {
        // Check if array contains only primitives (can be displayed inline)
        const hasPrimitivesOnly = value.every(item => item === null || typeof item !== 'object')

        if (hasPrimitivesOnly && value.length > 0) {
          // Display simple array inline
          const items = value.map(item => formatValue(item)).join(', ')
          const content = `${keyPrefix}[${items}]`
          totalSearchMatches += countMatches(content)
          result.push({
            lineNumber: lineNumber++,
            indentLevel,
            content,
            pathSegments,
            value,
            isExpandable: false,
          })
        } else if (value.length === 0) {
          // Empty array on one line
          const content = `${keyPrefix}[]`
          totalSearchMatches += countMatches(content)
          result.push({
            lineNumber: lineNumber++,
            indentLevel,
            content,
            pathSegments,
            value,
            isExpandable: false,
          })
        } else {
          // Complex array with objects/arrays
          const isExpanded = isPathExpanded(currentPath)

          if (!isExpanded) {
            // Collapsed array
            const content = `${keyPrefix}[ ... ] Array[${value.length}]`
            totalSearchMatches += countMatches(content)
            result.push({
              lineNumber: lineNumber++,
              indentLevel,
              content,
              pathSegments,
              value,
              isExpandable: true,
              isExpanded: false,
            })
          } else {
            // Expanded array
            const content = `${keyPrefix}[ Array[${value.length}]`
            totalSearchMatches += countMatches(content)
            result.push({
              lineNumber: lineNumber++,
              indentLevel,
              content,
              pathSegments,
              value,
              isExpandable: true,
              isExpanded: true,
            })

            value.forEach((item, index) => {
              const newSegments = [...pathSegments, { key: String(index), isArrayIndex: true }]
              const isLast = index === value.length - 1
              processValue(item, newSegments, indentLevel + 1, '')

              // Add comma if not last
              if (!isLast && result.length > 0) {
                result[result.length - 1].content += ','
              }
            })

            const closingContent = ']'
            totalSearchMatches += countMatches(closingContent)
            result.push({
              lineNumber: lineNumber++,
              indentLevel,
              content: closingContent,
              pathSegments,
              isExpandable: false,
            })
          }
        }
      } else {
        // Object
        const entries = Object.entries(value as Record<string, JsonValue>)
        const isExpanded = isPathExpanded(currentPath)

        if (!isExpanded) {
          // Collapsed object
          const content = `${keyPrefix}{ ... } Object{${entries.length}}`
          totalSearchMatches += countMatches(content)
          result.push({
            lineNumber: lineNumber++,
            indentLevel,
            content,
            pathSegments,
            value,
            isExpandable: true,
            isExpanded: false,
          })
        } else if (entries.length === 0) {
          // Empty object on one line
          const content = `${keyPrefix}{}`
          totalSearchMatches += countMatches(content)
          result.push({
            lineNumber: lineNumber++,
            indentLevel,
            content,
            pathSegments,
            value,
            isExpandable: false,
          })
        } else {
          // Expanded object
          const content = `${keyPrefix}{ Object{${entries.length}}`
          totalSearchMatches += countMatches(content)
          result.push({
            lineNumber: lineNumber++,
            indentLevel,
            content,
            pathSegments,
            value,
            isExpandable: true,
            isExpanded: true,
          })

          entries.forEach(([key, val], index) => {
            const newSegments = [...pathSegments, { key, isArrayIndex: false }]
            const isLast = index === entries.length - 1
            const keyPart = `"${key}": `

            processValue(val, newSegments, indentLevel + 1, keyPart)

            // Add comma if not last
            if (!isLast && result.length > 0) {
              result[result.length - 1].content += ','
            }
          })

          const closingContent = '}'
          totalSearchMatches += countMatches(closingContent)
          result.push({
            lineNumber: lineNumber++,
            indentLevel,
            content: closingContent,
            pathSegments,
            isExpandable: false,
          })
        }
      }
    }

    processValue(jsonData, [], 0)

    // Filter lines based on matching paths
    const filteredResult = result.filter(line => shouldShowLine(line.pathSegments))

    return { lines: filteredResult, searchMatchCount: totalSearchMatches }
  }, [jsonData, expandedPaths, collapsedPaths, truncateValues, matchingPaths, emptyPaths, hideEmpty, searchQuery, searchCaseSensitive])

  // Update search match count in store
  useEffect(() => {
    setSearchMatchCount(searchMatchCount)
  }, [searchMatchCount, setSearchMatchCount])

  // Global counter for match IDs during rendering (resets on each render)
  let renderMatchCounter = 0

  const handleToggle = (line: TextLine) => {
    if (!line.isExpandable) return
    const path = generatePath(line.pathSegments, 'jmespath')
    togglePath(path)
  }

  const handleCopyPath = async (line: TextLine, e: React.MouseEvent) => {
    e.stopPropagation()
    const path = generatePath(line.pathSegments, pathFormat)
    const success = await copyToClipboard(path)
    if (success) {
      setCurrentPath(path)
      setCopyNotification(true, `Copied: ${path}`)
      setTimeout(() => setCopyNotification(false), 2000)
    }
  }

  const handleBookmark = async (line: TextLine, e: React.MouseEvent) => {
    e.stopPropagation()
    const path = generatePath(line.pathSegments, pathFormat)
    addBookmark(path, line.value || null, pathFormat)
    setCopyNotification(true, `Bookmarked: ${path}`)
    setTimeout(() => setCopyNotification(false), 2000)
  }

  const handleMouseEnter = (line: TextLine) => {
    setHoverPosition({ line: line.lineNumber, column: 1 })
  }

  const handleMouseLeave = () => {
    setHoverPosition(null)
  }

  // Helper function to highlight search matches in text with data attributes for navigation
  const highlightSearchInText = (text: string, className: string) => {
    if (!searchQuery.trim()) {
      return <span className={className}>{text}</span>
    }

    const query = searchCaseSensitive ? searchQuery : searchQuery.toLowerCase()
    const textToSearch = searchCaseSensitive ? text : text.toLowerCase()

    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let index = textToSearch.indexOf(query)
    let matchKey = 0

    while (index !== -1) {
      // Add text before match
      if (index > lastIndex) {
        parts.push(
          <span key={`text-${matchKey}-${lastIndex}`}>
            {text.substring(lastIndex, index)}
          </span>
        )
      }

      // Generate unique match ID for navigation using outer counter
      const matchId = `textview-match-${renderMatchCounter++}`

      // Add highlighted match with data attribute for navigation
      parts.push(
        <mark
          key={`mark-${matchKey}-${index}`}
          data-search-match={matchId}
          className="bg-yellow-300 dark:bg-yellow-600/80 text-gray-900 dark:text-gray-100 px-0.5 rounded"
        >
          {text.substring(index, index + query.length)}
        </mark>
      )

      matchKey++
      lastIndex = index + query.length
      index = textToSearch.indexOf(query, lastIndex)
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${matchKey}-${lastIndex}`}>
          {text.substring(lastIndex)}
        </span>
      )
    }

    return <span className={className}>{parts}</span>
  }

  // Syntax highlighting for the content
  const renderContent = (content: string) => {
    // Match different parts of JSON syntax
    const parts: React.ReactNode[] = []
    let key = 0

    // Regex to match: strings, numbers, booleans, null, keys
    const regex = /"([^"\\]|\\.)*"\s*:|"([^"\\]|\\.)*"|-?\d+\.?\d*|true|false|null|[{}\[\],]/g
    let lastIndex = 0
    let match

    while ((match = regex.exec(content)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        const textBefore = content.substring(lastIndex, match.index)
        parts.push(
          <span key={key++}>
            {highlightSearchInText(textBefore, 'text-muted-foreground')}
          </span>
        )
      }

      const token = match[0]

      // Determine token type and apply color with search highlighting
      if (token.endsWith(':')) {
        // Key
        parts.push(
          <span key={key++}>
            {highlightSearchInText(token, 'text-json-key-light dark:text-json-key-dark')}
          </span>
        )
      } else if (token.startsWith('"')) {
        // String value
        parts.push(
          <span key={key++}>
            {highlightSearchInText(token, 'text-json-string-light dark:text-json-string-dark')}
          </span>
        )
      } else if (/^-?\d/.test(token)) {
        // Number
        parts.push(
          <span key={key++}>
            {highlightSearchInText(token, 'text-json-number-light dark:text-json-number-dark')}
          </span>
        )
      } else if (token === 'true' || token === 'false') {
        // Boolean
        parts.push(
          <span key={key++}>
            {highlightSearchInText(token, 'text-json-boolean-light dark:text-json-boolean-dark')}
          </span>
        )
      } else if (token === 'null') {
        // Null
        parts.push(
          <span key={key++}>
            {highlightSearchInText(token, 'text-json-null-light dark:text-json-null-dark')}
          </span>
        )
      } else {
        // Brackets, braces, commas
        parts.push(
          <span key={key++}>
            {highlightSearchInText(token, 'text-muted-foreground')}
          </span>
        )
      }

      lastIndex = regex.lastIndex
    }

    // Add remaining text
    if (lastIndex < content.length) {
      const textRemaining = content.substring(lastIndex)
      parts.push(
        <span key={key++}>
          {highlightSearchInText(textRemaining, 'text-muted-foreground')}
        </span>
      )
    }

    return parts
  }

  return (
    <div className="h-full overflow-auto bg-white dark:bg-gray-900 p-4">
      <div className="font-mono text-sm leading-relaxed">
        {renderedLines.map((line) => (
          <div
            key={line.lineNumber}
            className="flex items-stretch hover:bg-gray-100 dark:hover:bg-gray-800 py-0.5 px-2 rounded group"
            onMouseEnter={() => handleMouseEnter(line)}
            onMouseLeave={handleMouseLeave}
          >
            {/* Line number */}
            <span className="inline-block w-12 text-right mr-4 text-muted-foreground select-none flex-shrink-0">
              {line.lineNumber}
            </span>

            {/* Expand/collapse chevron */}
            {line.isExpandable ? (
              <button
                onClick={() => handleToggle(line)}
                className="mr-1 flex-shrink-0 w-4 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <ChevronRight
                  className={cn(
                    'w-3 h-3 transition-transform',
                    line.isExpanded ? 'rotate-90' : ''
                  )}
                />
              </button>
            ) : (
              <span className="w-4 flex-shrink-0 mr-1" />
            )}

            {/* Indent with vertical lines */}
            <div className="flex flex-shrink-0 -my-0.5">
              {Array.from({ length: line.indentLevel }).map((_, i) => (
                <div
                  key={i}
                  className="w-5 border-l border-border py-0.5"
                />
              ))}
            </div>

            {/* Content with syntax highlighting */}
            <span className="whitespace-pre flex-shrink-0">
              {renderContent(line.content)}
            </span>

            {/* Hover actions */}
            {line.pathSegments.length > 0 && (
              <>
                <button
                  onClick={(e) => handleCopyPath(line, e)}
                  className="ml-2 opacity-0 group-hover:opacity-100 flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded border border-border text-xs text-muted-foreground hover:text-primary hover:border-primary transition-all"
                  title="Copy path"
                >
                  <Copy className="w-3 h-3" />
                  <span>copy</span>
                </button>
                <button
                  onClick={(e) => handleBookmark(line, e)}
                  className="ml-1 opacity-0 group-hover:opacity-100 flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded border border-border text-xs text-muted-foreground hover:text-primary hover:border-primary transition-all"
                  title="Bookmark"
                >
                  <Bookmark className="w-3 h-3" />
                  <span>bookmark</span>
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
