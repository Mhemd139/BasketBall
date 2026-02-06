export const locales = ['ar', 'he', 'en'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'ar'

export const directions: Record<Locale, 'rtl' | 'ltr'> = {
  ar: 'rtl',
  he: 'rtl',
  en: 'ltr',
}

export const localeNames: Record<Locale, string> = {
  ar: 'العربية',
  he: 'עברית',
  en: 'English',
}

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}
