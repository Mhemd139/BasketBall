import { getDictionary } from '@/lib/i18n/get-dictionary'
import type { Locale } from '@/lib/i18n/config'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import { AnimatedMeshBackground } from "@/components/ui/AnimatedMeshBackground"
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
    // Language settings removed
  ]

  return (
    <AnimatedMeshBackground className="min-h-screen flex" suppressHydrationWarning>
      <Sidebar locale={locale} role={session?.role} />
      
      <div className="flex-1 flex flex-col md:ml-[240px]">
        <Header locale={locale} />

        <main className="flex-1 pt-20 pb-nav md:pb-8 px-5">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <section className="py-4 text-center md:text-start">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Settings className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <h1 className="text-4xl font-syncopate font-bold text-white drop-shadow-md tracking-tight">
                  {locale === 'he' ? 'עוד' : 'المزيد'}
                </h1>
              </div>
              <p className="text-indigo-200/70 font-outfit text-lg font-medium">
                {locale === 'he' ? 'הגדרות וניהול' : 'الإعدادات والإدارة'}
              </p>
            </section>

            {/* Menu Items */}
            <section>
              <div className="space-y-4">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.title} href={item.href} className="block">
                      <Card 
                        interactive 
                        className={`animate-fade-in-up stagger-${Math.min(index + 1, 4)} p-0 overflow-hidden rounded-[28px] transition-all hover:-translate-y-1`}
                      >
                        <div className="flex items-center gap-4 rounded-[28px] p-4 relative group">
                          <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl border border-white/10 shadow-xl rounded-[28px]" />
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[28px]" />
                          <div className={`w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 shadow-inner relative z-10`}>
                            <Icon className={`w-6 h-6 text-white/90 drop-shadow-sm`} strokeWidth={2.5} />
                          </div>
                          
                          <div className="flex-1 min-w-0 relative z-10">
                            <h3 className="font-syncopate font-bold text-white drop-shadow-md text-lg">
                              {item.title}
                            </h3>
                            <p className="text-sm font-outfit text-indigo-200/70 font-medium">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* App Version */}
            <section className="mt-12 text-center text-indigo-300/30 drop-shadow-sm font-space text-sm font-bold tracking-widest">
              <p>BASKETBALL MANAGER PRO MAX v2.0.0</p>
            </section>
          </div>
        </main>

        <div className="relative z-50">
          <BottomNav locale={locale} role={session?.role} />
        </div>
      </div>
    </AnimatedMeshBackground>
  )
}
