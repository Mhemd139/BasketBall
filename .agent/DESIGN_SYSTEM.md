# 🏀 Basketball Manager - Design System

**Based on النادي الرياضي Logo**  
**Design Philosophy:** Minimal, Compact, Modern

---

## 🎨 Color Palette

### Primary Colors (From Logo)

```css
/* Navy Blue - Primary Background */
--navy-950: #0a1628;  /* Darkest - headers, cards */
--navy-900: #0f1f3d;  /* Logo background */
--navy-800: #1a2f4f;  /* Main backgrounds */
--navy-700: #254263;  /* Hover states */
--navy-600: #305577;  /* Borders */

/* Gold/Yellow - Primary Accent */
--gold-500: #ffd700;  /* Logo banner - primary CTA */
--gold-400: #ffdf33;  /* Hover state */
--gold-600: #e6c200;  /* Active state */
--gold-300: #ffe866;  /* Light accents */

/* Basketball Orange - Secondary Accent */
--orange-500: #d97639;  /* Basketball color */
--orange-400: #e68a52;  /* Lighter */
--orange-600: #c86432;  /* Darker */

/* Neutrals */
--white: #ffffff;
--gray-50: #f8fafc;
--gray-100: #f1f5f9;
--gray-200: #e2e8f0;
--gray-300: #cbd5e1;
--gray-400: #94a3b8;
--gray-500: #64748b;
--gray-600: #475569;
--gray-700: #334155;
--gray-800: #1e293b;
--gray-900: #0f172a;
```

### Semantic Colors

```css
/* Status Colors */
--success: #10b981;   /* Present/Paid */
--warning: #f59e0b;   /* Late */
--error: #ef4444;     /* Absent/Unpaid */
--info: #3b82f6;      /* Information */

/* Backgrounds */
--bg-primary: var(--navy-900);
--bg-secondary: var(--navy-800);
--bg-tertiary: var(--navy-700);
--bg-card: var(--navy-800);
--bg-hover: var(--navy-700);

/* Text */
--text-primary: var(--white);
--text-secondary: var(--gray-300);
--text-tertiary: var(--gray-400);
--text-accent: var(--gold-500);
```

---

## 📐 Typography

### Font Families

```css
/* Arabic - Primary */
--font-arabic: 'Cairo', 'Noto Sans Arabic', sans-serif;

/* Hebrew */
--font-hebrew: 'Rubik', 'Noto Sans Hebrew', sans-serif;

/* English/Latin */
--font-latin: 'Inter', 'Roboto', sans-serif;

/* Numbers (Tabular) */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale (Mobile-First)

```css
/* Display - Logo, Hero */
--text-4xl: 2.5rem;   /* 40px */
--text-3xl: 2rem;     /* 32px */
--text-2xl: 1.75rem;  /* 28px */
--text-xl: 1.5rem;    /* 24px */

/* Headings */
--text-lg: 1.25rem;   /* 20px */
--text-base: 1rem;    /* 16px */
--text-sm: 0.875rem;  /* 14px */
--text-xs: 0.75rem;   /* 12px */

/* Font Weights */
--font-bold: 700;
--font-semibold: 600;
--font-medium: 500;
--font-regular: 400;
```

---

## 🏗️ Layout & Spacing

### Spacing Scale

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### Border Radius

```css
--radius-sm: 0.375rem;   /* 6px - buttons, inputs */
--radius-md: 0.5rem;     /* 8px - cards */
--radius-lg: 0.75rem;    /* 12px - modals */
--radius-xl: 1rem;       /* 16px - hero sections */
--radius-full: 9999px;   /* Pills, avatars */
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
--shadow-glow: 0 0 20px rgba(255, 215, 0, 0.3); /* Gold glow */
```

---

## 🎯 Component Patterns

### 1. Logo Integration

**Usage:**
- Header: Small logo (40px height)
- Login/Splash: Large logo (120px height)
- Favicon: Simplified basketball icon

**Placement:**
- Top-left in header (LTR)
- Top-right in header (RTL)
- Centered on auth pages

### 2. Navigation (Mobile Bottom Nav)

```
┌─────────────────────────────────────┐
│                                     │
│         Main Content Area           │
│                                     │
├─────────────────────────────────────┤
│ 📅 Today │ 🏟️ Halls │ 👥 Teams │ ⚙️ │
│  اليوم   │  القاعات │  الفرق   │ المزيد│
└─────────────────────────────────────┘
```

**Style:**
- Background: `navy-900`
- Active tab: `gold-500` with glow
- Inactive: `gray-400`
- Height: 64px
- Icons: 24px
- Text: 12px

### 3. Cards (Compact & Modern)

```css
.card {
  background: var(--navy-800);
  border: 1px solid var(--navy-600);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  box-shadow: var(--shadow-md);
}

