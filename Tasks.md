# 🏀 Basketball Team Manager — Project Plan

## Project Overview

A web application for managing a basketball organization led by a head trainer (Samy). The system manages 3 halls, schedules (games & trainings), sub-trainers, trainees, attendance tracking, and payment management.

---

## Domain Model

```
Head Trainer (Samy - Admin)
├── Manages 3 Halls
│   └── Each hall has scheduled events (Games / Trainings)
├── Manages Sub-Trainers
│   └── Each sub-trainer has assigned classes
│       └── Each class has trainees
│           └── Attendance tracked per session
└── Manages Payments
    └── 3000 NIS/year per trainee + admin comments
```

### Entities

| Entity | Fields |
|--------|--------|
| **Trainer** | id, name, phone, role (admin/sub), created_at |
| **Hall** | id, name, description, created_at |
| **Event** | id, hall_id, trainer_id, type (game/training), title, date, start_time, end_time, recurrence_rule, notes |
| **Class** | id, name, trainer_id (sub-trainer), hall_id, schedule_info |
| **Trainee** | id, name, phone, jersey_number, class_id, is_paid, payment_comment (admin only), created_at |
| **Attendance** | id, trainee_id, event_id, status (present/absent/late), marked_by (trainer_id), marked_at |

### Key Relationships
- 1 Admin Trainer → manages everything
- Admin Trainer → many Sub-Trainers
- Sub-Trainer → 1 Class
- Class → many Trainees
- Hall → many Events
- Event → many Attendance records
- Trainee → many Attendance records

---

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + React + Tailwind CSS + TypeScript — mobile-first responsive PWA
- **Backend**: Supabase (Postgres + Auth + RLS + Real-time)
- **Auth**: Supabase Auth (email/phone + magic links)
- **Language**: Multi-language support — Arabic (RTL), Hebrew (RTL), English (LTR)
- **State Management**: React Server Components + Client Components with hooks
- **Deployment**: Vercel (serverless, edge functions, auto-scaling)

---

## UX/UI Design Philosophy

### Target User
Trainers on their phones, standing in a gym hall, marking attendance quickly.

### Design Principles
1. **Mobile-first** — Everything must work perfectly on phone screens
2. **Fast attendance** — Tap-to-mark, swipe gestures, bulk actions. No friction.
3. **Calendar-centric** — The schedule IS the homepage. Trainers see today's events immediately.
4. **Minimal navigation** — Max 2 taps to reach any feature
5. **RTL-ready** — Hebrew support from day one
6. **Role-based views** — Admin sees everything; sub-trainers see only their classes

### Navigation Structure (Mobile)
```
Bottom Tab Bar:
┌──────────┬──────────┬──────────┬──────────┐
│ 📅 Today │ 🏟️ Halls │ 👥 Teams │ ⚙️ More  │
└──────────┴──────────┴──────────┴──────────┘
```

- **Today** — Today's schedule across all halls, quick-tap into attendance
- **Halls** — 3 halls, each with its own calendar view
- **Teams** — Classes, trainees, payment status
- **More** — Trainers management, settings (admin only)

### Attendance UX (Most Important Screen)
```
┌─────────────────────────────────┐
│ ← Hall A Training  │ 18:00     │
│    Jan 15, 2026                 │
├─────────────────────────────────┤
│ [✓ All Present]  [Mark All ✗]  │
├─────────────────────────────────┤
│ ┌─────────────────────────┐    │
│ │ #7  Ahmad Hassan    [✓] │    │
│ ├─────────────────────────┤    │
│ │ #12 Omar Khalil     [✗] │    │
│ ├─────────────────────────┤    │
│ │ #23 Yusuf Nader     [✓] │    │
│ ├─────────────────────────┤    │
│ │ #5  Kareem Said     [⏰]│    │
│ └─────────────────────────┘    │
│                                 │
│ Present: 12  Absent: 3  Late: 1│
│         [Save Attendance]       │
└─────────────────────────────────┘
```

- Single tap toggles: ✓ Present → ✗ Absent → ⏰ Late → ✓ Present
- Jersey number shown prominently for quick identification
- Summary bar at bottom
- Bulk actions at top

---

## Task Breakdown

### Phase 1: Foundation & Infrastructure ✅ (CURRENT PHASE)
> Goal: Next.js setup + Supabase schema + i18n foundation + Auth

