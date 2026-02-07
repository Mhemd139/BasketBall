# 🎨 Design Implementation Guide

**Basketball Manager - النادي الرياضي**  
**For:** Opus (Engineer)  
**From:** Antigravity (Designer)

---

## 📋 Implementation Checklist

### Phase 1: Foundation ✅ (Already Done)
- [x] Tailwind config updated with navy/gold/orange palette
- [x] Color scales defined (50-950)
- [x] Semantic colors (success/warning/error)
- [x] Custom shadows (glow-gold, glow-orange)
- [x] Animations (fade-in, slide-up, glow-pulse)

### Phase 2: Assets & Fonts
- [ ] Save logo to `/public/images/logo.svg`
- [ ] Add Google Fonts: Cairo (Arabic), Rubik (Hebrew), Inter (English)
- [ ] Create favicon from logo
- [ ] Add basketball court icon (SVG)

### Phase 3: Global Styles
- [ ] Update `globals.css` with design tokens
- [ ] Set default background to `navy-900`
- [ ] Set default text color to `white`
- [ ] Add smooth scroll behavior

### Phase 4: Core Components
- [ ] Button component (primary/secondary/ghost)
- [ ] Card component with hover glow
- [ ] Badge component (status indicators)
- [ ] Input component (forms)
- [ ] Modal component

### Phase 5: Layout Components
- [ ] Header with logo
- [ ] Bottom navigation (4 tabs)
- [ ] Page container with padding
- [ ] Loading states

### Phase 6: Feature Components
- [ ] Attendance toggle button
- [ ] Jersey number badge
- [ ] Event card
- [ ] Hall card
- [ ] Team card

---

## 🎨 Global CSS (globals.css)

Add this to `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Rubik:wght@400;500;600;700&display=swap');

@layer base {
  :root {
    /* Already defined in Tailwind config, but can add CSS vars here if needed */
    color-scheme: dark;
  }
  
  body {
    @apply bg-navy-900 text-white font-sans antialiased;
  }
  
  /* RTL Support */
  [dir="rtl"] {
    direction: rtl;
  }
  
  [dir="ltr"] {
    direction: ltr;
  }
  
  /* Smooth scrolling */
  html {
    scroll-behavior: smooth;
  }
  
  /* Focus styles */
  *:focus-visible {
    @apply outline-none ring-2 ring-gold-400 ring-offset-2 ring-offset-navy-900;
  }
}

@layer components {
  /* Button Base */
  .btn {
    @apply px-6 py-3 rounded-lg font-semibold transition-all duration-200;
    @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
  }
  
  /* Primary Button (Gold) */
  .btn-primary {
    @apply bg-gold-400 text-navy-900 hover:bg-gold-300;
    @apply shadow-glow-gold hover:shadow-glow-gold-lg;
    @apply hover:-translate-y-0.5 active:translate-y-0;
    @apply focus:ring-gold-400;
  }
  
  /* Secondary Button (Navy) */
  .btn-secondary {
    @apply bg-navy-700 text-white border border-navy-600;
    @apply hover:bg-navy-600 hover:border-gold-400;
    @apply focus:ring-navy-500;
  }
  
  /* Ghost Button */
  .btn-ghost {
    @apply bg-transparent text-gold-400 hover:bg-navy-800;
    @apply focus:ring-gold-400;
  }
  
  /* Card */
  .card {
    @apply bg-navy-800 border border-navy-600 rounded-lg p-4;
    @apply shadow-md transition-all duration-200;
    @apply hover:bg-navy-700 hover:border-gold-400 hover:shadow-glow-gold;
  }
  
  /* Input */
  .input {
    @apply w-full px-4 py-3 bg-navy-700 border border-navy-600;
    @apply rounded-lg text-white placeholder-gray-400;
    @apply focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20;
    @apply transition-all duration-200;
  }
  
  /* Badge */
  .badge {
    @apply inline-flex items-center px-3 py-1 rounded-full text-sm font-medium;
  }
  
  .badge-success {
    @apply bg-success/20 text-success border border-success/30;
  }
  
  .badge-warning {
    @apply bg-warning/20 text-warning border border-warning/30;
  }
  
  .badge-error {
    @apply bg-error/20 text-error border border-error/30;
  }
  
  .badge-info {
    @apply bg-info/20 text-info border border-info/30;
  }
  
  /* Jersey Number */
  .jersey-number {
    @apply flex items-center justify-center;
    @apply w-12 h-12 rounded-full bg-navy-700 border-2 border-orange-500;
    @apply text-orange-500 font-mono font-bold text-lg;
  }
  
  /* Status Toggle (Attendance) */
  .status-toggle {
    @apply w-12 h-12 rounded-lg flex items-center justify-center;
    @apply text-2xl font-bold transition-all duration-200;
    @apply cursor-pointer select-none;
  }
  
  .status-present {
    @apply bg-success text-white border-2 border-success;
    @apply hover:scale-110 active:scale-95;
  }
  
  .status-absent {
    @apply bg-error text-white border-2 border-error;
    @apply hover:scale-110 active:scale-95;
  }
  
  .status-late {
    @apply bg-warning text-navy-900 border-2 border-warning;
    @apply hover:scale-110 active:scale-95;
  }
}

@layer utilities {
  /* Text gradients */
  .text-gradient-gold {
    @apply bg-gradient-to-r from-gold-300 to-gold-500 bg-clip-text text-transparent;
  }
  
  /* Glow effects */
  .glow-gold {
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
  }
  
  .glow-gold-lg {
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
  }
  
  /* Animations */
  .animate-in {
    animation: fadeIn 200ms ease-out;
  }
  
  .animate-slide-up {
    animation: slideUp 300ms ease-out;
  }
}
```

