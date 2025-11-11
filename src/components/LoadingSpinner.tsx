export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading JSON...</p>
      </div>
    </div>
  )
}
