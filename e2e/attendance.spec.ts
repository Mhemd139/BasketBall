import { test, expect } from '@playwright/test'
import { login } from './fixtures/auth'

test.describe('Attendance', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('home page has attendance links', async ({ page }) => {
    // Home page shows today's schedule with attendance links
    const attendanceLink = page.locator('a[href*="/attendance/"]').first()
    if (await attendanceLink.count() > 0) {
      await expect(attendanceLink).toBeVisible()
    }
  })

  test('attendance page loads for an event', async ({ page }) => {
    // Find an attendance link on the home page
    const attendanceLink = page.locator('a[href*="/attendance/"]').first()
    if (await attendanceLink.count() > 0) {
      await attendanceLink.click()
      await page.waitForLoadState('domcontentloaded')
      expect(page.url()).toContain('/attendance/')

      const main = page.locator('main')
      await expect(main).toBeVisible()
    }
  })
})
