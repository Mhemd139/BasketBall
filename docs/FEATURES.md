# Basketball Manager — Feature Deep-Dive

**Version:** Current (uiux-logic-refactor branch)
**Stack:** Next.js 16 (App Router) · React 19 · TypeScript 5.9 · Supabase (Postgres) · Tailwind CSS 4

---

## Table of Contents

1. [OTP Authentication (Stateless, No Supabase Auth)](#1-otp-authentication-stateless-no-supabase-auth)
2. [Bilingual RTL Support (Arabic + Hebrew)](#2-bilingual-rtl-support-arabic--hebrew)
3. [Excel Import Wizard](#3-excel-import-wizard)
4. [Excel Export](#4-excel-export)
5. [Recurring Schedule System](#5-recurring-schedule-system)
6. [Attendance System](#6-attendance-system)
7. [Payment Tracking](#7-payment-tracking)
8. [Global Search](#8-global-search)
9. [Israel Timezone Handling](#9-israel-timezone-handling)
10. [Glassmorphic Dark UI](#10-glassmorphic-dark-ui)
11. [Mobile-First Design](#11-mobile-first-design)

---

## 1. OTP Authentication (Stateless, No Supabase Auth)

### Overview

The application implements a fully custom, stateless OTP authentication system over SMS. Supabase Auth is deliberately not used — the application manages its own session lifecycle, giving full control over session shape, role assignment, and multi-provider SMS delivery.

### SMS Provider Strategy

Two SMS providers are supported: Vonage (primary) and Twilio (fallback). Provider selection is determined at runtime by inspecting which environment variables are present, requiring zero configuration changes to switch providers:

```ts
const provider = process.env.VONAGE_API_KEY ? 'vonage' : 'twilio'
```

This dual-provider design ensures resilience against SMS gateway outages without deploying code changes.

### Phone Number Normalization

Before any OTP is sent, phone numbers pass through a normalization pipeline that handles three distinct transformations:

1. **Arabic-Indic digit conversion** — Arabic numerals (٠١٢٣٤٥٦٧٨٩) are mapped to ASCII digits (0-9).
2. **Persian digit conversion** — Persian numerals (۰۱۲۳۴۵۶۷۸۹) undergo the same mapping.
3. **Israeli format conversion** — Local format `05X-XXXXXXX` is normalized to international format `9725XXXXXXX`.

This pipeline ensures that users entering numbers from an Arabic keyboard on an iPhone receive the same OTP as users typing from a Latin keyboard, and that the number resolves correctly through Israeli carrier routing.

### Stateless OTP Verification

OTP codes are never written to the database. Verification is performed via HMAC-SHA256:

```ts
// Generation
const payload = `${normalizedPhone}:${otp}:${Math.floor(Date.now() / 300_000)}`
const hmac = createHmac('sha256', process.env.OTP_SECRET!).update(payload).digest('hex')

// Verification (same logic, time window must match)
const expectedHmac = createHmac('sha256', process.env.OTP_SECRET!).update(payload).digest('hex')
const valid = timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))
```

The 5-minute time window is encoded into the payload via `Math.floor(Date.now() / 300_000)`, making codes self-expiring without any database TTL mechanism. `timingSafeEqual` prevents timing-based attacks.

### Session Token Format

Once verified, a session token is constructed and stored in an `httpOnly` cookie named `admin_session`:

```
base64url(JSON.stringify(payload)) + "." + base64url(HMAC-SHA256(above, SESSION_SECRET))
```

The `getSession()` server utility splits the cookie on `.`, verifies the signature, and returns `{ id, name, role }`. No database read is required to validate a session — all information needed is in the signed payload.

### Three-Step Login Flow

| Step | Condition | Action |
|------|-----------|--------|
| 1. Phone Entry | Always | Normalize number, send OTP via SMS |
| 2. OTP Verification | Always | HMAC verify, look up user in DB |
| 3. Profile Setup | New user only | Collect name, gender, availability |

Returning users skip step 3 and land directly on the dashboard after step 2.

### Roles

- `headcoach` — Full administrative access: manage trainers, teams, halls, import/export data.
- `trainer` — Scoped access: view and manage their own team's attendance and payments.

### Mock OTP Mode

Setting `E2E_MOCK_OTP=true` bypasses the HMAC check and accepts codes `1111` or `1234`. This enables automated testing and local development without real SMS delivery.

---

## 2. Bilingual RTL Support (Arabic + Hebrew)

### Overview

The application serves two locales — Arabic (`ar`) and Hebrew (`he`) — both of which are right-to-left languages. The entire UI, including dynamic database content, renders correctly in both languages.

### URL-Based Locale Routing

Locale is encoded in the URL path segment, following Next.js App Router conventions:

```
/ar/teams        → Arabic
/he/teams        → Hebrew
/ar/trainers/42  → Arabic trainer profile
```

Next.js middleware inspects the incoming request, reads a locale preference cookie, and redirects to the appropriate locale prefix if absent.

### Trilingual Database Fields

Every entity in the database stores its name in three languages:

| Column | Purpose |
|--------|---------|
| `name_ar` | Arabic display name |
| `name_he` | Hebrew display name |
| `name_en` | English — used in Excel export and admin tooling |

A shared helper resolves the correct field at render time:

```ts
export function getLocalizedField(
  obj: Record<string, unknown>,
  field: string,
  locale: string
): string {
  return (obj[`${field}_${locale}`] ?? obj[`${field}_ar`] ?? '') as string
}
```

Arabic is the fallback — if a Hebrew string is missing, the Arabic value is displayed rather than an empty string or an error.

### Dictionary Files

Static UI strings (labels, button text, error messages) are loaded from JSON dictionary files:

```
src/dictionaries/ar.json
src/dictionaries/he.json
```

Server components call `getDictionary(locale)` once at the page level and pass the `dict` object down as props, avoiding per-component dictionary loading.

### RTL Layout

`dir="rtl"` is set on the root `<html>` element globally. Tailwind CSS 4's logical properties (`ms-`, `me-`, `ps-`, `pe-`) are used throughout rather than physical `left`/`right` properties, ensuring icons, margins, paddings, and flex directions all mirror correctly without per-locale style overrides.

---

## 3. Excel Import Wizard

### Overview

The import wizard allows a head coach to bulk-load trainees, trainers, teams, and halls from spreadsheet files. It handles messy real-world data: mixed-language column headers, missing foreign keys, and multi-sheet workbooks.

### Four-Step Wizard Flow

```
Step 1: Upload       → File picker, validates type/size (≤5MB, .xlsx/.xls/.csv)
Step 2: Sheet Select → Parses workbook, lists available sheets for selection
Step 3: Smart Review → Auto-detects table type, maps columns, shows preview
Step 4: Import       → Batch inserts with live progress bar
```

### Auto-Detection with Confidence Scoring

The wizard scores each column header against multilingual keyword dictionaries covering Arabic, Hebrew, and English synonyms for field names:

| Match Type | Score |
|------------|-------|
| Exact match | 100 |
| Contains match | 60 |
| Fuzzy / Levenshtein distance | 40 |

The aggregate score across all headers determines which of the four target tables (`trainees`, `trainers`, `classes`, `halls`) the sheet most likely represents, along with a confidence percentage displayed to the user.

### Column Mapping UI

Auto-mapped columns are shown with their confidence percentage. The user can override any mapping via a dropdown before proceeding to import. This handles non-standard column naming that the auto-detector cannot resolve confidently.

### Smart Dependency Resolution

Import order respects foreign key constraints:

```
Halls → Trainers → Classes → Trainees
```

If a trainer name referenced in an Excel row does not match any existing trainer record, the wizard creates the trainer automatically rather than failing with a foreign key error.

### Batch Processing

Records are inserted in batches of 10 with a progress bar updating after each batch. This prevents request timeouts on large imports and provides visible feedback for files with hundreds of rows.

---

## 4. Excel Export

### Overview

Head coaches can export current data to formatted `.xlsx` workbooks for record-keeping, sharing with club management, or feeding into external systems.

### Exportable Entities

- Trainees (with team and trainer associations)
- Trainers (with contact details)
- Teams / Classes (with schedule summary)

### Implementation Highlights

Column headers use Arabic field labels sourced from `TABLE_SCHEMAS`, ensuring exported files are immediately readable to Arabic-speaking staff without manual header renaming.

The `xlsx` library is dynamically imported to avoid adding ~200KB to the initial JavaScript bundle for users who never trigger an export:

```ts
const xlsx = await import('xlsx')
```

The export action constructs a workbook in memory and triggers a browser download via a Blob URL, with no server-side file storage required.

---

## 5. Recurring Schedule System

### Overview

Teams train on fixed weekly schedules. The system stores these recurring slots once and generates concrete event records on demand, avoiding the need to pre-populate a calendar table years in advance.

### Data Model

The `class_schedules` table stores weekly recurring slots:

| Column | Type | Description |
|--------|------|-------------|
| `class_id` | UUID | The team this schedule belongs to |
| `day_of_week` | int (0-6) | 0 = Sunday, 6 = Saturday |
| `start_time` | time | Local Israel time |
| `end_time` | time | Local Israel time |
| `hall_id` | UUID | Training hall |

### On-Demand Event Creation

A Postgres RPC function `ensure_events_for_schedules` is called on dashboard load. It checks whether event records already exist for today's date matching each active schedule, and creates them if not. This is idempotent — calling it multiple times per day has no effect after the first call.

```ts
await supabase.rpc('ensure_events_for_schedules', { target_date: todayISO })
```

### Schedule vs. Manual Events

Events with `schedule_id != null` were generated by the recurring schedule system. Events with `schedule_id = null` are manually created (friendly matches, special training sessions, tournaments). This distinction allows the UI to present scheduled events differently from ad-hoc ones.

### Schedule Editor

The `ScheduleEditor` component provides inline editing of each schedule slot's day, time, and hall. Changes persist immediately via server actions and call `revalidatePath()` to refresh the relevant pages.

---

## 6. Attendance System

### Overview

Trainers mark attendance per event, per trainee. The system supports three states and provides historical views for coaching analysis.

### StatusToggle Component

A single tap cycles through attendance states:

```
present (green) → absent (red) → late (amber) → present
```

The component uses optimistic local state — the UI updates instantly on tap, and the change is queued for bulk save. This eliminates round-trip latency for marking an entire team's attendance.

### Bulk Save

All pending attendance changes are batched into a single RPC call:

```ts
await supabase.rpc('bulk_save_attendance', { records: pendingChanges })
```

This replaces the naive approach of one HTTP request per trainee, reducing network overhead from O(n) to O(1) for a team of any size.

### Per-Trainee Statistics

Each trainee's profile shows aggregate attendance counts over the last 90 days:

- Present count
- Absent count
- Late count

These are computed server-side in a bounded query filtered to the 90-day window, not by loading all historical records and counting in JavaScript.

### Team Attendance History View

A matrix view shows the last 30 days of a team's attendance:

- **Columns:** Events (most recent on the right)
- **Rows:** Trainees
- **Cells:** Color-coded status badge

This gives the head coach an immediate visual pattern — a player with a red column of absences stands out instantly.

### Attendance Date Routing

Attendance URLs are event-specific: `/ar/attendance/[eventId]`. Links to today's attendance events are generated on the dashboard from the day's schedule using the Israel timezone utilities, ensuring the correct date is used even when the server runs in UTC.

---

## 7. Payment Tracking

### Overview

The system tracks each trainee's payment status per month/period, with a full log of payment transactions.

### Data Model

Per-trainee payment state:

| Field | Type | Description |
|-------|------|-------------|
| `is_paid` | boolean | Quick paid/unpaid toggle |
| `amount_paid` | numeric | Amount recorded for this period |

The `payment_logs` table stores individual transactions with amount, comment, and timestamp, providing an audit trail.

### PaymentModal

When recording a payment, the modal presents:

- Quick-add chips for common payment amounts (avoids typing on mobile)
- A comment field for notes (e.g., "partial payment — rest next week")
- The full payment log for this trainee

### Class Payments View

The `ClassPaymentsClient` component renders all trainees in a team on one screen with their current payment status. A trainer can see at a glance who has paid and who has not, and tap any row to open the PaymentModal.

### Toggle Behavior

A single tap on a trainee row toggles `is_paid` between paid and unpaid via a server action, with `revalidatePath()` keeping the view current.

---

## 8. Global Search

### Overview

A persistent search bar allows staff to find any trainee or trainer instantly without navigating to a specific team or page.

### UI Behavior

- **Desktop:** Inline dropdown appears below the search input in the header.
- **Mobile:** Full-width overlay covers the screen, providing sufficient space for the soft keyboard and results list.

### Debounced Parallel Queries

The search input is debounced at 300ms. The visible input value updates immediately on each keystroke (no lag), while the API call fires only after typing pauses:

```ts
const handleSearch = (term: string) => {
  setQuery(term) // immediate UI update
  if (debounceRef.current) clearTimeout(debounceRef.current)
  debounceRef.current = setTimeout(async () => {
    const [trainees, trainers] = await Promise.all([
      searchTrainees(term),
      searchTrainers(term),
    ])
    setResults({ trainees, trainers })
  }, 300)
}
```

Both tables are queried in parallel, and results are limited to 5 per entity type to keep the dropdown compact and fast.

### Result Linking

Trainee results link to their team page. Trainer results link to the trainer's profile page. Both display name and phone number for quick identification.

---

## 9. Israel Timezone Handling

### Overview

All date logic in the application explicitly targets the `Asia/Jerusalem` timezone. This is non-trivial because Vercel deployment servers run in UTC, and Israel Standard Time (IST, UTC+2) or Israel Daylight Time (IDT, UTC+3) diverges by 2-3 hours — enough to shift "today" across a midnight boundary.

### Core Utilities

Two utility functions centralize all timezone-aware date operations:

```ts
// Returns "YYYY-MM-DD" in Israel local time
export function getTodayISO(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
  }).format(new Date())
}

// Returns a Date object anchored to Israel's current moment
export function getNowInIsrael(): Date {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  })
  // ... parses formatted parts back into a Date
}
```

### Where It Is Applied

- **Dashboard:** Determining which of today's scheduled events to surface.
- **Attendance:** Stamping the correct date when creating attendance records.
- **Event creation:** Ensuring the `event_date` column stores the Israel-local date, not UTC midnight.
- **`ensure_events_for_schedules` RPC:** The `target_date` parameter passed to the RPC is always computed using `getTodayISO()`.

Without explicit timezone handling, a coach opening the app at 11:30 PM Israel time on a Vercel server in UTC would see the wrong date — yesterday's schedule would appear as today's.

---

## 10. Glassmorphic Dark UI

### Overview

The application uses a consistent dark glassmorphic design system throughout — dark semi-transparent cards over an animated gradient background, golden accent highlights, and layered blur effects.

### Animated Background

Every page renders an `AnimatedMeshBackground` component: an animated dark blue/indigo gradient mesh using CSS keyframe animations. The mesh moves slowly, creating a living background that avoids the static flatness of a plain dark color.

### Card System

Cards follow a strict glassmorphism pattern:

```
bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl
```

- `bg-white/5`: 5% white overlay on the dark background
- `backdrop-blur-2xl`: blurs the animated mesh visible behind the card
- `border border-white/10`: subtle 10% white border for definition

Interactive cards add a hover state: `hover:bg-white/10 transition-colors`.

### Navigation Indicators

The active bottom navigation item uses a golden glow effect to signal the current location:

```
shadow-[0_0_8px_rgba(250,204,21,0.8)]
```

This uses CSS box-shadow rather than a background change, keeping the icon readable while providing a visually distinct golden halo.

### iOS Safe Area

The bottom navigation respects the iPhone home indicator notch:

```
pb-[max(env(safe-area-inset-bottom),8px)]
```

`env(safe-area-inset-bottom)` returns 0 on devices without a notch and ~34px on iPhone X and newer. The `max()` ensures a minimum 8px padding on all devices.

### Typography

Three custom fonts provide typographic hierarchy:

| Font | Usage |
|------|-------|
| Syncopate | Display headings, logo |
| Outfit | Body text, UI labels |
| Space Mono | Monospaced data, jersey numbers |

### Motion

Framer Motion is used for:

- Page transitions (fade + slide)
- Wizard step transitions (slide left/right by step direction)
- Modal enter/exit (scale + fade)
- List item stagger (children animate in sequence with 50ms delay per item)

All animations use `spring` physics rather than `ease` curves for a natural feel on mobile.

---

## 11. Mobile-First Design

### Overview

The application is designed primarily for coaches using iPhones on the sideline. Desktop is a progressive enhancement — the base design target is a 375px-wide viewport.

### Viewport Strategy

All layouts are built at 375px first. Breakpoints (`md:`, `lg:`) add desktop enhancements:

- Mobile: single-column, full-width cards, bottom navigation
- Desktop: sidebar navigation, two-column layouts where appropriate

The CSS convention enforced across the codebase:

| Element | Size | Required class |
|---------|------|----------------|
| Header | 64px fixed | `pt-20` (80px top padding) |
| Sidebar | 240px | `md:ml-[240px]` |
| Bottom nav | 72px | `pb-24` mobile / `md:pb-8` desktop |

### Touch Target Enforcement

All interactive elements maintain a minimum 48x48px touch target. For small icons or inline controls, invisible padding is added:

```tsx
<button className="p-3 min-h-[48px] min-w-[48px] flex items-center justify-center">
  <ChevronRight size={18} />
</button>
```

This prevents the "fat finger" problem where small buttons in a list require multiple tap attempts.

### ScrollTimePicker

The native `<input type="time">` renders inconsistently across iOS versions and cannot be styled to match the dark glassmorphic design. A custom `ScrollTimePicker` component replaces it: a momentum-scroll wheel for hours and minutes, matching the iOS system time picker interaction model.

### JerseyNumber Component

Trainee jersey numbers are displayed using a custom `JerseyNumber` component that renders the number in a stylized basketball jersey silhouette using Space Mono font. This provides visual identity for each player in list views without requiring photos.

### Bottom-Sheet Modals

On mobile viewports, modals render as bottom sheets — they slide up from the bottom edge and cover 80-90% of the screen height. This is more thumb-accessible than centered modal dialogs, where the close button and confirm action land in the unreachable top half of the screen on a tall phone.

On desktop, the same modals render as centered dialogs with a backdrop overlay, using responsive Tailwind classes to switch between the two presentations without duplicating component logic.

---

*This document reflects the current implementation as of the `uiux-logic-refactor` branch. Features subject to change as the product evolves.*