.card:hover {
  background: var(--navy-700);
  border-color: var(--gold-500);
  box-shadow: var(--shadow-glow);
}
```

### 4. Buttons

**Primary (Gold):**
```css
.btn-primary {
  background: var(--gold-500);
  color: var(--navy-900);
  font-weight: var(--font-semibold);
  padding: 12px 24px;
  border-radius: var(--radius-sm);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.btn-primary:hover {
  background: var(--gold-400);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 215, 0, 0.4);
}
```

**Secondary (Navy):**
```css
.btn-secondary {
  background: var(--navy-700);
  color: var(--white);
  border: 1px solid var(--navy-600);
}
```

### 5. Attendance Toggle (Killer Feature)

```css
/* Present */
.status-present {
  background: var(--success);
  color: white;
  border: 2px solid var(--success);
}

/* Absent */
.status-absent {
  background: var(--error);
  color: white;
  border: 2px solid var(--error);
}

/* Late */
.status-late {
  background: var(--warning);
  color: var(--navy-900);
  border: 2px solid var(--warning);
}
```

---

## 🎨 Design Principles

### 1. Minimal
- Clean layouts with ample white space
- No unnecessary decorations
- Focus on content and functionality
- Maximum 3 colors per screen

### 2. Compact
- Efficient use of screen space
- Dense information display without clutter
- Mobile-optimized (375px base)
- Touch targets minimum 44x44px

### 3. Modern
- Smooth animations (200-300ms)
- Subtle gradients and glows
- Glassmorphism for overlays
- Micro-interactions on hover/tap

---

## 🌙 Dark Mode (Primary)

**The app uses dark mode by default** (matching the logo's navy background):

```css
:root {
  color-scheme: dark;
  --bg-app: var(--navy-900);
  --bg-surface: var(--navy-800);
  --text-primary: var(--white);
}
```

**Optional Light Mode** (for future):
- Background: `gray-50`
- Cards: `white`
- Text: `navy-900`
- Accents: Keep gold and orange

---

## 📱 Mobile-First Breakpoints

```css
/* Mobile (default) */
@media (min-width: 375px) { /* iPhone SE */ }

/* Tablet */
@media (min-width: 768px) { /* iPad */ }

/* Desktop */
@media (min-width: 1024px) { /* Laptop */ }

/* Large Desktop */
@media (min-width: 1440px) { /* Desktop */ }
```

---

## ✨ Animation Guidelines

### Timing Functions

```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Durations

```css
--duration-fast: 150ms;    /* Hover, focus */
--duration-base: 200ms;    /* Transitions */
--duration-slow: 300ms;    /* Modals, slides */
--duration-slower: 500ms;  /* Page transitions */
```

### Common Animations

```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide Up */
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Glow Pulse */
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 10px rgba(255, 215, 0, 0.3); }
  50% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.6); }
}
```

---

## 🎯 Key UI Elements

### Header
- Height: 64px
- Logo: 40px height
- Background: `navy-900` with subtle bottom border
- Sticky on scroll

### Bottom Navigation
- Height: 64px
- 4 tabs: Today, Halls, Teams, More
- Active state: Gold with icon glow
- Fixed position

### Cards
- Padding: 16px
- Border radius: 8px
- Background: `navy-800`
- Hover: Lift + gold border glow

### Forms
- Input height: 44px
- Label: 14px, `gray-300`
- Input: `navy-700` background, `white` text
- Focus: Gold border glow

---

## 🏀 Basketball-Specific Elements

### Jersey Numbers
```css
.jersey-number {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--orange-500);
  background: var(--navy-700);
  border-radius: var(--radius-full);
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### Court/Hall Icons
- Use basketball court outline
- Navy stroke, gold fill on active
- 32px size for cards

---

## 📋 Implementation Checklist

- [ ] Update Tailwind config with color palette
- [ ] Add Google Fonts (Cairo, Rubik, Inter)
- [ ] Create CSS custom properties
- [ ] Save logo to `/public/logo.svg`
- [ ] Create logo component with responsive sizes
- [ ] Build base UI components (Button, Card, Badge)
- [ ] Implement bottom navigation
- [ ] Create header with logo
- [ ] Add animations and transitions
- [ ] Test RTL/LTR with new design

---

**Design System Version:** 1.0  
**Last Updated:** February 6, 2026  
**Status:** Ready for Implementation
