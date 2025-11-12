import { create } from 'zustand'
import type {
  JsonValue,
  PathFormat,
  ImportHistoryItem,
  Bookmark
} from '@/types'
import { loadBookmarks, saveBookmarks, isFirstTimeUser, markUserAsVisited as markUserAsVisitedLS } from '@/utils/localStorage'
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
  currentExpandDepth: number // Current expansion depth (0 = all collapsed)
  togglePath: (path: string) => void
  expandAll: () => void
  collapseAll: () => void
  expandSubtree: (parentPath: string, data: JsonValue) => void
  incrementExpandDepth: () => void // Expand one level deeper
  decrementExpandDepth: () => void // Collapse one level
  expandToMaxDepth: () => void // Expand to maximum depth
  collapseToMinDepth: () => void // Collapse to depth 0

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

  // About Modal
  isAboutOpen: boolean
  setIsAboutOpen: (open: boolean) => void

  // First-time user tracking
  isFirstTimeUser: boolean
  markAsVisited: () => void
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
  currentExpandDepth: 0,
  togglePath: (path) =>
    set((state) => {
      const newExpandedSet = new Set(state.expandedPaths)
      const newCollapsedSet = new Set(state.collapsedPaths)

      // Check if we're in depth-based mode (including depth 0)
      const depthFlag = Array.from(newExpandedSet).find(flag => flag.startsWith('__EXPAND_TO_DEPTH_'))
      const isDepthMode = depthFlag || state.currentExpandDepth === 0

      if (isDepthMode) {
        // In depth mode, use collapsed/expanded paths for overrides
        if (newCollapsedSet.has(path)) {
          // Was explicitly collapsed, now expand it
          newCollapsedSet.delete(path)
          newExpandedSet.add(path) // Also add to expanded for depth 0
        } else if (newExpandedSet.has(path) && !depthFlag) {
          // Was explicitly expanded (depth 0), now collapse it
          newExpandedSet.delete(path)
        } else {
          // Check current state based on depth
          const pathDepth = path.split(/[.\[\]]/).filter(Boolean).length
          const currentDepth = depthFlag ? parseInt(depthFlag.replace('__EXPAND_TO_DEPTH_', '').replace('__', '')) : 0

          if (pathDepth <= currentDepth) {
            // Currently expanded by depth, collapse it explicitly
            newCollapsedSet.add(path)
          } else {
            // Currently collapsed, expand it explicitly
            newExpandedSet.add(path)
          }
        }
        return { expandedPaths: newExpandedSet, collapsedPaths: newCollapsedSet }
      }

      // Normal mode: toggle in expanded set (shouldn't happen with new system, but keep for safety)
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
    const maxDepth = state.metadata?.maxDepth || 999
    if (isLargeFile) {
      return {
        expandedPaths: new Set<string>(['__EXPAND_TO_DEPTH_2__']),
        collapsedPaths: new Set(),
        currentExpandDepth: 2
      }
    }
    return {
      expandedPaths: new Set<string>([`__EXPAND_TO_DEPTH_${maxDepth}__`]),
      collapsedPaths: new Set(),
      currentExpandDepth: maxDepth
    }
  }),
  collapseAll: () => set({
    expandedPaths: new Set<string>(),
    collapsedPaths: new Set(),
    currentExpandDepth: 0
  }),
  incrementExpandDepth: () => set((state) => {
    const maxDepth = state.metadata?.maxDepth || 999
    const newDepth = Math.min(state.currentExpandDepth + 1, maxDepth)
    return {
      expandedPaths: new Set<string>([`__EXPAND_TO_DEPTH_${newDepth}__`]),
      collapsedPaths: new Set(),
      currentExpandDepth: newDepth
    }
  }),
  decrementExpandDepth: () => set((state) => {
    const newDepth = Math.max(state.currentExpandDepth - 1, 0)
    if (newDepth === 0) {
      return {
        expandedPaths: new Set<string>(),
        collapsedPaths: new Set(),
        currentExpandDepth: 0
      }
    }
    return {
      expandedPaths: new Set<string>([`__EXPAND_TO_DEPTH_${newDepth}__`]),
      collapsedPaths: new Set(),
      currentExpandDepth: newDepth
    }
  }),
  expandToMaxDepth: () => set((state) => {
    const maxDepth = state.metadata?.maxDepth || 999
    return {
      expandedPaths: new Set<string>([`__EXPAND_TO_DEPTH_${maxDepth}__`]),
      collapsedPaths: new Set(),
      currentExpandDepth: maxDepth
    }
  }),
  collapseToMinDepth: () => set({
    expandedPaths: new Set<string>(),
    collapsedPaths: new Set(),
    currentExpandDepth: 0
  }),
  expandSubtree: (parentPath: string, data: JsonValue) => set((state) => {
    // Recursively expand all children under a specific parent path
    const newPaths = new Set(state.expandedPaths)
    // Remove expand depth flags if present
    Array.from(newPaths).forEach(flag => {
      if (flag.startsWith('__EXPAND_TO_DEPTH_')) {
        newPaths.delete(flag)
      }
    })

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
    currentExpandDepth: 0,
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

  // About Modal
  isAboutOpen: false,
  setIsAboutOpen: (open) => set({ isAboutOpen: open }),

  // First-time user tracking
  isFirstTimeUser: isFirstTimeUser(),
  markAsVisited: () => {
    markUserAsVisitedLS()
    set({ isFirstTimeUser: false })
  },
}))
