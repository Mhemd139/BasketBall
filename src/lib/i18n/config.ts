export const locales = ['ar', 'he'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'ar'

export const directions: Record<Locale, 'rtl' | 'ltr'> = {
  ar: 'rtl',
  he: 'rtl',
}

export const localeNames: Record<Locale, string> = {
  ar: 'العربية',
  he: 'עברית',
}

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}
