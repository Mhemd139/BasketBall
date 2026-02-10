# Language Lockdown Tasks — Arabic Only

> **Goal**: Lock the entire app to Arabic (`ar`) only. Do NOT delete the i18n infrastructure — just disable/hide all language-switching UI and hardcode locale to `'ar'` where needed. Keep the `[locale]` URL segment working (always `ar`), keep the dictionary system, keep RTL. Remove user-facing ability to switch languages.

---

## TASK 1: Lock config to Arabic only

**File**: `src/lib/i18n/config.ts`

Change `locales` to only include `'ar'`:
```ts
// BEFORE
export const locales = ['ar', 'he', 'en'] as const

// AFTER
export const locales = ['ar'] as const
```

Keep `defaultLocale = 'ar'`, keep `directions`, keep `localeNames`, keep `isValidLocale`. The rest of the code that references `locales` will automatically only see `'ar'`.

---

## TASK 2: Hide Language Switcher in Header

**File**: `src/components/layout/Header.tsx`

Find the language switcher dropdown (the button showing locale in uppercase + the dropdown with 3 language options). Comment out / remove the entire language switcher JSX block. Search for `LANGUAGES` constant and the dropdown that maps over it. Hide all of it. The header should no longer show any language toggle.

Look for something like:
```tsx
const LANGUAGES = [
  { code: 'ar', ...},
  { code: 'he', ...},
  { code: 'en', ...},
]
```
And the button/dropdown that renders them. Remove/comment the entire block.

---

## TASK 3: Hide LanguageSwitcher component on Login page

**File**: `src/app/[locale]/login/page.tsx`

Find `<LanguageSwitcher currentLocale={locale} />` and remove or comment it out. Also remove the import:
```tsx
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
```

---

## TASK 4: Hide Language option in Settings page

**File**: `src/app/[locale]/settings/page.tsx`

Find the navigation item that links to the language settings page (`/{locale}/settings/language`). It likely has a Globe icon and text like "اللغة" / "Language". Comment out or remove that entire list item/link.

---

## TASK 5: Hide Language option in More page

**File**: `src/app/[locale]/more/page.tsx`

Same as settings — find any link to language settings or language switching UI and hide it. Look for references to `/settings/language` or language-related menu items.

---

## TASK 6: Disable Language Settings page (optional)

**File**: `src/app/[locale]/settings/language/page.tsx`

