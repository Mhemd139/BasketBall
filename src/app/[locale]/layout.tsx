import type { Metadata, Viewport } from 'next'
import { Inter, Outfit, Syncopate, Space_Mono } from 'next/font/google'
import { notFound } from 'next/navigation'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { locales, directions, type Locale } from '@/lib/i18n/config'
import { ToastProvider } from '@/components/ui/Toast'
import { ConfirmProvider } from '@/components/ui/ConfirmModal'
import '../globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const syncopate = Syncopate({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-syncopate',
  display: 'swap',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Basketball Manager',
    template: '%s | Basketball Manager',
  },
  description: 'Basketball training management system for managing halls, trainers, classes, and attendance',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Basketball Manager',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale = rawLocale as Locale

  // Validate locale
  if (!locales.includes(locale)) {
    notFound()
  }

  const direction = directions[locale]
  return (
    <html lang={locale} dir={direction} className={`${inter.variable} ${outfit.variable} ${syncopate.variable} ${spaceMono.variable} scroll-smooth`}>
      <body className="min-h-screen bg-background font-sans antialiased selection:bg-gold-400 selection:text-navy-900">
        <ToastProvider>
          <ConfirmProvider>
            {children}
            <SpeedInsights />
          </ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
