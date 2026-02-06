---
description: Start development server and verify setup
---

# Basketball Manager - Development Workflow

Quick workflow to start development and verify everything is working.

## Start Development

// turbo-all
1. Start the Next.js development server
   ```bash
   npm run dev
   ```

## Verify Application

2. Check that the server is running
   - Server should be available at http://localhost:3000
   - Turbopack should be enabled for fast refresh

3. Test locale routing
   - Root URL should redirect to `/ar` (Arabic - default)
   - All three locales should be accessible:
     - `/ar` - Arabic (RTL)
     - `/he` - Hebrew (RTL)  
     - `/en` - English (LTR)

## Common Development Tasks

4. **Run linter**
   ```bash
   npm run lint
   ```

5. **Build for production** (to verify no build errors)
   ```bash
   npm run build
   ```

6. **Check for dependency updates**
   ```bash
   npm outdated
   ```

## Troubleshooting

### Server won't start
- Check if port 3000 is already in use
- Verify `.env.local` exists
- Run `npm install` to ensure dependencies are installed

### Supabase errors
- Verify `.env.local` has valid Supabase credentials
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Ensure Supabase project is active

### Build errors
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npx tsc --noEmit`

## Quick Reference

**Development Server:** http://localhost:3000  
**Default Locale:** Arabic (`/ar`)  
**Tech Stack:** Next.js 15 + React 19 + TypeScript + Tailwind CSS 4 + Supabase

**Key Features:**
- Mobile-first responsive design
- RTL/LTR support for Arabic, Hebrew, English
- Turbopack for fast development
- Hot module replacement enabled
