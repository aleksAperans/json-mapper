import { Clipboard, FileUp } from 'lucide-react'
import { useEffect } from 'react'
import {
  Empty,
  EmptyContent,
} from '@/components/ui/empty'

interface EmptyStateProps {
  onPasteFromClipboard: () => void
  onFileUpload: (file: File) => void
}

export function EmptyState({ onPasteFromClipboard, onFileUpload }: EmptyStateProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+V / Ctrl+V for paste
      if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        e.preventDefault()
        onPasteFromClipboard()
      }
      // Cmd+O / Ctrl+O for open file
      if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
        e.preventDefault()
        document.getElementById('file-upload-empty')?.click()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onPasteFromClipboard])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileUpload(file)
    }
  }

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0

  return (
    <Empty className="h-full py-20">
      <EmptyContent className="w-full max-w-sm">
        <button
          onClick={onPasteFromClipboard}
          className="group flex items-center justify-between rounded-lg border bg-card px-5 py-3 text-left shadow-sm transition-all hover:bg-accent hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Clipboard className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium">Paste from Clipboard</span>
          </div>
          <kbd className="rounded bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
            {isMac ? '⌘' : 'Ctrl+'} V
          </kbd>
        </button>

        <label className="group cursor-pointer">
          <input
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload-empty"
          />
          <div className="flex items-center justify-between rounded-lg border bg-card px-5 py-3 shadow-sm transition-all hover:bg-accent hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileUp className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Open File</span>
            </div>
            <kbd className="rounded bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
              {isMac ? '⌘' : 'Ctrl+'} O
            </kbd>
          </div>
        </label>
      </EmptyContent>
    </Empty>
  )
}
