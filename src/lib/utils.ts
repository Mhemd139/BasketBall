import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
export function formatTime(time: string): string {
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
