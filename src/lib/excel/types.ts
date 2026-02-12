export type ImportableTable = 'classes' | 'trainers' | 'trainees' | 'halls'

export interface ParsedSheet {
  name: string
  headers: string[]
  rows: Record<string, unknown>[]
  rawRows: unknown[][]
  rowCount: number
}

export interface ParsedWorkbook {
  fileName: string
  sheets: ParsedSheet[]
}

export interface ColumnMapping {
  excelColumn: string
  dbField: string | null  // null = skip
  confidence: number      // 0-100
  transform?: 'multilang' | 'phone' | 'number' | 'boolean' | 'fk_trainer' | 'fk_hall' | 'fk_class'
}

export interface ImportConfig {
  targetTable: ImportableTable
  mappings: ColumnMapping[]
  sheetIndex: number
}

export interface ImportRowResult {
  row: number
  status: 'success' | 'skipped' | 'error'
  error?: string
}

export interface ImportResult {
  inserted: number
  skipped: number
  errors: ImportRowResult[]
  total: number
}

export interface FieldSchema {
  key: string
  label: string        // Arabic label for display
  type: 'text' | 'number' | 'boolean' | 'fk'
  required: boolean
  fkTable?: ImportableTable
  fkDisplayField?: string
}

export interface TableSchema {
  key: ImportableTable
  label: string
  icon: string
  fields: FieldSchema[]
}

export interface RefData {
  trainers: { id: string; name_ar: string; name_he: string; name_en: string; phone: string | null }[]
  halls: { id: string; name_ar: string; name_he: string; name_en: string }[]
  classes: { id: string; name_ar: string; name_he: string; name_en: string }[]
}

export interface PreviewRow {
  index: number
  data: Record<string, unknown>
  transformed: Record<string, unknown>
  status: 'valid' | 'warning' | 'error'
  messages: string[]
}
