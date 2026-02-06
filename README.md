# 🏀 Basketball Manager

A comprehensive basketball training management system for managing halls, trainers, classes, trainees, and attendance tracking with full multilingual support.

## 🎯 Project Overview

Built for head trainer (Samy) to manage:
- 3 Basketball Halls
- Sub-trainers and their classes
- Trainees (players)
- Training & game schedules
- Fast mobile attendance tracking
- Payment management (3000 NIS/year per trainee)

## ✨ Features

- **Multi-language Support**: Arabic (RTL), Hebrew (RTL), English (LTR)
- **Mobile-First Design**: Optimized for trainers on their phones
- **Fast Attendance**: Tap-to-toggle attendance marking
- **Role-Based Access**: Admin (full access) vs Sub-trainers (their class only)
- **Real-time Updates**: Live schedule and attendance sync via Supabase
- **PWA Ready**: Installable on mobile devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS 4 with RTL support
- **Backend**: Supabase (PostgreSQL + Auth + RLS + Real-time)
- **Deployment**: Vercel (serverless, edge functions)

## 📦 Phase 1 Complete ✅

- ✅ Next.js 15 project initialization
- ✅ TypeScript configuration
- ✅ Tailwind CSS with RTL/LTR support
- ✅ Multi-language infrastructure (ar/he/en)
- ✅ Middleware for locale routing
- ✅ Dictionary system for translations
- ✅ Basketball-themed color palette

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Development Server

The app will be available at:
- http://localhost:3000 (redirects to /ar)
- http://localhost:3000/ar (Arabic)
- http://localhost:3000/he (Hebrew)
- http://localhost:3000/en (English)

## 📁 Project Structure

```
c:\Dev\BasketBall\
├── src/
│   ├── app/
│   │   ├── [locale]/           # Locale-based routing
│   │   │   ├── layout.tsx      # Sets lang, dir, fonts
│   │   │   └── page.tsx        # Home page
│   │   ├── globals.css         # Tailwind + custom styles
│   │   └── layout.tsx          # Root layout (redirects)
│   ├── dictionaries/           # Translation files
│   │   ├── ar.json             # Arabic translations
│   │   ├── he.json             # Hebrew translations
│   │   └── en.json             # English translations
│   ├── lib/
│   │   └── i18n/
│   │       ├── config.ts       # Locale configuration
│   │       └── get-dictionary.ts
│   └── middleware.ts           # Locale detection & routing
├── public/                     # Static assets
├── tailwind.config.ts          # Tailwind configuration
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
└── package.json
```

## 🌍 Internationalization (i18n)

The app supports 3 locales:
- **ar** (Arabic) - RTL - Default
- **he** (Hebrew) - RTL
- **en** (English) - LTR

Locale is detected from:
1. URL path (`/ar`, `/he`, `/en`)
2. Cookie (`NEXT_LOCALE`)
3. Browser `Accept-Language` header
4. Fallback to Arabic (default)

## 🎨 Design System

### Colors

- **Primary**: Basketball Orange (#f97316)
- **Secondary**: Court Gray (#64748b)
- Custom palette in `tailwind.config.ts`

### Typography

- **Primary Font**: Inter (Latin script)
- **Arabic**: Noto Sans Arabic (planned)
- **Hebrew**: Noto Sans Hebrew (planned)

### RTL/LTR Support

- Automatic layout flipping via `dir="rtl"` or `dir="ltr"`
- Tailwind logical properties: `ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`
- No manual RTL CSS needed

## 📝 Next Steps (Phase 2+)

- [ ] Set up Supabase project
- [ ] Create database schema
- [ ] Build core UI components
- [ ] Implement mobile bottom navigation
- [ ] Create hall management pages
- [ ] Build schedule/calendar system
- [ ] Implement attendance marking (core feature)
- [ ] Add authentication system
- [ ] Build admin dashboard
- [ ] Implement payment tracking

## 🤝 Contributing

This is a private project for managing basketball training operations.

## 📄 License

ISC

## 👥 Team

- **Head Trainer**: Samy (Admin)
- **Development**: Basketball Manager Team

---

**Current Phase**: Phase 1 - Foundation ✅
**Next Phase**: Phase 2 - Supabase Integration & Hall Management
