import { request } from '@playwright/test'

/**
 * Warm up the dev server by hitting the login page.
 * This triggers Next.js compilation so the first real test doesn't timeout.
 */
async function globalSetup() {
  const ctx = await request.newContext({ baseURL: 'http://localhost:3000' })
  try {
    await ctx.get('/ar/login', { timeout: 30_000 })
  } catch {
    // Server might not be ready yet, that's OK — webServer config handles startup
  }
  await ctx.dispose()
}

export default globalSetup
