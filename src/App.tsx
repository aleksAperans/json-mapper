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
import { AlertCircle } from 'lucide-react'

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
              <div className="flex items-center justify-center h-full p-8">
                <div className="max-w-md w-full">
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-8">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="rounded-full bg-destructive/10 p-3">
                        <AlertCircle className="h-8 w-8 text-destructive" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold tracking-tight">
                          Error Loading JSON
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {error}
                        </p>
                      </div>
                      <button
                        onClick={() => setError(null)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 px-4 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
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
