<p align="center">
  <img src="public/images/logo.jpg" alt="Basketball Manager" width="120" height="120" style="border-radius: 24px;" />
</p>

<h1 align="center">Basketball Manager</h1>

<p align="center">
  <strong>A full-stack basketball training operations platform</strong><br/>
  Manage halls, trainers, teams, players, attendance, and payments — all from your phone.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/License-ISC-blue" alt="License" />
</p>

<p align="center">
  <sub>Mobile-first &nbsp;|&nbsp; RTL-native (Arabic & Hebrew) &nbsp;|&nbsp; SMS OTP Auth &nbsp;|&nbsp; Excel Import/Export</sub>
</p>

---

## What is Basketball Manager?

Basketball Manager is a production-grade operations platform built for head coaches to run their entire basketball training program from a single app. It replaces spreadsheets, WhatsApp groups, and paper attendance sheets with a unified system that works on any phone.

**Who it's for:**
- Head coaches managing multiple halls, trainers, and teams
- Trainers tracking attendance and rosters for their assigned teams
- Basketball academies handling seasonal payments and player data

**What it does:**

| Module | Description |
|--------|-------------|
| **Halls** | Manage basketball venues with weekly event scheduling |
| **Trainers** | Role-based access — head coaches manage everything, trainers see their teams |
| **Teams** | Create teams (classes), assign trainers and halls, manage player rosters |
| **Players** | Track trainees with jersey numbers, contact info, and team assignments |
| **Attendance** | Tap-to-toggle attendance per event — present, absent, or late |
| **Payments** | Seasonal payment tracking per player with transaction history |
| **Schedule** | Calendar view of all events across halls |
| **Reports** | Dashboard analytics and attendance summaries |
| **Import/Export** | Bulk data operations via Excel (`.xlsx` / `.csv`) |

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | [Next.js 16](https://nextjs.org/) | App Router, React Server Components, Server Actions, Turbopack |
| **UI** | [React 19](https://react.dev/) | Latest RSC support, concurrent features |
| **Language** | [TypeScript 5.9](https://www.typescriptlang.org/) | Strict mode, full type safety |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first with RTL support, custom design tokens |
| **Database** | [Supabase](https://supabase.com/) | PostgreSQL with Row Level Security + RPC functions |
| **Auth** | Custom OTP via [Vonage](https://www.vonage.com/) | SMS-based, stateless HMAC verification |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) | Smooth transitions and micro-interactions |
| **Icons** | [Lucide React](https://lucide.dev/) | Consistent, tree-shakable icon set |
| **Excel** | [SheetJS](https://sheetjs.com/) | Client-side `.xlsx` / `.csv` parsing and generation |
| **Deployment** | [Vercel](https://vercel.com/) | Edge-optimized hosting with automatic deployments |

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
                    │  7 Tables · 17+ RPC Functions             │
                    └─────────────────────────────────────────┘
```

**Key decisions:**
- **Server-first** — Pages default to Server Components. `'use client'` only when hooks or event handlers are needed.
- **RPC-only mutations** — Direct table inserts/updates are blocked by RLS. All writes go through `SECURITY DEFINER` Postgres functions.
- **Surgical caching** — No `force-dynamic`. Next.js caching with `revalidatePath()` after mutations.
- **Parallel queries** — Independent database calls always wrapped in `Promise.all()`.

---

## Database Schema

7 tables with Row Level Security enabled on all of them:

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
└──────────────┘   │   ┌──────────────┐   │                     │
       ▲           ├───│   events     │   │   ┌──────────────┐  │
       │           │   │──────────────│   │   │  attendance   │  │
       │           │   │ id           │◄──│───│──────────────│  │
       │           │   │ hall_id    ──│───┘   │ id           │  │
       │           │   │ trainer_id ──│───┐   │ trainee_id ──│──┤
       │           │   │ type         │   │   │ event_id   ──│──┘
       │           │   │ title_ar/he  │   │   │ status       │
       │           │   │ event_date   │   │   │ marked_by  ──│───┐
       │           │   │ start/end    │   │   │ marked_at    │   │
       │           │   │ recurrence   │   │   └──────────────┘   │
       │           │   └──────────────┘   │                      │
       │           │                      │                      │
       │           │   ┌──────────────┐   │                      │
       │           └───│   classes    │   │                      │
       │               │ (= Teams)   │   │                      │
       │               │──────────────│   │                      │
       │               │ id           │◄──│──────────────────────┘
       │               │ name_ar/he/en│   │
       └───────────────│ trainer_id   │   │
                       │ hall_id    ──│───┘
                       │ schedule_info│
                       └──────┬───────┘
                              │
                       ┌──────┴───────┐
                       │  trainees    │
                       │ (= Players)  │
                       │──────────────│
                       │ id           │
                       │ name_ar/he/en│
                       │ phone        │
                       │ jersey_number│
                       │ class_id   ──│
                       │ is_paid      │
                       │ amount_paid  │
                       │ gender       │
                       └──────────────┘
```

**Relationships:**
- A **trainer** manages many **teams** (classes) and is assigned to many **events**
- A **hall** hosts many **events** and can be home to many **teams**
- A **team** belongs to one trainer and one hall, and contains many **players** (trainees)
- **Attendance** records link a player to an event with a status
- **Payment logs** track individual transactions per player per season

**All names are trilingual** — every entity stores `name_ar`, `name_he`, and `name_en` columns. The UI renders the correct one based on the active locale.

---

## Authentication

Custom cookie-based auth flow (not Supabase Auth):

```
Phone Number → Vonage SMS OTP → HMAC Verify → Session Cookie
```

1. User enters phone number on the login page
2. Server sends OTP via Vonage SMS API
3. OTP is verified using stateless HMAC-SHA256 (no database lookup)
4. On success, a signed `admin_session` httpOnly cookie is set with `{ id, name, role }`
5. `getSession()` reads and verifies the cookie on every request
6. Middleware enforces auth on all routes except `/login` and `/api/auth`

**Roles:**

| Role | Access |
|------|--------|
| `headcoach` | Full admin — manage trainers, teams, halls, import/export, all data |
| `sub_trainer` | View assigned teams, mark attendance, view own profile |

---

## Features

### Dashboard
Real-time overview of today's events with stat cards showing total halls, teams, and players. Quick-action shortcuts for common operations.

### Hall Management
Each hall displays its weekly event schedule on an interactive timeline. Head coaches can create, edit, and delete events with multilingual titles, date/time ranges, trainer assignment, and recurrence rules.

### Team Management
Teams (stored as `classes` in the database) are assigned to a trainer and optionally a home hall. Head coaches can create teams, reassign trainers, manage rosters, and transfer players between teams.

### Attendance Tracking
Tap-to-toggle attendance marking for each event. Three statuses: **present**, **absent**, **late**. Supports bulk attendance operations. Attendance history is available per team and per player.

### Payment Tracking
Track seasonal payments per player with detailed transaction logs. Payment modals support custom amounts and notes. View payment status across an entire team at a glance.

### Excel Import/Export

**Import** (head coach only) — 6-step wizard:

| Step | Action |
|------|--------|
| 1. Upload | Drag-and-drop `.xlsx`, `.xls`, or `.csv` files |
| 2. Sheet Select | Pick which sheet from the workbook |
| 3. Column Mapping | Auto-maps headers using keyword scoring in Arabic, Hebrew, and English |
| 4. Preview | Validate every row — green (valid), yellow (warning), red (error) |
| 5. Resolve Trainers | Create missing trainer accounts for referenced names |
| 6. Import | Batch insert via RPC functions with real-time progress |

Supports importing: **Teams**, **Trainers**, **Players**, **Halls**

**Export** — Download any table as `.xlsx` from the head coach admin panel.

### Admin Panel
Head coach exclusive area for managing trainers (create, edit, delete, role assignment), bulk data import/export, and system-wide operations.

---

## Internationalization

| Locale | Direction | Status |
|--------|-----------|--------|
| Arabic (`ar`) | RTL | Primary — full translations |
| Hebrew (`he`) | RTL | Full translations |
| English (`en`) | LTR | Available |

- Locale routing via `[locale]` dynamic segment in the URL
- Middleware auto-detects locale from cookies, defaults to Arabic
- Dictionary-based translations in `src/dictionaries/`
- Database records store all names in three columns (`_ar`, `_he`, `_en`)
- `getLocalizedField(obj, field, locale)` utility for runtime locale selection

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                        # Root HTML layout
│   ├── actions.ts                        # 25+ server actions (all mutations)
│   ├── globals.css                       # Design system tokens + Tailwind
│   └── [locale]/
│       ├── layout.tsx                    # Locale layout (RTL/LTR, fonts)
│       ├── page.tsx                      # Dashboard — today's events + stats
│       ├── loading.tsx                   # Loading state (bouncing basketball)
│       ├── login/page.tsx                # SMS OTP login flow
│       ├── halls/
│       │   ├── page.tsx                  # All halls grid
│       │   └── [id]/page.tsx             # Hall detail + event schedule
│       ├── teams/
│       │   ├── page.tsx                  # All teams grid
│       │   ├── [classId]/page.tsx        # Team roster + details
│       │   └── [classId]/add/page.tsx    # Add player to team
│       ├── trainers/
│       │   ├── page.tsx                  # All trainers grid
│       │   └── [id]/page.tsx             # Trainer profile + assigned teams
│       ├── attendance/
│       │   └── [eventId]/page.tsx        # Mark attendance for event
│       ├── payments/
│       │   ├── page.tsx                  # Team selector for payments
│       │   └── [classId]/page.tsx        # Per-team payment tracking
│       ├── schedule/page.tsx             # Full calendar schedule
│       ├── reports/page.tsx              # Analytics dashboard
│       ├── head-coach/
│       │   ├── page.tsx                  # Admin panel
│       │   └── import/page.tsx           # Excel import wizard
│       ├── profile/page.tsx              # User profile
│       ├── settings/
│       │   ├── page.tsx                  # Settings
│       │   └── language/page.tsx         # Language switcher
│       └── more/page.tsx                 # Overflow menu
│
├── components/
│   ├── layout/                           # AppShell, Header, Sidebar, BottomNav
│   ├── ui/                               # Button, Card, Input, Badge, Dialog,
│   │                                     # Toast, ConfirmModal, LoadingSpinner,
│   │                                     # AnimatedMeshBackground, SVGs
│   ├── halls/                            # HallCard, HallSchedule, EventModals
│   ├── teams/                            # TeamCard, CreateTeamModal, TraineeList
│   ├── trainers/                         # TrainerCard, ProfileModal, EditModal
│   ├── trainees/                         # TraineeProfileModal
│   ├── attendance/                       # AttendanceSheet, StatusToggle
│   ├── payments/                         # PaymentsClient, PaymentModal
│   ├── events/                           # EventCard, EventManagementActions
│   ├── import/                           # 6-step ImportWizard + ExportButton
│   ├── home/                             # QuickActions dashboard
│   ├── schedule/                         # ScheduleActions
│   ├── profile/                          # ProfileContent
│   ├── admin/                            # TrainerManager
│   └── players/                          # CreatePlayerModal
│
├── lib/
│   ├── supabase/                         # Client + Server + DB Types
│   ├── i18n/                             # Locale config + dictionary loader
│   ├── excel/                            # Parser, Mapper, Transformer, Exporter
│   ├── session.ts                        # HMAC session sign/verify
│   └── utils.ts                          # cn(), formatDate, getLocalizedField
│
├── dictionaries/                         # ar.json, he.json, en.json
└── middleware.ts                          # Auth enforcement + locale routing
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **Supabase** project with the schema applied
- **Vonage** API credentials for SMS OTP

### Installation

```bash
# Clone the repository
git clone https://github.com/Mhemd139/BasketBall.git
cd BasketBall

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Session Security
SESSION_SECRET=your_hmac_secret_key

# Vonage SMS
VONAGE_API_KEY=your_vonage_key
VONAGE_API_SECRET=your_vonage_secret
```

### Development

```bash
npm run dev        # Start dev server with Turbopack (http://localhost:3000)
npm run build      # Production build
npm start          # Start production server
npm run lint       # Run ESLint
```

The app auto-redirects to `/ar` (Arabic) on first visit.

---

## Design System

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Navy | `#254263` | Primary backgrounds, headers |
| Navy Dark | `#0f1f3d` | Deep backgrounds |
| Gold | `#ffd700` | Accent, highlights, CTAs |
| Orange | `#d97639` | Basketball-themed secondary |
| Success | `#22c55e` | Positive states (present, paid) |
| Error | `#ef4444` | Negative states (absent, errors) |
| Warning | `#f59e0b` | Caution states (late, warnings) |

### Typography

| Font | Usage |
|------|-------|
| Inter | Default UI text |
| Cairo | Arabic text |
| Rubik | Hebrew text |
| Outfit | Secondary headings |
| Syncopate | Display headings |

### Layout Constants

| Element | Size | Required CSS |
|---------|------|-------------|
| Header | 64px fixed | `pt-20` on page content |
| Sidebar | 240px (desktop only) | `md:ml-[240px]` on page content |
| Bottom Nav | 72px (mobile only) | `pb-24` mobile, `md:pb-8` desktop |

### Mobile-First Principles

- Designed for **375px viewport** first, desktop is progressive enhancement
- Touch targets **>= 48px** on all interactive elements
- **Bottom nav** is the primary navigation (5 items, thumb-reachable)
- Primary actions positioned in the **thumb zone** (bottom half of screen)

---

## Security

- **Row Level Security (RLS)** enabled on all tables — direct writes blocked
- **SECURITY DEFINER** Postgres functions for controlled mutations
- **HMAC-SHA256** signed session cookies — tamper-proof
- **httpOnly cookies** — not accessible via JavaScript
- **Middleware auth enforcement** — unauthenticated users redirected to login
- **Role-based access** — head coach vs. trainer permissions
- **No service role key** in client code — all elevated operations via RPC

---

## Performance

| Practice | Implementation |
|----------|---------------|
| Parallel queries | `Promise.all()` for independent DB calls |
| Bounded queries | Every `.select()` has `.limit()` or date filter |
| Surgical caching | `revalidatePath()` after mutations, no `force-dynamic` |
| Debounced search | 300ms debounce on keystroke-triggered queries |
| Server Components | Default RSC — `'use client'` only when necessary |
| Selective columns | `select('id, name')` instead of `select('*')` where possible |
| Optimized images | `next/image` with proper sizing and lazy loading |

---

## RPC Functions

All database mutations go through these `SECURITY DEFINER` Postgres functions:

| Function | Purpose |
|----------|---------|
| `create_trainer` | Create a new trainer account |
| `update_trainer_rpc` | Update trainer details |
| `delete_trainer_rpc` | Delete a trainer |
| `upsert_event` | Create or update an event |
| `delete_event` | Delete an event |
| `insert_class` | Create a new team |
| `update_class` | Update team details |
| `delete_class` | Delete a team |
| `insert_trainee` | Add a new player |
| `update_trainee_rpc` | Update player details |
| `delete_trainee` | Delete a player |
| `upsert_attendance` | Mark attendance (single) |
| `bulk_upsert_attendance` | Mark attendance (batch) |
| `update_trainee_payment_rpc` | Update payment total |
| `insert_payment_log` | Record a payment transaction |
| `update_hall_rpc` | Update hall names |
| `insert_hall` | Create a new hall |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## License

[ISC](LICENSE)

---

<p align="center">
  <sub>Built with Next.js 16 + Supabase + Tailwind CSS 4</sub>
</p>
