import type { ColumnMapping, ImportableTable, RefData } from './types'
import { MAPPING_HINTS } from './constants'

/**
 * Auto-map Excel column headers to DB fields for a given target table.
 * Returns an array of mappings with confidence scores.
 */
export function autoMapColumns(
  headers: string[],
  targetTable: ImportableTable
): ColumnMapping[] {
  const hints = MAPPING_HINTS[targetTable] || {}
  const usedFields = new Set<string>()

  return headers.map((header) => {
    const cleanHeader = header.trim().toLowerCase()
    let bestField: string | null = null
    let bestScore = 0
    let bestTransform: ColumnMapping['transform'] = undefined

    for (const [field, keywords] of Object.entries(hints)) {
      // Skip already-assigned fields (except multilang variants)
      if (usedFields.has(field) && !field.startsWith('name_')) continue

      const score = scoreMatch(cleanHeader, header, keywords)
      if (score > bestScore) {
        bestScore = score
        bestField = field
        bestTransform = inferTransform(field, targetTable)
      }
    }

    // Only accept if confidence is above threshold
    if (bestScore >= 30 && bestField) {
      usedFields.add(bestField)
      return {
        excelColumn: header,
        dbField: bestField,
        confidence: Math.min(bestScore, 100),
        transform: bestTransform,
      }
    }

    return {
      excelColumn: header,
      dbField: null,
      confidence: 0,
    }
  })
}

/**
 * Score how well an Excel header matches a set of DB field keywords.
 */
function scoreMatch(cleanHeader: string, originalHeader: string, keywords: string[]): number {
  let maxScore = 0

  for (const keyword of keywords) {
    const cleanKeyword = keyword.trim().toLowerCase()

    // Exact match
    if (cleanHeader === cleanKeyword) {
      maxScore = Math.max(maxScore, 100)
      continue
    }

    // Contains keyword
    if (cleanHeader.includes(cleanKeyword) || cleanKeyword.includes(cleanHeader)) {
      maxScore = Math.max(maxScore, 60)
      continue
    }

    // Simple fuzzy: check if most characters overlap
    if (cleanHeader.length > 2 && cleanKeyword.length > 2) {
      const distance = levenshtein(cleanHeader, cleanKeyword)
      if (distance <= 2) {
        maxScore = Math.max(maxScore, 40)
      }
    }
  }

  return maxScore
}

/**
 * Infer what transform to apply based on the DB field name.
 */
function inferTransform(
  field: string,
  _table: ImportableTable
): ColumnMapping['transform'] {
  if (field === 'trainer_id') return 'fk_trainer'
  if (field === 'hall_id') return 'fk_hall'
  if (field === 'class_id') return 'fk_class'
  if (field === 'phone') return 'phone'
  if (field === 'jersey_number' || field === 'amount_paid') return 'number'
  if (field === 'is_paid') return 'boolean'
  return undefined
}

/**
 * Resolve a text value to a foreign key ID using reference data.
 * Returns { id, confidence } or null if no match.
 */
export function resolveFK(
  value: string,
  refData: RefData,
  fkType: 'fk_trainer' | 'fk_hall' | 'fk_class'
): { id: string; matchedName: string; confidence: number } | null {
  if (!value || typeof value !== 'string') return null

  const cleanValue = value.trim().toLowerCase()
  const items =
    fkType === 'fk_trainer'
      ? refData.trainers
      : fkType === 'fk_hall'
        ? refData.halls
        : refData.classes

  let bestMatch: { id: string; matchedName: string; confidence: number } | null = null

  for (const item of items) {
    const names = [item.name_ar, item.name_he, item.name_en].filter(Boolean)

    for (const name of names) {
      const cleanName = name.toLowerCase().trim()

      // Exact match
      if (cleanName === cleanValue) {
        return { id: item.id, matchedName: name, confidence: 100 }
      }

      // Contains
      if (cleanName.includes(cleanValue) || cleanValue.includes(cleanName)) {
        const conf = 70
        if (!bestMatch || conf > bestMatch.confidence) {
          bestMatch = { id: item.id, matchedName: name, confidence: conf }
        }
      }

      // Fuzzy
      if (cleanValue.length > 2 && cleanName.length > 2) {
        const dist = levenshtein(cleanName, cleanValue)
        if (dist <= 3) {
          const conf = Math.max(30, 60 - dist * 10)
          if (!bestMatch || conf > bestMatch.confidence) {
            bestMatch = { id: item.id, matchedName: name, confidence: conf }
          }
        }
      }
    }
  }

  return bestMatch
}

/**
 * Simple Levenshtein distance implementation.
 */
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }

  return matrix[b.length][a.length]
}
