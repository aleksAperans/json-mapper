import { create } from 'zustand'
import type {
  JsonValue,
  PathFormat,
  ImportHistoryItem,
  Bookmark
} from '@/types'
import { loadBookmarks, saveBookmarks } from '@/utils/localStorage'

interface AppState {
  // JSON data
  jsonData: JsonValue | null
  setJsonData: (data: JsonValue | null) => void
  fileSize: number | null
  setFileSize: (size: number | null) => void

  // Loading and error states
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  loadingProgress: number
  loadingMessage: string
  setLoadingProgress: (progress: number, message: string) => void
  error: string | null
  setError: (error: string | null) => void

  // JSON metadata (computed during parsing)
  metadata: {
    nodeCount: number
    maxDepth: number
  } | null
  setMetadata: (metadata: { nodeCount: number; maxDepth: number } | null) => void

  // Current path
  currentPath: string | null
  setCurrentPath: (path: string | null) => void

  // Path format
  pathFormat: PathFormat
  setPathFormat: (format: PathFormat) => void

  // Active feature
  activeFeature: 'tree' | 'query'
  setActiveFeature: (feature: 'tree' | 'query') => void

  // Query & Extract feature
  extractionMode: 'paths' | 'keys' | 'values'
  setExtractionMode: (mode: 'paths' | 'keys' | 'values') => void

  // Filter (shared across both views)
  filterQuery: string
  setFilterQuery: (query: string) => void
  caseSensitive: boolean
  toggleCaseSensitive: () => void
  hideEmpty: boolean
  toggleHideEmpty: () => void

  // Expanded paths (for tree view) - tracks which nodes are expanded
  // By default, nodes are collapsed unless they're in this set or at root level
  expandedPaths: Set<string>
  togglePath: (path: string) => void
  expandAll: () => void
  collapseAll: () => void
  expandSubtree: (parentPath: string, data: JsonValue) => void

  // Clear data
  clearJsonData: () => void

  // Import history
  importHistory: ImportHistoryItem[]
  addToHistory: (item: Omit<ImportHistoryItem, 'id' | 'timestamp'>) => void
  clearHistory: () => void

  // Copy notification
  showCopyNotification: boolean
  copyMessage: string
  setCopyNotification: (show: boolean, message?: string) => void

  // Bookmarks
  bookmarks: Bookmark[]
  addBookmark: (path: string, value: JsonValue, pathFormat: PathFormat) => void
  removeBookmark: (id: string) => void
  clearBookmarks: () => void
  isBookmarksOpen: boolean
  setIsBookmarksOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  // JSON data
  jsonData: null,
  setJsonData: (data) => set({ jsonData: data }),
  fileSize: null,
  setFileSize: (size) => set({ fileSize: size }),

  // Loading and error states
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  loadingProgress: 0,
  loadingMessage: '',
  setLoadingProgress: (progress, message) => set({ loadingProgress: progress, loadingMessage: message }),
  error: null,
  setError: (error) => set({ error }),

  // JSON metadata
  metadata: null,
  setMetadata: (metadata) => set({ metadata }),

  // Current path
  currentPath: null,
  setCurrentPath: (path) => set({ currentPath: path }),

  // Path format
  pathFormat: 'jmespath',
  setPathFormat: (format) => set({ pathFormat: format }),

  // Active feature
  activeFeature: 'tree',
  setActiveFeature: (feature) => set({ activeFeature: feature }),

  // Query & Extract feature
  extractionMode: 'paths',
  setExtractionMode: (mode) => set({ extractionMode: mode }),

  // Filter (shared across both views)
  filterQuery: '',
  setFilterQuery: (query) => set({ filterQuery: query }),
  caseSensitive: false,
  toggleCaseSensitive: () => set((state) => ({ caseSensitive: !state.caseSensitive })),
  hideEmpty: false,
  toggleHideEmpty: () => set((state) => ({ hideEmpty: !state.hideEmpty })),

