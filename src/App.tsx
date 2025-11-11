import { useEffect, useCallback } from 'react'
import { useThemeStore } from './store/themeStore'
import { useAppStore } from './store/appStore'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Header } from './components/Header'
import { EmptyState } from './components/EmptyState'
import { LoadingSpinner } from './components/LoadingSpinner'
import { JsonTree } from './components/JsonTree'
import { ActionsToolbar } from './components/ActionsToolbar'
import { FeatureToolbar } from './components/FeatureToolbar'
import { CopyNotification } from './components/CopyNotification'
import { QueryExtractView } from './components/QueryExtractView'
import { BookmarksModal } from './components/BookmarksModal'

function App() {
  const { theme } = useThemeStore()
  const { jsonData, setJsonData, addToHistory, isLoading, setIsLoading, error, setError, activeFeature } = useAppStore()

  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  // Handle file upload
  const handleFileUpload = useCallback(
    async (file: File) => {
      setIsLoading(true)
      setError(null)
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        setJsonData(data)
        addToHistory({ source: 'file', name: file.name })
      } catch (error) {
        console.error('Failed to parse JSON:', error)
        const errorMsg = error instanceof Error ? error.message : 'Invalid JSON file'
        setError(errorMsg)
      } finally {
        setIsLoading(false)
      }
    },
    [setJsonData, addToHistory, setIsLoading, setError]
  )

  // Handle paste from clipboard
  const handlePasteFromClipboard = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const text = await navigator.clipboard.readText()
      const data = JSON.parse(text)
      setJsonData(data)
      addToHistory({ source: 'clipboard' })
    } catch (error) {
      console.error('Failed to parse JSON from clipboard:', error)
      const errorMsg = error instanceof Error ? error.message : 'Invalid JSON in clipboard or clipboard access denied'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [setJsonData, addToHistory, setIsLoading, setError])

  // Handle fetch from URL
  const handleFetchFromUrl = useCallback(
    async (url: string) => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setJsonData(data)
        addToHistory({ source: 'url', url })
      } catch (error) {
        console.error('Failed to fetch JSON from URL:', error)
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch JSON from URL'
        setError(errorMsg)
      } finally {
        setIsLoading(false)
      }
    },
    [setJsonData, addToHistory, setIsLoading, setError]
  )

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col overflow-hidden">
          <FeatureToolbar />
          <ActionsToolbar />
          <div className="flex-1 overflow-auto bg-white dark:bg-gray-900">
            {isLoading ? (
              <LoadingSpinner />
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="max-w-md px-4 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-red-600 dark:text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Error Loading JSON
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : !jsonData ? (
              <EmptyState
                onPasteFromClipboard={handlePasteFromClipboard}
                onFileUpload={handleFileUpload}
              />
            ) : activeFeature === 'tree' ? (
              <JsonTree data={jsonData} />
            ) : (
              <QueryExtractView />
            )}
          </div>
        </main>
        <CopyNotification />
        <BookmarksModal />
      </div>
    </ErrorBoundary>
  )
}

export default App
