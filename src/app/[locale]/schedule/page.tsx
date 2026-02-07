import type { Locale } from '@/lib/i18n/config'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLocalizedField, formatTime, formatDate } from '@/lib/utils'
import type { Database } from '@/lib/supabase/types'
import { Calendar as CalendarIcon, MapPin, ChevronRight, Inbox } from 'lucide-react'

type Event = Database['public']['Tables']['events']['Row']
type Hall = Database['public']['Tables']['halls']['Row']

interface EventWithDetails extends Event {
  halls: Hall | null
}

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()

  // Fetch all events ordered by date desc (newest first)
  const { data: events } = await (supabase as any)
    .from('events')
    .select('*, halls(*)')
    .order('event_date', { ascending: false })

  const allEvents = (events || []) as EventWithDetails[]

  // Group events by date
  const groupedEvents: Record<string, EventWithDetails[]> = {}
  allEvents.forEach(event => {
    const dateKey = event.event_date
    if (!groupedEvents[dateKey]) groupedEvents[dateKey] = []
    groupedEvents[dateKey].push(event)
  })

  // Sort dates descending
  const sortedDates = Object.keys(groupedEvents).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex" suppressHydrationWarning>
      <Sidebar locale={locale} />

      <div className="flex-1 flex flex-col md:ml-[240px]">
        <Header
          locale={locale}
          title={locale === 'ar' ? 'الجدول' : locale === 'he' ? 'לוח זמנים' : 'Schedule'}
          showBack={false}
        />

        <main className="flex-1 pt-48 pb-32 md:pb-10 px-5">
          <div className="max-w-2xl mx-auto space-y-6">
            
            {sortedDates.length > 0 ? (
              sortedDates.map((date) => (
                <section key={date}>
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarIcon className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-lg font-bold text-gray-800">
                      {formatDate(date, locale)}
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {groupedEvents[date].map((event, index) => (
                      <Link key={event.id} href={`/${locale}/attendance/${event.id}`}>
                        <Card interactive className="animate-fade-in-up">
                          <div className="flex items-center gap-4">
                            {/* Time */}
                            <div className="text-center min-w-[56px]">
                              <div className="text-xl font-bold text-indigo-600">
                                {formatTime(event.start_time).split(':')[0]}
                              </div>
                              <div className="text-xs text-gray-400 uppercase font-medium">
                                {formatTime(event.start_time).includes('PM') ? 'PM' : 'AM'}
                              </div>
                            </div>
                            
                            {/* Type Indicator */}
                            <div className={`w-1 h-12 rounded-full ${event.type === 'game' ? 'bg-orange-400' : 'bg-green-400'}`} />
                            
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={`text-xs font-semibold ${event.type === 'game' ? 'text-orange-500' : 'text-green-500'}`}>
                                  ● {event.type === 'game' 
                                    ? (locale === 'ar' ? 'مباراة' : locale === 'he' ? 'משחק' : 'Game')
                                    : (locale === 'ar' ? 'تدريب' : locale === 'he' ? 'אימון' : 'Training')
                                  }
                                </span>
                              </div>
                              <h3 className="font-semibold text-gray-900 truncate">
                                {getLocalizedField(event, 'title', locale)}
                              </h3>
                              {event.halls && (
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {getLocalizedField(event.halls, 'name', locale)}
                                </p>
                              )}
                            </div>
                            
                            <ChevronRight className="text-gray-300 w-5 h-5 rtl:rotate-180" />
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <div className="text-center py-20">
                <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Inbox className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700">
                  {locale === 'ar' ? 'لا توجد فعاليات' : locale === 'he' ? 'אין אירועים' : 'No events found'}
                </h3>
              </div>
            )}
          </div>
        </main>

        <BottomNav locale={locale} />
      </div>
    </div>
  )
}
