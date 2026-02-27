import { Page } from '@playwright/test'

/**
 * Login via mock OTP flow.
 * Requires E2E_MOCK_OTP=true on the Next.js server.
 */
export async function login(page: Page, phone = '0543299106', locale = 'ar') {
  await page.goto(`/${locale}/login`)
  await page.waitForLoadState('domcontentloaded')

  // Step 1: Enter phone number
  const phoneInput = page.locator('input[type="tel"]')
  await phoneInput.waitFor({ state: 'visible', timeout: 10_000 })
  await phoneInput.fill(phone)

  // Submit phone
  const submitBtn = page.locator('button[type="submit"]')
  await submitBtn.click()

  // Step 2: Wait for OTP input — name="one-time-code" appears on step transition
  const otpInput = page.locator('input[name="one-time-code"]')
  await otpInput.waitFor({ state: 'visible', timeout: 15_000 })
  await otpInput.fill('1111')

  // The app auto-submits when 4 digits entered, wait for redirect to home
  await page.waitForURL(`**/${locale}`, { timeout: 15_000 })
}
