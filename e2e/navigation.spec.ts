import { test, expect } from '@playwright/test'
import { login } from './fixtures/auth'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('sidebar nav is visible on desktop', async ({ page }) => {
    // Desktop shows sidebar nav, bottom nav is md:hidden
    const sidebarNav = page.locator('nav').first()
    await expect(sidebarNav).toBeVisible()
  })

  test('nav links navigate correctly', async ({ page }) => {
    await page.getByRole('link', { name: 'القاعات' }).first().click()
    await page.waitForURL('**/halls')
    expect(page.url()).toContain('/halls')

    await page.getByRole('link', { name: 'الفرق' }).first().click()
    await page.waitForURL('**/teams')
    expect(page.url()).toContain('/teams')
  })

  test('home page shows dashboard content', async ({ page }) => {
    const main = page.locator('main')
    await expect(main).toBeVisible()

    await expect(page.locator('main a[href="/ar/halls"]').first()).toBeVisible()
    await expect(page.locator('main a[href="/ar/teams"]').first()).toBeVisible()
  })
})
