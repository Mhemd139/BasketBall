import { test, expect } from '@playwright/test'
import { login } from './fixtures/auth'

test.describe('Authentication', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/ar/teams')
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })

  test('login page renders phone input', async ({ page }) => {
    await page.goto('/ar/login')
    await page.waitForLoadState('domcontentloaded')
    const phoneInput = page.locator('input[type="tel"]')
    await expect(phoneInput).toBeVisible()
  })

  test('full login flow with mock OTP', async ({ page }) => {
    await login(page)
    await expect(page).toHaveURL(/\/ar\/?$/)
  })

  test('authenticated user redirected away from login', async ({ page }) => {
    await login(page)
    await page.goto('/ar/login')
    // Middleware redirects authenticated users to dashboard
    await page.waitForURL(/\/ar\/?$/, { timeout: 10_000 })
    expect(page.url()).not.toContain('/login')
  })
})
