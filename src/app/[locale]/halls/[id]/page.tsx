import { getDictionary } from '@/lib/i18n/get-dictionary'
import type { Locale } from '@/lib/i18n/config'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLocalizedField, formatDate, formatTime } from '@/lib/utils'
import type { Database } from '@/lib/supabase/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Building2, Calendar } from 'lucide-react'
import { HallSchedule } from '@/components/halls/HallSchedule'

type Hall = Database['public']['Tables']['halls']['Row']
type Event = Database['public']['Tables']['events']['Row']

export default async function HallDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>
}) {
  const { locale, id } = await params
  const dict = await getDictionary(locale)
  const supabase = await createServerSupabaseClient()

  const { data: hall, error: hallError } = await supabase
    .from('halls')
    .select('*')
    .eq('id', id)
    .single()

  if (hallError || !hall) {
    notFound()
  }

  const hallData = hall as Hall

  const today = new Date().toISOString().split('T')[0]
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('hall_id', id)
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(10)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex" suppressHydrationWarning>
      <Sidebar locale={locale} />
      
      <div className="flex-1 flex flex-col md:ml-[240px]">
        <Header locale={locale} showBack backHref={`/${locale}/halls`} />

        <main className="flex-1 pt-20 pb-24 md:pb-8 px-5">
          <div className="max-w-4xl mx-auto">
            {/* Hall Hero */}
            <section className="py-4 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg mb-4">
                <Building2 className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              <h1 className="heading-lg mb-2">
                {getLocalizedField(hallData, 'name', locale)}
              </h1>
              <p className="text-gray-500 max-w-md mx-auto">
                {getLocalizedField(hallData, 'description', locale) || (
                  locale === 'ar' ? 'قاعة كرة السلة' :
                  locale === 'he' ? 'אולם כדורסל' :
                  'Basketball hall'
                )}
              </p>
            </section>

            {/* Hall Schedule Timeline */}
            <section>
              <HallSchedule 
                hallId={hallData.id} 
                events={events as any} 
                locale={locale} 
             />
            </section>
          </div>
        </main>

        <BottomNav locale={locale} />
      </div>
    </div>
  )
}
