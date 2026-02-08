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
import { Building2, Users, User, Calendar, Dumbbell, BarChart3, Inbox } from 'lucide-react'

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex" suppressHydrationWarning>
      <Sidebar locale={locale} />
      
      <div className="flex-1 flex flex-col md:ml-[240px]">
        <Header locale={locale} />

        <main className="flex-1 pt-20 pb-24 md:pb-8 px-3 md:px-5 w-full">
          <div className="max-w-4xl md:max-w-7xl mx-auto w-full space-y-4 md:space-y-8">
            {/* Stats */}
            <section>
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-2 md:gap-6 pb-2 -mx-3 px-3 md:mx-0 md:px-0 md:grid md:grid-cols-3 scrollbar-hide">
                <div className="stat-card min-w-[110px] md:min-w-0 p-3 md:p-6 snap-center shrink-0 flex-1 transition-all hover:scale-105">
                  <div className="stat-icon w-8 h-8 md:w-12 md:h-12 text-lg md:text-2xl mb-1 md:mb-2" style={{ background: 'linear-gradient(135deg, #fff7ed, #fed7aa)', color: '#ea580c' }}>
                    <Building2 className="w-4 h-4 md:w-6 md:h-6" strokeWidth={2.5} />
                  </div>
                  <div className="stat-value text-xl md:text-3xl font-bold">{hallsCount || 0}</div>
                  <div className="stat-label text-xs md:text-sm font-medium">{locale === 'ar' ? 'قاعات' : locale === 'he' ? 'אולמות' : 'Halls'}</div>
                </div>
                
                <div className="stat-card min-w-[110px] md:min-w-0 p-3 md:p-6 snap-center shrink-0 flex-1 transition-all hover:scale-105">
                  <div className="stat-icon w-8 h-8 md:w-12 md:h-12 text-lg md:text-2xl mb-1 md:mb-2" style={{ background: 'linear-gradient(135deg, #f5f3ff, #ddd6fe)', color: '#7c3aed' }}>
                    <Users className="w-4 h-4 md:w-6 md:h-6" strokeWidth={2.5} />
                  </div>
                  <div className="stat-value text-xl md:text-3xl font-bold">{teamsCount || 0}</div>
                  <div className="stat-label text-xs md:text-sm font-medium">{locale === 'ar' ? 'فرق' : locale === 'he' ? 'קבוצות' : 'Teams'}</div>
                </div>
                
                <div className="stat-card min-w-[110px] md:min-w-0 p-3 md:p-6 snap-center shrink-0 flex-1 transition-all hover:scale-105">
                  <div className="stat-icon w-8 h-8 md:w-12 md:h-12 text-lg md:text-2xl mb-1 md:mb-2" style={{ background: 'linear-gradient(135deg, #ecfdf5, #bbf7d0)', color: '#16a34a' }}>
                    <User className="w-4 h-4 md:w-6 md:h-6" strokeWidth={2.5} />
                  </div>
                  <div className="stat-value text-xl md:text-3xl font-bold">{traineesCount || 0}</div>
                  <div className="stat-label text-xs md:text-sm font-medium">{locale === 'ar' ? 'لاعبين' : locale === 'he' ? 'שחקנים' : 'Players'}</div>
                </div>
              </div>
            </section>

            {/* Quick Actions Integration */}
            <QuickActions locale={locale} canManage={canManage} />

            {/* Navigation Section */}
            <section>
               <div className="grid grid-cols-4 gap-2 md:gap-6">
                <Link href={`/${locale}/halls`}>
                  <Card interactive className="h-full p-2 md:p-6 active:scale-[0.95] transition-transform flex flex-col items-center justify-center text-center gap-1 md:gap-3 min-h-[80px] md:min-h-[160px]">
                     <div className="w-8 h-8 md:w-16 md:h-16 rounded-lg md:rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center transition-all">
                        <Building2 className="w-4 h-4 md:w-8 md:h-8" strokeWidth={2.5} />
                     </div>
                     <div className="flex flex-col items-center">
                        <span className="font-bold text-gray-900 text-[10px] md:text-lg leading-tight text-center">
                           {locale === 'ar' ? 'القاعات' : locale === 'he' ? 'אולמות' : 'Halls'}
                        </span>
                     </div>
                  </Card>
                </Link>

                <Link href={`/${locale}/teams`}>
                  <Card interactive className="h-full p-2 md:p-6 active:scale-[0.95] transition-transform flex flex-col items-center justify-center text-center gap-1 md:gap-3 min-h-[80px] md:min-h-[160px]">
                     <div className="w-8 h-8 md:w-16 md:h-16 rounded-lg md:rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center transition-all">
                        <Users className="w-4 h-4 md:w-8 md:h-8" strokeWidth={2.5} />
                     </div>
                     <div className="flex flex-col items-center">
                        <span className="font-bold text-gray-900 text-[10px] md:text-lg leading-tight text-center">
                           {locale === 'ar' ? 'الفرق' : locale === 'he' ? 'קבוצות' : 'Teams'}
                        </span>
                     </div>
                  </Card>
                </Link>

                <Link href={`/${locale}/trainers`}>
                  <Card interactive className="h-full p-2 md:p-6 active:scale-[0.95] transition-transform flex flex-col items-center justify-center text-center gap-1 md:gap-3 min-h-[80px] md:min-h-[160px]">
                     <div className="w-8 h-8 md:w-16 md:h-16 rounded-lg md:rounded-2xl bg-green-100 text-green-600 flex items-center justify-center transition-all">
                        <Dumbbell className="w-4 h-4 md:w-8 md:h-8" strokeWidth={2.5} />
                     </div>
                     <div className="flex flex-col items-center">
                        <span className="font-bold text-gray-900 text-[10px] md:text-lg leading-tight text-center">
                           {locale === 'ar' ? 'المدربين' : locale === 'he' ? 'מאמנים' : 'Trainers'}
                        </span>
                     </div>
                  </Card>
                </Link>

                <Link href={`/${locale}/reports`}>
                  <Card interactive className="h-full p-2 md:p-6 active:scale-[0.95] transition-transform flex flex-col items-center justify-center text-center gap-1 md:gap-3 min-h-[80px] md:min-h-[160px]">
                     <div className="w-8 h-8 md:w-16 md:h-16 rounded-lg md:rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center transition-all">
                        <BarChart3 className="w-4 h-4 md:w-8 md:h-8" strokeWidth={2.5} />
                     </div>
                     <div className="flex flex-col items-center">
                        <span className="font-bold text-gray-900 text-[10px] md:text-lg leading-tight text-center">
                           {locale === 'ar' ? 'التقارير' : locale === 'he' ? 'דוחות' : 'Reports'}
                        </span>
                     </div>
                  </Card>
                </Link>
              </div>
            </section>

            {/* Today's Schedule */}
            <section className="pb-4">
              <div className="section-header mb-2">
                <h2 className="section-title text-base">
                  <Calendar className="w-4 h-4" />
                  {locale === 'ar' ? 'جدول اليوم' : locale === 'he' ? 'לוח זמנים להיום' : "Today's Schedule"}
                </h2>
                <Badge className="badge-primary text-[10px] px-2 py-0.5" variant="secondary">
                  {new Date().toLocaleDateString(locale, { weekday: 'short', day: 'numeric' })}
                </Badge>
              </div>

              {todayEvents.length > 0 ? (
                <div className="space-y-3">
                  {todayEvents.map((event, index) => (
                    <Link key={event.id} href={`/${locale}/attendance/${event.id}`}>
                      <Card interactive className={`animate-fade-in-up stagger-${index + 1}`}>
                        <div className="flex items-center gap-3">
                          <div className="text-center min-w-[3.5rem] shrink-0">
                            <div className="text-lg font-bold text-indigo-600 leading-none">
                              {formatTime(event.start_time).split(':')[0]}
                            </div>
                            <div className="text-[10px] text-gray-400 uppercase font-medium mt-0.5">
                              {formatTime(event.start_time).includes('PM') ? 'PM' : 'AM'}
                            </div>
                          </div>
                          
                          <div className={`w-1 h-10 rounded-full shrink-0 ${event.type === 'game' ? 'bg-orange-400' : 'bg-green-400'}`} />
                          
                          <div className="flex-1 min-w-0 pr-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`text-[10px] uppercase tracking-wider font-bold ${event.type === 'game' ? 'text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md' : 'text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md'}`}>
                                {event.type === 'game' 
                                  ? (locale === 'ar' ? 'مباراة' : locale === 'he' ? 'משחק' : 'GAME')
                                  : (locale === 'ar' ? 'تدريب' : locale === 'he' ? 'אימון' : 'TRAINING')
                                }
                              </span>
                            </div>
                            <h3 className="font-bold text-gray-900 text-sm truncate leading-tight mb-1">
                              {getLocalizedField(event, 'title', locale)}
                            </h3>
                            {event.halls && (
                              <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                                <Building2 className="w-3 h-3 shrink-0" />
                                <span className="truncate">{getLocalizedField(event.halls, 'name', locale)}</span>
                              </p>
                            )}
                          </div>
                          
                          <div className="text-gray-300 text-lg shrink-0">
                            {locale === 'ar' || locale === 'he' ? '←' : '→'}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <Card className="animate-fade-in-up">
                  <div className="empty-state">
                    <div className="empty-icon">
                      <Inbox className="w-16 h-16 text-gray-300" strokeWidth={1.5} />
                    </div>
                    <h3>
                      {locale === 'ar' ? 'لا توجد فعاليات اليوم' : locale === 'he' ? 'אין אירועים היום' : 'No events today'}
                    </h3>
                    <p>
                      {locale === 'ar' ? 'استمتع بيوم راحة!' : locale === 'he' ? 'תהנה מיום מנוחה!' : 'Enjoy your rest day!'}
                    </p>
                  </div>
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
