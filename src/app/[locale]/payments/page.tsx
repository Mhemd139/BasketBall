
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { Locale } from '@/lib/i18n/config'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Users, ChevronRight, Trophy } from 'lucide-react'
import Link from 'next/link'

export default async function PaymentsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale)
  const supabase = await createServerSupabaseClient()

  // Fetch classes with trainee counts
  const { data: classes, error } = await (supabase as any)
    .from('classes')
    .select(`
      *,
      trainees (count),
      trainers (name_en, name_ar, name_he)
    `)
    .order('name_en')
    .limit(50)

  const safeClasses = (classes || []) as any[]

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar locale={locale} />
      <div className="flex-1 flex flex-col md:ml-[240px]">
        <Header 
            locale={locale} 
            title={dict.payments.title}
            showBack
            backHref={`/${locale}/more`}
        />

        <main className="flex-1 pt-20 pb-24 md:pb-8 px-3 md:px-5 w-full">
            <div className="max-w-4xl mx-auto space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    {locale === 'ar' ? 'اختر الفريق' : locale === 'he' ? 'בחר קבוצה' : 'Select Team'}
                </h2>
                
                <div className="grid gap-4 md:grid-cols-2">
                    {safeClasses.map((cls) => {
                        const name = locale === 'ar' ? cls.name_ar : locale === 'he' ? cls.name_he : cls.name_en
                        const trainerName = cls.trainers 
                            ? (locale === 'ar' ? cls.trainers.name_ar : locale === 'he' ? cls.trainers.name_he : cls.trainers.name_en)
                            : '-'
                        const count = cls.trainees?.[0]?.count || 0

                        return (
                            <Link key={cls.id} href={`/${locale}/payments/${cls.id}`}>
                                <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between group border-l-4 border-l-blue-500">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">{name}</h3>
                                        <p className="text-sm text-gray-500 mb-2">{trainerName}</p>
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 w-fit px-2 py-1 rounded-md">
                                            <Users className="w-3.5 h-3.5" />
                                            {count} {locale === 'ar' ? 'لاعب' : locale === 'he' ? 'שחקנים' : 'Players'}
                                        </div>
                                    </div>
                                    <ChevronRight className={`w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors ${locale === 'ar' || locale === 'he' ? 'rotate-180' : ''}`} />
                                </Card>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </main>
      </div>
    </div>
  )
}
