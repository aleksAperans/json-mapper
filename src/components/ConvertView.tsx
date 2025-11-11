import { useState, useMemo } from 'react'
import { useAppStore } from '@/store/appStore'
import { Copy, Download, FileCode, FileText, Table } from 'lucide-react'
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

export function ConvertView() {
  const { jsonData, setCopyNotification } = useAppStore()
  const [selectedFormat, setSelectedFormat] = useState<ConvertFormat>('yaml')

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
          return convert.js2xml(jsonData, options)
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
      {/* Format Selection Bar */}
      <div className="border-b bg-muted/40 px-4 py-2.5">
        <div className="flex items-center justify-between">
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

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex h-8 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              title="Copy to clipboard"
            >
              <Copy className="h-4 w-4 flex-shrink-0" />
              <span className="hidden lg:inline">Copy</span>
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex h-8 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              title="Download file"
            >
              <Download className="h-4 w-4 flex-shrink-0" />
              <span className="hidden lg:inline">Download</span>
            </button>
          </div>
        </div>
      </div>

      {/* Output Display */}
      <div className="flex-1 overflow-auto p-4">
        <pre className="font-mono text-sm bg-muted/30 rounded-lg p-4 overflow-x-auto">
          <code>{convertedOutput}</code>
        </pre>
      </div>
    </div>
  )
}
