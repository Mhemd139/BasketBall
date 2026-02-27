import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Returns today's date string (YYYY-MM-DD) in Israel timezone.
// Prevents UTC vs local mismatch on Vercel (UTC) vs dev (local TZ).
export function getTodayISO(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' })
}

// Returns a Date whose getters (getFullYear, getMonth, getDate, getDay, getHours etc.)
// return Israel-timezone values. Uses formatToParts for cross-engine reliability.
// NOTE: Do NOT use .getTime() or .toISOString() — the internal timestamp is shifted.
export function getNowInIsrael(): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    hour12: false,
  }).formatToParts(new Date())
  const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0')
  return new Date(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
}

// Date formatting helper
export function formatDate(date: string | Date, locale: string = 'ar'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

// Time formatting helper
export function formatTime(time: string | null | undefined): string {
  if (!time) return ''
  // Simple 24-hour format: "15:30:00" → "15:30"
  return time.slice(0, 5)
}

// Get localized field helper
export function getLocalizedField<T extends Record<string, any>>(
  obj: T,
  fieldName: string,
  locale: string
): string {
  const localizedFieldName = `${fieldName}_${locale}`
  return obj[localizedFieldName] || obj[`${fieldName}_ar`] || ''
}

// Normalize phone: convert Arabic/Persian digits to English, apply Israel format (05X → 9725X)
export function normalizePhone(str: string): string {
  let cleaned = str
    .replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => String(d.charCodeAt(0) - 1632))
    .replace(/[۰۱۲۳۴۵۶۷۸۹]/g, d => String(d.charCodeAt(0) - 1776))
    .replace(/[^\d+]/g, '')

  if (cleaned.startsWith('05')) {
    cleaned = '972' + cleaned.substring(1)
  } else if (cleaned.startsWith('5') && cleaned.length === 9) {
    cleaned = '972' + cleaned
  }

  return cleaned
}

// Phone number formatting helper
export function formatPhoneNumber(value: string): string {
  // Remove all non-digit and non-plus characters first to handle the +972 case
  let cleaned = value.replace(/[^\d+]/g, '')
  
  // specific handling for +972 or 972
  if (cleaned.startsWith('+972')) {
    cleaned = '0' + cleaned.substring(4)
  } else if (cleaned.startsWith('972')) {
    cleaned = '0' + cleaned.substring(3)
  }
  
  // Finally ensure only digits remain
  return cleaned.replace(/\D/g, '')
}
