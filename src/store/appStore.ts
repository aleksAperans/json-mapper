import { create } from 'zustand'
import type {
  JsonValue,
  PathFormat,
  ImportHistoryItem,
  Bookmark
} from '@/types'
import { loadBookmarks, saveBookmarks } from '@/utils/localStorage'
import { getJsonType } from '@/utils/pathGenerator'

interface AppState {
  // JSON data
  jsonData: JsonValue | null
  setJsonData: (data: JsonValue | null) => void
  originalText: string | null
  setOriginalText: (text: string | null) => void
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

  // Current path (set when copying)
  currentPath: string | null
  setCurrentPath: (path: string | null) => void

  // Hover path (dynamically updated as user hovers over rows)
  hoverPath: string | null
  setHoverPath: (path: string | null) => void

  // Hover position (for displaying line/column in footer)
  hoverPosition: { line: number; column: number } | null
  setHoverPosition: (position: { line: number; column: number } | null) => void

  // Path format
  pathFormat: PathFormat
  setPathFormat: (format: PathFormat) => void

  // Active feature
  activeFeature: 'viewer' | 'query' | 'convert'
  setActiveFeature: (feature: 'viewer' | 'query' | 'convert') => void

  // Viewer mode (for the viewer feature)
  viewerMode: 'json' | 'tree'
  setViewerMode: (mode: 'json' | 'tree') => void

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
  truncateValues: boolean
  toggleTruncateValues: () => void
  isFilterOpen: boolean
  setIsFilterOpen: (open: boolean) => void

  // Search (highlights matches without filtering)
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchCaseSensitive: boolean
  toggleSearchCaseSensitive: () => void
  isSearchOpen: boolean
  setIsSearchOpen: (open: boolean) => void
  currentSearchIndex: number
  setCurrentSearchIndex: (index: number) => void
  searchMatchCount: number
  setSearchMatchCount: (count: number) => void

  // Expanded paths (for tree view) - tracks which nodes are expanded
  // By default, nodes are collapsed unless they're in this set or at root level
  expandedPaths: Set<string>
  collapsedPaths: Set<string> // Tracks explicitly collapsed paths when in Expand All mode
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
  updateBookmark: (id: string, updates: Partial<Omit<Bookmark, 'id' | 'timestamp'>>) => void
  removeBookmark: (id: string) => void
  reorderBookmarks: (startIndex: number, endIndex: number) => void
  clearBookmarks: () => void
  isBookmarksOpen: boolean
  setIsBookmarksOpen: (open: boolean) => void

  // Keyboard Shortcuts
  isShortcutsOpen: boolean
  setIsShortcutsOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  // JSON data
  jsonData: null,
  setJsonData: (data) => set({ jsonData: data }),
  originalText: null,
  setOriginalText: (text) => set({ originalText: text }),
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

  // Hover path
  hoverPath: null,
  setHoverPath: (path) => set({ hoverPath: path }),

  // Hover position
  hoverPosition: null,
  setHoverPosition: (position) => set({ hoverPosition: position }),

  // Path format
  pathFormat: 'jmespath',
  setPathFormat: (format) => set({ pathFormat: format }),

  // Active feature
  activeFeature: 'viewer',
  setActiveFeature: (feature) => set({ activeFeature: feature }),

  // Viewer mode
  viewerMode: 'tree',
  setViewerMode: (mode) => set({ viewerMode: mode }),

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
  truncateValues: true,
  toggleTruncateValues: () => set((state) => ({ truncateValues: !state.truncateValues })),
  isFilterOpen: false,
  setIsFilterOpen: (open) => set({ isFilterOpen: open }),

