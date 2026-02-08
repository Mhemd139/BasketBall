import type { Locale } from '@/lib/i18n/config'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLocalizedField } from '@/lib/utils'
import type { Database } from '@/lib/supabase/types'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Users, User, MapPin, Calendar, Phone, Trophy, Plus } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { getSession } from '@/app/actions'
import { TraineeList } from '@/components/teams/TraineeList'

type Class = Database['public']['Tables']['classes']['Row']
type Trainer = Database['public']['Tables']['trainers']['Row']
type Hall = Database['public']['Tables']['halls']['Row']
type Trainee = Database['public']['Tables']['trainees']['Row']

interface ClassWithDetails extends Class {
  trainers: Trainer | null
  halls: Hall | null
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; classId: string }>
}) {
  const { locale, classId } = await params
  const supabase = await createServerSupabaseClient()
  const session = await getSession()

  const [
    { data: team, error: teamError },
    { data: roster }
  ] = await Promise.all([
    (supabase as any).from('classes').select('*, trainers(*), halls(*)').eq('id', classId).single(),
    (supabase as any).from('trainees').select('*').eq('class_id', classId).order('jersey_number', { ascending: true }),
  ])

  if (teamError || !team) {
    notFound()
  }

  const teamDetails = team as unknown as ClassWithDetails
  const trainees = (roster || []) as Trainee[]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex" suppressHydrationWarning>
      <Sidebar locale={locale} />

      <div className="flex-1 flex flex-col md:ml-[240px]">
        <Header
          locale={locale}
          title={getLocalizedField(teamDetails, 'name', locale)}
          showBack
          backHref={`/${locale}/teams`}
        />

        <main className="flex-1 pt-20 pb-24 md:pb-8 px-3 md:px-5 w-full">
          <div className="max-w-4xl mx-auto w-full">
            {/* Team Hero */}
            <section className="py-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg transform -rotate-3 text-white">
                  <Trophy className="w-10 h-10" strokeWidth={1.5} />
                </div>
                <div>
                  <h1 className="heading-lg mb-1">
                    {getLocalizedField(teamDetails, 'name', locale)}
                  </h1>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <User className="w-4 h-4" />
                      {trainees.length} {locale === 'ar' ? 'لاعب' : locale === 'he' ? 'שחקנים' : 'Players'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* Trainer Card */}
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                  <div className="flex items-center gap-3 mb-2 text-gray-500 text-sm font-medium">
                    <User className="w-4 h-4 text-purple-600" />
                    {locale === 'ar' ? 'المدرب' : locale === 'he' ? 'מאמן' : 'Coach'}
                  </div>
                  <p className="font-semibold text-gray-900">
                    {teamDetails.trainers 
                      ? getLocalizedField(teamDetails.trainers, 'name', locale)
                      : (locale === 'ar' ? 'غير معين' : locale === 'he' ? 'לא הוקצה' : 'Unassigned')}
                  </p>
                  {teamDetails.trainers?.phone && (
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
                      <Phone className="w-3 h-3" />
                      <span dir="ltr">{teamDetails.trainers.phone}</span>
                    </div>
                  )}
                </div>

                {/* Hall Card */}
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                  <div className="flex items-center gap-3 mb-2 text-gray-500 text-sm font-medium">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    {locale === 'ar' ? 'القاعة' : locale === 'he' ? 'אולם' : 'Hall'}
                  </div>
                  <p className="font-semibold text-gray-900">
                    {teamDetails.halls
                      ? getLocalizedField(teamDetails.halls, 'name', locale)
                      : (locale === 'ar' ? 'غير محدد' : locale === 'he' ? 'לא הוגדר' : 'Not set')}
                  </p>
                </div>

                {/* Schedule Card */}
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                  <div className="flex items-center gap-3 mb-2 text-gray-500 text-sm font-medium">
                    <Calendar className="w-4 h-4 text-green-600" />
                    {locale === 'ar' ? 'الموعد' : locale === 'he' ? 'זמנים' : 'Schedule'}
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {teamDetails.schedule_info || (locale === 'ar' ? 'غير محدد' : locale === 'he' ? 'לא הוגדר' : 'Not set')}
                  </p>
                </div>
              </div>
            </section>

            {/* Roster Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {locale === 'ar' ? 'قائمة اللاعبين' : locale === 'he' ? 'סגל השחקנים' : 'Roster'}
                </h2>
                <div className="flex items-center gap-2">
                   <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-mono">
                     {trainees.length}
                   </div>
                   {session && (
                     <Link 
                       href={`/${locale}/teams/${classId}/add`}
                       className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                     >
                       <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                       {locale === 'ar' ? 'إضافة' : locale === 'he' ? 'הוספה' : 'Add'}
                     </Link>
                   )}
                </div>
              </div>

              <TraineeList 
                trainees={trainees} 
                locale={locale} 
                isAdmin={!!session} 
                teamName={getLocalizedField(teamDetails, 'name', locale)}
                trainerName={teamDetails.trainers ? getLocalizedField(teamDetails.trainers, 'name', locale) : ''}
              />
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
