import type { Locale } from '@/lib/i18n/config'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSession } from '@/app/actions'
import { getLocalizedField, formatTime, formatDate } from '@/lib/utils'
import type { Database } from '@/lib/supabase/types'
import { Calendar as CalendarIcon, MapPin, ChevronRight, Plus } from 'lucide-react'
import { AnimatedMeshBackground } from '@/components/ui/AnimatedMeshBackground'
import { ScheduleActions } from '@/components/schedule/ScheduleActions'

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
  const session = await getSession()
  const canManage = !!session

  const today = new Date().toISOString().split('T')[0]
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Fetch upcoming events for the next 7 days
  const { data: events } = await (supabase as any)
    .from('events')
    .select('*, halls(*)')
    .gte('event_date', today)
    .lte('event_date', nextWeek)
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true })

  const allEvents = (events || []) as EventWithDetails[]

  // Group events by date
  const groupedEvents: Record<string, EventWithDetails[]> = {}
  allEvents.forEach(event => {
    const dateKey = event.event_date
    if (!groupedEvents[dateKey]) groupedEvents[dateKey] = []
    groupedEvents[dateKey].push(event)
  })

  // Sort dates ascending (Today first)
  const sortedDates = Object.keys(groupedEvents).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

  return (
    <AnimatedMeshBackground className="min-h-screen flex text-white" suppressHydrationWarning>
      <Sidebar locale={locale} role={(await getSession())?.role} />

      <div className="flex-1 flex flex-col md:ml-[240px] relative z-10 w-full overflow-hidden">
        <div className="bg-[#0B132B]/60 backdrop-blur-3xl border-b border-white/10 sticky top-0 z-40">
          <Header
            locale={locale}
            title={'الجدول'}
            showBack={false}
          />
        </div>

        <main className="flex-1 pt-20 pb-24 md:pb-8 px-3 md:px-5 w-full">
          <div className="max-w-2xl mx-auto space-y-6 w-full">
            
            {sortedDates.length > 0 ? (
              sortedDates.map((date) => (
                <section key={date}>
                  <div className="sticky top-[88px] z-30 flex justify-center mb-4">
                    <div className="bg-[#0B132B]/60 backdrop-blur-2xl border border-white/20 rounded-full px-5 py-2 shadow-lg flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-indigo-400 drop-shadow-sm" />
                      <h2 className="text-sm font-syncopate font-bold text-white tracking-wider drop-shadow-sm uppercase">
                        {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </h2>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {groupedEvents[date].map((event, index) => (
                      <Link key={event.id} href={`/${locale}/attendance/${event.id}`}>
                        <Card interactive className="animate-fade-in-up w-full overflow-hidden relative group hover:-translate-y-1 transition-all">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="flex items-center gap-4 relative z-10">
                            {/* Time Block */}
                            <div className="text-center min-w-[3.5rem] shrink-0 bg-white/10 p-2.5 rounded-xl border border-white/5">
                              <div className="text-lg font-black text-white drop-shadow-md leading-none">
                                {formatTime(event.start_time).split(':')[0]}
                              </div>
                              <div className="text-[10px] text-indigo-200/60 uppercase font-black tracking-widest mt-1">
                                {formatTime(event.start_time).includes('PM') ? 'PM' : 'AM'}
                              </div>
                            </div>
                            
                            {/* Type Indicator Bar */}
                            <div className={`w-1 h-12 rounded-full shrink-0 ${event.type === 'game' ? 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.4)]' : 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.4)]'}`} />
                            
                            {/* Event Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] uppercase tracking-wider font-bold ${event.type === 'game' ? 'text-orange-300 bg-orange-500/15 px-2 py-0.5 rounded-md border border-orange-500/20' : 'text-green-300 bg-green-500/15 px-2 py-0.5 rounded-md border border-green-500/20'}`}>
                                  {event.type === 'game' 
                                    ? 'مباراة'
                                    : 'تدريب'
                                  }
                                </span>
                              </div>
                              <h3 className="font-bold text-white text-sm truncate leading-tight mb-1 drop-shadow-md">
                                {getLocalizedField(event, 'title', locale)}
                              </h3>
                              {event.halls && (
                                <p className="text-xs text-indigo-200/60 flex items-center gap-1 truncate font-medium">
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{getLocalizedField(event.halls, 'name', locale)}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </section>
              ))
            ) : (
                <div className="text-center py-12 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[28px] animate-fade-in-up mt-8 shadow-xl">
                  <div className="bg-indigo-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-indigo-500/30">
                    <CalendarIcon className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-1 drop-shadow-md">
                    {'لا توجد فعاليات هذا الأسبوع'}
                  </h3>
                  <p className="text-sm font-bold text-gray-300 mb-6 drop-shadow-sm">
                    {'اختر قاعة لإضافة تدريب أو مباراة جديدة'}
                  </p>
                </div>
            )}
            
            {/* FLOATING ACTION BUTTON */}
            {canManage && (
              <ScheduleActions locale={locale} />
            )}
          </div>
        </main>

        <div className="relative z-50">
          <BottomNav locale={locale} role={(await getSession())?.role} />
        </div>
      </div>
    </AnimatedMeshBackground>
  )
}
