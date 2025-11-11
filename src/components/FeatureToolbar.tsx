import { Eye, Search } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { cn } from '@/lib/utils'

const features = [
  {
    id: 'viewer' as const,
    label: 'Viewer',
    icon: Eye,
  },
  {
    id: 'query' as const,
    label: 'Data Patterns',
    icon: Search,
  },
]

export function FeatureToolbar() {
  const { activeFeature, setActiveFeature } = useAppStore()

  return (
    <div className="border-b bg-muted/40">
      <div className="flex items-center px-4">
        {/* Feature Tabs */}
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
      </div>
    </div>
  )
}
