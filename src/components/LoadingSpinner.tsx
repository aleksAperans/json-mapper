import { useAppStore } from '@/store/appStore'

export function LoadingSpinner() {
  const loadingProgress = useAppStore((state) => state.loadingProgress)
  const loadingMessage = useAppStore((state) => state.loadingMessage)

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center w-full max-w-md px-6">
        <div className="w-12 h-12 mx-auto mb-4 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin" />

        {/* Progress bar */}
        {loadingProgress > 0 && (
          <div className="mb-3">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 transition-all duration-300 ease-out"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Status message */}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {loadingMessage || 'Loading JSON...'}
        </p>

        {/* Progress percentage */}
        {loadingProgress > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {loadingProgress}%
          </p>
        )}
      </div>
    </div>
  )
}
