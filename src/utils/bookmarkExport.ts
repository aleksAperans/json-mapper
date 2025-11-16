import type { Bookmark, JsonValue, CustomColumn } from '@/types'

/**
 * Formats a JSON value for display in table/export
 */
function formatValueForDisplay(value: JsonValue): string {
  if (value === null) return 'null'
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    const hasPrimitivesOnly = value.every(item => item === null || typeof item !== 'object')
    if (hasPrimitivesOnly && value.length > 0) {
      const items = value.map(item => {
        if (typeof item === 'string') return `"${item}"`
        return String(item)
      }).join(', ')
      return `[${items}]`
    }
    return `Array[${value.length}]`
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value)
    return `Object{${keys.length}}`
  }
  return String(value)
}

/**
 * Escapes a string for CSV format
 */
function escapeCSV(str: string): string {
  // If string contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Generates CSV content from bookmarks
 */
export function generateCSV(bookmarks: Bookmark[], customColumns: CustomColumn[] = []): string {
  const baseHeaders = ['#', 'Source Path', 'Value', 'Type', 'Target Path', 'Notes']
  const customHeaders = customColumns.map(col => col.name)
  const headers = [...baseHeaders, ...customHeaders]

  const rows = bookmarks.map((bookmark, index) => {
    const baseRow = [
      String(index + 1),
      escapeCSV(bookmark.path),
      escapeCSV(formatValueForDisplay(bookmark.value)),
      escapeCSV(bookmark.type),
      escapeCSV(bookmark.targetPath),
      escapeCSV(bookmark.notes)
    ]
    const customRow = customColumns.map(col => escapeCSV(bookmark.customColumns[col.id] || ''))
    return [...baseRow, ...customRow]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  return csvContent
}

/**
 * Generates Markdown table from bookmarks
 */
export function generateMarkdownTable(bookmarks: Bookmark[], customColumns: CustomColumn[] = []): string {
  if (bookmarks.length === 0) {
    return '# JSON Mapper Bookmarks\n\nNo bookmarks saved.'
  }

  const baseHeaders = ['#', 'Source Path', 'Value', 'Type', 'Target Path', 'Notes']
  const customHeaders = customColumns.map(col => col.name)
  const allHeaders = [...baseHeaders, ...customHeaders]

  const headerRow = `| ${allHeaders.join(' | ')} |`
  const separatorRow = `| ${allHeaders.map(() => '---').join(' | ')} |`

  const header = `# JSON Mapper Bookmarks

${headerRow}
${separatorRow}
`

  const rows = bookmarks.map((bookmark, index) => {
    const valueFmt = formatValueForDisplay(bookmark.value)
    const baseRow = [
      String(index + 1),
      bookmark.path,
      valueFmt,
      bookmark.type,
      bookmark.targetPath,
      bookmark.notes
    ]
    const customRow = customColumns.map(col => bookmark.customColumns[col.id] || '')
    const allCells = [...baseRow, ...customRow]
    return `| ${allCells.join(' | ')} |`
  }).join('\n')

  return header + rows
}

