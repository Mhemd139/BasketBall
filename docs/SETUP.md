# Development Setup Guide — Basketball Manager

## Overview

Basketball Manager is a web application for managing basketball teams, trainers, trainees, attendance, payments, and scheduling. It supports Arabic and Hebrew locales.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack dev server) |
| UI | React 19, TypeScript 5.9, Tailwind CSS 4 |
| Database | Supabase (PostgreSQL) — project ID: `amzfssqkjefzzbilqmfe` |
| Auth | Custom cookie-based sessions with OTP via SMS |
| SMS | Vonage or Twilio (production only) |
| Unit Tests | Vitest |
| E2E Tests | Playwright |

---

## Prerequisites

- **Node.js 20+** — check with `node --version`
- **npm** — bundled with Node.js
- **Supabase account** — for database access
- **Vonage or Twilio account** — required for SMS OTP in production; not needed for local development with mock OTP enabled

---

## Environment Variables

Copy `.env.example` to `.env.local` and populate the values below.

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://amzfssqkjefzzbilqmfe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# Session signing (required)
HMAC_SECRET=<random-secret-for-session-signing>

# SMS Provider — Vonage (at least one provider required in production)
VONAGE_API_KEY=<vonage-api-key>
VONAGE_API_SECRET=<vonage-api-secret>
VONAGE_FROM_NUMBER=<vonage-from-number>

# SMS Provider — Twilio (alternative to Vonage)
TWILIO_ACCOUNT_SID=<twilio-sid>
TWILIO_AUTH_TOKEN=<twilio-token>
TWILIO_FROM_NUMBER=<twilio-number>

# Testing
E2E_MOCK_OTP=true   # Set this in playwright.config.ts webServer env for E2E tests
```

**Notes:**
- `NEXT_PUBLIC_*` variables are exposed to the browser. Do not put secrets there.
- `HMAC_SECRET` signs session cookies. Use a long random string (32+ characters). Rotating this invalidates all active sessions.
- Only one SMS provider is required. If both are configured, the app will use whichever is wired in the SMS module.

---

## Setup Steps

```bash
# 1. Clone the repository
git clone <repo-url>
cd BasketBall

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Open .env.local and fill in all required values

# 4. Start the development server (Turbopack)
npm run dev
```

The dev server starts on `http://localhost:3000`.

The app uses locale-prefixed routes. Open one of:
- `http://localhost:3000/ar` — Arabic
- `http://localhost:3000/he` — Hebrew

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack on port 3000 |
| `npm run build` | Production build (do not run during development) |
| `npm test` | Vitest in watch mode |
| `npm run test:run` | Vitest single run (82 tests) |
| `npm run test:e2e` | Playwright E2E (24 tests, starts dev server automatically) |
| `npm run test:coverage` | Vitest coverage report |

---

## Running Tests

### Unit Tests (Vitest)

```bash
# Watch mode — re-runs on file changes
npm test

# Single run — useful for CI
npm run test:run

# With coverage report
npm run test:coverage
```

### End-to-End Tests (Playwright)

Playwright starts the dev server automatically before running tests. The `E2E_MOCK_OTP=true` environment variable is set in `playwright.config.ts` so that login works without a real SMS provider.

```bash
npm run test:e2e
```

To run a specific test file:

```bash
npx playwright test e2e/login.spec.ts
```

To open the Playwright UI:

```bash
npx playwright test --ui
```

---

## Troubleshooting

### Turbopack cache corruption

**Symptom:** Error message "Persisting failed: Another write batch" in the terminal.

**Fix:** Delete the `.next` cache directory and restart the dev server.

```bash
rm -rf .next
npm run dev
```

### OTP login not working locally

**Symptom:** Login fails because no SMS is sent and there is no OTP code.

**Fix:** For local development, you do not need a real SMS provider. Set `E2E_MOCK_OTP=true` in your `.env.local` to enable the mock OTP flow. With this flag, the app accepts a fixed test OTP code instead of sending an SMS.

### Supabase connection issues

**Symptom:** Data does not load, or you see Supabase client errors.

**Fix:** Verify that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` match the values in your Supabase project dashboard under Project Settings > API.

### Port 3000 already in use

**Symptom:** `Error: listen EADDRINUSE: address already in use :::3000`

**Fix:** Find and kill the process using port 3000, or change the port.

```bash
# On Unix/macOS
lsof -ti:3000 | xargs kill

# Or change port in package.json
"dev": "next dev --turbopack --port 3001"
```

---

## IDE Setup

**Recommended editor:** Visual Studio Code

**Recommended extensions:**

| Extension | Purpose |
|-----------|---------|
| Tailwind CSS IntelliSense | Autocomplete for Tailwind utility classes |
| ES7+ React/Redux/React-Native Snippets | React component and hook snippets |
| Prettier — Code Formatter | Consistent code formatting |
| TypeScript (built-in) | Type checking and IntelliSense |

---

## Project Structure

```
src/
  app/
    [locale]/           # Locale-prefixed routes (ar, he)
      attendance/       # Attendance tracking pages
      halls/            # Hall management pages
      payments/         # Payment pages
      teams/            # Team (class) management pages
      trainers/         # Trainer profile pages
  components/           # Shared React components
  lib/
    supabase/           # Supabase client and types
  actions.ts            # Next.js server actions
```

---

## Database Notes

- "Teams" in the UI correspond to the `classes` table in the database.
- Each class has one trainer and many trainees.
- Events are linked to trainers. To get trainees for an event: `event -> trainer -> class -> trainees`.
- All database mutations that require elevated privileges use `SECURITY DEFINER` Postgres functions (RPC) instead of a service role key.
