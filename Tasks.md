# Basketball Manager — Consolidated Task List

> Updated: 2026-02-11

---

## Part 1: Bilingual AR/HE Conversion — COMPLETE

All English references removed from UI. App now supports Arabic + Hebrew with language switcher.

- [x] i18n config — locales `['ar','he']`, removed `@ts-ignore`, restored Hebrew
- [x] Dictionary loader — removed `en` entry, fallback to `ar`
- [x] `getLocalizedField` — fallback to `_ar` instead of `_en`
- [x] Language settings page — removed English option
- [x] CreateTeamModal — 2 inputs (AR + HE), auto-fills `name_en` from `name_ar`
- [x] EditHallModal — 2 inputs (AR + HE), passes `nameAr` as `name_en`
- [x] CoachEventModal — renamed EN title to HE title
- [x] Server actions — name fallbacks to `_ar`, `.order('name_ar')`, removed `console.error`
- [x] Replaced `.order('name_en')` across all files
- [x] Ternary cleanup — removed English branches in 6 files
- [x] Display components — locale-aware names, translated English strings to AR/HE
- [x] Build verification — `npm run build` passes clean

---

## Part 2: RLS Security — Code Ready, SQL Needs Execution

### Step 1: Run the SQL (PENDING — you need to do this)
- [ ] Open Supabase SQL Editor for project `amzfssqkjefzzbilqmfe`
- [ ] Paste and execute `rls_security.sql` (all sections — includes role migration)
- [ ] Verify in Supabase dashboard: all tables show RLS enabled, no linter warnings

### Step 2: Convert server actions to RPC — DONE
- [x] Convert all 23 mutations to `.rpc()` calls
- [x] Removed `createServiceRoleClient` import
- [x] Cleaned all `console.error`/`console.warn` from `actions.ts`
- [x] Build verification passes clean

### Step 3: Verify after SQL execution
- [ ] Test reads still work (anon SELECT policies allow it)
- [ ] Test all write operations through RPCs
- [ ] Verify no Supabase dashboard linter warnings

---

## Part 3: Head Coach Role Feature — COMPLETE

- [x] Created `implementation.md` with feature spec
- [x] SQL migration added to `rls_security.sql` (section 0: standardize roles)
- [x] `update_trainer_rpc` updated to support `role` field
- [x] `upsertTrainer()` accepts `role` parameter (`'headcoach' | 'trainer'`)
- [x] `verifyOTP()` reads role from DB instead of hardcoded phone array
- [x] `TrainerManager.tsx` — role selector in add modal (polished card UI)
- [x] Role badges now read from DB `role` field (not hardcoded phone numbers)
- [x] Pre-named trainers skip profile-setup on first login
- [x] Removed `force-dynamic` from head-coach page
- [x] Build verification passes clean

### How it works:
1. Head coach opens **Admin Panel** (`/head-coach`)
2. Clicks **"Add Trainer"** → enters phone, name, and selects role (Trainer or Head Coach)
3. Name + role saved to DB immediately
4. When new trainer logs in via OTP → role read from DB, name pre-filled → skips profile setup
5. Seed head coach phones (`972543299106`, `972587131002`) auto-create as headcoach if not in DB

---

## Part 4: Excel Import/Export — Planning Only

See `excel-import-export-plan.md` for full spec.

- [x] Created plan document with technical approach
- [ ] Implement when ready

### Summary:
- **Import:** Upload `.xlsx` → parse client-side with SheetJS → bulk insert trainees into a team
- **Export:** Download roster/attendance/payments as `.xlsx` from existing page data
- **Library:** `xlsx` (SheetJS), client-side only (no server upload)

---

## Execution Order for Remaining Work

1. **Run `rls_security.sql`** in Supabase SQL Editor (includes role migration)
2. **Test** — verify reads + writes work, verify role assignment flow
3. **Excel import/export** — implement when ready per plan doc
