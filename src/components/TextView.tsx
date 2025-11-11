import { useAppStore } from '@/store/appStore'
import { useMemo, useState } from 'react'
import { ChevronRight, Copy, Bookmark } from 'lucide-react'
import type { JsonValue } from '@/types'
import { generatePath } from '@/utils/pathGenerator'
import { copyToClipboard } from '@/utils/clipboard'
import { cn } from '@/lib/utils'

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
    pathFormat,
    setCurrentPath,
    setCopyNotification,
    addBookmark,
    setHoverPosition,
    truncateValues,
  } = useAppStore()

  const [localExpandedPaths, setLocalExpandedPaths] = useState<Set<string>>(new Set())

  // Generate lines from JSON data
  const lines = useMemo(() => {
    if (!jsonData) return []

    const result: TextLine[] = []
    let lineNumber = 1

    // Check if a path should be expanded
    const isPathExpanded = (path: string): boolean => {
      if (expandedPaths.has('__EXPAND_ALL__')) return true
      if (expandedPaths.has('__EXPAND_TO_DEPTH_2__')) {
        const depth = path.split(/[.\[\]]/).filter(Boolean).length
        return depth <= 2
      }
      return expandedPaths.has(path) || localExpandedPaths.has(path)
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
        result.push({
          lineNumber: lineNumber++,
          indentLevel,
          content: `${keyPrefix}${formatValue(value)}`,
          pathSegments,
          value,
          isExpandable: false,
        })
      } else if (Array.isArray(value)) {
        const isExpanded = isPathExpanded(currentPath)

        if (!isExpanded) {
          // Collapsed array
          result.push({
            lineNumber: lineNumber++,
            indentLevel,
            content: `${keyPrefix}[ ... ] // ${value.length} items`,
            pathSegments,
            value,
            isExpandable: true,
            isExpanded: false,
          })
        } else if (value.length === 0) {
          // Empty array on one line
          result.push({
            lineNumber: lineNumber++,
            indentLevel,
            content: `${keyPrefix}[]`,
            pathSegments,
            value,
            isExpandable: false,
          })
        } else {
          // Expanded array
          result.push({
            lineNumber: lineNumber++,
            indentLevel,
            content: `${keyPrefix}[`,
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

          result.push({
            lineNumber: lineNumber++,
            indentLevel,
            content: ']',
            pathSegments,
            isExpandable: false,
          })
        }
      } else {
        // Object
        const entries = Object.entries(value as Record<string, JsonValue>)
        const isExpanded = isPathExpanded(currentPath)

        if (!isExpanded) {
          // Collapsed object
          result.push({
            lineNumber: lineNumber++,
            indentLevel,
            content: `${keyPrefix}{ ... } // ${entries.length} keys`,
            pathSegments,
            value,
            isExpandable: true,
            isExpanded: false,
          })
        } else if (entries.length === 0) {
          // Empty object on one line
          result.push({
            lineNumber: lineNumber++,
            indentLevel,
            content: `${keyPrefix}{}`,
            pathSegments,
            value,
            isExpandable: false,
          })
        } else {
          // Expanded object
          result.push({
            lineNumber: lineNumber++,
            indentLevel,
            content: `${keyPrefix}{`,
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

          result.push({
            lineNumber: lineNumber++,
            indentLevel,
            content: '}',
            pathSegments,
            isExpandable: false,
          })
        }
      }
    }

    processValue(jsonData, [], 0)
    return result
  }, [jsonData, expandedPaths, localExpandedPaths, truncateValues])

  const handleToggle = (line: TextLine) => {
    if (!line.isExpandable) return
    const path = generatePath(line.pathSegments, 'jmespath')

    setLocalExpandedPaths(prev => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
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
        parts.push(
          <span key={key++} className="text-muted-foreground">
            {content.substring(lastIndex, match.index)}
          </span>
        )
      }

      const token = match[0]

      // Determine token type and apply color
      if (token.endsWith(':')) {
        // Key
        parts.push(
          <span key={key++} className="text-json-key-light dark:text-json-key-dark">
            {token}
          </span>
        )
      } else if (token.startsWith('"')) {
        // String value
        parts.push(
          <span key={key++} className="text-json-string-light dark:text-json-string-dark">
            {token}
          </span>
        )
      } else if (/^-?\d/.test(token)) {
        // Number
        parts.push(
          <span key={key++} className="text-json-number-light dark:text-json-number-dark">
            {token}
          </span>
        )
      } else if (token === 'true' || token === 'false') {
        // Boolean
        parts.push(
          <span key={key++} className="text-json-boolean-light dark:text-json-boolean-dark">
            {token}
          </span>
        )
      } else if (token === 'null') {
        // Null
        parts.push(
          <span key={key++} className="text-json-null-light dark:text-json-null-dark">
            {token}
          </span>
        )
      } else {
        // Brackets, braces, commas
        parts.push(
          <span key={key++} className="text-muted-foreground">
            {token}
          </span>
        )
      }

      lastIndex = regex.lastIndex
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <span key={key++} className="text-muted-foreground">
          {content.substring(lastIndex)}
        </span>
      )
    }

    return parts
  }

  return (
    <div className="h-full overflow-auto bg-white dark:bg-gray-900 p-4">
      <div className="font-mono text-sm leading-relaxed">
        {lines.map((line) => (
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
