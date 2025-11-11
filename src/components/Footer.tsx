import { FileJson, Keyboard } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { formatFileSize } from '@/utils/fileSize'
import type { PathFormat } from '@/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const formats: { value: PathFormat; label: string }[] = [
  { value: 'jmespath', label: 'JMESPath' },
  { value: 'jsonpath', label: 'JSONPath' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
]

export function Footer() {
  const { fileSize, metadata, hoverPosition, pathFormat, setPathFormat, hoverPath, currentPath, setIsShortcutsOpen } = useAppStore()

  return (
    <footer className="border-t bg-muted/40 px-4 py-2">
      <div className="flex items-center justify-between">
        {/* Left side: File info */}
        <div className="flex items-center gap-4">
          {fileSize !== null && (
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <FileJson className="h-4 w-4" />
              <span className="font-mono">{formatFileSize(fileSize)}</span>
            </div>
          )}

          {metadata?.nodeCount !== undefined && (
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <span>{metadata.nodeCount.toLocaleString()} nodes</span>
            </div>
          )}

          {metadata?.maxDepth !== undefined && (
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <span>Max depth: {metadata.maxDepth}</span>
            </div>
          )}
        </div>

        {/* Right side: Position info, path format, and path display */}
        <div className="flex items-center gap-3">
          {/* Keyboard Shortcuts Help Button */}
          <button
            onClick={() => setIsShortcutsOpen(true)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            title="Keyboard shortcuts (⌘/)"
          >
            <Keyboard className="h-4 w-4" />
          </button>

          {hoverPosition && (
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono">
                Line: {hoverPosition.line}  Column: {hoverPosition.column}
              </span>
            </div>
          )}

          {/* Path Format Selector */}
          <Select value={pathFormat} onValueChange={(value) => setPathFormat(value as PathFormat)}>
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              {formats.map((format) => (
                <SelectItem key={format.value} value={format.value}>
                  {format.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Current Path Display */}
          <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 shadow-sm overflow-x-auto max-w-2xl">
            <code className="text-sm font-mono text-muted-foreground whitespace-nowrap">
              {hoverPath || currentPath || '—'}
            </code>
          </div>
        </div>
      </div>
    </footer>
  )
}
