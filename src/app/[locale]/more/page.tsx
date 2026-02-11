import { getDictionary } from '@/lib/i18n/get-dictionary'
import type { Locale } from '@/lib/i18n/config'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import { Dumbbell, DollarSign, BarChart3, Settings, Globe, LogIn, User } from 'lucide-react'
import { getSession } from '@/app/actions'

export default async function MorePage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale)
  const session = await getSession()

  const menuItems = [
    {
      icon: session ? User : LogIn,
      title: session ? (locale === 'he' ? 'פרופיל' : 'الملف الشخصي') : (locale === 'he' ? 'התחברות' : 'تسجيل دخول'),
      description: session ? session.name : (locale === 'he' ? 'גישת מאמנים' : 'دخول المدربين'),
      href: session ? `/${locale}/profile` : `/${locale}/login`,
      color: session ? 'from-orange-100 to-orange-200' : 'from-indigo-100 to-indigo-200',
      iconColor: session ? 'text-orange-600' : 'text-indigo-600',
    },
    {
      icon: Dumbbell,
      title: dict.trainers.title,
      description: locale === 'he' ? 'נהל מאמנים' : 'إدارة المدربين',
      href: `/${locale}/trainers`,
      color: 'from-blue-100 to-blue-200',
      iconColor: 'text-blue-600',
    },
    {
      icon: DollarSign,
      title: dict.payments.title,
      description: locale === 'he' ? 'נהל תשלומים' : 'إدارة المدفوعات',
      href: `/${locale}/payments`,
      color: 'from-green-100 to-green-200',
      iconColor: 'text-green-600',
    },
    {
      icon: BarChart3,
      title: locale === 'he' ? 'דוחות' : 'التقارير',
      description: locale === 'he' ? 'אנליטיקת נוכחות' : 'تحليلات الحضور',
      href: `/${locale}/reports`,
      color: 'from-purple-100 to-purple-200',
      iconColor: 'text-purple-600',
    },
    {
      icon: Settings,
      title: dict.admin.settings,
      description: locale === 'he' ? 'הגדרות אפליקציה' : 'إعدادات التطبيق',
      href: `/${locale}/settings`,
      color: 'from-gray-100 to-gray-200',
      iconColor: 'text-gray-600',
    },
    // Language settings removed
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex" suppressHydrationWarning>
      <Sidebar locale={locale} role={session?.role} />
      
      <div className="flex-1 flex flex-col md:ml-[240px]">
        <Header locale={locale} />

        <main className="flex-1 pt-20 pb-24 md:pb-8 px-5">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <section className="py-4 text-center md:text-start">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                  <Settings className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <h1 className="heading-lg">
                  {locale === 'he' ? 'עוד' : 'المزيد'}
                </h1>
              </div>
              <p className="text-gray-500">
                {locale === 'he' ? 'הגדרות וניהול' : 'الإعدادات والإدارة'}
              </p>
            </section>

            {/* Menu Items */}
            <section>
              <div className="space-y-3">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.title} href={item.href}>
                      <Card 
                        interactive 
                        className={`animate-fade-in-up stagger-${Math.min(index + 1, 4)}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-5 h-5 ${item.iconColor}`} strokeWidth={2.5} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-base">
                              {item.title}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {item.description}
                            </p>
                          </div>
                          
                          <div className="text-gray-300 text-lg flex-shrink-0">
                            {'←'}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* App Version */}
            <section className="mt-8 text-center text-gray-400 text-sm">
              <p>Basketball Manager v1.0.0</p>
            </section>
          </div>
        </main>

        <BottomNav locale={locale} role={session?.role} />
      </div>
    </div>
  )
}