  // Expanded paths (start with empty set - nodes collapsed by default)
  expandedPaths: new Set<string>(),
  togglePath: (path) =>
    set((state) => {
      const newSet = new Set(state.expandedPaths)

      // If we're in "expand all" or "expand to depth" mode, remove it and start tracking individual paths
      if (newSet.has('__EXPAND_ALL__') || newSet.has('__EXPAND_TO_DEPTH_2__')) {
        newSet.delete('__EXPAND_ALL__')
        newSet.delete('__EXPAND_TO_DEPTH_2__')
        // Add this path since we're collapsing it (opposite of expand mode)
        return { expandedPaths: newSet }
      }

      if (newSet.has(path)) {
        // Path is expanded, collapse it
        newSet.delete(path)
      } else {
        // Path is collapsed, expand it
        newSet.add(path)
      }
      return { expandedPaths: newSet }
    }),
  expandAll: () => set((state) => {
    // For large files, use depth-limited expansion instead of full expansion
    const isLargeFile = state.metadata?.nodeCount && state.metadata.nodeCount > 5000
    if (isLargeFile) {
      return { expandedPaths: new Set<string>(['__EXPAND_TO_DEPTH_2__']) }
    }
    return { expandedPaths: new Set<string>(['__EXPAND_ALL__']) }
  }),
  collapseAll: () => set({ expandedPaths: new Set<string>() }),
  expandSubtree: (parentPath: string, data: JsonValue) => set((state) => {
    // Recursively expand all children under a specific parent path
    const newPaths = new Set(state.expandedPaths)
    // Remove expand all flags if present
    newPaths.delete('__EXPAND_ALL__')
    newPaths.delete('__EXPAND_TO_DEPTH_4__')

    // Add the parent path itself
    newPaths.add(parentPath)

    // Recursively collect all descendant paths
    const collectPaths = (value: any, currentPath: string) => {
      if (value === null || typeof value !== 'object') return

      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          const childPath = `${currentPath}[${index}]`
          newPaths.add(childPath)
          collectPaths(item, childPath)
        })
      } else {
        Object.keys(value).forEach((key) => {
          const childPath = currentPath ? `${currentPath}.${key}` : key
          newPaths.add(childPath)
          collectPaths(value[key], childPath)
        })
      }
    }

    // Find the value at the parent path and expand all its children
    const pathSegments = parentPath.split(/[.\[\]]/).filter(Boolean)
    let currentValue = data

    for (const segment of pathSegments) {
      if (currentValue === null || typeof currentValue !== 'object') break
      currentValue = Array.isArray(currentValue) ? currentValue[parseInt(segment)] : currentValue[segment]
    }

    if (currentValue !== null && typeof currentValue === 'object') {
      collectPaths(currentValue, parentPath)
    }

    return { expandedPaths: newPaths }
  }),

  // Clear data
  clearJsonData: () => set({
    jsonData: null,
    fileSize: null,
    metadata: null,
    currentPath: null,
    filterQuery: '',
    expandedPaths: new Set<string>(),
    error: null,
    loadingProgress: 0,
    loadingMessage: ''
  }),

  // Import history
  importHistory: [],
  addToHistory: (item) =>
    set((state) => ({
      importHistory: [
        {
          ...item,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        },
        ...state.importHistory.slice(0, 9), // Keep last 10 items
      ],
    })),
  clearHistory: () => set({ importHistory: [] }),

  // Copy notification
  showCopyNotification: false,
  copyMessage: '',
  setCopyNotification: (show, message = '') =>
    set({ showCopyNotification: show, copyMessage: message }),

  // Bookmarks
  bookmarks: loadBookmarks(),
  addBookmark: (path, value, pathFormat) =>
    set((state) => {
      const newBookmark: Bookmark = {
        id: crypto.randomUUID(),
        path,
        value,
        pathFormat,
        timestamp: Date.now(),
      }
      const newBookmarks = [...state.bookmarks, newBookmark]
      saveBookmarks(newBookmarks)
      return { bookmarks: newBookmarks }
    }),
  removeBookmark: (id) =>
    set((state) => {
      const newBookmarks = state.bookmarks.filter((b) => b.id !== id)
      saveBookmarks(newBookmarks)
      return { bookmarks: newBookmarks }
    }),
  clearBookmarks: () => {
    saveBookmarks([])
    set({ bookmarks: [] })
  },
  isBookmarksOpen: false,
  setIsBookmarksOpen: (open) => set({ isBookmarksOpen: open }),
}))
