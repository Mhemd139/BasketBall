import { describe, it, expect } from 'vitest'
import { locales, defaultLocale, directions, localeNames, isValidLocale } from '../i18n/config'

describe('locales', () => {
  it('contains ar and he', () => {
    expect(locales).toContain('ar')
    expect(locales).toContain('he')
  })

  it('has exactly 2 locales', () => {
    expect(locales).toHaveLength(2)
  })
})

describe('defaultLocale', () => {
  it('is Arabic', () => {
    expect(defaultLocale).toBe('ar')
  })
})

describe('directions', () => {
  it('Arabic is RTL', () => {
    expect(directions.ar).toBe('rtl')
  })

  it('Hebrew is RTL', () => {
    expect(directions.he).toBe('rtl')
  })
})

describe('localeNames', () => {
  it('Arabic name is العربية', () => {
    expect(localeNames.ar).toBe('العربية')
  })

  it('Hebrew name is עברית', () => {
    expect(localeNames.he).toBe('עברית')
  })
})

describe('isValidLocale', () => {
  it('returns true for ar', () => {
    expect(isValidLocale('ar')).toBe(true)
  })

  it('returns true for he', () => {
    expect(isValidLocale('he')).toBe(true)
  })

  it('returns false for en', () => {
    expect(isValidLocale('en')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isValidLocale('')).toBe(false)
  })

  it('returns false for random string', () => {
    expect(isValidLocale('fr')).toBe(false)
  })

  it('returns false for uppercase', () => {
    expect(isValidLocale('AR')).toBe(false)
  })
})
