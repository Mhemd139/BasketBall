<p align="center">
  <img src="public/images/logo.jpg" alt="Basketball Manager" width="120" height="120" style="border-radius: 24px;" />
</p>

<h1 align="center">Basketball Manager</h1>

<p align="center">
  <strong>A full-stack basketball training operations platform</strong><br/>
  Manage halls, trainers, teams, players, attendance, and payments — all from your phone.
</p>

<p align="center">
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript" alt="TypeScript" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind CSS 4" /></a>
  <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase" alt="Supabase" /></a>
  <img src="https://img.shields.io/badge/Tests-106_passing-22C55E" alt="Tests" />
</p>

<p align="center">
  <sub>Mobile-first &nbsp;|&nbsp; RTL-native (Arabic + Hebrew) &nbsp;|&nbsp; Stateless HMAC Auth &nbsp;|&nbsp; 106 Automated Tests</sub>
</p>

---

## What is Basketball Manager?

Basketball Manager is a production-grade operations platform built for head coaches to run their entire basketball training program from a single app. It replaces spreadsheets, WhatsApp groups, and paper attendance sheets with a unified system designed for phones.

**Built for:**
- **Head coaches** managing multiple halls, trainers, and teams
- **Trainers** tracking attendance and rosters for their assigned teams
- **Basketball academies** handling seasonal payments and player data

---

## Features

| Module | Description |
|--------|-------------|
| **Teams** | Create teams, assign trainers and halls, manage player rosters with jersey numbers |
| **Attendance** | Tap-to-toggle per event (present / absent / late), bulk save, 30-day team history matrix |
| **Schedules** | Define weekly recurring slots — events auto-generate daily from schedules |
| **Payments** | Per-player payment tracking with transaction logs and class-wide status views |
| **Halls** | Manage venues with monthly event calendars and weekly schedule grids |
| **Trainers** | Profile management, availability scheduling, team reassignment |
| **Search** | Global debounced search across trainees and trainers (parallel queries, 300ms) |
| **Import/Export** | 4-step Excel wizard with smart column detection and multilingual header matching |
| **Admin Panel** | Head coach area — trainer CRUD, bulk import/export, system management |

