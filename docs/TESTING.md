# Testing Strategy — Basketball Manager

## Overview

The test suite covers both unit-level logic and full end-to-end user flows.

| Category | Runner | Test Files | Test Count | Typical Runtime |
|----------|--------|------------|------------|-----------------|
| Unit | Vitest | 5 | 82 | ~2.8s |
| E2E | Playwright | 9 | 24 | ~55s |
| **Total** | | **14** | **106** | |

All 106 tests pass with zero failures. The suite is intentionally lean: it covers critical paths without testing implementation details or framework internals.

---

## Running Tests

```bash
# Unit tests — watch mode (development)
npm test

# Unit tests — single run (CI / pre-push)
npm run test:run

# Unit tests — with v8 coverage report
npm run test:coverage

# E2E tests — full suite (requires dev server)
npm run test:e2e

# E2E tests — mobile viewport project (future)
npm run test:e2e:mobile
```

Coverage reports are written to `coverage/` and can be opened in a browser via `coverage/index.html`.

---

## Unit Tests (Vitest)

### Configuration

**File:** `vitest.config.ts`

- Environment: `jsdom` (simulates browser DOM)
- React plugin enabled for JSX transform
- Coverage provider: `v8`
- Path alias: `@/*` resolves to `src/*`

### Test Files

| File | Tests | What It Covers |
|------|-------|----------------|
| `src/lib/__tests__/utils.test.ts` | 38 | Utility functions |
| `src/lib/__tests__/session.test.ts` | 10 | Auth token sign/verify |
| `src/lib/__tests__/i18n.test.ts` | 13 | Locale config and dictionaries |
| `src/components/attendance/__tests__/StatusToggle.test.tsx` | 11 | Attendance status component |
| `src/components/layout/__tests__/BottomNav.test.tsx` | 10 | Bottom navigation rendering |

---

### `src/lib/__tests__/utils.test.ts` — 38 tests

Tests for all general-purpose utility functions exported from `src/lib/utils.ts`.

| Function | What Is Tested |
|----------|----------------|
| `cn()` | Merges Tailwind classes, resolves conflicts (e.g. `text-red-500` + `text-blue-500` → blue wins) |
| `getTodayISO()` | Returns `YYYY-MM-DD` string using Israel timezone, not UTC |
| `getNowInIsrael()` | Returns a `Date` object with the correct Israel UTC offset applied |
| `formatDate()` | Formats date strings using `ar` and `he` locales |
| `formatTime()` | Converts `"15:30:00"` → `"15:30"`, handles `null` → `""` |
| `getLocalizedField()` | Returns `obj.name_he` for `'he'` locale, falls back to `name_ar` |
| `formatPhoneNumber()` | Strips `+972` / `972` prefix from phone strings |
| `normalizePhone()` | Converts Arabic/Persian digit characters to English, handles Israeli format variants |

---

### `src/lib/__tests__/session.test.ts` — 10 tests

Tests for the stateless HMAC session token implementation used by the custom auth system.

| Scenario | Expected Behaviour |
|----------|--------------------|
| `sign()` with a payload | Produces a `base64url.base64url` two-part token |
| `sign()` with different payloads | Produces distinct tokens |
| `verify()` with a valid token | Returns the original payload object |
| `verify()` with a tampered token | Returns `null` |
| `verify()` with a malformed string | Returns `null` |
| `verify()` with an empty string | Returns `null` |

---

### `src/lib/__tests__/i18n.test.ts` — 13 tests

Tests for the internationalisation configuration (`src/lib/i18n.ts`) and dictionary loading.

| Area | What Is Tested |
|------|----------------|
| Locale validation | `'ar'` and `'he'` are valid; `'en'` is not |
| Default locale | Is `'ar'` |
| Direction config | Both `'ar'` and `'he'` have direction `'rtl'` |
| Dictionary loading | `ar` and `he` dictionaries load without error and contain expected keys |

---

### `src/components/attendance/__tests__/StatusToggle.test.tsx` — 11 tests

Tests for the `StatusToggle` component used on the attendance page.

| Scenario | Expected Behaviour |
|----------|--------------------|
| Rendered with `present` status | Shows green styling |
| Rendered with `absent` status | Shows red styling |
| Rendered with `late` status | Shows amber styling |
| Click on `present` | Calls `onChange` with `'absent'` |
| Click on `absent` | Calls `onChange` with `'late'` |
| Click on `late` | Calls `onChange` with `'present'` |
| Accessibility | Element has an `aria-label` attribute |

The cycle is: `present` → `absent` → `late` → `present`.

---

### `src/components/layout/__tests__/BottomNav.test.tsx` — 10 tests

Tests for the bottom navigation bar rendered on mobile.

