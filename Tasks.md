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
- [ ] Paste and execute `rls_security.sql` (all sections)
- [ ] Verify in Supabase dashboard: all tables show RLS enabled, no linter warnings

### Step 2: Convert server actions to RPC — DONE
- [x] Convert event mutations (`upsert_event`, `delete_event`)
- [x] Convert hall mutations (`update_hall_rpc`)
- [x] Convert class mutations (`insert_class`, `update_class`, `delete_class`)
- [x] Convert trainee mutations (`insert_trainee`, `update_trainee_rpc`, `delete_trainee`)
- [x] Convert attendance mutations (`upsert_attendance`, `bulk_upsert_attendance`)
- [x] Convert payment mutations (`insert_payment_log`, `update_trainee_payment_rpc`)
- [x] Convert trainer mutations (`update_trainer_rpc`, `delete_trainer_rpc`)
- [x] Removed `createServiceRoleClient` import (no longer needed)
- [x] Cleaned all `console.error`/`console.warn` from `actions.ts`
- [x] Build verification passes clean

### Step 3: Verify after SQL execution
- [ ] Test reads still work (anon SELECT policies allow it)
- [ ] Test all write operations through RPCs
- [ ] Verify no Supabase dashboard linter warnings

### RPC function reference:

| Function | Purpose |
|----------|---------|
| `upsert_event(p_data jsonb)` | Create/update events |
| `delete_event(p_id uuid)` | Delete event |
| `update_hall_rpc(p_id, p_name_en, p_name_ar, p_name_he)` | Update hall names |
| `insert_class(p_data jsonb)` | Create team/class |
| `update_class(p_id, p_data jsonb)` | Update team/class |
| `delete_class(p_id uuid)` | Delete team/class |
| `insert_trainee(p_data jsonb)` | Add trainee |
| `update_trainee_rpc(p_id, p_data jsonb)` | Update trainee |
| `delete_trainee(p_id uuid)` | Delete trainee |
| `upsert_attendance(p_trainee_id, p_event_id, p_status, p_marked_by)` | Mark attendance |
| `insert_payment_log(p_trainee_id, p_amount, p_note, p_season)` | Log payment |
| `update_trainee_payment_rpc(p_trainee_id, p_amount, p_comment)` | Update payment amount |
| `update_trainer_rpc(p_id, p_data jsonb)` | Update trainer profile/details |
| `delete_trainer_rpc(p_id uuid)` | Delete trainer/account |
| `bulk_upsert_attendance(p_records jsonb)` | Bulk mark attendance |

---

## Part 3: Head Coach Role Feature — Documentation Only

See `implementation.md` for full spec.

- [x] Created `implementation.md` with feature spec, code examples, and migration plan
- [ ] Implement when ready (5 steps described in the doc)

### Summary of what to implement later:
1. SQL migration — standardize `trainers.role` values to `'headcoach'`/`'trainer'`
2. Modify `upsertTrainer()` — accept role parameter
3. Modify `verifyOTP()` — read role from DB instead of hardcoded phone array
4. Modify `TrainerManager.tsx` — add role selector (headcoach vs trainer)
5. Deploy + migration path with fallback

---

## Execution Order for Remaining Work

1. **Run `rls_security.sql`** in Supabase SQL Editor (the only manual step left)
2. **Test** — verify reads + writes work after RLS is enabled
3. **Head Coach role feature** — implement when ready per `implementation.md`
