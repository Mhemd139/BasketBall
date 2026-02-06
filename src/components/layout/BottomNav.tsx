'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { Dictionary } from '@/lib/i18n/get-dictionary'
import type { Locale } from '@/lib/i18n/config'

interface BottomNavProps {
  locale: Locale
  dict: Dictionary
}

export function BottomNav({ locale, dict }: BottomNavProps) {
  const pathname = usePathname()

  const navItems = [
    {
      href: `/${locale}`,
      label: dict.nav.today,
      icon: '📅',
      active: pathname === `/${locale}`,
    },
    {
      href: `/${locale}/halls`,
      label: dict.nav.halls,
      icon: '🏟️',
      active: pathname.startsWith(`/${locale}/halls`),
    },
    {
      href: `/${locale}/teams`,
      label: dict.nav.teams,
      icon: '👥',
      active: pathname.startsWith(`/${locale}/teams`),
    },
    {
      href: `/${locale}/more`,
      label: dict.nav.more,
      icon: '⚙️',
      active: pathname.startsWith(`/${locale}/more`),
    },
  ]

  return (
    <nav className="fixed bottom-0 start-0 z-50 w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-around px-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 px-3 py-2 text-center transition-colors min-w-[64px]',
              item.active
                ? 'text-basketball-orange-500'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="text-xl" role="img" aria-label={item.label}>
              {item.icon}
            </span>
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
