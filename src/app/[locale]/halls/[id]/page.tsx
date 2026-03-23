import { getDictionary } from '@/lib/i18n/get-dictionary'
import type { Locale } from '@/lib/i18n/config'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card, CardContent } from '@/components/ui/Card'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLocalizedField, formatDate, formatTime, getNowInIsrael } from '@/lib/utils'
import type { Database } from '@/lib/supabase/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Calendar } from 'lucide-react'
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
      
      <div className="flex-1 flex flex-col md:ml-[240px] relative z-10 w-full">
        <div className="bg-[#0B132B]/60 backdrop-blur-3xl border-b border-white/10 sticky top-0 z-40">
          <Header locale={locale} showBack backHref={`/${locale}/halls`} />
        </div>

        <main className="flex-1 pt-[80px] pb-nav md:pb-8 px-3 md:px-5 w-full">
          <div className="max-w-4xl mx-auto w-full">
            {/* Hall Hero */}
            <section className="mb-4">
              <Card className="bg-white/5 backdrop-blur-2xl border border-white/10 shadow-xl overflow-hidden relative border-r-2 border-r-orange-400">
                {isEditable && (
                  <div className="absolute top-3 left-3 z-20">
                    <HallManagementActions hall={hallData} locale={locale} />
                  </div>
                )}

                <div className="flex flex-col items-center gap-2 py-6 px-5">
                  <h1 className="text-2xl font-black text-white text-center drop-shadow-sm">
                    {getLocalizedField(hallData, 'name', locale)}
                  </h1>
                  <span className="text-[10px] font-bold text-orange-300 bg-orange-500/15 px-2.5 py-0.5 rounded-md border border-orange-500/20">
                    {getLocalizedField(hallData, 'description', locale) || 'قاعة تدريب'}
                  </span>
                </div>
              </Card>
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
