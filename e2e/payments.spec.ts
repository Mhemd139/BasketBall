import { test, expect } from '@playwright/test'
import { login } from './fixtures/auth'

test.describe('Payments', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('payments page loads', async ({ page }) => {
    await page.goto('/ar/payments')
    await page.waitForLoadState('domcontentloaded')

    const main = page.locator('main')
    await expect(main).toBeVisible()
  })

  test('clicking a class navigates to class payments', async ({ page }) => {
    await page.goto('/ar/payments')
    const classLink = page.locator('main a[href*="/payments/"]').first()
    await classLink.waitFor({ state: 'visible', timeout: 10_000 })
    await classLink.click()
    await page.waitForURL(/\/payments\/[a-f0-9-]+/, { timeout: 10_000 })
    expect(page.url()).toMatch(/\/payments\/[a-f0-9-]+/)
  })
})