- [ ] **1.1** Initialize Next.js project with TypeScript & Tailwind
  - [ ] Run `create-next-app` with App Router, TypeScript, Tailwind, src/ directory
  - [ ] Configure Tailwind with RTL support (logical properties)
  - [ ] Set up custom blue-gold color palette in tailwind.config.ts
  - [ ] Configure fonts: Arabic (Noto Sans Arabic), Hebrew (Noto Sans Hebrew), English (Inter)
  - [ ] Create base layout structure with `[locale]` dynamic segment

- [ ] **1.2** Set up i18n (Arabic/Hebrew/English with RTL/LTR)
  - [ ] Create middleware for locale detection and routing (`/ar`, `/he`, `/en`)
  - [ ] Create i18n config (`src/lib/i18n/config.ts`) with locales, directions, locale names
  - [ ] Create dictionary JSON files (`ar.json`, `he.json`, `en.json`)
  - [ ] Implement dictionary loader (`get-dictionary.ts`)
  - [ ] Create `[locale]/layout.tsx` with `<html lang dir>` setting
  - [ ] Build LocaleSwitcher component

- [ ] **1.3** Set up Supabase project and database schema
  - [ ] Create Supabase project (or use existing)
  - [ ] Create `trainers` table with multilingual name fields
  - [ ] Create `halls` table with multilingual name/description fields
  - [ ] Create `events` table (games & trainings) with multilingual titles
  - [ ] Create `classes` table with multilingual names
  - [ ] Create `trainees` table with multilingual names
  - [ ] Create `attendance` table with status tracking
  - [ ] Create `private.is_admin()` and `private.is_trainer()` helper functions
  - [ ] Set up RLS policies (admin full access, sub-trainers scoped to their classes)
  - [ ] Seed initial data (3 halls, admin trainer Samy)
  - [ ] Generate TypeScript types from Supabase schema

- [ ] **1.4** Supabase Integration in Next.js
  - [ ] Install `@supabase/ssr` and `@supabase/supabase-js`
  - [ ] Create browser Supabase client (`src/lib/supabase/client.ts`)
  - [ ] Create server Supabase client with cookies (`src/lib/supabase/server.ts`)
  - [ ] Add Supabase session refresh to middleware
  - [ ] Set up `.env.local` with Supabase credentials
  - [ ] Create authentication context/hooks

- [ ] **1.5** Core UI Components (Mobile-First)
  - [ ] Create base `ui/` components (Button, Input, Badge, Card, Modal, LoadingSpinner)
  - [ ] Create mobile BottomNav component with 4 tabs (Today, Halls, Teams, More)
  - [ ] Create Header component with back button, title, actions
  - [ ] Create responsive layout shell (`AppShell.tsx`)
  - [ ] Ensure all components support RTL with logical properties

### Phase 2: Halls & Schedule Management
> Goal: Hall management + Calendar/Schedule UI + Today dashboard

- [ ] **2.1** Hall Management UI
  - [ ] Hall list view (3 cards with multilingual hall info)
  - [ ] Hall detail view with embedded calendar
  - [ ] Add/edit hall modal (admin only) with fields for all 3 languages
  - [ ] Server Components for data fetching, Client Components for interactions

- [ ] **2.2** Schedule/Calendar System
  - [ ] Monthly calendar view per hall (use a calendar library like `react-big-calendar` or custom)
  - [ ] Weekly agenda view (default for "Today" tab)
  - [ ] Event creation form with multilingual fields (type: game/training, date, time, hall, notes)
  - [ ] Event editing and deletion (admin + assigned trainer)
  - [ ] Recurring event support (e.g., "every Tuesday 18:00")
  - [ ] Color coding: 🟢 Training | 🔴 Game
  - [ ] Today's events dashboard (home screen) - fetches today's events across all halls
  - [ ] Quick-tap from today's event into attendance marking

- [ ] **2.3** API Routes for Schedule
  - [ ] `/api/events` - CRUD operations for events
  - [ ] `/api/events/recurring` - Handle recurring event expansion
  - [ ] Real-time subscriptions for live schedule updates

### Phase 3: Trainers & Classes Management
> Goal: Trainer management + class assignment + role-based access

