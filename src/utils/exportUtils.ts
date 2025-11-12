import type { JsonValue } from '@/types'
import type { ExtractedPath, ExtractedKey, ExtractedValue } from './extract'

/**
 * Escapes a value for CSV format
 */
function escapeCsvValue(value: string | number | boolean | null): string {
  const str = value === null ? 'null' : String(value)
  // If string contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Formats a JSON value for display in CSV
 */
function formatValueForCsv(value: JsonValue): string {
  if (value === null) return 'null'
  if (typeof value === 'string') return value
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
 * Generates CSV content from extracted paths
 */
export function generatePathsCsv(paths: ExtractedPath[]): string {
  const headers = ['Path', 'Type']
  const rows = paths.map(item => [
    escapeCsvValue(item.path),
    escapeCsvValue(item.type)
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  return csvContent
}

/**
 * Generates CSV content from extracted keys
 */
export function generateKeysCsv(keys: ExtractedKey[]): string {
  const headers = ['Key', 'Count', 'Paths']
  const rows = keys.map(item => [
    escapeCsvValue(item.key),
    escapeCsvValue(item.count),
    escapeCsvValue(item.paths.join(', '))
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  return csvContent
}

/**
 * Generates CSV content from extracted values
 */
export function generateValuesCsv(values: ExtractedValue[]): string {
  const headers = ['Path', 'Value', 'Type']
  const rows = values.map(item => [
    escapeCsvValue(item.path),
    escapeCsvValue(formatValueForCsv(item.value)),
    escapeCsvValue(item.type)
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  return csvContent
}

/**
 * Downloads a file with given content
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
