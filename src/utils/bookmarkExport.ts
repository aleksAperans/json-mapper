import type { Bookmark, JsonValue } from '@/types'

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
export function generateCSV(bookmarks: Bookmark[]): string {
  const headers = ['Source Path', 'Value', 'Type', 'Target Path', 'Transformation', 'Notes']
  const rows = bookmarks.map(bookmark => [
    escapeCSV(bookmark.path),
    escapeCSV(formatValueForDisplay(bookmark.value)),
    escapeCSV(bookmark.type),
    escapeCSV(bookmark.targetPath),
    escapeCSV(bookmark.transformation),
    escapeCSV(bookmark.notes)
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  return csvContent
}

/**
 * Generates Markdown table from bookmarks
 */
export function generateMarkdownTable(bookmarks: Bookmark[]): string {
  if (bookmarks.length === 0) {
    return '# JSON Mapper Bookmarks\n\nNo bookmarks saved.'
  }

  const header = `# JSON Mapper Bookmarks

| Source Path | Value | Type | Target Path | Transformation | Notes |
|-------------|-------|------|-------------|----------------|-------|
`

  const rows = bookmarks.map(bookmark => {
    const valueFmt = formatValueForDisplay(bookmark.value)
    return `| ${bookmark.path} | ${valueFmt} | ${bookmark.type} | ${bookmark.targetPath} | ${bookmark.transformation} | ${bookmark.notes} |`
  }).join('\n')

  return header + rows
}

