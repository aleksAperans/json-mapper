import { Keyboard } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Shortcut {
  keys: string[]
  description: string
  category: 'general' | 'viewer' | 'navigation'
}

const shortcuts: Shortcut[] = [
  // General
  { keys: ['⌘', '/'], description: 'Show keyboard shortcuts', category: 'general' },
  { keys: ['⌘', 'F'], description: 'Open search', category: 'general' },
  { keys: ['⌘', '⇧', 'F'], description: 'Open filter', category: 'general' },
  { keys: ['⌘', 'B'], description: 'View bookmarks', category: 'general' },

  // Viewer
  { keys: ['⌘', '1'], description: 'Switch to Tree view', category: 'viewer' },
  { keys: ['⌘', '2'], description: 'Switch to JSON view', category: 'viewer' },
  { keys: ['⌘', 'E'], description: 'Expand all nodes', category: 'viewer' },
  { keys: ['⌘', '⇧', 'E'], description: 'Collapse all nodes', category: 'viewer' },

  // Navigation
  { keys: ['⌘', 'G'], description: 'Next search result', category: 'navigation' },
  { keys: ['⌘', '⇧', 'G'], description: 'Previous search result', category: 'navigation' },
  { keys: ['Esc'], description: 'Close modals/panels', category: 'navigation' },
]

const KeyBadge = ({ keys }: { keys: string[] }) => (
  <div className="flex items-center gap-1">
    {keys.map((key, index) => (
      <span key={index}>
        <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-muted px-2 text-xs font-semibold text-muted-foreground shadow-sm">
          {key}
        </kbd>
        {index < keys.length - 1 && <span className="mx-1 text-muted-foreground">+</span>}
      </span>
    ))}
  </div>
)

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const categories = {
    general: 'General',
    viewer: 'Viewer',
    navigation: 'Navigation'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </div>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and interact with JSON Mapper more efficiently
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {Object.entries(categories).map(([key, title]) => {
            const categoryShortcuts = shortcuts.filter(s => s.category === key)
            if (categoryShortcuts.length === 0) return null

            return (
              <div key={key}>
                <h3 className="text-sm font-semibold mb-3 text-foreground">{title}</h3>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                      <KeyBadge keys={shortcut.keys} />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Note: On Windows and Linux, use <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted text-[10px]">Ctrl</kbd> instead of <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted text-[10px]">⌘</kbd>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
