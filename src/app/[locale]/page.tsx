import { getDictionary } from '@/lib/i18n/get-dictionary'
import type { Locale } from '@/lib/i18n/config'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { createServerSupabaseClient } from '@/lib/supabase/server'
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

  const today = new Date().toISOString().split('T')[0]

  const { data: events } = await supabase
    .from('events')
    .select('*, halls(*)')
    .eq('event_date', today)
    .order('start_time', { ascending: true })

  const todayEvents = (events || []) as unknown as EventWithHall[]

  const { count: hallsCount } = await supabase.from('halls').select('*', { count: 'exact', head: true })
  const { count: teamsCount } = await supabase.from('teams').select('*', { count: 'exact', head: true })
  const { count: traineesCount } = await supabase.from('trainees').select('*', { count: 'exact', head: true })

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex" suppressHydrationWarning>
      <Sidebar locale={locale} />
      
      <div className="flex-1 flex flex-col md:ml-[240px]">
        <Header locale={locale} />

        <main className="flex-1 pt-20 pb-24 md:pb-8 px-5">
          <div className="max-w-4xl mx-auto">
            {/* Stats */}
            <section className="py-4">
              <div className="grid grid-cols-3 md:flex md:justify-center md:gap-8 gap-3">
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fff7ed, #fed7aa)', color: '#ea580c' }}>
                    <Building2 className="w-6 h-6" strokeWidth={2.5} />
                  </div>
                  <div className="stat-value">{hallsCount || 0}</div>
                  <div className="stat-label">{locale === 'ar' ? 'قاعات' : locale === 'he' ? 'אולמות' : 'Halls'}</div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f5f3ff, #ddd6fe)', color: '#7c3aed' }}>
                    <Users className="w-6 h-6" strokeWidth={2.5} />
                  </div>
                  <div className="stat-value">{teamsCount || 0}</div>
                  <div className="stat-label">{locale === 'ar' ? 'فرق' : locale === 'he' ? 'קבוצות' : 'Teams'}</div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ecfdf5, #bbf7d0)', color: '#16a34a' }}>
                    <User className="w-6 h-6" strokeWidth={2.5} />
                  </div>
                  <div className="stat-value">{traineesCount || 0}</div>
                  <div className="stat-label">{locale === 'ar' ? 'لاعبين' : locale === 'he' ? 'שחקנים' : 'Players'}</div>
                </div>
              </div>
            </section>

            {/* Today's Schedule */}
            <section className="pb-8">
              <div className="section-header">
                <h2 className="section-title">
                  <Calendar className="w-5 h-5" />
                  {locale === 'ar' ? 'جدول اليوم' : locale === 'he' ? 'לוח זמנים להיום' : "Today's Schedule"}
                </h2>
                <Badge className="badge-primary">
                  {new Date().toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })}
                </Badge>
              </div>

              {todayEvents.length > 0 ? (
                <div className="space-y-3">
                  {todayEvents.map((event, index) => (
                    <Link key={event.id} href={`/${locale}/attendance/${event.id}`}>
                      <Card interactive className={`animate-fade-in-up stagger-${index + 1}`}>
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[56px]">
                            <div className="text-xl font-bold text-indigo-600">
                              {formatTime(event.start_time).split(':')[0]}
                            </div>
                            <div className="text-xs text-gray-400 uppercase font-medium">
                              {formatTime(event.start_time).includes('PM') ? 'PM' : 'AM'}
                            </div>
                          </div>
                          
                          <div className={`w-1 h-12 rounded-full ${event.type === 'game' ? 'bg-orange-400' : 'bg-green-400'}`} />
                          
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
                              <p className="text-sm text-gray-500">
                                {getLocalizedField(event.halls, 'name', locale)}
                              </p>
                            )}
                          </div>
                          
                          <div className="text-gray-300 text-lg">
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

            {/* Quick Actions */}
            <section>
              <div className="section-header">
                <h2 className="section-title">
                  {locale === 'ar' ? 'إجراءات سريعة' : locale === 'he' ? 'פעולות מהירות' : 'Quick Actions'}
                </h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href={`/${locale}/halls`}>
                  <Card variant="feature" color="orange" interactive className="animate-fade-in-up stagger-1">
                    <div className="icon-wrapper">
                      <Building2 className="w-8 h-8" strokeWidth={2.5} />
                    </div>
                    <h3>{locale === 'ar' ? 'القاعات' : locale === 'he' ? 'אולמות' : 'Halls'}</h3>
                    <p>{locale === 'ar' ? 'عرض الجداول' : locale === 'he' ? 'צפה בלוחות' : 'View schedules'}</p>
                  </Card>
                </Link>

                <Link href={`/${locale}/teams`}>
                  <Card variant="feature" color="purple" interactive className="animate-fade-in-up stagger-2">
                    <div className="icon-wrapper">
                      <Users className="w-8 h-8" strokeWidth={2.5} />
                    </div>
                    <h3>{locale === 'ar' ? 'الفرق' : locale === 'he' ? 'קבוצות' : 'Teams'}</h3>
                    <p>{locale === 'ar' ? 'إدارة الفرق' : locale === 'he' ? 'ניהול קבוצות' : 'Manage teams'}</p>
                  </Card>
                </Link>

                <Link href={`/${locale}/trainers`}>
                  <Card variant="feature" color="green" interactive className="animate-fade-in-up stagger-3">
                    <div className="icon-wrapper">
                      <Dumbbell className="w-8 h-8" strokeWidth={2.5} />
                    </div>
                    <h3>{locale === 'ar' ? 'المدربين' : locale === 'he' ? 'מאמנים' : 'Trainers'}</h3>
                    <p>{locale === 'ar' ? 'قائمة المدربين' : locale === 'he' ? 'רשימת מאמנים' : 'Trainer list'}</p>
                  </Card>
                </Link>

                <Link href={`/${locale}/reports`}>
                  <Card variant="feature" color="blue" interactive className="animate-fade-in-up stagger-4">
                    <div className="icon-wrapper">
                      <BarChart3 className="w-8 h-8" strokeWidth={2.5} />
                    </div>
                    <h3>{locale === 'ar' ? 'التقارير' : locale === 'he' ? 'דוחות' : 'Reports'}</h3>
                    <p>{locale === 'ar' ? 'تحليلات' : locale === 'he' ? 'אנליטיקה' : 'Analytics'}</p>
                  </Card>
                </Link>
              </div>
            </section>
          </div>
        </main>

        <BottomNav locale={locale} />
      </div>
    </div>
  )
}