| Scenario | Expected Behaviour |
|----------|--------------------|
| Regular trainer session | Renders 4 nav items |
| Headcoach session | Renders 5 nav items (includes admin tab) |
| Active state | Highlighted item matches the current path |
| "حسابي" tab active paths | Active for `/more`, `/profile`, `/settings`, `/payments`, `/trainers`, `/reports` |

---

## E2E Tests (Playwright)

### Configuration

**File:** `playwright.config.ts`

- Browser: Desktop Chrome only
- Workers: 1 (serial execution)
- Retries: 2 on failure
- Timeout: 30s per test
- Base URL: `http://localhost:3000`

**Global setup:** `e2e/global-setup.ts` — sends a warm-up request to the dev server before any test runs, preventing cold-compilation timeouts.

**Auth fixture:** `e2e/fixtures/auth.ts` — provides a `loggedInPage` fixture that performs a full login using the mock OTP.

**Mock OTP:** When `E2E_MOCK_OTP=true` is set (configured in the `webServer` block), `sendOTP` skips Vonage SMS and `verifyOTP` accepts `1111` as a valid code. No real SMS is ever sent during tests.

### Test Files

| File | Tests | What It Covers |
|------|-------|----------------|
| `e2e/auth.spec.ts` | 4 | Authentication flows |
| `e2e/navigation.spec.ts` | 3 | Sidebar nav and routing |
| `e2e/teams.spec.ts` | 3 | Teams list and detail pages |
| `e2e/halls.spec.ts` | 2 | Halls list and detail pages |
| `e2e/payments.spec.ts` | 2 | Payments list and class payments |
| `e2e/attendance.spec.ts` | 2 | Attendance links and page load |
| `e2e/mobile.spec.ts` | 3 | Mobile viewport behaviour |
| `e2e/rtl.spec.ts` | 2 | RTL direction for ar/he locales |
| `e2e/accessibility.spec.ts` | 3 | axe-core zero critical/serious violations |

---

### `e2e/auth.spec.ts` — 4 tests

| Test | What Happens |
|------|--------------|
| Unauthenticated redirect | Visiting `/` redirects to `/login` |
| Login page renders | Phone number input is visible |
| Full login flow | Enter phone → receive mock OTP `1111` → authenticated and redirected |
| Authenticated redirect | Visiting `/login` while logged in redirects away |

---

### `e2e/navigation.spec.ts` — 3 tests

| Test | What Happens |
|------|--------------|
| Sidebar visible on desktop | `<aside>` nav element is visible at 1280px width |
| Nav links navigate correctly | Clicking "القاعات" routes to `/halls`, "الفرق" routes to `/teams` |
| Home page content | Dashboard renders hall and team links |

---

### `e2e/teams.spec.ts` — 3 tests

| Test | What Happens |
|------|--------------|
| Teams page loads | Page renders without error |
| Click team navigates | `waitForURL` with UUID regex confirms route change to team detail |
| Team detail has content | Detail page body is non-empty |

---

### `e2e/halls.spec.ts` — 2 tests

| Test | What Happens |
|------|--------------|
| Halls page loads | Page renders without error |
| Click hall navigates | Navigates to hall detail page |

---

### `e2e/payments.spec.ts` — 2 tests

| Test | What Happens |
|------|--------------|
| Payments page loads | Page renders without error |
| Click class navigates | Navigates to class payments page |

---

### `e2e/attendance.spec.ts` — 2 tests

| Test | What Happens |
|------|--------------|
| Home page has attendance links | Dashboard contains at least one event/attendance link |
| Attendance page loads | Navigating to an event attendance page renders without error |

---

### `e2e/mobile.spec.ts` — 3 tests

| Test | What Happens |
|------|--------------|
| Sidebar nav links | `<aside>` nav contains navigation links |
| Header sticky on scroll | Header element remains visible after scrolling 500px |
| Login usable on mobile | Phone input height is at least 40px on a 375px viewport |

---

### `e2e/rtl.spec.ts` — 2 tests

| Test | What Happens |
|------|--------------|
| Arabic locale RTL | `/ar` page has `<html dir="rtl">` |
| Hebrew locale RTL | `/he` page has `<html dir="rtl">` |

---

### `e2e/accessibility.spec.ts` — 3 tests

Uses `@axe-core/playwright` to inject and run axe accessibility analysis in-browser. Only `critical` and `serious` violations cause failure; `moderate` and `minor` are excluded to avoid noise.

| Page | Requirement |
|------|-------------|
| Login page | Zero critical/serious violations |
| Home page | Zero critical/serious violations |
| Teams page | Zero critical/serious violations |

---

## Architecture Decisions

### 1. Mock OTP via environment variable

