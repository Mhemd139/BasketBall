'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface HeaderProps {
  title: string
  showBack?: boolean
  action?: React.ReactNode
  className?: string
}

export function Header({ title, showBack = false, action, className }: HeaderProps) {
  const router = useRouter()

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
    >
      <div className="flex h-14 items-center px-4">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground me-2"
            aria-label="Go back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="rtl:rotate-180"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}
        <h1 className="flex-1 text-lg font-semibold">{title}</h1>
        {action && <div className="ms-auto">{action}</div>}
      </div>
    </header>
  )
}
