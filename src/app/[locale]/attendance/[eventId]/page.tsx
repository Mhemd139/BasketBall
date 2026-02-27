import type { Locale } from '@/lib/i18n/config'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { Badge } from '@/components/ui/Badge'
import { AttendanceSheet } from '@/components/attendance/AttendanceSheet'
import { EventManagementActions } from '@/components/events/EventManagementActions'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLocalizedField, formatDate } from '@/lib/utils'
import type { Database } from '@/lib/supabase/types'
import { notFound } from 'next/navigation'
import { MapPin } from 'lucide-react'
import { getSession } from '@/app/actions'
import { AnimatedMeshBackground } from '@/components/ui/AnimatedMeshBackground'
import { EventTimeEditor } from '@/components/events/EventTimeEditor'

type Event = Database['public']['Tables']['events']['Row']
type Hall = Database['public']['Tables']['halls']['Row']
type Trainee = Database['public']['Tables']['trainees']['Row']

interface EventWithHall extends Event {
  halls: Hall | null
}

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
    (supabase as any).from('events').select('*, halls(*)').eq('id', eventId).single(),
    (supabase as any).from('attendance').select('trainee_id, status').eq('event_id', eventId),
  ])

  if (eventError || !event) {
    notFound()
  }

  const eventWithHall = event as unknown as EventWithHall

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
            title={getLocalizedField(eventWithHall, 'title', locale)}
            showBack
          />
        </div>

        <main className="flex-1 pt-20 pb-nav md:pb-8 px-5">
          <div className="max-w-2xl mx-auto">
            {/* Event Info */}
            <section className="py-4">
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <Badge className={event.type === 'game' ? 'badge-error' : 'badge-success'}>
                    {event.type === 'game'
                      ? 'مباراة'
                      : 'تدريب'
                    }
                </Badge>
                <span className="text-sm text-white/50">
                  {formatDate(event.event_date, locale)}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-xl font-semibold text-white">
                  {getLocalizedField(eventWithHall, 'title', locale)}
                </h1>
                <EventManagementActions event={event} locale={locale} hallId={event.hall_id} />
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-white/50">
                {eventWithHall.halls && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {getLocalizedField(eventWithHall.halls, 'name', locale)}
                  </span>
                )}
                <EventTimeEditor
                  eventId={eventId}
                  startTime={event.start_time}
                  endTime={event.end_time}
                />
              </div>
            </section>

            {/* Attendance Sheet */}
            <section>
              {trainees.length > 0 ? (
                <AttendanceSheet
                  eventId={eventId}
                  trainees={trainees}
                  initialAttendance={(attendanceRecords || []) as { trainee_id: string; status: 'present' | 'absent' | 'late' }[]}
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