Real SMS via Vonage is bypassed using `E2E_MOCK_OTP=true`. When set, `verifyOTP` accepts `1111` unconditionally. This means E2E tests have no external dependencies, run offline, and produce no charges or side effects. The flag is injected into the `webServer` environment block in `playwright.config.ts` so it applies only during test runs.

### 2. Desktop Chrome only

Playwright is configured to run on Desktop Chrome only. This makes the suite fast, deterministic, and free of cross-browser flakiness. Mobile behaviour is covered via `mobile.spec.ts` assertions (viewport size, touch target heights, sticky positioning) rather than separate browser projects.

### 3. Single worker

Running Playwright with `workers: 1` prevents a known streaming bug (`transformAlgorithm`) that surfaces under concurrent load against the Next.js dev server. Tests run sequentially, which is fast enough given the 24-test count.

### 4. Global setup warm-up

`e2e/global-setup.ts` issues a GET request to the dev server before the first test. This forces Next.js to compile the initial routes so the first test does not time out waiting for cold compilation.

### 5. `waitForURL` over `waitForLoadState`

Client-side navigation in Next.js App Router does not trigger a full page load. `waitForLoadState('networkidle')` is unreliable for these transitions. `page.waitForURL(pattern)` waits until the browser URL matches, which is the correct signal for SPA-style navigation.

### 6. `aside` selector for sidebar nav

The sidebar `<nav>` is inside `<aside>`. Using `page.locator('aside nav')` avoids a Playwright strict-mode violation that would occur if the test matched both the sidebar nav and the mobile bottom nav simultaneously.

---

## Adding New Tests

### Unit test — new utility function

1. Place the test file in `src/lib/__tests__/` with the name `<filename>.test.ts`.
2. Import the function under test using the `@/` alias.
3. Use `describe` + `it` blocks. Keep each `it` focused on one behaviour.

```ts
// src/lib/__tests__/myUtils.test.ts
import { describe, it, expect } from 'vitest'
import { myFunction } from '@/lib/myUtils'

describe('myFunction', () => {
  it('returns expected value for valid input', () => {
    expect(myFunction('input')).toBe('expected')
  })

  it('returns null for empty string', () => {
    expect(myFunction('')).toBeNull()
  })
})
```

### Unit test — new React component

1. Place the test file in `src/components/<domain>/__tests__/<ComponentName>.test.tsx`.
2. Use `@testing-library/react` for rendering and `@testing-library/user-event` for interactions.
3. Do not test implementation details — test what the user sees and does.

```tsx
// src/components/payments/__tests__/PaymentBadge.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import PaymentBadge from '@/components/payments/PaymentBadge'

describe('PaymentBadge', () => {
  it('renders paid status correctly', () => {
    render(<PaymentBadge status="paid" />)
    expect(screen.getByText('مدفوع')).toBeInTheDocument()
  })
})
```

### E2E test — new page or flow

1. Create `e2e/<feature>.spec.ts`.
2. Import the `test` and `expect` from `@playwright/test`.
3. Use the auth fixture from `e2e/fixtures/auth.ts` when the test requires a logged-in user.
4. Use `waitForURL` when asserting navigation, not `waitForLoadState`.

```ts
// e2e/reports.spec.ts
import { test, expect } from './fixtures/auth'

test('reports page loads', async ({ loggedInPage: page }) => {
  await page.goto('/ar/reports')
  await expect(page.locator('h1, h2').first()).toBeVisible()
})

test('clicking a report navigates to detail', async ({ loggedInPage: page }) => {
  await page.goto('/ar/reports')
  await page.locator('[data-testid="report-item"]').first().click()
  await page.waitForURL(/\/reports\/.+/)
  await expect(page.locator('main')).toBeVisible()
})
```

### File placement reference

| Test type | Location pattern |
|-----------|-----------------|
| Utility / lib unit test | `src/lib/__tests__/<name>.test.ts` |
| Component unit test | `src/components/<domain>/__tests__/<Name>.test.tsx` |
| E2E spec | `e2e/<feature>.spec.ts` |
| E2E fixture | `e2e/fixtures/<name>.ts` |

### Naming conventions

- Unit test files: `<subject>.test.ts` or `<Subject>.test.tsx`
- E2E spec files: `<feature>.spec.ts` (noun describing the feature, not the test action)
- `describe` labels: the function or component name
- `it` / `test` labels: start with a verb — "returns", "renders", "navigates", "calls"

---

## Coverage

Run `npm run test:coverage` to generate a v8 coverage report. Open `coverage/index.html` to view line-by-line coverage.

Coverage is informational. The goal is meaningful tests over high percentages — a 100% covered function with no behavioural assertions provides no value. Prioritise coverage of:

- All branches in utility functions (especially edge cases like null, empty string, invalid input)
- State transitions in interactive components
- Auth and session logic

Do not write tests purely to raise the coverage number.
