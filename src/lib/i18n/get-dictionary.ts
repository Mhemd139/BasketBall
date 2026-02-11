import type { Locale } from './config'

const dictionaries = {
  ar: () => import('@/dictionaries/ar.json').then((module) => module.default),
  he: () => import('@/dictionaries/he.json').then((module) => module.default),
}

export const getDictionary = async (locale: Locale) => {
  if (!dictionaries[locale]) {
    return dictionaries['ar']()
  }
  return dictionaries[locale]()
}

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>
