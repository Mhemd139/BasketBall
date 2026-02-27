import { test, expect } from '@playwright/test'
import { login } from './fixtures/auth'

test.describe('Mobile UX', () => {
  test('sidebar nav has navigation links', async ({ page }) => {
    await login(page)
    // Wait for sidebar to render (it's a client component)
    const sidebarNav = page.locator('aside nav')
    await sidebarNav.waitFor({ state: 'visible', timeout: 10_000 })
    const navLinks = sidebarNav.locator('a')
    const count = await navLinks.count()
    expect(count).toBeGreaterThanOrEqual(4)
  })

  test('header stays sticky on scroll', async ({ page }) => {
    await login(page)
    await page.evaluate(() => window.scrollBy(0, 500))
    await page.waitForTimeout(300)

    const header = page.locator('header').first()
    if (await header.count() > 0) {
      const box = await header.boundingBox()
      if (box) {
        expect(box.y).toBeLessThanOrEqual(10)
      }
    }
  })

  test('login page is usable on mobile viewport', async ({ page }) => {
    await page.goto('/ar/login')
    await page.waitForLoadState('domcontentloaded')

    const phoneInput = page.locator('input[type="tel"]')
    await expect(phoneInput).toBeVisible()

    const box = await phoneInput.boundingBox()
    expect(box).not.toBeNull()
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(40)
    }
  })
})
