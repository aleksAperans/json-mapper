export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  const value = bytes / Math.pow(k, i)
  const formatted = i === 0 ? value.toString() : value.toFixed(2)

  return `${formatted} ${sizes[i]}`
}

export function calculateJsonSize(data: unknown): number {
  // Convert to JSON string and calculate byte size
  const jsonString = JSON.stringify(data)
  return new Blob([jsonString]).size
}
