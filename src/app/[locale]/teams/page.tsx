import type { Locale } from '@/lib/i18n/config'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card, CardContent } from '@/components/ui/Card'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLocalizedField } from '@/lib/utils'
import Link from 'next/link'
import { Users, User } from 'lucide-react'

export default async function TeamsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()

  // Fetch classes (teams) with trainee count
  const { data: classes } = await supabase
    .from('classes')
    .select('*, trainees(count)')
    .order('created_at', { ascending: true })

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex" suppressHydrationWarning>
      <Sidebar locale={locale} />

      <div className="flex-1 flex flex-col md:ml-[240px]">
        <Header locale={locale} />

        <main className="flex-1 pt-20 pb-24 md:pb-8 px-5">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <section className="py-4 text-center md:text-start">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <h1 className="heading-lg">
                  {locale === 'ar' ? 'الفرق' : locale === 'he' ? 'קבוצות' : 'Teams'}
                </h1>
              </div>
              <p className="text-gray-500">
                {locale === 'ar' ? 'إدارة فرق كرة السلة' : locale === 'he' ? 'ניהול קבוצות כדורסל' : 'Manage basketball teams'}
              </p>
            </section>

            {/* Teams List */}
            <section>
              {classes && classes.length > 0 ? (
                <div className="space-y-3">
                  {classes.map((cls: any, index: number) => {
                    const traineeCount = cls.trainees?.[0]?.count ?? 0
                    return (
                      <Link key={cls.id} href={`/${locale}/teams/${cls.id}`}>
                        <Card
                          interactive
                          className={`animate-fade-in-up stagger-${Math.min(index + 1, 4)}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center flex-shrink-0">
                              <Users className="w-6 h-6 text-purple-600" strokeWidth={2.5} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-semibold text-gray-900 mb-1">
                                {getLocalizedField(cls, 'name', locale)}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <User className="w-3.5 h-3.5" />
                                <span>
                                  {traineeCount} {locale === 'ar' ? 'لاعب' : locale === 'he' ? 'שחקנים' : 'players'}
                                </span>
                              </div>
                            </div>

                            <div className="text-gray-300 text-lg flex-shrink-0">
                              {locale === 'ar' || locale === 'he' ? '←' : '→'}
                            </div>
                          </div>
                        </Card>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <Card className="animate-fade-in-up">
                  <CardContent className="py-16 text-center">
                    <div className="flex justify-center mb-4">
                      <Users className="w-16 h-16 text-gray-300" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {locale === 'ar' ? 'لا توجد فرق بعد' : locale === 'he' ? 'אין קבוצות עדיין' : 'No teams yet'}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {locale === 'ar' ? 'سيتم إضافة الفرق قريباً' : locale === 'he' ? 'קבוצות יתווספו בקרוב' : 'Teams will be added soon'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </section>
          </div>
        </main>

        <BottomNav locale={locale} />
      </div>
    </div>
  )
}
