import { useState, useMemo } from 'react'
import { useAppStore } from '@/store/appStore'
import { Upload, FileJson, CheckCircle2, XCircle, AlertCircle, Clipboard } from 'lucide-react'
import { cn } from '@/lib/utils'
import Ajv from 'ajv'

const ajv = new Ajv({ allErrors: true, verbose: true })

export function AnalysisView() {
  const { jsonData } = useAppStore()
  const [schemaText, setSchemaText] = useState('')
  const [schemaError, setSchemaError] = useState<string | null>(null)

  // Validate the JSON against the schema
  const validationResult = useMemo(() => {
    if (!jsonData || !schemaText.trim()) {
      return null
    }

    try {
      // Parse the schema
      const schema = JSON.parse(schemaText)

      // Compile the schema
      const validate = ajv.compile(schema)

      // Validate the data
      const valid = validate(jsonData)

      return {
        valid,
        errors: validate.errors || [],
      }
    } catch (error) {
      setSchemaError(error instanceof Error ? error.message : 'Invalid schema format')
      return null
    }
  }, [jsonData, schemaText])

  const handlePasteSchema = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setSchemaText(text)
      setSchemaError(null)
    } catch (error) {
      console.error('Failed to paste from clipboard:', error)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        setSchemaText(text)
        setSchemaError(null)
      }
      reader.readAsText(file)
    }
  }

  const handleClearSchema = () => {
    setSchemaText('')
    setSchemaError(null)
  }

  if (!jsonData) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <p className="text-muted-foreground">No JSON data loaded</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Schema Input Area */}
      <div className="border-b bg-muted/40 p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">JSON Schema</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePasteSchema}
                className="inline-flex h-8 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                title="Paste schema from clipboard"
              >
                <Clipboard className="h-4 w-4" />
                <span className="hidden lg:inline">Paste</span>
              </button>
              <label className="inline-flex h-8 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer">
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="h-4 w-4" />
                <span className="hidden lg:inline">Upload</span>
              </label>
              {schemaText && (
                <button
                  onClick={handleClearSchema}
                  className="inline-flex h-8 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium text-destructive shadow-sm transition-colors hover:bg-destructive/10"
                  title="Clear schema"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <textarea
            value={schemaText}
            onChange={(e) => {
              setSchemaText(e.target.value)
              setSchemaError(null)
            }}
            placeholder="Paste or upload your JSON Schema here..."
            className="w-full h-32 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />

          {schemaError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{schemaError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Validation Results */}
      <div className="flex-1 overflow-auto p-4">
        {!schemaText.trim() ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="rounded-full bg-muted p-4">
              <FileJson className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No Schema Provided</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Paste or upload a JSON Schema to validate your JSON data against it.
              </p>
            </div>
          </div>
        ) : validationResult ? (
          <div className="space-y-4">
            {/* Validation Status */}
            <div
              className={cn(
                'rounded-lg border p-4',
                validationResult.valid
                  ? 'border-green-500/20 bg-green-500/5'
                  : 'border-destructive/20 bg-destructive/5'
              )}
            >
              <div className="flex items-center gap-3">
                {validationResult.valid ? (
                  <>
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-500" />
                    <div>
                      <h3 className="font-semibold text-green-900 dark:text-green-100">
                        Validation Passed
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Your JSON data conforms to the provided schema.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6 text-destructive" />
                    <div>
                      <h3 className="font-semibold text-destructive">
                        Validation Failed
                      </h3>
                      <p className="text-sm text-destructive/80">
                        Found {validationResult.errors.length} validation{' '}
                        {validationResult.errors.length === 1 ? 'error' : 'errors'}.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Error List */}
            {!validationResult.valid && validationResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Validation Errors:</h4>
                <div className="space-y-2">
                  {validationResult.errors.map((error, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 space-y-1"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium text-destructive">
                            {error.instancePath || '(root)'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {error.message}
                          </p>
                          {error.params && Object.keys(error.params).length > 0 && (
                            <div className="text-xs font-mono text-muted-foreground mt-1">
                              {JSON.stringify(error.params)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
