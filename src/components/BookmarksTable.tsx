import { Trash2, GripVertical } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import type { JsonValue } from '@/types'
import { useState } from 'react'

/**
 * Formats a JSON value for display in the table
 */
function formatValueForDisplay(value: JsonValue): string {
  if (value === null) return 'null'
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    const hasPrimitivesOnly = value.every(item => item === null || typeof item !== 'object')
    if (hasPrimitivesOnly && value.length > 0) {
      const items = value.map(item => {
        if (typeof item === 'string') return `"${item}"`
        return String(item)
      }).join(', ')
      const result = `[${items}]`
      return result.length > 100 ? result.slice(0, 100) + '...]' : result
    }
    return `Array[${value.length}]`
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value)
    return `Object{${keys.length}}`
  }
  return String(value)
}

interface EditableCellProps {
  value: string
  onSave: (newValue: string) => void
  className?: string
}

function EditableCell({ value, onSave, className = '' }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)

  const handleDoubleClick = () => {
    setIsEditing(true)
    setEditValue(value)
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (editValue !== value) {
      onSave(editValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      setIsEditing(false)
      if (editValue !== value) {
        onSave(editValue)
      }
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setEditValue(value)
    }
  }

  if (isEditing) {
    return (
      <textarea
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full p-1 text-xs font-mono border border-primary bg-background text-foreground rounded focus:outline-none focus:ring-1 focus:ring-primary resize-none ${className}`}
        autoFocus
        rows={1}
        style={{ minHeight: '24px' }}
      />
    )
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={`p-1 text-xs font-mono cursor-text hover:bg-muted/50 rounded min-h-[24px] ${className}`}
      title="Double-click to edit"
    >
      {value || <span className="text-muted-foreground italic">Empty</span>}
    </div>
  )
}

export function BookmarksTable() {
  const { bookmarks, updateBookmark, removeBookmark, reorderBookmarks } = useAppStore()
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      reorderBookmarks(draggedIndex, dropIndex)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 mb-4 bg-muted rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">No bookmarks yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Start bookmarking paths by clicking the bookmark button on any row in
          the tree or JSON view.
        </p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-muted/50 border-b sticky top-0">
          <tr>
            <th className="w-8"></th>
            <th className="text-left p-2 font-semibold">Source Path</th>
            <th className="text-left p-2 font-semibold">Value</th>
            <th className="text-left p-2 font-semibold w-20">Type</th>
            <th className="text-left p-2 font-semibold">Target Path</th>
            <th className="text-left p-2 font-semibold">Transformation</th>
            <th className="text-left p-2 font-semibold">Notes</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {bookmarks.map((bookmark, index) => (
            <tr
              key={bookmark.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`border-b hover:bg-muted/30 transition-colors ${
                draggedIndex === index ? 'opacity-50' : ''
              } ${dragOverIndex === index ? 'border-t-2 border-t-primary' : ''}`}
            >
              <td className="p-2">
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
              </td>
              <td className="p-2">
                <EditableCell
                  value={bookmark.path}
                  onSave={(newValue) => updateBookmark(bookmark.id, { path: newValue })}
                />
              </td>
              <td className="p-2 max-w-xs">
                <EditableCell
                  value={formatValueForDisplay(bookmark.value)}
                  onSave={(newValue) => {
                    // For now, store as string. Could parse JSON if needed
                    updateBookmark(bookmark.id, { value: newValue as JsonValue })
                  }}
                  className="break-all"
                />
              </td>
              <td className="p-2">
                <EditableCell
                  value={bookmark.type}
                  onSave={(newValue) => updateBookmark(bookmark.id, { type: newValue })}
                />
              </td>
              <td className="p-2">
                <EditableCell
                  value={bookmark.targetPath}
                  onSave={(newValue) => updateBookmark(bookmark.id, { targetPath: newValue })}
                />
              </td>
              <td className="p-2">
                <EditableCell
                  value={bookmark.transformation}
                  onSave={(newValue) => updateBookmark(bookmark.id, { transformation: newValue })}
                />
              </td>
              <td className="p-2">
                <EditableCell
                  value={bookmark.notes}
                  onSave={(newValue) => updateBookmark(bookmark.id, { notes: newValue })}
                />
              </td>
              <td className="p-2">
                <button
                  onClick={() => removeBookmark(bookmark.id)}
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  title="Remove bookmark"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
