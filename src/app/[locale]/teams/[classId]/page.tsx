import type { Locale } from '@/lib/i18n/config'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLocalizedField } from '@/lib/utils'
import type { Database } from '@/lib/supabase/types'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { User, Calendar, Trophy, Plus, Building2, ChevronLeft } from 'lucide-react'
import { getSession, getClassAttendanceStats } from '@/app/actions'
import { TraineeList } from '@/components/teams/TraineeList'
import { TrainerReassignButton } from '@/components/teams/TrainerReassignButton'
import { ScheduleEditor } from '@/components/teams/ScheduleEditor'
import { AnimatedMeshBackground } from '@/components/ui/AnimatedMeshBackground'

type Class = Database['public']['Tables']['classes']['Row']
type Trainer = Database['public']['Tables']['trainers']['Row']
type Trainee = Database['public']['Tables']['trainees']['Row']

interface ClassSchedule {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  notes: string | null
  halls: { id: string; name_he: string; name_ar: string; name_en: string } | null
}

interface ClassWithDetails extends Class {
  trainers: Trainer | null
  categories: { name_he: string; name_ar: string; name_en: string } | null
  class_schedules: ClassSchedule[]
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
    { data: roster, error: rosterError },
    { data: allHalls, error: hallsError },
    attendanceStatsMap
  ] = await Promise.all([
    supabase.from('classes').select('id, name_ar, name_he, name_en, trainer_id, trainers(id, name_ar, name_he, name_en, phone, gender), categories(name_he, name_ar, name_en), class_schedules(id, day_of_week, start_time, end_time, notes, halls(id, name_he, name_ar, name_en))').eq('id', classId).single(),
    supabase.from('trainees').select('id, name_ar, name_he, name_en, phone, jersey_number, class_id, gender, is_paid, amount_paid, payment_comment_ar, payment_comment_he, payment_comment_en').eq('class_id', classId).order('jersey_number', { ascending: true, nullsFirst: false }).limit(200),
    supabase.from('halls').select('id, name_ar, name_he, name_en').order('name_ar').limit(50),
    getClassAttendanceStats(classId),
  ])

  if (teamError || !team) {
    notFound()
  }
  if (rosterError) console.error(`Failed to fetch roster for class ${classId}:`, rosterError.message)
  if (hallsError) console.error('Failed to fetch halls:', hallsError.message)

  const teamDetails = team as unknown as ClassWithDetails
  const trainees = (roster || []) as Trainee[]
  const schedules = teamDetails.class_schedules || []
  const hallNames = [...new Set(
    schedules.filter(s => s.halls).map(s => getLocalizedField(s.halls!, 'name', locale))
  )] as string[]
  const halls = (allHalls || []) as { id: string; name_ar: string; name_he: string; name_en: string }[]

  return (
    <AnimatedMeshBackground className="min-h-screen flex text-white" suppressHydrationWarning>
      <Sidebar locale={locale} />

      <div className="flex-1 flex flex-col md:ml-[240px] relative z-10 w-full">
        <div className="bg-[#0B132B]/60 backdrop-blur-3xl border-b border-white/10 sticky top-0 z-40">
          <Header
            locale={locale}
            title={getLocalizedField(teamDetails, 'name', locale)}
            showBack
            backHref={`/${locale}/teams`}
          />
        </div>

        <main className="flex-1 pt-20 pb-nav md:pb-8 px-3 md:px-5 w-full overflow-x-hidden">
          <div className="max-w-4xl mx-auto w-full">

            {/* Team Hero */}
            <section className="py-4">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-700 p-6 text-white shadow-xl shadow-purple-900/30 mb-4">
                <div className="absolute top-0 right-0 -mt-6 -mr-6 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-28 h-28 bg-black/20 rounded-full blur-xl" />
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner flex-shrink-0">
                    <Trophy className="w-8 h-8 text-white" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-white drop-shadow-sm mb-0.5">
                      {getLocalizedField(teamDetails, 'name', locale)}
                    </h1>
                    <div className="flex items-center gap-1.5 text-purple-200 text-sm font-medium">
                      <User className="w-4 h-4" />
                      <span>{trainees.length} {'لاعب'}</span>
                      {teamDetails.categories && (
                        <>
                          <span className="text-white/30">•</span>
                          <span className="text-purple-200">{getLocalizedField(teamDetails.categories, 'name', locale)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Info strip */}
              <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl mb-4 overflow-hidden">
                {/* Trainer row */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${(teamDetails.trainers as any)?.gender === 'female' ? 'bg-pink-500/20' : 'bg-indigo-500/20'}`}>
                      <User className={`w-3.5 h-3.5 ${(teamDetails.trainers as any)?.gender === 'female' ? 'text-pink-400' : 'text-indigo-400'}`} />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{'المدرب'}</p>
                      <p className="text-sm font-black text-white leading-tight">
                        {teamDetails.trainers ? getLocalizedField(teamDetails.trainers, 'name', locale) : 'غير معين'}
                      </p>
                      {teamDetails.trainers?.phone && (
                        <p className="text-xs text-white/40 font-medium" dir="ltr">{teamDetails.trainers.phone}</p>
                      )}
                    </div>
                  </div>
                  <TrainerReassignButton
                    classId={classId}
                    currentTrainerId={teamDetails.trainer_id}
                    locale={locale}
                    isAdmin={!!session}
                  />
                </div>

                {/* Hall row */}
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/8">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{'القاعة'}</p>
                    <p className="text-sm font-black text-white leading-tight">
                      {hallNames.length > 0 ? hallNames.join(' / ') : 'غير محدد'}
                    </p>
                  </div>
                </div>

                {/* Schedule row */}
                <div className="flex items-start gap-2.5 px-4 py-3">
                  <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">{'الجدول'}</p>
                    <ScheduleEditor schedules={schedules} halls={halls} locale={locale} />
                  </div>
                </div>
              </div>
            </section>

            {/* Attendance History Link */}
            <section className="mb-4">
              <Link
                href={`/${locale}/teams/${classId}/attendance`}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-[0.99] touch-manipulation"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">سجل الحضور</p>
                    <p className="text-[11px] text-white/40">آخر 30 يوم</p>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-white/30" />
              </Link>
            </section>

            {/* Roster Section */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-black text-white drop-shadow-md">
                  {'قائمة اللاعبين'}
                </h2>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-white/50 bg-white/10 border border-white/10 px-3 py-1 rounded-full font-mono">
                    {trainees.length}
                  </div>
                  {session && (
                    <Link
                      href={`/${locale}/teams/${classId}/add`}
                      className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded-full text-xs font-bold hover:bg-indigo-500 transition-colors shadow-sm border border-indigo-500/50"
                    >
                      <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                      {'إضافة'}
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
                attendanceStatsMap={attendanceStatsMap}
              />
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
