import { Check } from 'lucide-react'
import { useAppStore } from '@/store/appStore'

export function CopyNotification() {
  const { showCopyNotification, copyMessage } = useAppStore()

  if (!showCopyNotification) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 fade-in">
      <div className="flex items-center gap-3 rounded-lg border bg-primary px-4 py-3 text-primary-foreground shadow-lg">
        <Check className="h-5.5 w-5.5 flex-shrink-0" />
        <p className="text-base font-medium">{copyMessage}</p>
      </div>
    </div>
  )
}
