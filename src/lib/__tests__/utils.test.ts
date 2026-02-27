import { describe, it, expect } from 'vitest'
import { cn, getTodayISO, getNowInIsrael, formatDate, formatTime, getLocalizedField, formatPhoneNumber, normalizePhone } from '../utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('deduplicates conflicting Tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'extra')).toBe('base extra')
  })

  it('handles empty inputs', () => {
    expect(cn()).toBe('')
  })
})

describe('getTodayISO', () => {
  it('returns YYYY-MM-DD format', () => {
    const result = getTodayISO()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('returns a valid date string', () => {
    const result = getTodayISO()
    const parsed = new Date(result)
    expect(parsed.toString()).not.toBe('Invalid Date')
  })
})

describe('getNowInIsrael', () => {
  it('returns a Date object', () => {
    const result = getNowInIsrael()
    expect(result).toBeInstanceOf(Date)
  })

  it('returns a valid date (not NaN)', () => {
    const result = getNowInIsrael()
    expect(isNaN(result.getTime())).toBe(false)
  })

  it('year is reasonable', () => {
    const result = getNowInIsrael()
    expect(result.getFullYear()).toBeGreaterThanOrEqual(2024)
    expect(result.getFullYear()).toBeLessThanOrEqual(2030)
  })
})

describe('formatDate', () => {
  it('formats a date string with Arabic locale', () => {
    const result = formatDate('2025-01-15', 'ar')
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })

  it('formats a date string with Hebrew locale', () => {
    const result = formatDate('2025-01-15', 'he')
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })

  it('formats a Date object', () => {
    const result = formatDate(new Date(2025, 0, 15), 'ar')
    expect(result).toBeTruthy()
  })

  it('defaults to Arabic locale', () => {
    const result = formatDate('2025-06-01')
    expect(result).toBeTruthy()
  })
})

describe('formatTime', () => {
  it('truncates seconds from time string', () => {
    expect(formatTime('15:30:00')).toBe('15:30')
  })

  it('handles time without seconds', () => {
    expect(formatTime('09:05')).toBe('09:05')
  })

  it('returns empty string for null', () => {
    expect(formatTime(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(formatTime(undefined)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(formatTime('')).toBe('')
  })
})

describe('getLocalizedField', () => {
  const obj = {
    name_ar: 'اسم',
    name_he: 'שם',
    name_en: 'Name',
  }

  it('returns Hebrew field for he locale', () => {
    expect(getLocalizedField(obj, 'name', 'he')).toBe('שם')
  })

  it('returns Arabic field for ar locale', () => {
    expect(getLocalizedField(obj, 'name', 'ar')).toBe('اسم')
  })

  it('returns English field for en locale', () => {
    expect(getLocalizedField(obj, 'name', 'en')).toBe('Name')
  })

  it('falls back to Arabic when locale field is missing', () => {
    const partial = { name_ar: 'اسم' }
    expect(getLocalizedField(partial, 'name', 'he')).toBe('اسم')
  })

  it('returns empty string when no field exists', () => {
    const empty = {}
    expect(getLocalizedField(empty, 'name', 'he')).toBe('')
  })
})

describe('formatPhoneNumber', () => {
  it('converts +972 to local format', () => {
    expect(formatPhoneNumber('+972501234567')).toBe('0501234567')
  })

  it('converts 972 (no plus) to local format', () => {
    expect(formatPhoneNumber('972501234567')).toBe('0501234567')
  })

  it('passes through already-clean number', () => {
    expect(formatPhoneNumber('0501234567')).toBe('0501234567')
  })

  it('strips dashes', () => {
    expect(formatPhoneNumber('+972-50-123-4567')).toBe('0501234567')
  })

  it('strips spaces', () => {
    expect(formatPhoneNumber('050 123 4567')).toBe('0501234567')
  })

  it('returns empty for empty input', () => {
    expect(formatPhoneNumber('')).toBe('')
  })

  it('handles parentheses and dots', () => {
    expect(formatPhoneNumber('(050) 123.4567')).toBe('0501234567')
  })
})

describe('normalizePhone', () => {
  it('converts Arabic digits to English', () => {
    expect(normalizePhone('٠٥٤٣٢٩٩١٠٦')).toBe('972543299106')
  })

  it('converts Persian digits to English', () => {
    expect(normalizePhone('۰۵۴۳۲۹۹۱۰۶')).toBe('972543299106')
  })

  it('converts 05X to 9725X (Israel format)', () => {
    expect(normalizePhone('0501234567')).toBe('972501234567')
  })

  it('handles 9-digit starting with 5 (forgot leading 0)', () => {
    expect(normalizePhone('501234567')).toBe('972501234567')
  })

  it('strips non-digit characters except +', () => {
    // normalizePhone preserves + (regex is [^\d+])
    expect(normalizePhone('+972-50-123-4567')).toBe('+972501234567')
  })

  it('passes through already-international format', () => {
    expect(normalizePhone('972501234567')).toBe('972501234567')
  })

  it('returns empty for empty input', () => {
    expect(normalizePhone('')).toBe('')
  })

  it('handles mixed Arabic digits with dashes', () => {
    expect(normalizePhone('٠٥٤-٣٢٩-٩١٠٦')).toBe('972543299106')
  })
})
