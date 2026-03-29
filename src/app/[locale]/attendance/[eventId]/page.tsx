import type { Locale } from '@/lib/i18n/config'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { AttendanceSheet } from '@/components/attendance/AttendanceSheet'
import { EventInfoCards } from '@/components/events/EventInfoCards'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLocalizedField } from '@/lib/utils'
import type { Database } from '@/lib/supabase/types'
import { notFound } from 'next/navigation'
import { getSession } from '@/app/actions'
import { AnimatedMeshBackground } from '@/components/ui/AnimatedMeshBackground'

type Trainee = Database['public']['Tables']['trainees']['Row']

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ locale: Locale; eventId: string }>
}) {
  const { locale, eventId } = await params
  const supabase = await createServerSupabaseClient()

  // Fetch session + event + attendance in parallel
  const [
    session,
    { data: event, error: eventError },
    { data: attendanceRecords }
  ] = await Promise.all([
    getSession(),
    (supabase as any).from('events').select('id, type, event_date, class_id, trainer_id, hall_id, title_ar, title_he, title_en, start_time, end_time, notes_en, halls(id, name_ar, name_he, name_en), trainers(name_ar, name_he, name_en), classes(name_ar, name_he, name_en)').eq('id', eventId).single(),
    (supabase as any).from('attendance').select('trainee_id, status, absence_reason').eq('event_id', eventId),
  ])

  if (eventError || !event) {
    notFound()
  }

  const trainerName = event.trainers ? getLocalizedField(event.trainers, 'name', locale) : null
  const className = event.classes ? getLocalizedField(event.classes, 'name', locale) : null
  const hallName = event.halls ? getLocalizedField(event.halls, 'name', locale) : null

  // Get class_id directly from event column, fallback to trainer's class
  let targetClassId: string | null = event.class_id || null
  if (!targetClassId && event.trainer_id) {
    const { data: classData } = await (supabase as any)
      .from('classes').select('id').eq('trainer_id', event.trainer_id).limit(1).maybeSingle()
    if (classData) targetClassId = classData.id
  }

  // Fetch trainees for this class
  let trainees: Trainee[] = []
  if (targetClassId) {
    const { data } = await (supabase as any)
      .from('trainees').select('id, name_ar, name_he, name_en, jersey_number, gender, class_id').eq('class_id', targetClassId)
      .order('jersey_number', { ascending: true })
      .limit(200)
    trainees = data || []
  }

  return (
    <AnimatedMeshBackground className="min-h-screen flex text-white" suppressHydrationWarning>
      <Sidebar locale={locale} role={session?.role} />

      <div className="flex-1 flex flex-col md:ml-[240px] relative z-10 w-full">
        <div className="bg-[#0B132B]/60 backdrop-blur-3xl border-b border-white/10 sticky top-0 z-40">
          <Header
            locale={locale}
            title={getLocalizedField(event, 'title', locale)}
            showBack
          />
        </div>

        <main className="flex-1 pt-20 pb-nav md:pb-8 px-5">
          <div className="max-w-2xl mx-auto">
            {/* Event Info Cards */}
            <EventInfoCards
              event={{
                id: event.id,
                type: event.type,
                event_date: event.event_date,
                class_id: event.class_id,
                trainer_id: event.trainer_id,
                hall_id: event.hall_id,
                title_ar: event.title_ar,
                title_he: event.title_he,
                title_en: event.title_en,
                start_time: event.start_time,
                end_time: event.end_time,
                notes_en: event.notes_en,
              }}
              trainerName={trainerName}
              className={className}
              hallName={hallName}
              locale={locale}
              date={event.event_date}
            />

            {/* Attendance Sheet */}
            <section>
              {trainees.length > 0 ? (
                <AttendanceSheet
                  eventId={eventId}
                  trainees={trainees}
                  initialAttendance={(attendanceRecords || []) as { trainee_id: string; status: 'present' | 'absent' | 'late'; absence_reason?: string }[]}
                />
              ) : (
                <div className="text-center py-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl animate-fade-in-up">
                  <p className="text-sm font-bold text-white/50">
                    {'لا يوجد لاعبون مسجلون لهذا الحدث'}
                  </p>
                </div>
              )}
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
