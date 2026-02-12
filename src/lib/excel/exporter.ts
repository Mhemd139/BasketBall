import * as XLSX from 'xlsx'
import type { ImportableTable } from './types'
import { getTableSchema } from './constants'

/**
 * Create an Excel workbook from DB data.
 * Column headers use Arabic field labels from the schema.
 */
export function createExcelWorkbook(
  data: Record<string, unknown>[],
  table: ImportableTable
): XLSX.WorkBook {
  const schema = getTableSchema(table)
  if (!schema || data.length === 0) {
    // Return empty workbook with just headers
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([schema?.fields.map((f) => f.label) || ['No data']])
    XLSX.utils.book_append_sheet(wb, ws, schema?.label || 'Export')
    return wb
  }

  // Build header row from schema
  const headers = schema.fields.map((f) => f.label)
  const fieldKeys = schema.fields.map((f) => f.key)

  // Build data rows
  const rows = data.map((record) =>
    fieldKeys.map((key) => {
      const val = record[key]
      if (val == null) return ''
      if (typeof val === 'boolean') return val ? 'نعم' : 'لا'
      return val
    })
  )

  const wsData = [headers, ...rows]
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Auto-size columns
  const colWidths = headers.map((h, i) => {
    const maxLen = Math.max(
      h.length,
      ...rows.map((row) => String(row[i] || '').length)
    )
    return { wch: Math.min(maxLen + 2, 50) }
  })
  ws['!cols'] = colWidths

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, schema.label)
  return wb
}

/**
 * Trigger browser download of an Excel workbook.
 */
export function downloadWorkbook(workbook: XLSX.WorkBook, filename: string): void {
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
