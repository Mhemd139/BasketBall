import type { Locale } from '@/lib/i18n/config'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card } from '@/components/ui/Card'
import { BarChart3, TrendingUp, Users, Calendar } from 'lucide-react'

import { BottomNav } from '@/components/layout/BottomNav'
import { getSession } from '@/app/actions'
import { AnimatedMeshBackground } from '@/components/ui/AnimatedMeshBackground'

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const session = await getSession()

  return (
    <AnimatedMeshBackground className="min-h-screen flex text-white" suppressHydrationWarning>
      <Sidebar locale={locale} role={session?.role} />
      <div className="flex-1 flex flex-col md:ml-[240px] relative z-10 w-full">
        <div className="bg-[#0B132B]/60 backdrop-blur-3xl border-b border-white/10 sticky top-0 z-40">
          <Header
            locale={locale}
            title={'التقارير'}
            showBack
            backHref={`/${locale}/more`}
          />
        </div>

        <main className="flex-1 pt-20 pb-nav md:pb-8 px-3 md:px-5 w-full">
           <div className="max-w-4xl mx-auto grid gap-6 w-full">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6 bg-white/70 backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-50/50 flex items-center justify-center text-blue-500 border border-blue-100">
                            <Users className="w-5 h-5" />
                        </div>
                        <span className="text-gray-500 font-bold text-sm">{'إجمالي اللاعبين'}</span>
                    </div>
                    <p className="text-3xl font-black text-navy-900 drop-shadow-sm">124</p>
                </Card>
                <Card className="p-6 bg-white/70 backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-green-50/50 flex items-center justify-center text-green-500 border border-green-100">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="text-gray-500 font-bold text-sm">{'نسبة الحضور'}</span>
                    </div>
                    <p className="text-3xl font-black text-navy-900 drop-shadow-sm">88%</p>
                </Card>
                <Card className="p-6 bg-white/70 backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-orange-50/50 flex items-center justify-center text-orange-500 border border-orange-100">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <span className="text-gray-500 font-bold text-sm">{'التدريبات هذا الشهر'}</span>
                    </div>
                    <p className="text-3xl font-black text-navy-900 drop-shadow-sm">12</p>
                </Card>
             </div>

             {/* Chart Placeholder */}
             <Card className="p-8 flex flex-col items-center justify-center min-h-[300px] text-gray-500/50 text-center bg-white/40 backdrop-blur-sm border-white/20">
                <BarChart3 className="w-16 h-16 mb-4 opacity-50 drop-shadow-sm" />
                <h3 className="text-lg font-black text-navy-900 mb-2 opacity-70">
                    {'تحليل الأداء قريباً'}
                </h3>
                <p className="max-w-md text-sm font-bold opacity-70">
                    {'سنقوم بإضافة رسوم بيانية تفصيلية هنا قريباً.'}
                </p>
             </Card>
           </div>
        </main>
        <div className="relative z-50">
          <BottomNav locale={locale} role={session?.role} />
        </div>
      </div>
    </AnimatedMeshBackground>
  )
}
