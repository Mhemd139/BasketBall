import { getDictionary } from '@/lib/i18n/get-dictionary'
import type { Locale } from '@/lib/i18n/config'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLocalizedField, formatDate, formatTime, getNowInIsrael } from '@/lib/utils'
import type { Database } from '@/lib/supabase/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Building2, Calendar } from 'lucide-react'
import { HallSchedule } from '@/components/halls/HallSchedule'
import { HallManagementActions } from '@/components/halls/HallManagementActions'
import { getSession, fetchHallSchedules } from '@/app/actions'
import { AnimatedMeshBackground } from '@/components/ui/AnimatedMeshBackground'

type Hall = Database['public']['Tables']['halls']['Row']

export default async function HallDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>
}) {
  const { locale, id } = await params
  const dict = await getDictionary(locale)
  const supabase = await createServerSupabaseClient()
  const session = await getSession() // Fetch Session

  const today = getNowInIsrael()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' })
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' })

  const [{ data: hall, error: hallError }, { data: events }, schedulesRes] = await Promise.all([
    supabase.from('halls').select('*').eq('id', id).single(),
    (supabase as any).from('events')
      .select('id, title_he, title_ar, title_en, start_time, end_time, event_date, type, schedule_id, class_id, trainer_id, hall_id, notes_en, trainers(name_he, name_ar, name_en)')
      .eq('hall_id', id)
      .gte('event_date', startOfMonth)
      .lte('event_date', endOfMonth)
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true }),
    fetchHallSchedules(id),
  ])

  if (hallError || !hall) {
    notFound()
  }

  const hallData = hall as Hall
  const isEditable = session?.role === 'headcoach' || session?.role === 'coach' || session?.role === 'admin' || session?.role === 'trainer'

  return (
    <AnimatedMeshBackground className="min-h-screen flex text-white" suppressHydrationWarning>
      <Sidebar locale={locale} role={session?.role} />
      
      <div className="flex-1 flex flex-col md:ml-[240px] relative z-10 w-full overflow-x-hidden">
        <div className="bg-white/70 backdrop-blur-xl border-b border-white/20 sticky top-0 z-40">
          <Header locale={locale} showBack backHref={`/${locale}/halls`} />
        </div>

        <main className="flex-1 pt-20 pb-24 md:pb-8 px-3 md:px-5 w-full">
          <div className="max-w-4xl mx-auto w-full">
            {/* Hall Hero */}
            <section className="py-4 mb-2">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 to-red-600 p-6 text-white shadow-lg shadow-orange-200">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-black/10 rounded-full blur-xl"></div>
                
                {isEditable && (
                  <div className="absolute top-4 right-4 z-20">
                    <HallManagementActions hall={hallData} locale={locale} />
                  </div>
                )}

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="mb-3 p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <Building2 className="w-8 h-8 text-white" strokeWidth={2.5} />
                  </div>
                  
                  <h1 className="heading-lg text-white mb-2 drop-shadow-sm">
                    {getLocalizedField(hallData, 'name', locale)}
                  </h1>
                  
                  <p className="text-orange-50 max-w-md mx-auto font-medium opacity-90">
                    {getLocalizedField(hallData, 'description', locale) || (
                      locale === 'he' ? 'אולם כדורסל' : 'قاعة كرة السلة'
                    )}
                  </p>
                </div>
              </div>
            </section>

            {/* Hall Schedule Timeline */}
            <section>
              <HallSchedule
                hallId={hallData.id}
                events={(events || []) as any}
                weeklySchedules={schedulesRes.schedules ?? []}
                locale={locale}
                isEditable={isEditable}
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
