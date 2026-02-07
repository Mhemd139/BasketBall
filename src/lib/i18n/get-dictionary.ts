import type { Locale } from './config'

const dictionaries = {
  ar: () => import('@/dictionaries/ar.json').then((module) => module.default),
  he: () => import('@/dictionaries/he.json').then((module) => module.default),
  en: () => import('@/dictionaries/en.json').then((module) => module.default),
}

export const getDictionary = async (locale: Locale) => {
  if (!dictionaries[locale]) {
    console.error(`Missing dictionary for locale: "${locale}"`)
    return dictionaries['en']()
  }
  return dictionaries[locale]()
}

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>
