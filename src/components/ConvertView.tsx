import { useState, useMemo } from 'react'
import { useAppStore } from '@/store/appStore'
import { Copy, Download, FileCode, FileText, Table, Clipboard, FileUp, FileJson, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { copyToClipboard } from '@/utils/clipboard'
import yaml from 'js-yaml'
import convert from 'xml-js'

type ConvertFormat = 'yaml' | 'xml' | 'csv'

// Custom CSV converter
function jsonToCSV(data: any): string {
  // Flatten JSON for CSV conversion
  const flattenObject = (obj: any, prefix = ''): any => {
    return Object.keys(obj).reduce((acc: any, key: string) => {
      const pre = prefix.length ? `${prefix}.` : ''
      if (
        typeof obj[key] === 'object' &&
        obj[key] !== null &&
        !Array.isArray(obj[key])
      ) {
        Object.assign(acc, flattenObject(obj[key], pre + key))
      } else if (Array.isArray(obj[key])) {
        acc[pre + key] = JSON.stringify(obj[key])
      } else {
        acc[pre + key] = obj[key]
      }
      return acc
    }, {})
  }

  // Handle arrays of objects
  let dataForCsv: any[]
  if (Array.isArray(data)) {
    dataForCsv = data.map((item) =>
      typeof item === 'object' && item !== null
        ? flattenObject(item)
        : { value: item }
    )
  } else if (typeof data === 'object' && data !== null) {
    dataForCsv = [flattenObject(data)]
  } else {
    dataForCsv = [{ value: data }]
  }

  if (dataForCsv.length === 0) {
    return ''
  }

  // Get all unique keys across all rows
  const allKeys = Array.from(
    new Set(dataForCsv.flatMap((row) => Object.keys(row)))
  )

  // Escape CSV value
  const escapeCSVValue = (value: any): string => {
    if (value === null || value === undefined) {
      return ''
    }
    const stringValue = String(value)
    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
  }

  // Build CSV
  const header = allKeys.map(escapeCSVValue).join(',')
  const rows = dataForCsv.map((row) =>
    allKeys.map((key) => escapeCSVValue(row[key])).join(',')
  )

  return [header, ...rows].join('\n')
}

interface ConvertViewProps {
  onPasteFromClipboard?: () => void
  onFileUpload?: (file: File) => void
  onLoadExample?: () => void
}

export function ConvertView({ onPasteFromClipboard, onFileUpload, onLoadExample }: ConvertViewProps = {}) {
  const { jsonData, setCopyNotification, clearJsonData } = useAppStore()
  const [selectedFormat, setSelectedFormat] = useState<ConvertFormat>('yaml')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onFileUpload) {
      onFileUpload(file)
    }
  }

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

  // Convert JSON to selected format
  const convertedOutput = useMemo(() => {
    if (!jsonData) return ''

    try {
      switch (selectedFormat) {
        case 'yaml':
          return yaml.dump(jsonData, {
            indent: 2,
            lineWidth: 120,
            noRefs: true,
          })

        case 'xml': {
          const options = {
            compact: true,
            ignoreComment: true,
            spaces: 2,
          }
          return convert.js2xml(jsonData as any, options)
        }

        case 'csv':
          return jsonToCSV(jsonData)

        default:
          return ''
      }
    } catch (error) {
      console.error(`Failed to convert to ${selectedFormat}:`, error)
      return `Error: Failed to convert to ${selectedFormat.toUpperCase()}\n${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }, [jsonData, selectedFormat])

  const handleCopy = async () => {
    const success = await copyToClipboard(convertedOutput)
    if (success) {
      setCopyNotification(true, `Copied ${selectedFormat.toUpperCase()} to clipboard`)
      setTimeout(() => setCopyNotification(false), 2000)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([convertedOutput], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `converted.${selectedFormat}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setCopyNotification(true, `Downloaded as converted.${selectedFormat}`)
    setTimeout(() => setCopyNotification(false), 2000)
  }

  const formats: { value: ConvertFormat; label: string; description: string; icon: any }[] = [
    {
      value: 'yaml',
      label: 'YAML',
      description: 'Convert to YAML format',
      icon: FileText,
    },
    {
      value: 'xml',
      label: 'XML',
      description: 'Convert to XML format',
      icon: FileCode,
    },
    {
      value: 'csv',
      label: 'CSV',
      description: 'Convert to CSV format (flattened)',
      icon: Table,
    },
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Format Selection Bar */}
      <div className="border-b bg-muted/40 px-4 py-2.5">
        <div className="flex items-center gap-3">
          {/* Format Buttons */}
          <div className="inline-flex items-center rounded-lg border bg-background p-0.5 shadow-sm">
            {formats.map((format) => (
              <button
                key={format.value}
                onClick={() => setSelectedFormat(format.value)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-md px-3 py-1 text-sm font-medium transition-all',
                  selectedFormat === format.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title={format.description}
              >
                <format.icon className="h-4 w-4" />
                {format.label}
              </button>
            ))}
          </div>

          {/* Vertical Separator */}
          <div className="h-8 w-px bg-border" />

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={!jsonData}
              className="inline-flex h-8 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
              title="Copy to clipboard"
            >
              <Copy className="h-4 w-4 flex-shrink-0" />
              <span className="hidden lg:inline">Copy</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={!jsonData}
              className="inline-flex h-8 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
              title="Download file"
            >
              <Download className="h-4 w-4 flex-shrink-0" />
              <span className="hidden lg:inline">Download</span>
            </button>
          </div>

          <div className="flex-1" />

          {/* Clear Button */}
          <button
            onClick={clearJsonData}
            disabled={!jsonData}
            className="inline-flex h-8 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium text-destructive shadow-sm transition-colors hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-50"
            title="Clear JSON data"
          >
            <Trash2 className="h-4 w-4 flex-shrink-0" />
            <span className="hidden lg:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Output Display */}
      <div className="flex-1 overflow-auto p-4">
        {!jsonData ? (
          <div className="flex flex-col items-center justify-center text-center h-full py-8">
            <div className="mt-4 w-full max-w-sm flex flex-col gap-2">
              <button
                onClick={onPasteFromClipboard}
                className="group flex w-full items-center justify-between rounded-lg border bg-card px-5 py-3 text-left shadow-sm transition-all hover:bg-accent hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Clipboard className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium">Paste from Clipboard</span>
                </div>
                <kbd className="rounded bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                  {isMac ? '⌘' : 'Ctrl+'} V
                </kbd>
              </button>

              <label className="group cursor-pointer">
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex w-full items-center justify-between rounded-lg border bg-card px-5 py-3 shadow-sm transition-all hover:bg-accent hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileUp className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium">Open File</span>
                  </div>
                  <kbd className="rounded bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                    {isMac ? '⌘' : 'Ctrl+'} O
                  </kbd>
                </div>
              </label>

              <button
                onClick={onLoadExample}
                className="group flex w-full items-center justify-between rounded-lg border bg-card px-5 py-3 text-left shadow-sm transition-all hover:bg-accent hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileJson className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium">Load Example</span>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <pre className="font-mono text-sm bg-muted/30 rounded-lg p-4 overflow-x-auto">
            <code>{convertedOutput}</code>
          </pre>
        )}
      </div>
    </div>
  )
}