---

## 🧩 Component Examples

### 1. Button Component

```tsx
// src/components/ui/Button.tsx
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: ReactNode;
  className?: string;
}

export function Button({ 
  variant = 'primary', 
  children, 
  className,
  ...props 
}: ButtonProps) {
  return (
    <button
      className={cn(
        'btn',
        variant === 'primary' && 'btn-primary',
        variant === 'secondary' && 'btn-secondary',
        variant === 'ghost' && 'btn-ghost',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

### 2. Card Component

```tsx
// src/components/ui/Card.tsx
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'card',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
```

### 3. Jersey Number Badge

```tsx
// src/components/ui/JerseyNumber.tsx
interface JerseyNumberProps {
  number: number;
  className?: string;
}

export function JerseyNumber({ number, className }: JerseyNumberProps) {
  return (
    <div className={cn('jersey-number', className)}>
      {number}
    </div>
  );
}
```

### 4. Attendance Status Toggle

```tsx
// src/components/attendance/StatusToggle.tsx
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

type Status = 'present' | 'absent' | 'late';

interface StatusToggleProps {
  initialStatus?: Status;
  onChange?: (status: Status) => void;
}

export function StatusToggle({ initialStatus = 'absent', onChange }: StatusToggleProps) {
  const [status, setStatus] = useState<Status>(initialStatus);
  
  const statusConfig = {
    present: { icon: '✓', next: 'absent' as Status },
    absent: { icon: '✗', next: 'late' as Status },
    late: { icon: '⏰', next: 'present' as Status },
  };
  
  const handleToggle = () => {
    const nextStatus = statusConfig[status].next;
    setStatus(nextStatus);
    onChange?.(nextStatus);
  };
  
  return (
    <button
      className={cn(
        'status-toggle',
        status === 'present' && 'status-present',
        status === 'absent' && 'status-absent',
        status === 'late' && 'status-late'
      )}
      onClick={handleToggle}
      aria-label={`Status: ${status}`}
    >
      {statusConfig[status].icon}
    </button>
  );
}
```

### 5. Bottom Navigation

```tsx
// src/components/layout/BottomNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  icon: string;
  label: string;
  labelAr: string;
}

