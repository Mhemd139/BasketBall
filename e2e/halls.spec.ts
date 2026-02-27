import { test, expect } from '@playwright/test'
import { login } from './fixtures/auth'

test.describe('Halls', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('halls page loads', async ({ page }) => {
    await page.goto('/ar/halls')
    await page.waitForLoadState('domcontentloaded')

    const main = page.locator('main')
    await expect(main).toBeVisible()
  })

  test('clicking a hall navigates to detail', async ({ page }) => {
    await page.goto('/ar/halls')
    const hallLink = page.locator('main a[href*="/halls/"]').first()
    await hallLink.waitFor({ state: 'visible', timeout: 10_000 })
    await hallLink.click()
    await page.waitForURL(/\/halls\/[a-f0-9-]+/, { timeout: 10_000 })
    expect(page.url()).toMatch(/\/halls\/[a-f0-9-]+/)
  })
})
