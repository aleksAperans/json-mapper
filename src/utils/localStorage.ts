import type { Bookmark } from '@/types'

const STORAGE_KEY = 'json-mapper-bookmarks'
const USER_PREFS_KEY = 'json-mapper-user-prefs'

export interface UserPreferences {
  hasVisitedBefore: boolean
  visitCount: number
  firstVisitTimestamp: number
  lastVisitTimestamp: number
}

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

// User preferences functions
const DEFAULT_USER_PREFS: UserPreferences = {
  hasVisitedBefore: false,
  visitCount: 0,
  firstVisitTimestamp: 0,
  lastVisitTimestamp: 0
}

export function getUserPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(USER_PREFS_KEY)
    if (!stored) return DEFAULT_USER_PREFS
    return { ...DEFAULT_USER_PREFS, ...JSON.parse(stored) }
  } catch (error) {
    console.error('Failed to load user preferences from localStorage:', error)
    return DEFAULT_USER_PREFS
  }
}

export function updateUserPreferences(updates: Partial<UserPreferences>): void {
  try {
    const current = getUserPreferences()
    const updated = { ...current, ...updates }
    localStorage.setItem(USER_PREFS_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to update user preferences in localStorage:', error)
  }
}

export function isFirstTimeUser(): boolean {
  const prefs = getUserPreferences()
  return !prefs.hasVisitedBefore
}

export function markUserAsVisited(): void {
  const prefs = getUserPreferences()
  const now = Date.now()

  updateUserPreferences({
    hasVisitedBefore: true,
    visitCount: prefs.visitCount + 1,
    firstVisitTimestamp: prefs.firstVisitTimestamp || now,
    lastVisitTimestamp: now
  })
}
