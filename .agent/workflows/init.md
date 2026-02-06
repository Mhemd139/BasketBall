---
description: Initialize Basketball Manager development environment
---

# Basketball Manager - Initialization Workflow

This workflow sets up the Basketball Manager development environment and verifies all dependencies are ready.

## Prerequisites Check

1. Verify Node.js is installed (v18+)
   ```bash
   node --version
   ```

2. Verify npm is installed
   ```bash
   npm --version
   ```

## Installation Steps

// turbo
3. Install project dependencies
   ```bash
   npm install
   ```

4. Check if `.env.local` exists
   - If not, copy from `.env.example` and prompt user to fill in Supabase credentials
   ```bash
   if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
   ```

## Environment Configuration

5. Verify Supabase configuration
   - Check that `.env.local` has valid values (not placeholder text)
   - Required variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `NEXT_PUBLIC_APP_URL`

## Development Server

// turbo
6. Start the development server
   ```bash
   npm run dev
   ```

7. Verify the app is running
   - Open browser to http://localhost:3000
   - Should redirect to `/ar` (Arabic - default locale)
   - Verify all three locales work:
     - http://localhost:3000/ar (Arabic - RTL)
     - http://localhost:3000/he (Hebrew - RTL)
     - http://localhost:3000/en (English - LTR)

## Project Status Check

8. Review current phase
   - Phase 1 (Foundation) is complete ✅
   - Next phase: Phase 2 - Supabase Integration & Hall Management
   - See `Tasks.md` for detailed task breakdown

## Quick Reference

**Project Structure:**
- `src/app/[locale]/` - Locale-based routing (ar/he/en)
- `src/dictionaries/` - Translation files
- `src/lib/i18n/` - Internationalization configuration
- `src/lib/supabase/` - Supabase client setup

**Key Commands:**
- `npm run dev` - Start development server (with Turbopack)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

**Tech Stack:**
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase (PostgreSQL + Auth + RLS)

## Next Steps

After initialization, you can:
- Review the comprehensive task list in `Tasks.md`
- Check `README.md` for project overview
- Review `SETUP_COMPLETE.md` for Phase 1 completion details
- Start working on Phase 2 tasks (Supabase schema setup)
