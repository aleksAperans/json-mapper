import type { Bookmark, JsonValue } from '@/types'

function formatValue(value: JsonValue, maxLength = 100): string {
  if (value === null) return 'null'
  if (typeof value === 'string') {
    const escaped = value.replace(/\n/g, '\\n').replace(/\t/g, '\\t')
    const truncated = escaped.length > maxLength ? escaped.slice(0, maxLength) + '...' : escaped
    return `"${truncated}"`
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    // For primitive arrays, show inline
    const hasPrimitivesOnly = value.every(item => item === null || typeof item !== 'object')
    if (hasPrimitivesOnly && value.length > 0) {
      const items = value.map(item => formatValue(item, 50)).join(', ')
      const result = `[${items}]`
      return result.length > maxLength ? result.slice(0, maxLength) + '...]' : result
    }
    return `Array[${value.length}]`
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value)
    return `Object{${keys.length}}`
  }
  return String(value)
}

export function generateMarkdown(bookmarks: Bookmark[]): string {
  if (bookmarks.length === 0) {
    return '# JSON Mapper Bookmarks\n\nNo bookmarks saved.'
  }

  const header = `# JSON Mapper Bookmarks

`

  // Find the longest path for alignment
  const maxPathLength = Math.max(...bookmarks.map(b => b.path.length))

  const bookmarksList = bookmarks
    .map((bookmark) => {
      const padding = ' '.repeat(Math.max(2, maxPathLength - bookmark.path.length + 2))
      const valueStr = formatValue(bookmark.value)
      return `${bookmark.path}${padding}// ${valueStr}`
    })
    .join('\n')

  return header + bookmarksList
}

export function generateSingleBookmarkText(path: string, value: JsonValue): string {
  const valueStr = formatValue(value)
  return `${path}  // ${valueStr}`
}

export function downloadMarkdown(content: string, filename = 'json-mapper-bookmarks.md'): void {
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
