# Basketball Manager

A full-stack basketball training management system built for managing halls, trainers, teams, players, attendance tracking, and payments. Designed as a mobile-first Arabic RTL application.

## Overview

Basketball Manager is used by head coaches to manage their entire basketball training operation:

- **3 Basketball Halls** with event scheduling
- **Trainers** with role-based access (Head Coach / Trainer)
- **Teams** (classes) assigned to trainers and halls
- **Players** (trainees) with roster management
- **Tap-to-toggle attendance** marking per event
- **Payment tracking** (seasonal per player)
- **Bulk Excel import/export** for data migration

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| [Next.js](https://nextjs.org/) | 16 | App Router, Server Components, Server Actions |
| [React](https://react.dev/) | 19 | UI library |
| [TypeScript](https://www.typescriptlang.org/) | 5.9 | Type safety |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | Utility-first styling with RTL support |
| [Supabase](https://supabase.com/) | - | PostgreSQL database, RLS, RPC functions |
| [Vonage](https://www.vonage.com/) | - | SMS OTP for authentication |
| [SheetJS](https://sheetjs.com/) | 0.18 | Client-side Excel parsing and generation |
| [Framer Motion](https://www.framer.com/motion/) | 12 | Animations and transitions |
| [Lucide React](https://lucide.dev/) | - | Icon library |

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (project ID: `amzfssqkjefzzbilqmfe`)
- Vonage API credentials for SMS OTP

### Installation

```bash
npm install
```

### Environment Variables

Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://amzfssqkjefzzbilqmfe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
OTP_SECRET=your_hmac_secret
VONAGE_API_KEY=your_vonage_key
VONAGE_API_SECRET=your_vonage_secret
```

### Development

```bash
npm run dev          # Runs with Turbopack
npm run build        # Production build
npm start            # Start production server
```

The app runs at `http://localhost:3000` and redirects to `/ar` (Arabic).

## Authentication

Custom cookie-based auth with SMS OTP:

1. User enters phone number
2. Vonage sends SMS with OTP code
3. Stateless HMAC verification (no DB lookup for OTP)
4. Session cookie (`admin_session`) set with `{ id, name, role }`
5. `getSession()` reads from cookie on every request

Roles:
- **headcoach** - Full admin access (manage trainers, teams, import data)
- **trainer** - View their own teams and mark attendance

## Database Architecture

All data lives in Supabase PostgreSQL with Row Level Security (RLS) enabled on every table.

### Tables

| Table | UI Name | Description |
|---|---|---|
| `trainers` | Trainers | Coaches with phone, name (AR/HE/EN), role, availability |
| `halls` | Halls | Basketball courts with multilingual names |
| `classes` | Teams | Groups assigned to a trainer and hall |
| `trainees` | Players | Players belonging to a team, with jersey numbers |
| `events` | Events | Training sessions and games at halls |
| `attendance` | Attendance | Per-player per-event status (present/absent/late) |
| `payment_logs` | Payments | Payment records per player per season |

### RLS + RPC Pattern

Direct table writes are **blocked** by RLS policies (`WITH CHECK (false)`). All mutations go through `SECURITY DEFINER` Postgres functions (RPCs) that bypass RLS:

```
Client -> Server Action -> supabase.rpc('function_name', params) -> DB
```

Key RPCs: `upsert_event`, `insert_class`, `insert_hall`, `insert_trainee`, `update_trainee_rpc`, `upsert_attendance`, `bulk_upsert_attendance`, `insert_payment_log`, `create_trainer`, `update_trainer_rpc`, `delete_event`, `delete_class`, `delete_trainee`, `delete_trainer_rpc`

The full SQL definitions are in [rls_security.sql](rls_security.sql).

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                          # Root layout
│   ├── actions.ts                          # All server actions (25+ mutations)
│   ├── globals.css                         # Tailwind globals
│   └── [locale]/
│       ├── layout.tsx                      # Locale layout (RTL, fonts)
│       ├── page.tsx                        # Dashboard (today's events)
│       ├── login/page.tsx                  # OTP login flow
│       ├── halls/
│       │   ├── page.tsx                    # All halls
│       │   └── [id]/page.tsx              # Hall detail + schedule
│       ├── teams/
│       │   ├── page.tsx                    # All teams
│       │   ├── [classId]/page.tsx         # Team roster
│       │   └── [classId]/add/page.tsx     # Add player to team
│       ├── trainers/
│       │   ├── page.tsx                    # All trainers
│       │   └── [id]/page.tsx              # Trainer profile
│       ├── attendance/
│       │   └── [eventId]/page.tsx         # Mark attendance
│       ├── payments/
│       │   ├── page.tsx                    # Select team for payments
│       │   └── [classId]/page.tsx         # Team payment tracking
│       ├── schedule/page.tsx               # Full event schedule
│       ├── reports/page.tsx                # Reports dashboard
│       ├── head-coach/
│       │   ├── page.tsx                    # Admin panel
│       │   └── import/page.tsx            # Excel import wizard
│       ├── profile/page.tsx                # User profile
│       ├── settings/page.tsx               # Settings
│       └── more/page.tsx                   # More menu
│
├── components/
│   ├── admin/                              # Trainer management
│   ├── attendance/                         # Attendance sheet + status toggle
│   ├── events/                             # Event cards + management
│   ├── halls/                              # Hall cards, schedule, event modals
│   ├── home/                               # Quick actions dashboard
│   ├── import/                             # Excel import wizard (8 components)
│   ├── layout/                             # AppShell, Header, Sidebar, BottomNav
│   ├── payments/                           # Payment list + modals
│   ├── players/                            # Create player modal
│   ├── profile/                            # Profile content
│   ├── teams/                              # Team cards, create modal, reassign
│   ├── trainees/                           # Trainee profile modal
│   ├── trainers/                           # Trainer profile + edit modals
│   └── ui/                                 # Button, Card, Input, Badge, Dialog,
│                                           # Toast, ConfirmModal, LoadingSpinner
│
├── lib/
│   ├── excel/                              # Excel import/export engine
│   │   ├── types.ts                        # TypeScript interfaces
│   │   ├── constants.ts                    # Table schemas, mapping hints
│   │   ├── parser.ts                       # SheetJS parsing, merge resolution
│   │   ├── mapper.ts                       # Auto column mapping with scoring
│   │   ├── transformer.ts                  # Data normalization, FK resolution
│   │   └── exporter.ts                     # Excel file generation
│   ├── i18n/
│   │   ├── config.ts                       # Locale config (ar, he, en)
│   │   └── get-dictionary.ts               # Dictionary loader
│   ├── supabase/
│   │   ├── client.ts                       # Browser client
│   │   ├── server.ts                       # Server client with cookies
│   │   └── types.ts                        # Database type definitions
│   ├── session.ts                          # JWT session sign/verify
│   └── utils.ts                            # cn() utility (clsx + tailwind-merge)
│
├── dictionaries/                           # i18n translation files
│   ├── ar.json                             # Arabic
│   ├── he.json                             # Hebrew
│   └── en.json                             # English
│
└── middleware.ts                            # Locale detection + routing
```

## Features in Detail

### Dashboard

Today's events with quick-access cards showing upcoming training sessions and games. Stats overview of halls, teams, and players.

### Hall Management

Each hall displays its event schedule. Head coaches can create, edit, and delete events. Events have multilingual titles, date/time, trainer assignment, and notes.

### Team Management

Teams (stored as `classes` in DB) are assigned to a trainer and optionally a hall. Head coaches can create teams, reassign trainers, and manage rosters. Players can be transferred between teams.

### Attendance

Tap-to-toggle attendance marking for each event. Three statuses: present, absent, late. Bulk attendance support. Attendance history per team.

### Payments

Track seasonal payments per player (3000 NIS/year). Payment modals with amount input and notes. Payment logs stored per transaction.

### Excel Import/Export

**Import** — 6-step wizard (head coach only):

1. **Upload** — Drag-and-drop `.xlsx`/`.xls`/`.csv` file
2. **Sheet Select** — Pick which sheet (auto-skips for single-sheet files)
3. **Column Mapping** — Auto-maps Excel headers to DB fields using keyword scoring in AR/HE/EN. Manual override available.
4. **Preview** — Validate every row (green/yellow/red status), see warnings and errors
5. **Resolve Trainers** — If importing teams with unknown trainer names, enter phone numbers to auto-create trainer accounts
6. **Import** — Batch insert via RPCs with progress bar

Supports importing into: `classes`, `trainers`, `trainees`, `halls`

**Export** — Download current data as `.xlsx` from the head coach panel.

### Admin Panel (Head Coach)

- Add/edit/delete trainers with role assignment
- Import data from Excel
- Export data to Excel
- Manage all teams and halls

## Layout Constants

| Element | Size | CSS |
|---|---|---|
| Header | 64px fixed | Pages need `pt-20` (80px top padding) |
| Sidebar | 240px | Pages need `md:ml-[240px]` |
| Bottom nav | 72px | Pages need `pb-24` mobile, `md:pb-8` desktop |

## Multilingual Support

The app supports Arabic (RTL), Hebrew (RTL), and English (LTR). All database records store names in three columns (`name_ar`, `name_he`, `name_en`). The UI is primarily Arabic. Dictionary-based translations live in `src/dictionaries/`.

## Key Patterns

- **Server Components by default** — only `'use client'` when hooks/events are needed
- **Server Actions for mutations** — all writes go through `src/app/actions.ts`
- **RPC for all DB writes** — never direct `.from().insert()` (blocked by RLS)
- **`revalidatePath()`** after mutations — no `force-dynamic`
- **`Promise.all()`** for independent parallel queries
- **Bounded queries** — every `.select()` has a `.limit()` or date filter
- **Debounced search** — 300ms debounce on keystroke-triggered queries

## License

ISC
