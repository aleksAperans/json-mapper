import { Github, Info } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { useAppStore } from '@/store/appStore'

export function Header() {
  const { setIsAboutOpen } = useAppStore()

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <img src="/android-chrome-192x192.png" alt="JSON Mapper" className="h-7 w-7 rounded" />
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-semibold leading-none tracking-tight">
              JSON Mapper
            </h1>
            <p className="text-sm text-muted-foreground">
              View, analyze and convert JSON - built for deeply nested structures
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAboutOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="About JSON Mapper"
          >
            <Info className="h-5 w-5" />
          </button>
          <a
            href="https://github.com/aleksAperans/json-mapper"
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