- [ ] **3.1** Trainer Management (Admin only)
  - [ ] Add/edit/remove sub-trainers with multilingual name fields
  - [ ] Trainer profile cards (name, phone, assigned class, role)
  - [ ] Trainer list page (`/[locale]/admin/trainers`)
  - [ ] Trainer detail/edit page
  - [ ] Link trainer accounts to Supabase auth users

- [ ] **3.2** Class Management
  - [ ] Create classes with multilingual names
  - [ ] Assign classes to sub-trainers (1 class per sub-trainer)
  - [ ] Assign classes to halls (default training location)
  - [ ] Class schedule info (recurring training times)
  - [ ] Class list view with trainer assignments
  - [ ] Class detail page with roster preview

- [ ] **3.3** Role-Based Access Control
  - [ ] Implement RLS policies for trainers table
  - [ ] Admin sees all classes and trainees
  - [ ] Sub-trainers see only their assigned class
  - [ ] Middleware route guards for admin-only pages
  - [ ] UI conditional rendering based on role

### Phase 4: Trainees & Attendance (Core Feature) 🎯
> Goal: The killer feature — fast mobile attendance marking

- [ ] **4.1** Trainee Management
  - [ ] Add/edit/remove trainees per class (multilingual names)
  - [ ] Trainee profile page (name, phone, jersey #, payment status)
  - [ ] Trainee list with search/filter by name or jersey number
  - [ ] Trainee roster view per class
  - [ ] Import trainees via CSV (bulk upload)
  - [ ] Trainee photo upload (optional, using Supabase Storage if needed)

- [ ] **4.2** Attendance System (Mobile-Optimized)
  - [ ] Attendance marking screen (`/[locale]/attendance/[event_id]`)
  - [ ] Tap-to-toggle status: ✓ Present → ✗ Absent → ⏰ Late → ✓ Present
  - [ ] Bulk mark all present/absent buttons
  - [ ] Live attendance count summary (Present: X, Absent: Y, Late: Z)
  - [ ] Jersey number prominently displayed for quick identification
  - [ ] Optimistic UI updates for instant feedback
  - [ ] Auto-save attendance changes to Supabase
  - [ ] Real-time sync across devices (if multiple trainers marking)

- [ ] **4.3** Attendance History & Reports
  - [ ] Attendance history per trainee (attendance rate %)
  - [ ] Attendance summary per event
  - [ ] Attendance statistics dashboard
  - [ ] Monthly attendance report (trainee-level)
  - [ ] Export attendance to Excel/PDF

### Phase 5: Payments Management
> Goal: Track annual 3000 NIS payments per trainee

- [ ] **5.1** Payment tracking per trainee
  - [ ] Paid/unpaid boolean toggle (admin only)
  - [ ] Admin comment field (multilingual) for payment notes/reasons
  - [ ] Payment date timestamp
  - [ ] Payment overview dashboard (`/[locale]/admin/payments`)
  - [ ] Filter: show only unpaid trainees
  - [ ] Payment reminder system (optional: send WhatsApp/SMS)

- [ ] **5.2** Payment Reports
  - [ ] Monthly payment collection report
  - [ ] Outstanding payments list
  - [ ] Export payments to Excel

### Phase 6: Authentication & Authorization
> Goal: Secure multi-user access with role-based permissions

- [ ] **6.1** Authentication System
  - [ ] Login page (`/[locale]/login`) with email/password
  - [ ] Magic link login option (email-based)
  - [ ] Phone-based login option (SMS OTP via Supabase Auth)
  - [ ] Logout functionality
  - [ ] Session management with Supabase Auth

- [ ] **6.2** Authorization & Roles
  - [ ] Admin role: Full access to all features
  - [ ] Sub-trainer role: Access only to assigned class and events
  - [ ] Middleware auth guards for protected routes
  - [ ] RLS policies enforcement in Supabase
  - [ ] Role-based UI rendering (hide admin features from sub-trainers)
  - [ ] Redirect unauthenticated users to login

- [ ] **6.3** User Onboarding
  - [ ] Admin creates sub-trainer accounts manually
  - [ ] Set `app_metadata.role` to 'admin' or 'sub_trainer'
  - [ ] Initial password setup/reset flow
  - [ ] User profile page (change password, update phone)

### Phase 7: Polish & Advanced Features
> Goal: Production-ready enhancements

- [ ] **7.1** PWA Support
  - [ ] Create `manifest.json` for installable app
  - [ ] Service worker for offline support
  - [ ] App icons for Android/iOS
  - [ ] "Add to Home Screen" prompt

- [ ] **7.2** Notifications
  - [ ] WhatsApp/SMS integration for attendance alerts (Twilio or similar)
  - [ ] Push notifications for upcoming events
  - [ ] Payment reminder notifications

- [ ] **7.3** Reports & Analytics
  - [ ] Attendance statistics dashboard (charts with recharts or similar)
  - [ ] Trainee attendance trends
  - [ ] Hall utilization metrics
  - [ ] Export all reports to Excel/PDF

- [ ] **7.4** Season Management
  - [ ] Define seasons (yearly or custom)
  - [ ] Archive old seasons
  - [ ] Season-level statistics
  - [ ] Reset attendance for new season

- [ ] **7.5** UI/UX Enhancements
  - [ ] Dark mode support
  - [ ] Haptic feedback for mobile interactions (attendance toggles)
  - [ ] Swipe gestures for navigation
  - [ ] Skeleton loaders for better perceived performance
  - [ ] Error boundaries with user-friendly error messages
  - [ ] Toast notifications for actions (success/error)

- [ ] **7.6** Performance Optimization
  - [ ] Image optimization with Next.js `<Image>`
  - [ ] Code splitting and lazy loading
  - [ ] Prefetch critical data
  - [ ] Database query optimization (indexes)
  - [ ] Edge caching for static content

- [ ] **7.7** Testing & Quality Assurance
  - [ ] End-to-end testing for critical flows (Playwright or Cypress)
  - [ ] Unit tests for utility functions
  - [ ] Manual testing on real devices (iOS/Android)
  - [ ] Cross-browser testing
  - [ ] RTL layout testing for Arabic/Hebrew

---

## Supabase Schema (Multilingual Enhanced)

```sql
-- Trainers (includes admin and sub-trainers)
create table public.trainers (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_he text not null,
  name_en text not null,
  phone text not null unique,
  role text not null check (role in ('admin', 'sub_trainer')),
  auth_user_id uuid references auth.users(id) unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Halls (3 basketball halls)
create table public.halls (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_he text not null,
  name_en text not null,
  description_ar text,
  description_he text,
  description_en text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Events (games and trainings scheduled in halls)
create table public.events (
  id uuid primary key default gen_random_uuid(),
  hall_id uuid references public.halls(id) on delete cascade,
  trainer_id uuid references public.trainers(id),
  type text not null check (type in ('game', 'training')),
  title_ar text not null,
  title_he text not null,
  title_en text not null,
  event_date date not null,
  start_time time not null,
  end_time time not null,
  recurrence_rule text, -- e.g., 'weekly:tue,thu'
  notes_ar text,
  notes_he text,
  notes_en text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for faster event queries by date
create index events_date_idx on public.events(event_date);

-- Classes (each sub-trainer manages one)
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_he text not null,
  name_en text not null,
  trainer_id uuid references public.trainers(id) unique, -- one class per trainer
  hall_id uuid references public.halls(id),
  schedule_info text, -- e.g., "Every Mon/Wed 18:00-20:00"
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trainees (players in a class)
create table public.trainees (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_he text not null,
  name_en text not null,
  phone text,
  jersey_number integer,
  class_id uuid references public.classes(id) on delete cascade,
  is_paid boolean default false,
  payment_date timestamptz,
  payment_comment_ar text, -- admin only
  payment_comment_he text, -- admin only
  payment_comment_en text, -- admin only
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for faster trainee queries by class
create index trainees_class_idx on public.trainees(class_id);

-- Attendance (per trainee per event)
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  trainee_id uuid references public.trainees(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  status text not null check (status in ('present', 'absent', 'late')),
  marked_by uuid references public.trainers(id),
  marked_at timestamptz default now(),
  unique(trainee_id, event_id)
);

-- Index for faster attendance queries
create index attendance_event_idx on public.attendance(event_id);
create index attendance_trainee_idx on public.attendance(trainee_id);

-- Helper function: Check if user is admin
create or replace function private.is_admin()
returns boolean
language plpgsql
security definer
stable
as $$
begin
  return coalesce(
    (current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role') = 'admin',
    false
  );
end;
$$;

-- Helper function: Get current trainer ID from auth
create or replace function private.current_trainer_id()
returns uuid
language plpgsql
security definer
stable
as $$
begin
  return (
    select id from public.trainers
    where auth_user_id = auth.uid()
    limit 1
  );
end;
$$;

-- RLS POLICIES

-- Trainers: admins see all, sub-trainers see themselves + admin
alter table public.trainers enable row level security;

create policy "Trainers viewable by authenticated users"
  on public.trainers for select
  to authenticated
  using (
    private.is_admin() or auth_user_id = auth.uid()
  );

create policy "Only admins can manage trainers"
  on public.trainers for all
  to authenticated
  using (private.is_admin());

-- Halls: everyone can view, only admins can manage
alter table public.halls enable row level security;

create policy "Halls viewable by authenticated"
  on public.halls for select
  to authenticated
  using (true);

create policy "Only admins can manage halls"
  on public.halls for all
  to authenticated
  using (private.is_admin());

-- Events: authenticated users can view, admins + assigned trainer can manage
alter table public.events enable row level security;

create policy "Events viewable by authenticated"
  on public.events for select
  to authenticated
  using (true);

create policy "Admins can manage all events"
  on public.events for all
  to authenticated
  using (private.is_admin());

create policy "Trainers can manage their own events"
  on public.events for all
  to authenticated
  using (trainer_id = private.current_trainer_id());

-- Classes: authenticated can view, admins manage all, trainers manage their own
alter table public.classes enable row level security;

create policy "Classes viewable by authenticated"
  on public.classes for select
  to authenticated
  using (true);

create policy "Admins can manage all classes"
  on public.classes for all
  to authenticated
  using (private.is_admin());

-- Trainees: authenticated see all, admins manage all, trainers manage their class
alter table public.trainees enable row level security;

create policy "Trainees viewable by authenticated"
  on public.trainees for select
  to authenticated
  using (true);

create policy "Admins can manage all trainees"
  on public.trainees for all
  to authenticated
  using (private.is_admin());

create policy "Trainers can manage their class trainees"
  on public.trainees for all
  to authenticated
  using (
    class_id in (
      select id from public.classes
      where trainer_id = private.current_trainer_id()
    )
  );

-- Attendance: authenticated can view their scope, trainers mark their events
alter table public.attendance enable row level security;

create policy "Attendance viewable by authenticated"
  on public.attendance for select
  to authenticated
  using (true);

create policy "Trainers can mark attendance for their events"
  on public.attendance for insert
  to authenticated
  with check (
    private.is_admin() or
    event_id in (
      select id from public.events
      where trainer_id = private.current_trainer_id()
    )
  );

create policy "Trainers can update attendance for their events"
  on public.attendance for update
  to authenticated
  using (
    private.is_admin() or
    event_id in (
      select id from public.events
      where trainer_id = private.current_trainer_id()
    )
  );

-- Seed Data: Initial 3 halls (run after schema creation)
insert into public.halls (name_ar, name_he, name_en, description_ar, description_he, description_en) values
  ('القاعة الأولى', 'אולם 1', 'Hall A', 'قاعة كرة السلة الرئيسية', 'אולם כדורסל ראשי', 'Main basketball court'),
  ('القاعة الثانية', 'אולם 2', 'Hall B', 'قاعة التدريب', 'אולם אימונים', 'Training court'),
  ('القاعة الثالثة', 'אולם 3', 'Hall C', 'قاعة متعددة الأغراض', 'אולם רב תכליתי', 'Multi-purpose court');

-- Note: Admin user (Samy) should be created via Supabase dashboard with:
-- email/phone auth, then set app_metadata: { "role": "admin" }
-- Then insert into trainers table with auth_user_id
```

---

## File Structure (Next.js App Router)

```
c:\Dev\BasketBall\
├── public/
│   ├── images/
│   │   ├── logo.svg
│   │   ├── basketball-court.jpg
│   │   └── placeholder-avatar.png
│   ├── icons/                  # PWA app icons
│   └── manifest.json           # PWA manifest
│
├── src/
│   ├── app/
│   │   ├── [locale]/                   # Dynamic locale segment (ar/he/en)
│   │   │   ├── layout.tsx              # Sets <html lang dir>, fonts, providers
│   │   │   ├── page.tsx                # Today's dashboard (home)
│   │   │   │
│   │   │   ├── halls/
│   │   │   │   ├── page.tsx            # Halls list
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx        # Hall detail with calendar
│   │   │   │       └── schedule/
│   │   │   │           └── page.tsx    # Hall schedule view
│   │   │   │
│   │   │   ├── events/
│   │   │   │   ├── page.tsx            # All events list
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx        # Event detail
│   │   │   │   └── new/
│   │   │   │       └── page.tsx        # Create event (admin/trainer)
│   │   │   │
│   │   │   ├── attendance/
│   │   │   │   └── [event_id]/
│   │   │   │       └── page.tsx        # Attendance marking screen 🎯
│   │   │   │
│   │   │   ├── teams/
│   │   │   │   ├── page.tsx            # Classes list
│   │   │   │   └── [class_id]/
│   │   │   │       ├── page.tsx        # Class roster
│   │   │   │       └── trainees/
│   │   │   │           ├── page.tsx    # Trainee list
│   │   │   │           ├── [id]/
│   │   │   │           │   └── page.tsx # Trainee profile
│   │   │   │           └── new/
│   │   │   │               └── page.tsx # Add trainee
│   │   │   │
│   │   │   ├── admin/
│   │   │   │   ├── layout.tsx          # Admin layout with auth guard
│   │   │   │   ├── page.tsx            # Admin dashboard
│   │   │   │   ├── trainers/
│   │   │   │   │   ├── page.tsx        # Trainers management
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── page.tsx    # Edit trainer
│   │   │   │   │   └── new/
│   │   │   │   │       └── page.tsx    # Add trainer
│   │   │   │   ├── halls/
│   │   │   │   │   ├── page.tsx        # Halls management
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── page.tsx    # Edit hall
│   │   │   │   │   └── new/
│   │   │   │   │       └── page.tsx    # Add hall
│   │   │   │   ├── classes/
│   │   │   │   │   ├── page.tsx        # Classes management
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── page.tsx    # Edit class
│   │   │   │   │   └── new/
│   │   │   │   │       └── page.tsx    # Add class
│   │   │   │   └── payments/
│   │   │   │       └── page.tsx        # Payments overview
│   │   │   │
│   │   │   ├── login/
│   │   │   │   └── page.tsx            # Login page
│   │   │   │
│   │   │   └── profile/
│   │   │       └── page.tsx            # User profile
│   │   │
│   │   ├── api/
│   │   │   ├── events/
│   │   │   │   └── route.ts            # Events CRUD API
│   │   │   ├── attendance/
│   │   │   │   └── route.ts            # Attendance API
│   │   │   └── auth/
│   │   │       └── callback/
│   │   │           └── route.ts        # Supabase auth callback
│   │   │
│   │   ├── layout.tsx                  # Root layout (minimal)
│   │   ├── globals.css                 # Global styles + Tailwind
│   │   ├── not-found.tsx
│   │   └── error.tsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx            # Main mobile layout with bottom nav
│   │   │   ├── BottomNav.tsx           # 4-tab navigation (Today/Halls/Teams/More)
│   │   │   ├── Header.tsx              # Page header with back button
│   │   │   ├── LocaleSwitcher.tsx      # Language dropdown (ar/he/en)
│   │   │   └── AuthGuard.tsx           # Protected route wrapper
│   │   │
│   │   ├── halls/
│   │   │   ├── HallCard.tsx            # Hall display card
│   │   │   ├── HallList.tsx            # Halls grid
│   │   │   └── HallForm.tsx            # Add/edit hall form (multilingual)
│   │   │
│   │   ├── schedule/
│   │   │   ├── Calendar.tsx            # Monthly calendar view
│   │   │   ├── WeekView.tsx            # Weekly agenda
│   │   │   ├── EventCard.tsx           # Single event card
│   │   │   ├── EventForm.tsx           # Create/edit event (multilingual)
│   │   │   └── TodayDashboard.tsx      # Today's events dashboard
│   │   │
│   │   ├── attendance/
│   │   │   ├── AttendanceSheet.tsx     # Main attendance marking UI 🎯
│   │   │   ├── TraineeRow.tsx          # Single trainee toggle row
│   │   │   ├── AttendanceSummary.tsx   # Present/Absent/Late counts
│   │   │   └── BulkActions.tsx         # Mark all present/absent buttons
│   │   │
│   │   ├── trainers/
│   │   │   ├── TrainerCard.tsx
│   │   │   ├── TrainerList.tsx
│   │   │   └── TrainerForm.tsx         # Multilingual trainer form
│   │   │
│   │   ├── trainees/
│   │   │   ├── TraineeCard.tsx
│   │   │   ├── TraineeList.tsx
│   │   │   ├── TraineeForm.tsx         # Multilingual trainee form
│   │   │   └── TraineeSearch.tsx       # Search by name or jersey #
│   │   │
│   │   ├── classes/
│   │   │   ├── ClassCard.tsx
│   │   │   ├── ClassList.tsx
│   │   │   └── ClassForm.tsx           # Multilingual class form
│   │   │
│   │   ├── payments/
│   │   │   ├── PaymentStatus.tsx       # Paid/unpaid badge
│   │   │   ├── PaymentForm.tsx         # Update payment status
│   │   │   └── PaymentsDashboard.tsx   # Overview of payments
│   │   │
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Badge.tsx
│   │       ├── Card.tsx
│   │       ├── Modal.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── Tabs.tsx
│   │       ├── Select.tsx
│   │       └── Toast.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # Browser Supabase client
│   │   │   ├── server.ts               # Server Supabase client (cookies)
│   │   │   ├── middleware.ts           # Supabase auth middleware
│   │   │   └── types.ts                # Generated database types
│   │   ├── i18n/
│   │   │   ├── config.ts               # Locales config (ar/he/en, RTL/LTR)
│   │   │   ├── dictionaries.ts         # Dictionary loader
│   │   │   └── get-dictionary.ts       # Server-side dictionary fetcher
│   │   └── utils.ts                    # Shared utilities (cn, date helpers)
│   │
│   ├── dictionaries/
│   │   ├── ar.json                     # Arabic translations
│   │   ├── he.json                     # Hebrew translations
│   │   └── en.json                     # English translations
│   │
│   ├── hooks/
│   │   ├── useAuth.ts                  # Auth context hook
│   │   ├── useSupabase.ts              # Supabase client hook
│   │   ├── useDictionary.ts            # Translations hook
│   │   └── useAttendance.ts            # Attendance state management
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx             # Auth provider
│   │   └── DictionaryContext.tsx       # i18n provider
│   │
│   └── middleware.ts                   # Next.js middleware (locale + auth)
│
├── .env.local                          # Supabase credentials
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── Tasks.md                            # This file
```

---

---

## Key Implementation Notes

### Multilingual Content Strategy
All user-facing content (trainer names, hall names, event titles, etc.) is stored in 3 separate columns: `name_ar`, `name_he`, `name_en`. The frontend selects the appropriate column based on the current locale.

### RTL/LTR Support
- Middleware sets locale from URL path (`/ar`, `/he`, `/en`)
- Root layout sets `<html dir="rtl">` for Arabic/Hebrew, `dir="ltr"` for English
- Tailwind uses logical properties: `ms-*` (margin-inline-start) instead of `ml-*`, `text-start` instead of `text-left`
- Components automatically flip for RTL without extra CSS

### Mobile-First Design
- Bottom tab navigation for primary navigation (Today/Halls/Teams/More)
- Large touch targets (min 44x44px)
- Optimized for one-handed use
- Fast attendance marking with tap-to-toggle

### Attendance Flow (Core UX)
1. Trainer opens Today tab → sees today's events
2. Taps event → lands on attendance sheet
3. Sees list of all trainees in that event's class
4. Taps trainee row to toggle: ✓ Present → ✗ Absent → ⏰ Late
5. Changes auto-save to Supabase (optimistic UI)
6. Summary bar shows live counts

### Role-Based Access
- **Admin (Samy)**: Full access to all features
- **Sub-Trainer**: Access only to their assigned class and events

### Authentication
- Supabase Auth with email/password or magic links
- `app_metadata.role` set to 'admin' or 'sub_trainer'
- RLS policies enforce role-based data access
- Middleware checks auth status and redirects to login if needed

---

## Current Status

**Phase**: Phase 1 — Foundation & Infrastructure
**Next Steps**:
1. Initialize Next.js project with TypeScript & Tailwind
2. Set up i18n middleware and dictionary system
3. Create Supabase project and apply schema migrations
4. Build core UI components and layout structure
5. Integrate Supabase auth and clients