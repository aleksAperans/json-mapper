import type { Bookmark } from '@/types'

const STORAGE_KEY = 'json-mapper-bookmarks'

export function saveBookmarks(bookmarks: Bookmark[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks))
  } catch (error) {
    console.error('Failed to save bookmarks to localStorage:', error)
  }
}

export function loadBookmarks(): Bookmark[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored) as Bookmark[]
  } catch (error) {
    console.error('Failed to load bookmarks from localStorage:', error)
    return []
  }
}

export function clearBookmarksStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear bookmarks from localStorage:', error)
  }
}
