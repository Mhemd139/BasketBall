import type { ColumnMapping, ImportableTable, RefData, PreviewRow } from './types'
import { getTableSchema } from './constants'
import { resolveFK } from './mapper'
import { formatPhoneNumber } from '@/lib/utils'

/**
 * Transform a single row from Excel data into a DB-ready record.
 * Also validates and returns status + messages.
 */
export function transformRow(
  row: Record<string, unknown>,
  index: number,
  mappings: ColumnMapping[],
  targetTable: ImportableTable,
  refData: RefData
): PreviewRow {
  const transformed: Record<string, unknown> = {}
  const messages: string[] = []
  let hasError = false
  let hasWarning = false

  const schema = getTableSchema(targetTable)
  if (!schema) {
    return { index, data: row, transformed: {}, status: 'error', messages: ['Unknown table'] }
  }

  // Track which name fields were explicitly mapped
  const mappedNameFields = new Set<string>()

  for (const mapping of mappings) {
    if (!mapping.dbField) continue // skipped column

    const rawValue = row[mapping.excelColumn]
    if (rawValue == null || String(rawValue).trim() === '') continue

    const strValue = String(rawValue).trim()

    switch (mapping.transform) {
      case 'phone': {
        transformed[mapping.dbField] = formatPhoneNumber(strValue)
        break
      }
      case 'number': {
        const num = parseFloat(strValue)
        if (isNaN(num)) {
          messages.push(`"${mapping.excelColumn}" قيمة غير رقمية: "${strValue}"`)
          hasWarning = true
        } else {
          transformed[mapping.dbField] = num
        }
        break
      }
      case 'boolean': {
        const lower = strValue.toLowerCase()
        const truthy = ['true', 'yes', '1', 'כן', 'نعم']
        transformed[mapping.dbField] = truthy.includes(lower)
        break
      }
      case 'fk_trainer':
      case 'fk_hall':
      case 'fk_class': {
        const match = resolveFK(strValue, refData, mapping.transform)
        if (match) {
          transformed[mapping.dbField] = match.id
          // Store display name for preview (not sent to DB)
          transformed[`_display_${mapping.dbField}`] = match.matchedName
          if (match.confidence < 70) {
            messages.push(`"${strValue}" ← تطابق جزئي مع "${match.matchedName}"`)
            hasWarning = true
          }
        } else {
          messages.push(`"${strValue}" — لم يتم العثور على تطابق`)
          hasWarning = true
          // Store original value for user reference
          transformed[`_unresolved_${mapping.dbField}`] = strValue
          // Also store as display so preview shows the original name
          transformed[`_display_${mapping.dbField}`] = strValue
        }
        break
      }
      default: {
        transformed[mapping.dbField] = strValue
        if (mapping.dbField.startsWith('name_')) {
          mappedNameFields.add(mapping.dbField)
        }
        break
      }
    }
  }

  // Multi-lang auto-fill: if only one name field is set, copy to others
  const nameFields = ['name_ar', 'name_he', 'name_en']
  const setNameFields = nameFields.filter((f) => transformed[f])
  if (setNameFields.length === 1) {
    const nameValue = transformed[setNameFields[0]]
    for (const f of nameFields) {
      if (!transformed[f]) {
        transformed[f] = nameValue
      }
    }
  }

  // Handle category merging for classes
  if (targetTable === 'classes') {
    const category = transformed['_category']
    const nameAr = transformed['name_ar']
    
    // If we have a category and a name, combine them: "Category - Name"
    // If only category exists (sometimes happens with bad mapping), use it as name
    if (category && typeof category === 'string' && category.trim()) {
      if (nameAr && typeof nameAr === 'string' && nameAr.trim()) {
        transformed['name_ar'] = `${category.trim()} - ${nameAr.trim()}`
      } else {
        transformed['name_ar'] = category.trim()
      }
    }
  }

  // Validate required fields
  for (const field of schema.fields) {
    if (field.required && !transformed[field.key]) {
      messages.push(`حقل مطلوب مفقود: ${field.label}`)
      hasError = true
    }
  }

  const status: PreviewRow['status'] = hasError ? 'error' : hasWarning ? 'warning' : 'valid'
  return { index, data: row, transformed, status, messages }
}

/**
 * Transform all rows and return preview data.
 */
export function transformAllRows(
  rows: Record<string, unknown>[],
  mappings: ColumnMapping[],
  targetTable: ImportableTable,
  refData: RefData
): PreviewRow[] {
  return rows.map((row, index) =>
    transformRow(row, index, mappings, targetTable, refData)
  )
}

/**
 * Get import-ready records from preview rows (only valid + warning rows).
 */
export function getImportableRecords(
  previewRows: PreviewRow[],
  includeWarnings: boolean = true
): Record<string, unknown>[] {
  return previewRows
    .filter((row) => row.status === 'valid' || (includeWarnings && row.status === 'warning'))
    .map((row) => {
      // Remove internal _unresolved_ fields
      const clean: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(row.transformed)) {
        if (!key.startsWith('_unresolved_') && !key.startsWith('_display_')) {
          clean[key] = value
        }
      }
      return clean
    })
}