const navItems: NavItem[] = [
  { href: '/ar', icon: '📅', label: 'Today', labelAr: 'اليوم' },
  { href: '/ar/halls', icon: '🏟️', label: 'Halls', labelAr: 'القاعات' },
  { href: '/ar/teams', icon: '👥', label: 'Teams', labelAr: 'الفرق' },
  { href: '/ar/more', icon: '⚙️', label: 'More', labelAr: 'المزيد' },
];

export function BottomNav({ locale = 'ar' }: { locale?: string }) {
  const pathname = usePathname();
  
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-navy-900 border-t border-navy-700 z-50">
      <div className="flex items-center justify-around h-16 max-w-screen-sm mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full',
                'transition-all duration-200',
                isActive 
                  ? 'text-gold-400' 
                  : 'text-gray-400 hover:text-gold-300'
              )}
            >
              <span className={cn(
                'text-2xl mb-1 transition-all',
                isActive && 'animate-glow-pulse'
              )}>
                {item.icon}
              </span>
              <span className="text-xs font-medium">
                {locale === 'ar' ? item.labelAr : item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

---

## 📐 Layout Structure

### App Shell

```tsx
// src/components/layout/AppShell.tsx
import { ReactNode } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

interface AppShellProps {
  children: ReactNode;
  locale: string;
  showBottomNav?: boolean;
}

export function AppShell({ children, locale, showBottomNav = true }: AppShellProps) {
  return (
    <div className="min-h-screen bg-navy-900 text-white">
      <Header locale={locale} />
      
      <main className={cn(
        'max-w-screen-sm mx-auto px-4',
        showBottomNav ? 'pb-20 pt-20' : 'py-20'
      )}>
        {children}
      </main>
      
      {showBottomNav && <BottomNav locale={locale} />}
    </div>
  );
}
```

---

## 🎯 Key Design Decisions

### 1. **Navy Blue Background**
- Creates professional, focused environment
- Reduces eye strain for long use
- Makes gold accents pop
- Matches logo perfectly

### 2. **Gold Primary Actions**
- High contrast with navy
- Draws attention to important CTAs
- Matches logo banner
- Feels premium and energetic

### 3. **Orange for Basketball Elements**
- Jersey numbers
- Basketball icons
- Game events (vs training)
- Reinforces sports theme

### 4. **Minimal Approach**
- No unnecessary decorations
- Focus on content
- Fast loading
- Easy to maintain

### 5. **Compact Layout**
- Efficient space usage
- More info visible
- Less scrolling
- Mobile-optimized

### 6. **Modern Interactions**
- Smooth animations
- Hover glows
- Tap feedback
- Optimistic UI

---

## 📱 Mobile-First Principles

1. **Touch Targets:** Minimum 48x48px
2. **Font Sizes:** Minimum 16px for body text
3. **Spacing:** Generous padding (16px+)
4. **Navigation:** Bottom nav for thumb reach
5. **Forms:** Large inputs (44px height)
6. **Cards:** Full-width on mobile
7. **Modals:** Slide up from bottom

---

## ✅ Quality Checklist

Before marking design as complete:

- [ ] All colors from logo palette
- [ ] Logo integrated in header
- [ ] RTL layout works perfectly
- [ ] All text is readable (contrast 4.5:1+)
- [ ] Touch targets are 48x48px+
- [ ] Animations are smooth (60fps)
- [ ] Loading states exist
- [ ] Error states are clear
- [ ] Success feedback is immediate
- [ ] Works on 375px width (iPhone SE)
- [ ] Works on 768px+ (iPad)
- [ ] Dark mode looks great
- [ ] Fonts load properly
- [ ] Icons are consistent

---

## 🚀 Next Steps for Opus

1. **Implement global CSS** (copy from above)
2. **Create UI components** (Button, Card, Badge, Input)
3. **Build layout components** (Header, BottomNav, AppShell)
4. **Add Google Fonts** to layout
5. **Save logo** to public folder
6. **Test RTL/LTR** switching
7. **Build first screen** (Today dashboard)
8. **Iterate** based on feedback

---

**Design handoff complete!** 🎨  
**Ready for engineering implementation.** 🛠️

All design tokens, components, and guidelines are documented.  
The design is minimal, compact, and modern as requested.
