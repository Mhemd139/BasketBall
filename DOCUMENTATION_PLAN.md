# Documentation Plan — Basketball Manager

> A plan for creating professional, portfolio-grade documentation that showcases this project's architecture, capabilities, and engineering quality.

---

## Goal

Create documentation that serves two audiences:

1. **Companies / Technical Reviewers** — Demonstrates engineering depth: architecture decisions, security model, testing strategy, and production-grade patterns.
2. **Developers / Contributors** — Enables anyone to understand, set up, and contribute to the project quickly.

---

## Documents to Create

### 1. `README.md` — Project Overview (The First Impression)

The main entry point. Clean, visual, and to the point.

**Sections:**

| Section | Content |
|---------|---------|
| **Hero** | Project name, one-line description, tech stack badges (Next.js 16, React 19, Supabase, TypeScript 5.9, Tailwind 4) |
| **Screenshots** | 3-4 mobile screenshots: dashboard, attendance sheet, team detail, payment modal |
| **Features** | Bullet list of 10-12 key capabilities with brief descriptions |
| **Tech Stack** | Visual table — framework, database, auth, styling, testing, deployment |
| **Quick Start** | 5-step setup: clone → install → env vars → run → open browser |
| **Project Structure** | Tree diagram of `src/` showing pages, components, lib, and tests |
| **Testing** | Commands table: `npm test`, `npm run test:e2e`, `npm run test:coverage` with what each does |
| **Deployment** | Vercel one-click + required env vars |
| **License** | MIT or as appropriate |

**Why this matters for companies:** Clean README = professional engineer who thinks about developer experience.

---

### 2. `docs/ARCHITECTURE.md` — System Architecture

Deep dive into how the system is built and why.

**Sections:**

| Section | Content |
|---------|---------|
| **High-Level Diagram** | ASCII/Mermaid diagram: Browser → Next.js (App Router) → Supabase (Postgres + Auth bypass via RPC) |
| **App Router Structure** | All 20+ routes listed with their data flow (server component → server action → Supabase RPC) |
| **Authentication Flow** | Diagram: Phone → OTP (Vonage/Twilio) → HMAC Verification → Cookie Session. Explain why stateless HMAC over JWT library |
| **Database Schema** | ER diagram (Mermaid) of all 8 tables with relationships. Explain "classes = teams" naming |
| **RLS Bypass Strategy** | Why SECURITY DEFINER RPCs instead of service role key. List all 24 RPC functions grouped by domain |
| **Middleware Pipeline** | Flow: Request → Locale detection → Auth verification → Route or redirect |
| **Server Actions** | Grouped list of all 40+ actions by domain (auth, events, trainers, teams, trainees, payments, attendance, import/export) |
| **Client vs Server** | Decision framework: what's a server component vs client component, and why |

**Why this matters:** Shows you can design systems, not just write components.

---

### 3. `docs/FEATURES.md` — Feature Deep Dives

Detailed walkthrough of each major feature with implementation notes.

**Features to document:**

| Feature | What to Cover |
|---------|--------------|
| **OTP Authentication** | 3-step login flow, phone normalization (Arabic/Persian digits → English), dual SMS provider support (Vonage + Twilio), stateless HMAC token, mock OTP for testing |
| **Bilingual RTL** | Arabic + Hebrew, both RTL, `getLocalizedField()` helper, dictionary system, locale middleware, all DB fields trilingual (AR/HE/EN) |
| **Excel Import Wizard** | 4-step wizard, auto-detection of table type from headers, multilingual column matching with confidence scoring, dependency-ordered creation (halls → trainers → records), batch processing |
| **Excel Export** | Dynamic import of xlsx library, Arabic headers, headcoach-only access |
| **Recurring Schedules** | `class_schedules` → auto-generated events via `ensure_events_for_schedules` RPC, manual vs schedule-generated events |
| **Attendance System** | Status toggle (present/absent/late), bulk save, per-trainee stats, 30-day team history matrix |
| **Payment Tracking** | Per-trainee payment status, amount + comment logging, quick-add chips, progress visualization |
| **Global Search** | Debounced 300ms, parallel trainee + trainer search, max 5+5 results with links |
| **Israel Timezone** | `getTodayISO()` and `getNowInIsrael()` solving Vercel UTC vs local mismatch |

**Why this matters:** Proves you can build complex features end-to-end, not just UI.

---

### 4. `docs/DATABASE.md` — Database Reference

Complete reference for the Supabase schema.

**Sections:**

| Section | Content |
|---------|---------|
| **Tables** | All 8 tables with column definitions, types, constraints, and FK relationships |
| **ER Diagram** | Mermaid diagram showing all relationships |
| **RPC Functions** | All 24 SECURITY DEFINER functions with parameters, return types, and when they're called |
| **Naming Convention** | Explain: `classes` in DB = "Teams" in UI, all text fields have `_ar/_he/_en` suffixes |
| **Query Patterns** | Examples of common queries: bounded selects, parallel fetches, count-only queries |

---

### 5. `docs/TESTING.md` — Testing Strategy

Showcase the testing infrastructure and methodology.

**Sections:**

| Section | Content |
|---------|---------|
| **Overview** | 106 tests total: 82 unit (Vitest) + 24 E2E (Playwright). Test pyramid strategy |
| **Unit Tests** | What's covered: utils (38 tests), session/HMAC (10), i18n (13), StatusToggle (11), BottomNav (10). How to run, how to add new tests |
| **E2E Tests** | All 9 spec files: auth, navigation, teams, halls, payments, attendance, mobile UX, RTL, accessibility. Mock OTP strategy, global setup warmup |
| **Coverage** | How to generate reports, current coverage targets, what's not yet covered |
| **CI Integration** | How to add tests to GitHub Actions / Vercel CI (future) |
| **Adding Tests** | Step-by-step guide: where to put files, naming conventions, fixture patterns |

