// Core JSON types
export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonObject | JsonArray
export interface JsonObject {
  [key: string]: JsonValue
}
export type JsonArray = JsonValue[]

// Theme types
export type Theme = 'light' | 'dark'

// Path format types
export type PathFormat = 'jmespath' | 'jsonpath' | 'javascript' | 'python'

// JSON node type for tree rendering
export interface JsonNode {
  key: string
  value: JsonValue
  path: string
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
  isExpanded?: boolean
  children?: JsonNode[]
}

// Import source types
export type ImportSource = 'file' | 'clipboard' | 'url'

// Search types
export interface SearchResult {
  path: string
  key: string
  value: JsonValue
  matchType: 'key' | 'value'
}

// Application state
export interface AppState {
  jsonData: JsonValue | null
  currentPath: string | null
  pathFormat: PathFormat
  searchQuery: string
  searchResults: SearchResult[]
  currentSearchIndex: number
  caseSensitive: boolean
  expandedPaths: Set<string>
  importHistory: ImportHistoryItem[]
}

// Import history
export interface ImportHistoryItem {
  id: string
  source: ImportSource
  timestamp: number
  name?: string
  url?: string
}

// Copy notification
export interface CopyNotification {
  message: string
  visible: boolean
}

// Bookmarks
export interface Bookmark {
  id: string
  path: string
  value: JsonValue
  pathFormat: PathFormat
  timestamp: number
  type: string // Data type: string, number, array, object, boolean, null
  targetPath: string // Destination path in target system
  notes: string // General notes
  customColumns: Record<string, string> // User-defined columns
}

// Custom column definition for bookmarks table
export interface CustomColumn {
  id: string
  name: string
}
