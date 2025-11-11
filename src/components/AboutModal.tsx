import { Info, Github, Heart, Code2, Keyboard } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface AboutModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            <DialogTitle>About JSON Mapper</DialogTitle>
          </div>
          <DialogDescription>
            A powerful tool for exploring, navigating, and mapping nested JSON structures
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Features */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-foreground">Features</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span><strong>Multiple Views:</strong> Tree and JSON text views for different exploration styles</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span><strong>Smart Search & Filter:</strong> Find and highlight content with case-sensitive options</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span><strong>Bookmarks:</strong> Save important paths with notes and transformations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span><strong>Path Formats:</strong> JMESPath, JSONPath, JavaScript, and Python syntax support</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span><strong>Convert:</strong> Export JSON to YAML, XML, CSV, and other formats</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span><strong>Large File Support:</strong> Virtual scrolling and lazy loading for huge JSON files</span>
              </li>
            </ul>
          </div>

          {/* Tech Stack */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
              <Code2 className="h-4 w-4" />
              Tech Stack
            </h3>
            <div className="flex flex-wrap gap-2">
              {['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Zustand', 'shadcn/ui'].map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Keyboard className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Keyboard Shortcuts</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Press{' '}
              <kbd className="px-2 py-1 rounded border border-border bg-background text-xs font-semibold">
                ⌘/
              </kbd>{' '}
              (or{' '}
              <kbd className="px-2 py-1 rounded border border-border bg-background text-xs font-semibold">
                Ctrl+/
              </kbd>
              ) to view all available keyboard shortcuts
            </p>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <a
                href="https://github.com/aleksAperans/json-mapper"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
                <span>View on GitHub</span>
              </a>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span>Made with</span>
                <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" />
                <span>by</span>
                <a
                  href="https://aleksaperans.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-primary transition-colors"
                >
                  Aleks Aperans
                </a>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