**Why this matters:** Testing discipline is the #1 signal of engineering maturity.

---

### 6. `docs/API.md` — Server Actions Reference

Complete API reference for all server actions (the app's "API layer").

**Format per action:**

```markdown
### `functionName(params)`
**Domain:** Auth | Events | Teams | ...
**Parameters:**
| Name | Type | Required | Description |
**Returns:** `{ success, data?, error? }`
**Side Effects:** revalidatePath, cookie set/clear
**RPC Used:** `rpc_function_name`
```

**Grouped by domain:** Auth (4), Events (8), Trainers (8), Teams (5), Trainees (7), Payments (2), Attendance (6), Halls (1), Import/Export (4)

---

### 7. `docs/COMPONENTS.md` — Component Library

Reference for all 50+ components.

**Format:**

```markdown
### ComponentName
**Path:** `src/components/domain/ComponentName.tsx`
**Type:** Client | Server
**Props:** table of props with types
**Used by:** which pages/components use it
**Key behavior:** brief description of what it does
```

**Grouped by domain:** Layout (5), Attendance (2), Events (3), Halls (7), Teams (10), Trainees (1), Trainers (4), Payments (3), Import (8), Profile (1), UI (15+)

---

### 8. `docs/SETUP.md` — Development Setup Guide

Step-by-step guide for getting the project running locally.

**Sections:**

| Section | Content |
|---------|---------|
| **Prerequisites** | Node.js 20+, npm, Supabase account |
| **Environment Variables** | Every required env var with description and where to get it |
| **Database Setup** | Supabase project creation, running migrations, seeding data |
| **Local Development** | `npm install` → `npm run dev` → open localhost:3000 |
| **Troubleshooting** | Turbopack cache corruption fix, Vonage/Twilio key issues, common errors |
| **IDE Setup** | Recommended VS Code extensions, settings |

---

### 9. `docs/PERFORMANCE.md` — Performance Guidelines

Document the performance patterns enforced in this codebase.

**Rules documented:**

| Rule | Description |
|------|-------------|
| Parallel queries | `Promise.all()` for independent Supabase calls |
| No force-dynamic | Surgical `revalidatePath()` instead |
| Bounded queries | `.limit(N)` or date filter on every select |
| Debounced inputs | 300ms minimum on search/filter |
| Select only needed columns | No `select('*')` when only 3 fields are used |
| Server components default | `'use client'` only when hooks or event handlers are needed |
| Image optimization | `next/image` with width/height or fill |
| Efficient re-renders | `useMemo`, `useCallback`, no inline object creation |

---

## File Structure

```
BasketBall/
├── README.md                    # Project overview (rewrite)
├── docs/
│   ├── ARCHITECTURE.md          # System design & decisions
│   ├── FEATURES.md              # Feature deep dives
│   ├── DATABASE.md              # Schema & RPC reference
│   ├── TESTING.md               # Testing strategy & guide
│   ├── API.md                   # Server actions reference
│   ├── COMPONENTS.md            # Component library
│   ├── SETUP.md                 # Development setup
│   └── PERFORMANCE.md           # Performance guidelines
└── DOCUMENTATION_PLAN.md        # This file (delete after docs are complete)
```

---

## Execution Order

| Priority | Document | Why First |
|----------|----------|-----------|
| 1 | `README.md` | First thing anyone sees. Must be polished. |
| 2 | `docs/ARCHITECTURE.md` | Shows system thinking — most impressive for companies |
| 3 | `docs/TESTING.md` | Demonstrates engineering discipline |
| 4 | `docs/FEATURES.md` | Showcases problem-solving depth |
| 5 | `docs/DATABASE.md` | Technical reference, useful for architecture doc |
| 6 | `docs/API.md` | Complete API surface documentation |
| 7 | `docs/SETUP.md` | Enables others to contribute |
| 8 | `docs/COMPONENTS.md` | Component catalog |
| 9 | `docs/PERFORMANCE.md` | Performance engineering proof |

---

## Style Guidelines (Technical Writer Skill)

All documentation will follow these principles:

- **User-centered**: Lead with "what you can do" not "how it's built"
- **Clarity first**: Active voice, sentences under 25 words, one idea per paragraph
- **Show don't tell**: Code examples for every concept, expected output shown
- **Progressive disclosure**: Quick start before deep dives, link to advanced topics
- **Scannable**: Descriptive headings, tables for structured data, code blocks with syntax highlighting
- **Professional tone**: "you" for direct address, conversational but authoritative

---

## What This Documentation Proves to Companies

| Quality | Evidence |
|---------|----------|
| **Architecture thinking** | Custom auth system, RLS bypass strategy, middleware pipeline design |
| **Full-stack depth** | Server actions, Postgres RPCs, client components, middleware — all custom |
| **Mobile-first discipline** | Bottom nav, touch targets, safe area insets, scroll time picker |
| **Internationalization** | Bilingual RTL (Arabic + Hebrew), trilingual DB fields, locale middleware |
| **Testing maturity** | 106 automated tests, mock OTP strategy, accessibility audits |
| **Performance awareness** | Parallel queries, bounded selects, debounced search, no force-dynamic |
| **Data engineering** | Excel import wizard with AI-like column matching, dependency resolution |
| **Security consciousness** | HMAC auth, SECURITY DEFINER RPCs, httpOnly cookies, no service role key exposure |
| **Production readiness** | Vercel deployment, error handling, loading states, timezone handling |

---

## Next Step

Say "start docs" and I'll begin creating each document in priority order.
