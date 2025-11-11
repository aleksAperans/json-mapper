import { FileJson } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { formatFileSize } from '@/utils/fileSize'

export function Footer() {
  const { fileSize, metadata, hoverPosition } = useAppStore()

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

        {/* Right side: Position info and app name */}
        <div className="flex items-center gap-4">
          {hoverPosition && (
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono">
                Line: {hoverPosition.line}  Column: {hoverPosition.column}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>JSON Mapper</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
