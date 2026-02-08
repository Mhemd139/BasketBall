import type { Locale } from '@/lib/i18n/config'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card, CardContent } from '@/components/ui/Card'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLocalizedField } from '@/lib/utils'
import Link from 'next/link'
import { Users, User } from 'lucide-react'
import { getSession } from '@/app/actions'
import { TeamCard } from '@/components/teams/TeamCard'
import { CreateTeamButton } from '@/components/teams/CreateTeamButton'

export default async function TeamsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()
  const session = await getSession()
  const canCreate = !!session // Ensure logged-in trainers can see management features

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

        <main className="flex-1 pt-20 pb-24 md:pb-8 px-3 md:px-5 w-full">
          <div className="max-w-4xl mx-auto w-full">
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
              <p className="text-gray-500 mb-6">
                {locale === 'ar' ? 'إدارة فرق كرة السلة' : locale === 'he' ? 'ניהול קבוצות כדורסל' : 'Manage basketball teams'}
              </p>
            </section>

            {/* Create Team Button */}
            <CreateTeamButton locale={locale} canCreate={canCreate} />

            {/* Teams List */}
            <section>
              {classes && classes.length > 0 ? (
                <div className="space-y-3">
                  {classes.map((cls: any, index: number) => (
                    <TeamCard 
                        key={cls.id} 
                        cls={cls} 
                        locale={locale} 
                        isEditable={canCreate}
                    />
                  ))}
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
