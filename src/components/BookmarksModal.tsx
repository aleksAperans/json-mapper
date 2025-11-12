import { Download, Trash2, FileDown, Copy } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { generateCSV, generateMarkdownTable } from '@/utils/bookmarkExport'
import { downloadFile } from '@/utils/exportUtils'
import { BookmarksTable } from '@/components/BookmarksTable'
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
    clearBookmarks,
    setCopyNotification,
  } = useAppStore()

  const handleExportCSV = () => {
    const csv = generateCSV(bookmarks)
    downloadFile(csv, 'json-mapper-bookmarks.csv', 'text/csv')
    setCopyNotification(true, 'Bookmarks exported as CSV')
    setTimeout(() => setCopyNotification(false), 2000)
  }

  const handleExportMarkdown = () => {
    const markdown = generateMarkdownTable(bookmarks)
    downloadFile(markdown, 'json-mapper-bookmarks.md', 'text/markdown')
    setCopyNotification(true, 'Bookmarks exported as Markdown')
    setTimeout(() => setCopyNotification(false), 2000)
  }

  const handleCopyMarkdown = async () => {
    const markdown = generateMarkdownTable(bookmarks)
    try {
      await navigator.clipboard.writeText(markdown)
      setCopyNotification(true, 'Markdown table copied to clipboard')
      setTimeout(() => setCopyNotification(false), 2000)
    } catch (err) {
      setCopyNotification(true, 'Failed to copy to clipboard')
      setTimeout(() => setCopyNotification(false), 2000)
    }
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
      <DialogContent className="max-w-7xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bookmarks ({bookmarks.length})</DialogTitle>
          <DialogDescription>
            View and manage your saved paths
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <BookmarksTable />
        </div>

        {/* Footer actions */}
        {bookmarks.length > 0 && (
          <div className="flex gap-2 pt-4 border-t">
            <button
              onClick={handleExportCSV}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <FileDown className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={handleExportMarkdown}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Download className="w-4 h-4" />
              Export Markdown
            </button>
            <button
              onClick={handleCopyMarkdown}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Copy className="w-4 h-4" />
              Copy Markdown
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
