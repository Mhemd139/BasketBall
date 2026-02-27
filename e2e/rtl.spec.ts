import { test, expect } from '@playwright/test'
import { login } from './fixtures/auth'

test.describe('RTL Layout', () => {
  test('Arabic locale has RTL direction', async ({ page }) => {
    await login(page, '0543299106', 'ar')

    const dir = await page.evaluate(() => {
      return document.documentElement.getAttribute('dir') ||
        document.body.getAttribute('dir') ||
        getComputedStyle(document.body).direction
    })
    expect(dir).toBe('rtl')
  })

  test('Hebrew locale has RTL direction', async ({ page }) => {
    await login(page, '0543299106', 'he')

    const dir = await page.evaluate(() => {
      return document.documentElement.getAttribute('dir') ||
        document.body.getAttribute('dir') ||
        getComputedStyle(document.body).direction
    })
    expect(dir).toBe('rtl')
  })
})
