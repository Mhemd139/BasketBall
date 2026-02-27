import type { ParsedWorkbook, ParsedSheet } from './types'

/**
 * Parse an Excel/CSV file client-side using SheetJS.
 * Returns all sheets with headers and rows as keyed objects.
 * XLSX is dynamically imported to avoid bundling ~200KB on initial load.
 */
export function parseExcelFile(file: File): Promise<ParsedWorkbook> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const XLSX = await import('xlsx')
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, {
          type: 'array',
          cellDates: true,
          cellText: false,
        })

        const sheets: ParsedSheet[] = workbook.SheetNames.map((name) => {
          const ws = workbook.Sheets[name]

          // Get raw 2D array including merged cells
          const rawRows: unknown[][] = XLSX.utils.sheet_to_json(ws, {
            header: 1,
            defval: null,
            blankrows: false,
          })

          // Resolve merged cells by copying values to all cells in merge range
          if (ws['!merges']) {
            for (const merge of ws['!merges']) {
              const topLeftValue = rawRows[merge.s.r]?.[merge.s.c]
              if (topLeftValue != null) {
                for (let r = merge.s.r; r <= merge.e.r; r++) {
                  for (let c = merge.s.c; c <= merge.e.c; c++) {
                    if (!rawRows[r]) rawRows[r] = []
                    rawRows[r][c] = topLeftValue
                  }
                }
              }
            }
          }

          // Detect header row (first row with most non-null cells)
          const headerRowIndex = detectHeaderRow(rawRows)
          const headers = (rawRows[headerRowIndex] || []).map((h, i) =>
            h != null ? String(h).trim() : `Column ${i + 1}`
          )

          // Forward-fill columns that have sparse values (category pattern)
          const dataRows = rawRows.slice(headerRowIndex + 1)
          forwardFillColumns(dataRows, headers.length)

          // Convert to keyed objects
          const rows = dataRows
            .filter((row) => row.some((cell) => cell != null && String(cell).trim() !== ''))
            .map((row) => {
              const obj: Record<string, unknown> = {}
              headers.forEach((header, i) => {
                obj[header] = row[i] ?? null
              })
              return obj
            })

          return {
            name,
            headers,
            rows,
            rawRows: dataRows,
            rowCount: rows.length,
          }
        })

        resolve({ fileName: file.name, sheets })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Detect which row is the header row.
 * Picks the first row with the most non-null cells.
 */
function detectHeaderRow(rows: unknown[][]): number {
  let bestIndex = 0
  let bestCount = 0

  const checkRows = Math.min(rows.length, 5)
  for (let i = 0; i < checkRows; i++) {
    const nonNullCount = (rows[i] || []).filter(
      (cell) => cell != null && String(cell).trim() !== ''
    ).length
    if (nonNullCount > bestCount) {
      bestCount = nonNullCount
      bestIndex = i
    }
  }

  return bestIndex
}

/**
 * Forward-fill sparse columns (for category-style data where
 * a value in column A spans multiple rows below it).
 */
function forwardFillColumns(rows: unknown[][], colCount: number): void {
  // Detect which columns are sparse (>50% empty) — candidates for forward-fill
  for (let c = 0; c < colCount; c++) {
    const nonNullCount = rows.filter((row) => row[c] != null && String(row[c]).trim() !== '').length
    const emptyCount = rows.length - nonNullCount

    // Only forward-fill if column has some values but is majority empty
    if (nonNullCount > 0 && emptyCount > nonNullCount) {
      let lastValue: unknown = null
      for (let r = 0; r < rows.length; r++) {
        if (!rows[r]) rows[r] = []
        if (rows[r][c] != null && String(rows[r][c]).trim() !== '') {
          lastValue = rows[r][c]
        } else if (lastValue != null) {
          rows[r][c] = lastValue
        }
      }
    }
  }
}
