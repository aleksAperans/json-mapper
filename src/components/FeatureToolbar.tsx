import { Eye, Search, Copy } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { copyToClipboard } from '@/utils/clipboard'
import { cn } from '@/lib/utils'
import type { PathFormat } from '@/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const features = [
  {
    id: 'viewer' as const,
    label: 'Viewer',
    icon: Eye,
  },
  {
    id: 'query' as const,
    label: 'Query & Extract',
    icon: Search,
  },
]

const viewerModes = [
  { value: 'text', label: 'Text' },
  { value: 'tree', label: 'Tree' },
  { value: 'table', label: 'Table' },
]

const formats: { value: PathFormat; label: string }[] = [
  { value: 'jmespath', label: 'JMESPath' },
  { value: 'jsonpath', label: 'JSONPath' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
]

export function FeatureToolbar() {
  const { activeFeature, setActiveFeature, currentPath, pathFormat, setPathFormat, setCopyNotification } =
    useAppStore()

  const handleCopyPath = async () => {
    if (!currentPath) return
    const success = await copyToClipboard(currentPath)
    if (success) {
      setCopyNotification(true, `Copied: ${currentPath}`)
      setTimeout(() => setCopyNotification(false), 2000)
    }
  }

  return (
    <div className="border-b bg-muted/40">
      <div className="flex items-center justify-between px-4">
        {/* Left: Feature Tabs */}
        <div className="flex items-center">
          {features.map((feature) => (
            <button
              key={feature.id}
              onClick={() => setActiveFeature(feature.id)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px',
                activeFeature === feature.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
              )}
            >
              <feature.icon className="h-4 w-4" />
              <span>{feature.label}</span>
            </button>
          ))}
        </div>

        {/* Right: Path Format + Current Path */}
        <div className="flex items-center gap-3">
          {/* Path Format Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">Path Format:</label>
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
          </div>

          {/* Current Path Display */}
          {currentPath && (
            <div className="flex min-w-0 max-w-md items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 shadow-sm">
              <code className="flex-1 truncate text-sm font-mono">{currentPath}</code>
              <button
                onClick={handleCopyPath}
                className="flex-shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                title="Copy path"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
