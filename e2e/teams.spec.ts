import { test, expect } from '@playwright/test'
import { login } from './fixtures/auth'

test.describe('Teams', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('teams page loads', async ({ page }) => {
    await page.goto('/ar/teams')
    await page.waitForLoadState('domcontentloaded')

    const main = page.locator('main')
    await expect(main).toBeVisible()
  })

  test('clicking a team navigates to detail', async ({ page }) => {
    await page.goto('/ar/teams')
    const teamLink = page.locator('main a[href*="/teams/"]').first()
    await teamLink.waitFor({ state: 'visible', timeout: 10_000 })
    await teamLink.click()
    await page.waitForURL(/\/teams\/[a-f0-9-]+/, { timeout: 10_000 })
    expect(page.url()).toMatch(/\/teams\/[a-f0-9-]+/)
  })

  test('team detail page has content', async ({ page }) => {
    await page.goto('/ar/teams')
    const teamLink = page.locator('main a[href*="/teams/"]').first()
    await teamLink.waitFor({ state: 'visible', timeout: 10_000 })
    await teamLink.click()
    await page.waitForURL(/\/teams\/[a-f0-9-]+/, { timeout: 10_000 })

    const main = page.locator('main')
    await expect(main).toBeVisible()
  })
})
