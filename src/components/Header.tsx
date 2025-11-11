import { Github, FileBracesCorner } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <FileBracesCorner className="h-7 w-7 text-primary" />
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold leading-none tracking-tight">
              JSONPrism
            </h1>
            <p className="text-sm text-muted-foreground">
              JSON Viewer with JMESPath
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com/aleksAperans/json-prism"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="View on GitHub"
          >
            <Github className="h-5.5 w-5.5" />
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