  // Search (highlights matches without filtering)
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query, currentSearchIndex: 0 }),
  searchCaseSensitive: false,
  toggleSearchCaseSensitive: () => set((state) => ({ searchCaseSensitive: !state.searchCaseSensitive, currentSearchIndex: 0 })),
  isSearchOpen: false,
  setIsSearchOpen: (open) => set({ isSearchOpen: open }),
  currentSearchIndex: 0,
  setCurrentSearchIndex: (index) => set({ currentSearchIndex: index }),
  searchMatchCount: 0,
  setSearchMatchCount: (count) => set({ searchMatchCount: count }),

  // Expanded paths (start with empty set - nodes collapsed by default)
  expandedPaths: new Set<string>(),
  collapsedPaths: new Set<string>(),
  togglePath: (path) =>
    set((state) => {
      const newExpandedSet = new Set(state.expandedPaths)
      const newCollapsedSet = new Set(state.collapsedPaths)

      // If we're in "expand all" or "expand to depth" mode, use collapsed paths tracking
      if (newExpandedSet.has('__EXPAND_ALL__') || newExpandedSet.has('__EXPAND_TO_DEPTH_2__')) {
        // Toggle in the collapsed set instead
        if (newCollapsedSet.has(path)) {
          newCollapsedSet.delete(path) // Un-collapse (expand)
        } else {
          newCollapsedSet.add(path) // Collapse this specific path
        }
        return { expandedPaths: newExpandedSet, collapsedPaths: newCollapsedSet }
      }

      // Normal mode: toggle in expanded set
      if (newExpandedSet.has(path)) {
        // Path is expanded, collapse it
        newExpandedSet.delete(path)
      } else {
        // Path is collapsed, expand it
        newExpandedSet.add(path)
      }
      // Clear collapsed paths when not in expand all mode
      return { expandedPaths: newExpandedSet, collapsedPaths: new Set() }
    }),
  expandAll: () => set((state) => {
    // For large files, use depth-limited expansion instead of full expansion
    const isLargeFile = state.metadata?.nodeCount && state.metadata.nodeCount > 5000
    if (isLargeFile) {
      return { expandedPaths: new Set<string>(['__EXPAND_TO_DEPTH_2__']), collapsedPaths: new Set() }
    }
    return { expandedPaths: new Set<string>(['__EXPAND_ALL__']), collapsedPaths: new Set() }
  }),
  collapseAll: () => set({ expandedPaths: new Set<string>(), collapsedPaths: new Set() }),
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
    originalText: null,
    fileSize: null,
    metadata: null,
    currentPath: null,
    hoverPosition: null,
    filterQuery: '',
    searchQuery: '',
    expandedPaths: new Set<string>(),
    collapsedPaths: new Set<string>(),
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
      const type = getJsonType(value)
      const newBookmark: Bookmark = {
        id: crypto.randomUUID(),
        path,
        value,
        pathFormat,
        timestamp: Date.now(),
        type,
        targetPath: '',
        transformation: '',
        notes: '',
      }
      const newBookmarks = [...state.bookmarks, newBookmark]
      saveBookmarks(newBookmarks)
      return { bookmarks: newBookmarks }
    }),
  updateBookmark: (id, updates) =>
    set((state) => {
      const newBookmarks = state.bookmarks.map((bookmark) =>
        bookmark.id === id ? { ...bookmark, ...updates } : bookmark
      )
      saveBookmarks(newBookmarks)
      return { bookmarks: newBookmarks }
    }),
  removeBookmark: (id) =>
    set((state) => {
      const newBookmarks = state.bookmarks.filter((b) => b.id !== id)
      saveBookmarks(newBookmarks)
      return { bookmarks: newBookmarks }
    }),
  reorderBookmarks: (startIndex, endIndex) =>
    set((state) => {
      const newBookmarks = Array.from(state.bookmarks)
      const [removed] = newBookmarks.splice(startIndex, 1)
      newBookmarks.splice(endIndex, 0, removed)
      saveBookmarks(newBookmarks)
      return { bookmarks: newBookmarks }
    }),
  clearBookmarks: () => {
    saveBookmarks([])
    set({ bookmarks: [] })
  },
  isBookmarksOpen: false,
  setIsBookmarksOpen: (open) => set({ isBookmarksOpen: open }),

  // Keyboard Shortcuts
  isShortcutsOpen: false,
  setIsShortcutsOpen: (open) => set({ isShortcutsOpen: open }),
}))
