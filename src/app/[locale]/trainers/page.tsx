import type { Locale } from '@/lib/i18n/config'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSession } from '@/app/actions'
import { getLocalizedField } from '@/lib/utils'
import type { Database } from '@/lib/supabase/types'
import { Card } from '@/components/ui/Card'
import { Trophy, Users } from 'lucide-react'
import { TrainerCard } from '@/components/trainers/TrainerCard'
import { AnimatedMeshBackground } from '@/components/ui/AnimatedMeshBackground'

type Trainer = Database['public']['Tables']['trainers']['Row']

export default async function TrainersPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()
  const session = await getSession()

  // Fetch trainers
  const { data: trainers } = await (supabase as any)
    .from('trainers')
    .select('*')
    .order('name_ar')
    .limit(50)

  return (
    <AnimatedMeshBackground className="min-h-screen flex text-white" suppressHydrationWarning>
      <Sidebar locale={locale} role={session?.role} />

      <div className="flex-1 flex flex-col md:ml-[240px] relative z-10 w-full overflow-x-hidden">
        <div className="bg-[#0B132B]/60 backdrop-blur-3xl border-b border-white/10 sticky top-0 z-40">
          <Header
            locale={locale}
            title={'المدربين'}
            showBack={false}
          />
        </div>

        <main className="flex-1 pt-20 pb-24 md:pb-8 px-3 md:px-5 w-full">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {(trainers || []).map((trainer: Trainer) => (
              <TrainerCard key={trainer.id} trainer={trainer} locale={locale} />
            ))}

            {(!trainers || trainers.length === 0) && (
              <div className="col-span-full text-center py-12 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl animate-fade-in-up mt-8 shadow-xl">
                <div className="bg-indigo-500/20 border border-indigo-500/30 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-lg font-black text-white mb-1 drop-shadow-md">
                  {'لا يوجد مدربين'}
                </h3>
                <p className="text-sm font-bold text-indigo-100/70 mb-6 drop-shadow-sm">
                  {'أضف مدربين جدد لإدارة الفرق والتدريبات'}
                </p>
              </div>
            )}
          </div>
        </main>

        <div className="relative z-50">
          <BottomNav locale={locale} role={session?.role} />
        </div>
      </div>
    </AnimatedMeshBackground>
  )
}
