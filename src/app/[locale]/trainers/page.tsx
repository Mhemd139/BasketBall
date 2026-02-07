import type { Locale } from '@/lib/i18n/config'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLocalizedField } from '@/lib/utils'
import type { Database } from '@/lib/supabase/types'
import { Card } from '@/components/ui/Card'
import { User, Phone, Trophy, Users } from 'lucide-react'

type Trainer = Database['public']['Tables']['trainers']['Row']

export const dynamic = 'force-dynamic'

export default async function TrainersPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()

  // Fetch trainers
  const { data: trainers } = await (supabase as any)
    .from('trainers')
    .select('*')
    .order('name_en')

  console.log('DEBUG TRAINERS FROM DB:', trainers)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex" suppressHydrationWarning>
      <Sidebar locale={locale} />

      <div className="flex-1 flex flex-col md:ml-[240px]">
        <Header
          locale={locale}
          title={locale === 'ar' ? 'المدربين' : locale === 'he' ? 'מאמנים' : 'Trainers'}
          showBack={false}
        />

        <main className="flex-1 pt-48 pb-32 md:pb-10 px-5">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            {(trainers || []).map((trainer: Trainer) => (
              <Card key={trainer.id} className="flex items-center gap-4">
                 <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md text-white">
                    <User className="w-8 h-8" strokeWidth={1.5} />
                 </div>
                 
                 <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-gray-900 truncate">
                      {getLocalizedField(trainer, 'name', locale)}
                    </h3>
                    
                    {trainer.phone && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                        <Phone className="w-3.5 h-3.5" />
                        <span dir="ltr">{trainer.phone}</span>
                      </div>
                    )}
                 </div>
              </Card>
            ))}

            {(!trainers || trainers.length === 0) && (
              <div className="col-span-full text-center py-20 text-gray-500">
                {locale === 'ar' ? 'لا يوجد مدربين' : locale === 'he' ? 'אין מאמנים' : 'No trainers found'}
              </div>
            )}
          </div>
        </main>

        <BottomNav locale={locale} />
      </div>
    </div>
  )
}
