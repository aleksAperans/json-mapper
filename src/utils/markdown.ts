import type { Bookmark, JsonValue } from '@/types'

function formatValue(value: JsonValue): string {
  if (value === null) return 'null'
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return `Array(${value.length})`
  if (typeof value === 'object') {
    const keys = Object.keys(value)
    return `{${keys.length} ${keys.length === 1 ? 'key' : 'keys'}}`
  }
  return String(value)
}

export function generateMarkdown(bookmarks: Bookmark[]): string {
  if (bookmarks.length === 0) {
    return '# JSON Mapper Bookmarks\n\nNo bookmarks saved.'
  }

  const header = `# JSON Mapper Bookmarks

Generated: ${new Date().toLocaleString()}
Total: ${bookmarks.length} ${bookmarks.length === 1 ? 'bookmark' : 'bookmarks'}

`

  const bookmarksList = bookmarks
    .map((bookmark) => {
      const value = formatValue(bookmark.value)
      return `- \`${bookmark.path}\`: ${value}`
    })
    .join('\n')

  return header + bookmarksList
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
