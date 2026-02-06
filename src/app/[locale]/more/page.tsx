import { getDictionary } from '@/lib/i18n/get-dictionary'
import type { Locale } from '@/lib/i18n/config'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Link from 'next/link'

export default async function MorePage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale)

  const menuItems = [
    {
      icon: '👨‍🏫',
      title: dict.trainers.title,
      description: locale === 'ar' ? 'إدارة المدربين' : locale === 'he' ? 'נהל מאמנים' : 'Manage trainers',
      href: `/${locale}/admin/trainers`,
    },
    {
      icon: '💰',
      title: dict.payments.title,
      description: locale === 'ar' ? 'إدارة المدفوعات' : locale === 'he' ? 'נהל תשלומים' : 'Manage payments',
      href: `/${locale}/admin/payments`,
    },
    {
      icon: '⚙️',
      title: dict.admin.settings,
      description: locale === 'ar' ? 'إعدادات التطبيق' : locale === 'he' ? 'הגדרות אפליקציה' : 'App settings',
      href: `/${locale}/admin/settings`,
    },
  ]

  return (
    <>
      <Header title={dict.nav.more} />

      <main className="min-h-[calc(100vh-56px-64px)] p-4 pb-20">
        <div className="mx-auto max-w-4xl space-y-4">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{item.icon}</div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </div>
                    <svg
                      className="h-5 w-5 text-muted-foreground rtl:rotate-180"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </main>

      <BottomNav locale={locale} dict={dict} />
    </>
  )
}
