import type { Locale } from '@/lib/i18n/config'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card } from '@/components/ui/Card'
import { BarChart3, TrendingUp, Users, Calendar } from 'lucide-react'

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex">
      <Sidebar locale={locale} />
      <div className="flex-1 flex flex-col md:ml-[240px]">
        <Header
          locale={locale}
          title={locale === 'ar' ? 'التقارير' : locale === 'he' ? 'דוחות' : 'Reports'}
          showBack
          backHref={`/${locale}/more`}
        />

        <main className="flex-1 pt-24 px-3 md:px-5 w-full">
           <div className="max-w-4xl mx-auto grid gap-6 w-full">
             {/* Stats Overview */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <Users className="w-5 h-5" />
                        </div>
                        <span className="text-gray-500 font-medium">{locale === 'ar' ? 'إجمالي اللاعبين' : 'Total Players'}</span>
                    </div>
                    <p className="text-3xl font-bold">124</p>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="text-gray-500 font-medium">{locale === 'ar' ? 'نسبة الحضور' : 'Attendance Rate'}</span>
                    </div>
                    <p className="text-3xl font-bold">88%</p>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <span className="text-gray-500 font-medium">{locale === 'ar' ? 'التدريبات هذا الشهر' : 'Sessions this Month'}</span>
                    </div>
                    <p className="text-3xl font-bold">12</p>
                </Card>
             </div>

             {/* Chart Placeholder */}
             <Card className="p-8 flex flex-col items-center justify-center min-h-[300px] text-gray-400 text-center">
                <BarChart3 className="w-16 h-16 mb-4 opacity-20" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {locale === 'ar' ? 'تحليل الأداء قريباً' : 'Performance Analytics Coming Soon'}
                </h3>
                <p className="max-w-md">
                    {locale === 'ar' ? 'سنقوم بإضافة رسوم بيانية تفصيلية هنا قريباً.' : 'We are working on detailed charts for player attendance and payments.'}
                </p>
             </Card>
           </div>
        </main>
      </div>
    </div>
  )
}
