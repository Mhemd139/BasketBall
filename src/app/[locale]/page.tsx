// 🏀 Basketball Manager - Last build trigger: 2026-02-08T22:07:00
import { getDictionary } from '@/lib/i18n/get-dictionary'
import type { Locale } from '@/lib/i18n/config'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSession } from '@/app/actions'
import { QuickActions } from '@/components/home/QuickActions'
import { getLocalizedField, formatTime } from '@/lib/utils'
import type { Database } from '@/lib/supabase/types'
import Link from 'next/link'
import { Building2, Users, User, Calendar, Inbox } from 'lucide-react'
import { AnimatedMeshBackground } from "@/components/ui/AnimatedMeshBackground"

type Event = Database['public']['Tables']['events']['Row']
type Hall = Database['public']['Tables']['halls']['Row']

interface EventWithHall extends Event {
  halls: Hall | null
}

import { notFound } from 'next/navigation'
import { isValidLocale } from '@/lib/i18n/config'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  if (!isValidLocale(locale)) {
    notFound()
  }
  const dict = await getDictionary(locale)
  const supabase = await createServerSupabaseClient()
  const session = await getSession()
  const canManage = !!session // Ensure logged-in trainers can see quick action shortcuts

  const today = new Date().toISOString().split('T')[0]

  const [
    { data: events },
    { count: hallsCount },
    { count: teamsCount },
    { count: traineesCount }
  ] = await Promise.all([
    supabase.from('events').select('*, halls(*)').eq('event_date', today).order('start_time', { ascending: true }),
    supabase.from('halls').select('*', { count: 'exact', head: true }),
    supabase.from('classes').select('*', { count: 'exact', head: true }),
    supabase.from('trainees').select('*', { count: 'exact', head: true }),
  ])

  const todayEvents = (events || []) as unknown as EventWithHall[]

  return (
    <AnimatedMeshBackground className="min-h-screen flex text-white" suppressHydrationWarning>
      <Sidebar locale={locale} role={session?.role} />
      
      <div className="flex-1 flex flex-col md:ml-[240px] relative z-10 w-full overflow-hidden">
        <div className="bg-[#0B132B]/60 backdrop-blur-3xl border-b border-white/10 sticky top-0 z-40">
          <Header locale={locale} />
        </div>

        <main className="flex-1 pt-20 pb-24 md:pb-8 px-3 md:px-5 w-full">
          <div className="max-w-4xl md:max-w-7xl mx-auto w-full space-y-4 md:space-y-8">
            {/* Stats */}
            <section>
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 py-4 -my-4 -mx-3 px-3 md:mx-0 md:px-0 md:grid md:grid-cols-3 scrollbar-hide">
                
                {/* Halls Card */}
                <Link href={`/${locale}/halls`} className="relative min-w-[120px] md:min-w-0 p-5 snap-center shrink-0 flex-1 flex flex-col items-center transition-all hover:-translate-y-1 active:scale-95 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[28px] shadow-xl group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 border border-orange-500/20 group-hover:-translate-y-1 transition-transform bg-orange-500/10 text-orange-400">
                    <Building2 className="w-6 h-6" strokeWidth={2} />
                  </div>
                  <div className="text-3xl font-black text-white drop-shadow-md mb-1">{hallsCount || 0}</div>
                  <div className="text-[10px] font-black text-orange-200/70 uppercase tracking-widest">{'قاعات'}</div>
                </Link>

                {/* Teams Card */}
                <Link href={`/${locale}/teams`} className="relative min-w-[120px] md:min-w-0 p-5 snap-center shrink-0 flex-1 flex flex-col items-center transition-all hover:-translate-y-1 active:scale-95 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[28px] shadow-xl group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 border border-indigo-500/20 group-hover:-translate-y-1 transition-transform bg-indigo-500/10 text-indigo-400">
                    <Users className="w-6 h-6" strokeWidth={2} />
                  </div>
                  <div className="text-3xl font-black text-white drop-shadow-md mb-1">{teamsCount || 0}</div>
                  <div className="text-[10px] font-black text-indigo-200/70 uppercase tracking-widest">{'فرق'}</div>
                </Link>

                {/* Trainees Card */}
                <Link href={`/${locale}/teams`} className="relative min-w-[120px] md:min-w-0 p-5 snap-center shrink-0 flex-1 flex flex-col items-center transition-all hover:-translate-y-1 active:scale-95 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[28px] shadow-xl group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 border border-emerald-500/20 group-hover:-translate-y-1 transition-transform bg-emerald-500/10 text-emerald-400">
                    <User className="w-6 h-6" strokeWidth={2} />
                  </div>
                  <div className="text-3xl font-black text-white drop-shadow-md mb-1">{traineesCount || 0}</div>
                  <div className="text-[10px] font-black text-emerald-200/70 uppercase tracking-widest">{'لاعبين'}</div>
                </Link>

              </div>
            </section>

            {/* Quick Actions */}
            <QuickActions locale={locale} canManage={canManage} />

            {/* Today's Schedule */}
            <section className="pb-4">
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-base font-black text-white drop-shadow-md flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  {'جدول اليوم'}
                </h2>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 shadow-sm text-center">
                  <span className="font-syncopate text-xs text-white tracking-widest uppercase font-bold drop-shadow">
                    {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              </div>

              {todayEvents.length > 0 ? (
                <div className="space-y-3">
                  {todayEvents.map((event, index) => (
                    <Link key={event.id} href={`/${locale}/attendance/${event.id}`}>
                      <Card interactive className={`animate-fade-in-up stagger-${index + 1} overflow-hidden relative group hover:-translate-y-1 transition-all`}>
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
                                <Building2 className="w-3 h-3 shrink-0" />
                                <span className="truncate">{getLocalizedField(event.halls, 'name', locale)}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 py-4 px-3 animate-fade-in-up bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-xl">
                  <div className="bg-indigo-500/20 border border-indigo-500/30 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Inbox className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white drop-shadow-md">{'لا توجد فعاليات اليوم'}</p>
                    <p className="text-xs text-indigo-200/70 font-bold">{'تحقق من جدول الأسبوع القادم'}</p>
                  </div>
                  <Link 
                    href={`/${locale}/schedule`}
                    className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 border border-white/10 transition-colors whitespace-nowrap backdrop-blur-md"
                  >
                    {'عرض الجدول'}
                  </Link>
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