This page shows 3 language options (English, Arabic, Hebrew) with flags. Since no one can navigate here anymore (links removed in Tasks 4-5), you can either:
- Leave it as-is (it's unreachable), OR
- Add a redirect to `/{locale}/settings` at the top of the page

Preferred: Leave as-is since it's already unreachable.

---

## TASK 7: Simplify all inline locale ternaries to Arabic

> This is the BIGGEST task. Every page and component has patterns like:
> ```tsx
> {locale === 'ar' ? 'القاعات' : locale === 'he' ? 'אולמות' : 'Halls'}
> ```
> Change all of these to just the Arabic value:
> ```tsx
> {'القاعات'}
> ```

### Files to update (with approximate occurrence counts):

**Pages:**
1. `src/app/[locale]/page.tsx` (~13 occurrences) — Stats labels, nav card titles, event display, empty state
2. `src/app/[locale]/login/page.tsx` (~27 occurrences) — Form labels, gender options, day names, button text, error messages, setup profile text
3. `src/app/[locale]/halls/page.tsx` (~7 occurrences) — Page title, description, status labels
4. `src/app/[locale]/halls/[id]/page.tsx` (~1 occurrence)
5. `src/app/[locale]/teams/page.tsx` (~4 occurrences) — Title, empty states
6. `src/app/[locale]/teams/[classId]/page.tsx` (~9 occurrences) — Team detail labels
7. `src/app/[locale]/teams/[classId]/add/page.tsx` (~18 occurrences) — Add player form
8. `src/app/[locale]/trainers/page.tsx` (~2 occurrences) — Title, empty state
9. `src/app/[locale]/trainers/[id]/page.tsx` (~17 occurrences) — Profile labels, day names, role, gender
10. `src/app/[locale]/attendance/[eventId]/page.tsx` (~3 occurrences) — Event type labels
11. `src/app/[locale]/payments/page.tsx` (~5 occurrences) — Select team label, player count
12. `src/app/[locale]/schedule/page.tsx` (~5 occurrences) — Schedule labels
13. `src/app/[locale]/reports/page.tsx` (~1 occurrence) — Stat labels
14. `src/app/[locale]/profile/page.tsx` (~16 occurrences) — Profile page labels
15. `src/app/[locale]/settings/page.tsx` (~7 occurrences) — Settings title, menu items
16. `src/app/[locale]/more/page.tsx` (~13 occurrences) — All menu items

**Components:**
17. `src/components/layout/Header.tsx` (~5 occurrences) — Search placeholder, etc.
18. `src/components/layout/Sidebar.tsx` (~1 occurrence) — Uses `labelAr` property
19. `src/components/layout/BottomNav.tsx` (~1 occurrence) — Uses `labelAr` property
20. `src/components/home/QuickActions.tsx` (~3 occurrences) — Section title, button labels
21. `src/components/attendance/AttendanceSheet.tsx` (~5 occurrences)
22. `src/components/payments/PaymentsClient.tsx` (~9 occurrences)
23. `src/components/payments/PaymentModal.tsx` (~1 occurrence)
24. `src/components/payments/ClassPaymentsClient.tsx` (~7 occurrences)
25. `src/components/halls/HallSchedule.tsx` (~8 occurrences)
26. `src/components/halls/CoachEventModal.tsx` (~10 occurrences)
27. `src/components/halls/AttendanceModal.tsx` (~6 occurrences)
28. `src/components/halls/InteractiveEventModal.tsx` (~6 occurrences)
29. `src/components/teams/CreateTeamModal.tsx` (~7 occurrences)
30. `src/components/teams/CreateTeamButton.tsx` (~1 occurrence)
31. `src/components/teams/TeamCard.tsx` (~2 occurrences)
32. `src/components/teams/TraineeList.tsx` (~3 occurrences)
33. `src/components/teams/TrainerReassignModal.tsx` (~5 occurrences)
34. `src/components/trainers/EditTrainerProfileModal.tsx` (~23 occurrences) — Day names, form labels, gender
35. `src/components/trainers/TrainerProfileModal.tsx` (~3 occurrences)
36. `src/components/trainers/TrainerProfileActions.tsx` (~1 occurrence)
37. `src/components/trainees/TraineeProfileModal.tsx` (~3 occurrences)
38. `src/components/players/CreatePlayerModal.tsx` (~1 occurrence)

### Pattern to follow:

For every ternary like:
```tsx
locale === 'ar' ? 'Arabic text' : locale === 'he' ? 'Hebrew text' : 'English text'
```
Replace with just:
```tsx
'Arabic text'
```

For `getLocalizedField(obj, 'name', locale)` calls — **KEEP THESE AS-IS**. They read from the database and the `_ar` fields will be returned correctly since locale is always `'ar'`.

For `new Date().toLocaleDateString(locale, ...)` calls — **KEEP THESE AS-IS**. They'll use `'ar'` locale automatically.

For Sidebar/BottomNav that use `getLabel()` with `labelAr` — you can simplify `getLabel` to just return `item.labelAr`, or leave the function as-is since locale will always be `'ar'`.

---

## TASK 8: Hardcode RTL direction

**File**: `src/app/[locale]/layout.tsx`

The layout already sets `dir={directions[locale]}` which resolves to `'rtl'` for Arabic. No change needed here — just verify it works.

**File**: `src/app/[locale]/login/page.tsx`

The login page has its own `dir` attribute:
```tsx
dir={locale === 'ar' || locale === 'he' ? 'rtl' : 'ltr'}
```
Since locale is always `'ar'`, this will always be `'rtl'`. You can simplify to `dir="rtl"` or leave as-is.

---

## TASK 9: Fix arrow directions

Multiple files flip arrow icons for RTL:
```tsx
locale === 'ar' || locale === 'he' ? '←' : '→'
```
Since locale is always `'ar'`, these will always show `'←'`. You can simplify to just `'←'` or leave as-is (they'll work correctly).

Same for icon rotations:
```tsx
className={`w-6 h-6 ${locale === 'ar' || locale === 'he' ? 'rotate-180' : ''}`}
```
Can simplify to `className="w-6 h-6 rotate-180"` or leave as-is.

**Files with arrow/rotation logic:**
- `src/app/[locale]/login/page.tsx` (line ~168)
- `src/app/[locale]/page.tsx` (line ~205)
- `src/app/[locale]/settings/page.tsx` (line ~68)
- `src/app/[locale]/more/page.tsx` (line ~121)
- `src/app/[locale]/payments/page.tsx` (line ~70)

---

## TASK 10: Remove LocaleSwitcher component references

**File**: `src/components/layout/LocaleSwitcher.tsx` — Leave file, just ensure nothing imports it anymore.
**File**: `src/components/ui/LanguageSwitcher.tsx` — Leave file, just ensure nothing imports it anymore (after Task 3 removes login import).

Search the entire `src/` folder for any remaining imports of `LanguageSwitcher` or `LocaleSwitcher` and remove them.

---

## TASK 11: Middleware cleanup

**File**: `src/middleware.ts`

The middleware detects locale from cookie/path. Since `locales` array now only has `['ar']`, the middleware will always resolve to `'ar'`. No code change needed — it works automatically from the config change in Task 1.

The `NEXT_LOCALE` cookie will always be set to `'ar'`.

---

## VERIFICATION CHECKLIST

After all tasks, verify:
- [ ] Visiting `/` redirects to `/ar`
- [ ] Visiting `/he/...` or `/en/...` returns 404 (since they're not valid locales anymore)
- [ ] No language switcher visible anywhere (Header, Login, Settings, More)
- [ ] All UI text is in Arabic
- [ ] RTL direction is applied everywhere
- [ ] Database queries still work (getLocalizedField with locale='ar' returns `_ar` fields)
- [ ] Login flow works (OTP, profile setup — all Arabic)
- [ ] Settings page has no Language option
- [ ] No build errors

---

## TASK 12: Collapse multi-language form inputs to single Arabic field

> **Critical**: Forms currently ask users to type a name in 3 languages (English, Arabic, Hebrew). Since the app is Arabic-only, show only ONE name input and auto-fill all 3 DB columns with the same Arabic value.

### 12a. CreateTeamModal — `src/components/teams/CreateTeamModal.tsx`

**Current**: 3 separate inputs for `name_en`, `name_ar`, `name_he` (lines 201-236)
**Change**:
- Remove the English and Hebrew input fields entirely
- Keep only the Arabic input (currently labeled "بالعربية")
- Relabel it to just "اسم الفريق" (Team Name)
- In `handleSubmit`, copy the Arabic value to all 3 fields:
  ```ts
  const payload = {
      name_en: formData.name_ar,  // copy Arabic to all
      name_ar: formData.name_ar,
      name_he: formData.name_ar,  // copy Arabic to all
      trainer_id: formData.trainer_id || null,
      hall_id: formData.hall_id || null
  }
  ```
- Also update the validation (line 62): `if (!formData.name_ar)` instead of checking all 3
- In Step 2 (Assign Head Coach), display `trainer.name_ar` instead of `trainer.name_en` (line 272)
- Same for halls: `hall.name_ar` instead of `hall.name_en` (line 296)
- Translate all English labels to Arabic: "Step 1: Branding" → "الخطوة 1: التسمية", "Step 2: Assignment" → "الخطوة 2: التعيين", "Assign Head Coach" → "تعيين المدرب الرئيسي", "Primary Training Hall" → "قاعة التدريب", "Continue" → "متابعة", "Back" → "رجوع", "Create Team" → "إنشاء فريق", "Save Changes" → "حفظ التغييرات"
- Delete confirm dialog: "Delete this team?" → "حذف هذا الفريق؟", body text → "هذا الإجراء نهائي وسيزيل جميع بيانات التدريب المرتبطة.", "Cancel" → "إلغاء", "Delete" → "حذف"

### 12b. EditHallModal — `src/components/halls/EditHallModal.tsx`

**Current**: 3 inputs for `nameEn`, `nameAr`, `nameHe` (lines 66-109)
**Change**:
- Remove English and Hebrew inputs
- Keep only Arabic input, relabel to "اسم القاعة"
- In `handleSave`, pass the Arabic value for all 3:
  ```ts
  const res = await updateHall(hall.id, nameAr, nameAr, nameAr)
  ```

### 12c. CoachEventModal — `src/components/halls/CoachEventModal.tsx`

**Current**: Has `titleEn` and `titleAr` state (lines 21-22). On save, copies `titleEn` to `title_he` (line 34).
**Change**:
- Remove `titleEn` state entirely
- Keep only `titleAr`
- On save, copy Arabic to all:
  ```ts
  title_en: titleAr || (type === 'game' ? 'مباراة' : 'تدريب'),
  title_ar: titleAr || (type === 'game' ? 'مباراة' : 'تدريب'),
  title_he: titleAr || (type === 'game' ? 'مباراة' : 'تدريب'),
  ```
- Remove the English title input from the form, keep only Arabic
- Translate all form labels to Arabic

### 12d. InteractiveEventModal — `src/components/halls/InteractiveEventModal.tsx`

- Line 157-159: Sets `title_en`, `title_ar`, `title_he` all from same `title` var — no change needed here, just ensure the input label is Arabic
- Lines 116, 119, 129, 134, 174: Change `getName` helper to just use `item.name_ar`

### 12e. CreatePlayerModal — `src/components/players/CreatePlayerModal.tsx`

**Current**: Single `name` field that gets sent to `addTrainee()`
**Check**: In `src/app/actions.ts`, the `addTrainee` function (around line 473) already writes the same `name` to `name_en`, `name_ar`, `name_he`:
```ts
name_en: name,
name_ar: name, // <-- already copies to all 3
name_he: name,
```
**No input change needed** — just translate form labels to Arabic.

### 12f. EditTrainerProfileModal — `src/components/trainers/EditTrainerProfileModal.tsx`

**Current**: Single `name` field, already writes to all 3 DB columns (lines 53-55).
**No input change needed** — just translate labels to Arabic.

### 12g. Server Actions — `src/app/actions.ts`

- `createTeam` (around line 743+): Receives `name_en`, `name_ar`, `name_he` — no change needed, the modal will pass same value for all 3
- `updateHall` (line 850): Receives 3 name params — no change needed, modal will pass same value
- `addTrainee` (line 473): Already copies single name to all 3 — no change needed
- `createTrainer` RPC: Already copies single name — no change needed
- `getEventRefData` (line 582+): Selects `name_en, name_ar, name_he` — keep selecting all, display `name_ar` in UI

### 12h. Data display throughout — use `name_ar` / `_ar` fields

In all components that read from DB and display names, change:
```ts
locale === 'ar' ? item.name_ar : locale === 'he' ? item.name_he : item.name_en
```
to just:
```ts
item.name_ar
```

This applies to:
- `src/components/payments/ClassPaymentsClient.tsx` (lines 29, 32, 36)
- `src/components/teams/TeamCard.tsx`
- `src/components/teams/TraineeList.tsx` (line 199)
- `src/components/teams/TrainerReassignModal.tsx`
- `src/components/halls/InteractiveEventModal.tsx` (line 174)
- `src/components/halls/HallSchedule.tsx`
- `src/components/halls/AttendanceModal.tsx`
- `src/components/trainees/TraineeProfileModal.tsx`
- `src/components/trainers/TrainerProfileModal.tsx`
- `src/components/payments/PaymentsClient.tsx`
- `src/app/[locale]/teams/[classId]/add/page.tsx` (lines 62, 199, 208)
  - **Line 62 (important!)**: The transfer confirm dialog uses `trainee.name_en` directly — change to `trainee.name_ar`
  - Lines 199, 208: locale ternary display of trainee/class names

**Note**: `getLocalizedField(obj, 'name', locale)` calls can stay — they'll resolve to `name_ar` since locale is always `'ar'`.

### Also check: Header search results

**File**: `src/components/layout/Header.tsx`
- The search function queries `name_en, name_ar, name_he` and returns results using a `nameField` variable based on locale. Since locale will be `'ar'`, it will use `name_ar`. No change strictly needed, but can simplify to always use `name_ar`.

### Also check: `searchTrainees` in `src/app/actions.ts` (line 630)
- The `.or()` filter searches across all 3 name columns — this is fine, keeps search working even for old data that may only have `name_en` populated.
- No change needed.

---

## PRIORITY ORDER

1. **Task 1** (config) — This alone breaks other locales
2. **Tasks 2-5** (hide switchers) — Remove user ability to switch
3. **Task 12** (collapse multi-lang forms) — Remove English/Hebrew input fields, single Arabic input
4. **Task 7** (simplify ternaries) — Biggest task, do file by file
5. **Tasks 8-10** (cleanup) — Polish and remove dead code
6. **Task 11** (verify middleware) — Just confirm it works
