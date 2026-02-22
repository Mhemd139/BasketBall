import type { ParsedSheet, ImportableTable, RefData, ColumnMapping, PreviewRow } from './types'
import type { UnresolvedTrainer } from '@/components/import/ResolveTrainersStep'
import { TABLE_SCHEMAS } from './constants'
import { autoMapColumns } from './mapper'
import { transformAllRows, getImportableRecords } from './transformer'

// ─── Types ───────────────────────────────────────────────────────────────

export interface ExtractedEntity {
  name: string
  phone: string // phone from the Excel row, or empty
  count: number // how many rows reference this entity
}

export interface TableAnalysis {
  table: ImportableTable
  label: string
  mappings: ColumnMapping[]
  mappedCount: number
  previewRows: PreviewRow[]
  validCount: number
  warningCount: number
  errorCount: number
  importableCount: number
}

export interface SmartAnalysisResult {
  /** The primary table detected (best column match) */
  primaryTable: ImportableTable
  /** Full analysis for the primary table */
  primaryAnalysis: TableAnalysis
  /** Unique trainer names extracted from FK columns */
  extractedTrainers: ExtractedEntity[]
  /** Unique hall names extracted from FK columns */
  extractedHalls: ExtractedEntity[]
  /** Unique class/team names extracted from FK columns (for trainee imports) */
  extractedClasses: ExtractedEntity[]
  /** Which trainers are NEW (not in refData) */
  newTrainers: ExtractedEntity[]
  /** Which halls are NEW (not in refData) */
  newHalls: ExtractedEntity[]
  /** Total records that will be created across all tables */
  totalNewRecords: number
}

// ─── Core analysis ───────────────────────────────────────────────────────

/**
 * Analyze an Excel sheet and auto-detect what should be imported.
 * Returns a complete analysis with extracted entities ready for one-click import.
 */
export function analyzeSheet(sheet: ParsedSheet, refData: RefData): SmartAnalysisResult {
  // 1. Score each table schema against the sheet columns
  const tableScores = TABLE_SCHEMAS.map((schema) => {
    const mappings = autoMapColumns(sheet.headers, schema.key)
    const mappedCount = mappings.filter((m) => m.dbField).length
    const requiredFields = schema.fields.filter((f) => f.required)
    const requiredMapped = requiredFields.filter((rf) =>
      mappings.some((m) => m.dbField === rf.key)
    ).length

    // Score: mapped columns + bonus for required fields matched
    const score = mappedCount + requiredMapped * 2

    return { table: schema.key, label: schema.label, mappings, mappedCount, score }
  })

  // 2. Pick the best-matching table
  tableScores.sort((a, b) => b.score - a.score)
  const best = tableScores[0]

  // 3. Transform rows for the primary table
  const previewRows = transformAllRows(sheet.rows, best.mappings, best.table, refData)

  const validCount = previewRows.filter((r) => r.status === 'valid').length
  const warningCount = previewRows.filter((r) => r.status === 'warning').length
  const errorCount = previewRows.filter((r) => r.status === 'error').length
  const importableCount = validCount + warningCount

  const primaryAnalysis: TableAnalysis = {
    table: best.table,
    label: best.label,
    mappings: best.mappings,
    mappedCount: best.mappedCount,
    previewRows,
    validCount,
    warningCount,
    errorCount,
    importableCount,
  }

  // 4. Extract unique FK entities from the transformed data
  const extractedTrainers = extractUniqueEntities(previewRows, 'trainer_id')
  const extractedHalls = extractUniqueEntities(previewRows, 'hall_id')
  const extractedClasses = extractUniqueEntities(previewRows, 'class_id')

  // 5. Determine which entities are NEW (not already in refData)
  const newTrainers = extractedTrainers.filter((e) =>
    !refData.trainers.some((t) =>
      matchesAnyName(e.name, [t.name_ar, t.name_he, t.name_en])
    )
  )

  const newHalls = extractedHalls.filter((e) =>
    !refData.halls.some((h) =>
      matchesAnyName(e.name, [h.name_ar, h.name_he, h.name_en])
    )
  )

  // 6. Calculate total new records
  const totalNewRecords = importableCount + newTrainers.length + newHalls.length

  return {
    primaryTable: best.table,
    primaryAnalysis,
    extractedTrainers,
    extractedHalls,
    extractedClasses,
    newTrainers,
    newHalls,
    totalNewRecords,
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────

/**
 * Extract unique entity names from a specific FK field across all preview rows.
 * Looks at both _display_ and _unresolved_ prefixed fields.
 */
function extractUniqueEntities(rows: PreviewRow[], fieldKey: string): ExtractedEntity[] {
  const nameData = new Map<string, { count: number; phone: string }>()

  for (const row of rows) {
    // Check display value first (resolved or unresolved)
    const displayName = row.transformed[`_display_${fieldKey}`]
    const unresolvedName = row.transformed[`_unresolved_${fieldKey}`]
    const name = unresolvedName || displayName

    if (name && typeof name === 'string' && name.trim()) {
      const clean = name.trim()
      const existing = nameData.get(clean)
      // Try to grab associated phone from the same row
      const rowPhone = row.transformed.phone || row.data['טלפון'] || row.data['phone'] || row.data['هاتف']
      const phone = rowPhone ? String(rowPhone).trim() : ''

      if (existing) {
        existing.count++
        // Keep the first non-empty phone found
        if (!existing.phone && phone) existing.phone = phone
      } else {
        nameData.set(clean, { count: 1, phone })
      }
    }
  }

  return Array.from(nameData.entries())
    .map(([name, data]) => ({ name, phone: data.phone, count: data.count }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Check if a name matches any of the given names (case-insensitive, trimmed).
 */
function matchesAnyName(name: string, candidates: (string | null | undefined)[]): boolean {
  const clean = name.trim().toLowerCase()
  return candidates.some((c) => c && c.trim().toLowerCase() === clean)
}
