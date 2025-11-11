import { useEffect, useCallback } from 'react'
import { useThemeStore } from './store/themeStore'
import { useAppStore } from './store/appStore'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Header } from './components/Header'
import { EmptyState } from './components/EmptyState'
import { LoadingSpinner } from './components/LoadingSpinner'
import { JsonTree } from './components/JsonTree'
import { TextView } from './components/TextView'
import { ActionsToolbar } from './components/ActionsToolbar'
import { FeatureToolbar } from './components/FeatureToolbar'
import { Footer } from './components/Footer'
import { CopyNotification } from './components/CopyNotification'
import { QueryExtractView } from './components/QueryExtractView'
import { ConvertView } from './components/ConvertView'
import { BookmarksModal } from './components/BookmarksModal'
import { AlertCircle } from 'lucide-react'
import { parseJSONAsync } from './utils/workerParser'
import type { JsonValue } from './types'

const EXAMPLE_JSON = {
  "band": {
    "name": "Daft Punk",
    "formed": 1993,
    "disbanded": 2021,
    "genre": ["Electronic", "House", "Disco", "Funk"],
    "members": [
      {
        "name": "Thomas Bangalter",
        "role": ["Producer", "DJ", "Multi-instrumentalist"],
        "birthYear": 1975,
        "equipment": {
          "synthesizers": ["Roland Juno-106", "Minimoog Voyager"],
          "samplers": ["E-mu SP-1200", "Akai MPC3000"],
          "customGear": {
            "helmet": {
              "version": 2,
              "features": ["LED Display", "Cooling System", "Gold Plating"],
              "designer": "Tony Gardner"
            }
          }
        },
        "sideProjects": ["Stardust", "Together", "Roule Records"]
      },
      {
        "name": "Guy-Manuel de Homem-Christo",
        "role": ["Producer", "DJ", "Guitarist"],
        "birthYear": 1974,
        "equipment": {
          "synthesizers": ["Roland Jupiter-8", "ARP 2600"],
          "guitars": ["Fender Stratocaster", "Gibson Les Paul"],
          "customGear": {
            "helmet": {
              "version": 2,
              "features": ["Rainbow LED", "Ventilation", "Chrome Finish"],
              "designer": "Tony Gardner"
            }
          }
        },
        "sideProjects": ["Le Knight Club", "Crydamoure Records"]
      }
    ],
    "discography": {
      "studioAlbums": [
        {
          "title": "Homework",
          "year": 1997,
          "topTracks": [
            {
              "name": "Around the World",
              "length": "7:09",
              "certifications": ["Gold", "Platinum"]
            },
            {
              "name": "Da Funk",
              "length": "5:28",
              "certifications": ["Silver"]
            }
          ]
        },
        {
          "title": "Random Access Memories",
          "year": 2013,
          "topTracks": [
            {
              "name": "Get Lucky",
              "length": "6:09",
              "certifications": ["Multi-Platinum", "Diamond"]
            }
          ]
        }
      ]
    }
  }
}

function App() {
  const { theme } = useThemeStore()
  const {
    jsonData,
    setJsonData,
    setOriginalText,
    activeFeature,
    setFileSize,
    setMetadata,
    addToHistory,
    isLoading,
    setIsLoading,
    setLoadingProgress,
    error,
    setError,
    viewerMode
  } = useAppStore()

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
      setLoadingProgress(0, '')
      try {
        const text = await file.text()
        const result = await parseJSONAsync(text, {
          onProgress: (progress, message) => {
            setLoadingProgress(progress, message)
          }
        })
        setJsonData(result.data as JsonValue)
        setOriginalText(text)
        setFileSize(result.size)
        setMetadata(result.metadata)
        addToHistory({ source: 'file', name: file.name })
      } catch (error) {
        console.error('Failed to parse JSON:', error)
        const errorMsg = error instanceof Error ? error.message : 'Invalid JSON file'
        setError(errorMsg)
      } finally {
        setIsLoading(false)
        setLoadingProgress(0, '')
      }
    },
    [setJsonData, setOriginalText, setFileSize, setMetadata, addToHistory, setIsLoading, setLoadingProgress, setError]
  )

  // Handle paste from clipboard
  const handlePasteFromClipboard = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setLoadingProgress(0, '')
    try {
      const text = await navigator.clipboard.readText()
      const result = await parseJSONAsync(text, {
        onProgress: (progress, message) => {
          setLoadingProgress(progress, message)
        }
      })
      setJsonData(result.data as JsonValue)
      setOriginalText(text)
      setFileSize(result.size)
      setMetadata(result.metadata)
      addToHistory({ source: 'clipboard' })
    } catch (error) {
      console.error('Failed to parse JSON from clipboard:', error)
      const errorMsg = error instanceof Error ? error.message : 'Invalid JSON in clipboard or clipboard access denied'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
      setLoadingProgress(0, '')
    }
  }, [setJsonData, setOriginalText, setFileSize, setMetadata, addToHistory, setIsLoading, setLoadingProgress, setError])

  // Handle load example
  const handleLoadExample = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setLoadingProgress(0, '')
    try {
      const text = JSON.stringify(EXAMPLE_JSON, null, 2)
      const result = await parseJSONAsync(text, {
        onProgress: (progress, message) => {
          setLoadingProgress(progress, message)
        }
      })
      setJsonData(result.data as JsonValue)
      setOriginalText(text)
      setFileSize(result.size)
      setMetadata(result.metadata)
      addToHistory({ source: 'file', name: 'example.json' })
    } catch (error) {
      console.error('Failed to load example JSON:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to load example'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
      setLoadingProgress(0, '')
    }
  }, [setJsonData, setOriginalText, setFileSize, setMetadata, addToHistory, setIsLoading, setLoadingProgress, setError])

  return (
    <ErrorBoundary>
      <div className="h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10">
          <Header />
          <FeatureToolbar />
          {activeFeature !== 'convert' && <ActionsToolbar />}
        </div>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-auto bg-white dark:bg-gray-900">
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
          ) : activeFeature === 'convert' ? (
            <ConvertView
              onPasteFromClipboard={handlePasteFromClipboard}
              onFileUpload={handleFileUpload}
              onLoadExample={handleLoadExample}
            />
          ) : !jsonData ? (
            <EmptyState
              onPasteFromClipboard={handlePasteFromClipboard}
              onFileUpload={handleFileUpload}
              onLoadExample={handleLoadExample}
            />
          ) : activeFeature === 'viewer' ? (
            viewerMode === 'tree' ? (
              <JsonTree data={jsonData} />
            ) : (
              <TextView />
            )
          ) : (
            <QueryExtractView />
          )}
        </main>

        {/* Fixed Footer */}
        <Footer />

        <CopyNotification />
        <BookmarksModal />
      </div>
    </ErrorBoundary>
  )
}

export default App
