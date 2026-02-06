'use client'

import { usePathname, useRouter } from 'next/navigation'
import { locales, localeNames, type Locale } from '@/lib/i18n/config'
import { cn } from '@/lib/utils'

interface LocaleSwitcherProps {
  currentLocale: Locale
  className?: string
}

export function LocaleSwitcher({ currentLocale, className }: LocaleSwitcherProps) {
  const pathname = usePathname()
  const router = useRouter()

  const switchLocale = (newLocale: Locale) => {
    // Replace the current locale in the pathname
    const newPathname = pathname.replace(`/${currentLocale}`, `/${newLocale}`)
    router.push(newPathname)
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => switchLocale(locale)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
            currentLocale === locale
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          {localeNames[locale]}
        </button>
      ))}
    </div>
  )
}
