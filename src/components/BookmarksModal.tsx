import { Download, Trash2, Copy } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { generateMarkdown, downloadMarkdown } from '@/utils/markdown'
import { copyToClipboard } from '@/utils/clipboard'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

export function BookmarksModal() {
  const {
    bookmarks,
    isBookmarksOpen,
    setIsBookmarksOpen,
    removeBookmark,
    clearBookmarks,
    setCopyNotification,
  } = useAppStore()

  const markdown = generateMarkdown(bookmarks)

  const handleCopyAll = async () => {
    const success = await copyToClipboard(markdown)
    if (success) {
      setCopyNotification(true, 'Copied bookmarks to clipboard')
      setTimeout(() => setCopyNotification(false), 2000)
    }
  }

  const handleDownload = () => {
    downloadMarkdown(markdown, 'json-prism-bookmarks.md')
    setCopyNotification(true, 'Bookmarks downloaded')
    setTimeout(() => setCopyNotification(false), 2000)
  }

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all bookmarks?')) {
      clearBookmarks()
      setCopyNotification(true, 'All bookmarks cleared')
      setTimeout(() => setCopyNotification(false), 2000)
    }
  }

  return (
    <Dialog open={isBookmarksOpen} onOpenChange={setIsBookmarksOpen}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bookmarks ({bookmarks.length})</DialogTitle>
          <DialogDescription>
            View and manage your saved JSON paths
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {bookmarks.length === 0 ? (
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
                Start bookmarking JSON paths by clicking the bookmark button on any row in
                the tree view.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Markdown preview */}
              <div className="border rounded-lg p-4 bg-muted/50">
                <pre className="text-sm font-mono whitespace-pre-wrap break-all">
                  {markdown}
                </pre>
              </div>

              {/* Individual bookmarks */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Individual Bookmarks
                </h4>
                {bookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <code className="text-sm font-mono break-all text-primary">
                        {bookmark.path}
                      </code>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(bookmark.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => removeBookmark(bookmark.id)}
                      className="flex-shrink-0 p-1.5 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove bookmark"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {bookmarks.length > 0 && (
          <div className="flex gap-2 pt-4 border-t">
            <button
              onClick={handleCopyAll}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Copy className="w-4 h-4" />
              Copy All
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <div className="flex-1" />
            <button
              onClick={handleClearAll}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-destructive text-destructive px-4 text-sm font-medium shadow-sm transition-colors hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
