# Basketball Manager - Design Tasks

## Critical Issues to Fix

### 1. Header Issues
- [ ] Fix logo being hidden - header obscures the hero logo
- [ ] Add search button to header
- [ ] Make header responsive (mobile + desktop)

### 2. Remove All Emojis - Professional Look
Replace emojis with Lucide React icons throughout:

| Current Emoji | Replace With | Lucide Icon |
|--------------|--------------|-------------|
| 🏀 Basketball | SVG icon | `<Circle />` or custom basketball SVG |
| 🏟️ Halls | Building icon | `<Building2 />` |
| 👥 Teams | Users icon | `<Users />` |
| 🏃 Players | User icon | `<User />` |
| 📅 Calendar | Calendar icon | `<Calendar />` |
| ⚡ Quick actions | Zap icon | `<Zap />` |
| 🏋️ Trainers | Dumbbell | `<Dumbbell />` |
| 📊 Reports | BarChart icon | `<BarChart3 />` |
| 📭 Empty | Inbox icon | `<Inbox />` |
| 🏠 Home | Home icon | `<Home />` |
| ⚙️ Settings | Settings icon | `<Settings />` |

**Install command:**
```bash
npm install lucide-react
```

### 3. Responsive Design (Mobile + Desktop)
- [ ] Max-width container for desktop (1200px)
- [ ] Side navigation for desktop, bottom nav for mobile
- [ ] Grid adjusts: 2 cols mobile → 4 cols desktop for quick actions
- [ ] Stats: 3 cols mobile → inline row desktop

### 4. Files to Modify

#### `src/components/layout/Header.tsx`
```tsx
// Add search button
// Add Lucide icons
// Fix z-index/spacing so it doesn't hide content
```

#### `src/components/layout/BottomNav.tsx`
```tsx
// Replace emojis with Lucide icons
// Hide on desktop (md:hidden)
```

#### `src/components/layout/Sidebar.tsx` [NEW]
```tsx
// Desktop sidebar navigation
// Show on md+ screens
// Same nav items as BottomNav
```

#### `src/app/[locale]/page.tsx`
```tsx
// Replace all emojis with Lucide icons
// Remove hero logo (header has logo)
// Adjust pt-* to not be hidden by header
// Add responsive grid classes
```

#### `src/app/globals.css`
```css
/* Add responsive breakpoints */
/* Update container max-width for desktop */
/* Add sidebar styles */
```

### 5. Design Principles
- **NO EMOJIS** - Use Lucide React icons only
- **Professional** - Clean, minimal, work-focused
- **Responsive** - Mobile-first, desktop-enhanced
- **Consistent** - Same icon style throughout

### 6. Execution Order
1. Install `lucide-react`
2. Create icon components
3. Update Header with search + icons
4. Create Sidebar for desktop
5. Update BottomNav with icons + hide on desktop
6. Update home page - remove emojis, add responsive grids
7. Update halls, teams, more pages
8. Test on mobile and desktop widths

---

## Commands to Run
```bash
cd c:\Dev\BasketBall
npm install lucide-react
```

## Quick Reference - Lucide Import
```tsx
import { Home, Building2, Users, Settings, Search, Calendar, BarChart3, Dumbbell, User, Zap, Inbox } from 'lucide-react'
```
