import type { Locale } from '@/lib/i18n/config'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { Badge } from '@/components/ui/Badge'
import { AttendanceSheet } from '@/components/attendance/AttendanceSheet'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLocalizedField, formatTime, formatDate } from '@/lib/utils'
import type { Database } from '@/lib/supabase/types'
import { notFound } from 'next/navigation'
import { MapPin, Clock } from 'lucide-react'

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

  // Step 1: event + attendance in parallel
  const [
    { data: event, error: eventError },
    { data: attendanceRecords }
  ] = await Promise.all([
    (supabase as any).from('events').select('*, halls(*)').eq('id', eventId).single(),
    (supabase as any).from('attendance').select('trainee_id, status').eq('event_id', eventId),
  ])

  if (eventError || !event) {
    notFound()
  }

  const eventWithHall = event as unknown as EventWithHall

  // Step 2: class from trainer
  const { data: classData } = await (supabase as any)
    .from('classes')
    .select('id')
    .eq('trainer_id', event.trainer_id)
    .single()

  // Step 3: trainees
  let trainees: Trainee[] = []
  if (classData) {
    const { data } = await (supabase as any)
      .from('trainees')
      .select('*')
      .eq('class_id', classData.id)
      .order('jersey_number', { ascending: true })
    trainees = data || []
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex" suppressHydrationWarning>
      <Sidebar locale={locale} />

      <div className="flex-1 flex flex-col md:ml-[240px]">
        <Header
          locale={locale}
          title={getLocalizedField(eventWithHall, 'title', locale)}
          showBack
          backHref={`/${locale}`}
        />

        <main className="flex-1 pt-20 pb-32 md:pb-10 px-5">
          <div className="max-w-2xl mx-auto">
            {/* Event Info */}
            <section className="py-4">
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <Badge className={event.type === 'game' ? 'badge-error' : 'badge-success'}>
                  {event.type === 'game'
                    ? (locale === 'ar' ? 'مباراة' : locale === 'he' ? 'משחק' : 'Game')
                    : (locale === 'ar' ? 'تدريب' : locale === 'he' ? 'אימון' : 'Training')
                  }
                </Badge>
                <span className="text-sm text-gray-500">
                  {formatDate(event.event_date, locale)}
                </span>
              </div>

              <h1 className="heading-md mb-2">
                {getLocalizedField(eventWithHall, 'title', locale)}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                {eventWithHall.halls && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {getLocalizedField(eventWithHall.halls, 'name', locale)}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {formatTime(event.start_time)} - {formatTime(event.end_time)}
                </span>
              </div>
            </section>

            {/* Attendance Sheet */}
            <section>
              {trainees.length > 0 ? (
                <AttendanceSheet
                  eventId={eventId}
                  trainees={trainees}
                  initialAttendance={(attendanceRecords || []) as { trainee_id: string; status: 'present' | 'absent' | 'late' }[]}
                  locale={locale}
                />
              ) : (
                <div className="card text-center py-12">
                  <p className="text-gray-500">
                    {locale === 'ar' ? 'لا يوجد لاعبون مسجلون لهذا الحدث'
                      : locale === 'he' ? 'אין שחקנים רשומים לאירוע זה'
                      : 'No players registered for this event'}
                  </p>
                </div>
              )}
            </section>
          </div>
        </main>

        <BottomNav locale={locale} />
      </div>
    </div>
  )
}
