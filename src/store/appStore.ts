import { create } from 'zustand'
import type {
  JsonValue,
  PathFormat,
  ImportHistoryItem
} from '@/types'

interface AppState {
  // JSON data
  jsonData: JsonValue | null
  setJsonData: (data: JsonValue | null) => void

  // Loading and error states
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  error: string | null
  setError: (error: string | null) => void

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

  // Expanded paths (for tree view) - tracks which nodes are expanded
  // By default, nodes are collapsed unless they're in this set or at root level
  expandedPaths: Set<string>
  togglePath: (path: string) => void
  expandAll: () => void
  collapseAll: () => void

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
}

export const useAppStore = create<AppState>((set) => ({
  // JSON data
  jsonData: null,
  setJsonData: (data) => set({ jsonData: data }),

  // Loading and error states
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),

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

  // Expanded paths (start with empty set - nodes collapsed by default)
  expandedPaths: new Set<string>(),
  togglePath: (path) =>
    set((state) => {
      const newSet = new Set(state.expandedPaths)

      // If we're in "expand all" mode, remove it and start tracking individual paths
      if (newSet.has('__EXPAND_ALL__')) {
        newSet.delete('__EXPAND_ALL__')
        // Add this path since we're collapsing it (opposite of expand all)
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
  expandAll: () => set({ expandedPaths: new Set<string>(['__EXPAND_ALL__']) }),
  collapseAll: () => set({ expandedPaths: new Set<string>() }),

  // Clear data
  clearJsonData: () => set({
    jsonData: null,
    currentPath: null,
    filterQuery: '',
    expandedPaths: new Set<string>(),
    error: null
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
}))
