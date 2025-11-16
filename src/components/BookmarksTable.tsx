import { Trash2, GripVertical, Plus, X } from 'lucide-react'
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
  const {
    bookmarks,
    updateBookmark,
    removeBookmark,
    reorderBookmarks,
    customColumns,
    addCustomColumn,
    removeCustomColumn,
    renameCustomColumn,
    columnOrder,
    reorderColumns
  } = useAppStore()
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [newColumnName, setNewColumnName] = useState('')
  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null)
  const [editingColumnName, setEditingColumnName] = useState('')
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null)
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null)

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

  const handleAddColumn = () => {
    if (newColumnName.trim()) {
      addCustomColumn(newColumnName.trim())
      setNewColumnName('')
      setIsAddingColumn(false)
    }
  }

  const handleStartEditColumn = (columnId: string, currentName: string) => {
    setEditingColumnId(columnId)
    setEditingColumnName(currentName)
  }

  const handleSaveColumnName = () => {
    if (editingColumnId && editingColumnName.trim()) {
      renameCustomColumn(editingColumnId, editingColumnName.trim())
      setEditingColumnId(null)
      setEditingColumnName('')
    }
  }

  const handleCancelEditColumn = () => {
    setEditingColumnId(null)
    setEditingColumnName('')
  }

  // Define all base column metadata
  const baseColumnMeta: Record<string, { name: string }> = {
    'source-path': { name: 'Source Path' },
    'value': { name: 'Value' },
    'type': { name: 'Type' },
    'target-path': { name: 'Target Path' },
    'notes': { name: 'Notes' },
  }

  const handleColumnDragStart = (columnId: string) => {
    setDraggedColumnId(columnId)
  }

  const handleColumnDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    setDragOverColumnId(columnId)
  }

  const handleColumnDrop = (e: React.DragEvent, dropColumnId: string) => {
    e.preventDefault()
    if (draggedColumnId && draggedColumnId !== dropColumnId) {
      reorderColumns(draggedColumnId, dropColumnId)
    }
    setDraggedColumnId(null)
    setDragOverColumnId(null)
  }

  const handleColumnDragEnd = () => {
    setDraggedColumnId(null)
    setDragOverColumnId(null)
  }

  // Helper to render a column header cell
  const renderColumnHeader = (colId: string) => {
    const isCustom = customColumns.some(c => c.id === colId)
    const columnName = isCustom
      ? customColumns.find(c => c.id === colId)?.name || ''
      : baseColumnMeta[colId]?.name || ''

    if (!columnName) return null

    return (
      <th
        key={colId}
        draggable
        onDragStart={() => handleColumnDragStart(colId)}
        onDragOver={(e) => handleColumnDragOver(e, colId)}
        onDrop={(e) => handleColumnDrop(e, colId)}
        onDragEnd={handleColumnDragEnd}
        className={`text-left p-2 font-semibold group ${
          colId === 'type' ? 'w-20' : ''
        } ${draggedColumnId === colId ? 'opacity-50' : ''} ${
          dragOverColumnId === colId ? 'border-l-2 border-l-primary' : ''
        }`}
      >
        {isCustom && editingColumnId === colId ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={editingColumnName}
              onChange={(e) => setEditingColumnName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveColumnName()
                if (e.key === 'Escape') handleCancelEditColumn()
              }}
              onBlur={handleSaveColumnName}
              className="w-full p-1 text-xs border border-primary bg-background rounded"
              autoFocus
            />
            <button
              onClick={handleCancelEditColumn}
              className="p-0.5 hover:text-destructive"
              title="Cancel"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              <GripVertical className="w-3 h-3 text-muted-foreground cursor-move opacity-0 group-hover:opacity-100" />
              <span
                onClick={() => isCustom && handleStartEditColumn(colId, columnName)}
                className={isCustom ? 'cursor-pointer hover:text-primary' : ''}
                title={isCustom ? 'Click to rename' : ''}
              >
                {columnName}
              </span>
            </div>
            {isCustom && (
              <button
                onClick={() => removeCustomColumn(colId)}
                className="p-0.5 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                title="Remove column"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </th>
    )
  }

  // Helper to render a column cell
  const renderColumnCell = (colId: string, bookmark: typeof bookmarks[0]) => {
    const isCustom = customColumns.some(c => c.id === colId)

    if (isCustom) {
      return (
        <td key={colId} className="p-2">
          <EditableCell
            value={bookmark.customColumns[colId] || ''}
            onSave={(newValue) => {
              const updatedCustomColumns = { ...bookmark.customColumns, [colId]: newValue }
              updateBookmark(bookmark.id, { customColumns: updatedCustomColumns })
            }}
          />
        </td>
      )
    }

    // Render base column cells
    switch (colId) {
      case 'source-path':
        return (
          <td key={colId} className="p-2">
            <EditableCell
              value={bookmark.path}
              onSave={(newValue) => updateBookmark(bookmark.id, { path: newValue })}
            />
          </td>
        )
      case 'value':
        return (
          <td key={colId} className="p-2 max-w-xs">
            <EditableCell
              value={formatValueForDisplay(bookmark.value)}
              onSave={(newValue) => {
                updateBookmark(bookmark.id, { value: newValue as JsonValue })
              }}
              className="break-all"
            />
          </td>
        )
      case 'type':
        return (
          <td key={colId} className="p-2">
            <EditableCell
              value={bookmark.type}
              onSave={(newValue) => updateBookmark(bookmark.id, { type: newValue })}
            />
          </td>
        )
      case 'target-path':
        return (
          <td key={colId} className="p-2">
            <EditableCell
              value={bookmark.targetPath}
              onSave={(newValue) => updateBookmark(bookmark.id, { targetPath: newValue })}
            />
          </td>
        )
      case 'notes':
        return (
          <td key={colId} className="p-2">
            <EditableCell
              value={bookmark.notes}
              onSave={(newValue) => updateBookmark(bookmark.id, { notes: newValue })}
            />
          </td>
        )
      default:
        return null
    }
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
            <th className="text-left p-2 font-semibold w-12">#</th>
            {columnOrder.map((colId) => renderColumnHeader(colId))}
            <th className={`p-2 ${isAddingColumn ? 'min-w-48' : 'w-10'}`}>
              {isAddingColumn ? (
                <div className="flex items-center gap-1 justify-end">
                  <input
                    type="text"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddColumn()
                      if (e.key === 'Escape') {
                        setIsAddingColumn(false)
                        setNewColumnName('')
                      }
                    }}
                    onBlur={handleAddColumn}
                    placeholder="Column name"
                    className="w-full p-1 text-xs border border-primary bg-background rounded"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setIsAddingColumn(false)
                      setNewColumnName('')
                    }}
                    className="p-0.5 hover:text-destructive flex-shrink-0"
                    title="Cancel"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    onClick={() => setIsAddingColumn(true)}
                    className="p-1 text-muted-foreground hover:text-primary transition-colors"
                    title="Add custom column"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </th>
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
              <td className="p-2 text-center text-muted-foreground">
                {index + 1}
              </td>
              {columnOrder.map((colId) => renderColumnCell(colId, bookmark))}
              <td className="p-2">
                <div className="flex justify-end">
                  <button
                    onClick={() => removeBookmark(bookmark.id)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    title="Remove bookmark"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