**Additional capabilities:**
- Bilingual RTL interface (Arabic + Hebrew) with trilingual database fields
- Stateless HMAC-SHA256 phone authentication via Vonage or Twilio SMS
- Glassmorphic dark UI with animated mesh backgrounds and Framer Motion transitions
- Loading states with animated basketball spinner on every route
- iOS safe area support with proper bottom nav padding

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | [Next.js 16](https://nextjs.org/) | App Router, Server Components, Server Actions, Turbopack |
| **UI** | [React 19](https://react.dev/) | Latest RSC support, concurrent features |
| **Language** | [TypeScript 5.9](https://www.typescriptlang.org/) | Strict mode, full type safety |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first with RTL support, custom design tokens |
| **Database** | [Supabase](https://supabase.com/) | PostgreSQL with RLS + 24 SECURITY DEFINER RPCs |
| **Auth** | Custom HMAC-SHA256 | Stateless OTP via [Vonage](https://www.vonage.com/) / [Twilio](https://www.twilio.com/) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) | Page transitions, wizard steps, modal animations |
| **Icons** | [Lucide React](https://lucide.dev/) | Tree-shakable, consistent icon set |
| **Excel** | [SheetJS](https://sheetjs.com/) | Dynamic import for `.xlsx` / `.csv` parsing and generation |
| **Testing** | [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) | 82 unit + 24 E2E tests |
| **Deployment** | [Vercel](https://vercel.com/) | Edge-optimized with automatic deployments |

---

## Architecture

```
                    ┌─────────────────────────────────────────┐
                    │              Client (Browser)            │
                    │  React 19 · Tailwind CSS 4 · Framer Motion│
                    └──────────────────┬──────────────────────┘
                                       │
                              Server Components
                              Server Actions
                                       │
                    ┌──────────────────┴──────────────────────┐
                    │           Next.js 16 App Router          │
                    │  Middleware (Auth + Locale Routing)       │
                    │  Cookie-based Sessions (HMAC-signed)      │
                    └──────────────────┬──────────────────────┘
                                       │
                              supabase.rpc()
                                       │
                    ┌──────────────────┴──────────────────────┐
                    │         Supabase (PostgreSQL)             │
                    │  RLS Policies (block direct writes)       │
                    │  SECURITY DEFINER Functions (RPCs)        │
                    │  8 Tables · 24 RPC Functions              │
                    └─────────────────────────────────────────┘
```

**Key architectural decisions:**

| Decision | Rationale |
|----------|-----------|
| Server-first components | Pages default to RSC. `'use client'` only for hooks and event handlers |
| RPC-only mutations | Direct writes blocked by RLS. All mutations go through SECURITY DEFINER functions |
| Surgical caching | No `force-dynamic`. `revalidatePath()` after mutations for targeted invalidation |
| Parallel queries | Independent Supabase calls always wrapped in `Promise.all()` |
| Stateless auth | HMAC-SHA256 tokens in httpOnly cookies — no session table, no JWT library |
| Israel timezone | All date logic uses `Asia/Jerusalem` via `Intl.DateTimeFormat` for Vercel UTC compatibility |

---

## Database Schema

8 tables with Row Level Security enabled on all of them:

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   trainers   │       │    halls     │       │ payment_logs │
│──────────────│       │──────────────│       │──────────────│
│ id           │◄──┐   │ id           │◄──┐   │ id           │
│ name_ar/he/en│   │   │ name_ar/he/en│   │   │ trainee_id ──│──┐
│ phone        │   │   │ description  │   │   │ amount       │  │
│ role         │   │   │ created_at   │   │   │ season       │  │
│ gender       │   │   └──────────────┘   │   │ note         │  │
│ availability │   │                      │   └──────────────┘  │
│ avail_sched  │   │   ┌──────────────┐   │                     │
└──────────────┘   │   │   events     │   │   ┌──────────────┐  │
       ▲           ├───│──────────────│   │   │  attendance   │  │
       │           │   │ id           │◄──│───│──────────────│  │
       │           │   │ hall_id    ──│───┘   │ id           │  │
       │           │   │ trainer_id ──│───┐   │ trainee_id ──│──┤
       │           │   │ type         │   │   │ event_id   ──│──┘
       │           │   │ title_ar/he  │   │   │ status       │
       │           │   │ event_date   │   │   │ marked_by  ──│───┐
       │           │   │ start/end    │   │   │ marked_at    │   │
       │           │   │ schedule_id  │   │   └──────────────┘   │
       │           │   └──────────────┘   │                      │
       │           │          ▲           │   ┌──────────────┐   │
       │           │          │           │   │ categories   │   │
       │           │   ┌──────┴───────┐   │   │──────────────│   │
       │           └───│   classes    │   │   │ id           │   │
       │               │ (= Teams)   │   │   │ name_ar/he/en│   │
       │               │──────────────│   │   └──────┬───────┘   │
       │               │ id           │◄──│──────────┘           │
       │               │ name_ar/he/en│   │                      │
       └───────────────│ trainer_id   │   │                      │
                       │ category_id  │   │                      │
                       └──────┬───────┘   │                      │
                              │           │                      │
         ┌────────────────────┤           │                      │
         │                    │           │                      │
  ┌──────┴───────┐     ┌─────┴────────┐  │                      │
  │  trainees    │     │class_schedules│  │                      │
  │ (= Players)  │     │──────────────│  │                      │
  │──────────────│     │ id           │  │                      │
  │ id           │     │ class_id   ──│──┘                      │
  │ name_ar/he/en│     │ hall_id   ──│                           │
  │ phone        │     │ day_of_week │                           │
  │ jersey_number│     │ start/end   │                           │
  │ class_id   ──│     └─────────────┘                           │
  │ is_paid      │                                               │
  │ amount_paid  │───────────────────────────────────────────────┘
  │ gender       │
  └──────────────┘
```

**Key relationships:**
- A **trainer** manages many **teams** and is assigned to many **events**
- A **team** has one trainer, one category, many **players**, and many **weekly schedule slots**
- **Schedule slots** auto-generate **events** daily via the `ensure_events_for_schedules` RPC
- **Attendance** records link a player to an event with a status (present / absent / late)
- **Payment logs** track individual transactions per player per season
- All text fields are **trilingual** — `name_ar`, `name_he`, `name_en` on every entity

See [docs/DATABASE.md](docs/DATABASE.md) for the complete column reference and ER diagram.

---

## Authentication

Custom cookie-based auth flow — no Supabase Auth, no JWT library:

```
Phone → Normalize (Arabic/Persian digits) → SMS OTP (Vonage/Twilio) → HMAC Verify → Session Cookie
```

1. User enters phone number (supports Arabic ٠-٩ and Persian ۰-۹ digit input)
2. Phone normalized to Israeli format (`05X` → `9725X`)
3. 4-digit OTP sent via Vonage or Twilio (whichever keys are configured)
4. OTP verified stateless via HMAC-SHA256 — no database lookup needed
5. Signed `admin_session` httpOnly cookie set with `{ id, name, role }`
6. New users complete a profile setup step (name, gender, availability)
7. Middleware enforces auth on all routes except `/login`

**Roles:**

| Role | Access |
|------|--------|
| `headcoach` | Full admin — manage trainers, teams, halls, import/export, all data |
| `trainer` | View assigned teams, mark attendance, edit own profile |

---

## Testing

106 automated tests — all passing:

| Suite | Tests | Runner | Time |
|-------|-------|--------|------|
| Unit | 82 | Vitest | ~3s |
| E2E | 24 | Playwright (Desktop Chrome) | ~55s |

```bash
npm test              # Unit tests (watch mode)
npm run test:run      # Unit tests (single run)
npm run test:coverage # Unit tests with v8 coverage report
npm run test:e2e      # E2E tests (starts dev server automatically)
```

**Unit tests cover:** utility functions (38), HMAC session tokens (10), i18n config (13), StatusToggle component (11), BottomNav component (10).

**E2E tests cover:** full OTP login flow, page navigation, team/hall/payment drill-down, attendance links, RTL direction verification, accessibility audits via axe-core, mobile UX (sticky header, nav structure, touch targets).

See [docs/TESTING.md](docs/TESTING.md) for the full testing strategy and how to add new tests.

---

## Internationalization

| Locale | Direction | Status |
|--------|-----------|--------|
| Arabic (`ar`) | RTL | Primary — full UI translations |
| Hebrew (`he`) | RTL | Full UI translations |

- URL-based locale routing: `/ar/teams`, `/he/teams`
- Middleware auto-detects locale from cookie, defaults to Arabic
- Dictionary-based UI translations in `src/dictionaries/`
- All database fields store three values (`_ar`, `_he`, `_en`)
- `getLocalizedField(obj, field, locale)` utility with Arabic fallback
- English (`en`) columns exist for data export and admin tooling

---

## Project Structure

```
src/
├── app/
│   ├── actions.ts                   # 40+ server actions (all mutations)
│   └── [locale]/                    # All routes under locale prefix
│       ├── page.tsx                 # Dashboard — stats + today's schedule
│       ├── login/                   # 3-step OTP login flow
│       ├── teams/                   # List → detail → attendance history → add player
│       ├── halls/                   # List → detail with monthly calendar
│       ├── attendance/[eventId]/    # Per-event attendance sheet
│       ├── trainers/               # List → profile with availability
│       ├── payments/               # Hub → per-team payment tracking
│       ├── schedule/               # 7-day schedule view
│       ├── head-coach/             # Admin panel + Excel import wizard
│       └── profile/, more/, settings/, reports/
├── components/                      # 50+ components across 12 domains
│   ├── layout/                      # Header, Sidebar, BottomNav, AppShell
│   ├── attendance/                  # AttendanceSheet, StatusToggle
│   ├── teams/                       # TraineeList, ScheduleEditor, AttendanceHistoryView
│   ├── halls/                       # HallSchedule, InteractiveEventModal
│   ├── payments/                    # PaymentModal, ClassPaymentsClient
│   ├── import/                      # 4-step ImportWizard, ExportButton
│   └── ui/                          # Toast, ScrollTimePicker, JerseyNumber, etc.
├── lib/
│   ├── utils.ts                     # cn(), date/timezone helpers, phone normalization
│   ├── session.ts                   # HMAC sign/verify (Web Crypto API)
│   ├── i18n/                        # Locale config + dictionary loader
│   ├── excel/                       # Parser, mapper, transformer, analyzer, exporter
│   └── supabase/                    # Client/server instances + generated types
├── middleware.ts                     # Locale detection + auth enforcement
└── dictionaries/                    # ar.json, he.json UI strings

e2e/                                 # 9 Playwright spec files
src/**/__tests__/                    # 5 Vitest test files
```

---

## Getting Started

### Prerequisites

- **Node.js** 20+ and **npm**
- **Supabase** project with the schema applied
- **Vonage** or **Twilio** API credentials (for production SMS OTP)

### Installation

```bash
git clone https://github.com/Mhemd139/BasketBall.git
cd BasketBall
npm install
```

### Environment Variables

Create `.env.local` in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Session signing
HMAC_SECRET=your_random_secret_key

# SMS Provider (at least one for production)
VONAGE_API_KEY=your_key
VONAGE_API_SECRET=your_secret
VONAGE_FROM_NUMBER=your_number
```

### Development

```bash
npm run dev     # Start with Turbopack on localhost:3000
```

Open `http://localhost:3000/ar` (Arabic) or `http://localhost:3000/he` (Hebrew).

---

## Design System

### Visual Identity

| Token | Hex | Usage |
|-------|-----|-------|
| Navy | `#254263` | Primary backgrounds, headers |
| Navy Dark | `#0f1f3d` | Deep backgrounds |
| Gold | `#ffd700` | Accent, highlights, active indicators |
| Orange | `#d97639` | Basketball-themed secondary |
| Success | `#22c55e` | Present, paid, positive states |
| Error | `#ef4444` | Absent, errors, negative states |
| Warning | `#f59e0b` | Late, caution states |

### Typography

| Font | Usage |
|------|-------|
| Cairo | Arabic text |
| Rubik | Hebrew text |
| Inter | Default UI text |
| Syncopate | Display headings |
| Outfit | Secondary headings |

### Layout Constants

| Element | Size | Required CSS |
|---------|------|-------------|
| Header | 64px fixed | `pt-20` on page content |
| Sidebar | 240px (desktop only) | `md:ml-[240px]` on page content |
| Bottom Nav | 72px (mobile only) | `pb-24` mobile, `md:pb-8` desktop |

### Mobile-First Principles

- Designed for **375px viewport** first — desktop is progressive enhancement
- Touch targets **>= 48px** on all interactive elements
- **Bottom nav** is the primary mobile navigation (4-5 thumb-reachable tabs)
- Primary actions positioned in the **thumb zone** (bottom half of screen)
- iOS safe area: `pb-[max(env(safe-area-inset-bottom),8px)]`

---

## Security

| Measure | Implementation |
|---------|---------------|
| Row Level Security | Enabled on all tables — direct writes blocked |
| SECURITY DEFINER RPCs | 24 Postgres functions for controlled mutations |
| HMAC-SHA256 sessions | Signed, tamper-proof session tokens |
| httpOnly cookies | Not accessible via JavaScript |
| Middleware enforcement | Unauthenticated users redirected to login |
| Role-based access | Head coach vs. trainer permissions |
| No service role key | All elevated operations go through RPCs |

---

## Performance

| Rule | Implementation |
|------|---------------|
| Parallel queries | `Promise.all()` for independent Supabase calls |
| Bounded queries | Every `.select()` has `.limit()` or date filter |
| Surgical caching | `revalidatePath()` after mutations — no `force-dynamic` |
| Debounced search | 300ms debounce on keystroke-triggered queries |
| Server Components | Default RSC — `'use client'` only when necessary |
| Selective columns | Fetch only needed fields, not `select('*')` |
| Image optimization | `next/image` with proper sizing and lazy loading |
| Dynamic imports | Excel library loaded on demand (avoids 200KB upfront) |

See [docs/PERFORMANCE.md](docs/PERFORMANCE.md) for detailed rules with code examples.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | ESLint check |
| `npm test` | Unit tests (watch mode) |
| `npm run test:run` | Unit tests (single run) |
| `npm run test:coverage` | Unit tests with v8 coverage |
| `npm run test:e2e` | E2E tests (Playwright) |

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/ARCHITECTURE.md) | System design, auth flow, data flow diagrams |
| [Features](docs/FEATURES.md) | Deep dives into each major feature |
| [Database](docs/DATABASE.md) | Complete schema, ER diagram, RPC reference |
| [Testing](docs/TESTING.md) | Testing strategy and how to add new tests |
| [API Reference](docs/API.md) | All 40+ server actions documented |
| [Setup Guide](docs/SETUP.md) | Local development setup and troubleshooting |
| [Components](docs/COMPONENTS.md) | Component library reference |
| [Performance](docs/PERFORMANCE.md) | Enforced performance rules with code examples |

---

## License

[ISC](LICENSE)

---

<p align="center">
  <sub>Built with Next.js 16 + React 19 + Supabase + Tailwind CSS 4</sub>
</p>
