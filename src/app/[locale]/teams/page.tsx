import type { Locale } from '@/lib/i18n/config'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card, CardContent } from '@/components/ui/Card'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLocalizedField } from '@/lib/utils'
import Link from 'next/link'
import { Users, User } from 'lucide-react'
import { getSession } from '@/app/actions'
import { TeamCard } from '@/components/teams/TeamCard'
import { CreateTeamButton } from '@/components/teams/CreateTeamButton'
import { AnimatedMeshBackground } from '@/components/ui/AnimatedMeshBackground'

export default async function TeamsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()
  const session = await getSession()
  const canCreate = !!session // Ensure logged-in trainers can see management features

  // Fetch classes (teams) with trainee count
  const { data: classes } = await supabase
    .from('classes')
    .select('*, trainees(count)')
    .order('created_at', { ascending: true })
    .limit(50)

  return (
    <AnimatedMeshBackground className="min-h-screen flex text-royal" suppressHydrationWarning>
      <Sidebar locale={locale} role={session?.role} />

      <div className="flex-1 flex flex-col md:ml-[240px] relative z-10 w-full overflow-hidden">
        <div className="bg-[#0B132B]/60 backdrop-blur-3xl border-b border-white/10 sticky top-0 z-40">
          <Header locale={locale} title={'الفرق'} />
        </div>

        <main className="flex-1 pt-20 pb-24 md:pb-8 px-3 md:px-5 w-full">
          <div className="max-w-4xl mx-auto w-full">


            {/* Create Team Button */}
            <CreateTeamButton locale={locale} canCreate={canCreate} />

            {/* Teams List */}
            <section>
              {classes && classes.length > 0 ? (
                <div className="space-y-3">
                  {classes.map((cls: any, index: number) => (
                    <TeamCard 
                        key={cls.id} 
                        cls={cls} 
                        locale={locale} 
                        isEditable={canCreate}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl animate-fade-in-up mt-8 shadow-xl">
                    <div className="bg-purple-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-purple-500/30">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-black text-white mb-1 drop-shadow-md">
                      {'لا توجد فرق بعد'}
                    </h3>
                    <p className="text-sm font-bold text-indigo-100/70 mb-6 drop-shadow-sm">
                      {'ابدأ بإنشاء أول فريق لإدارة اللاعبين والتدريبات'}
                    </p>
                    <div className="max-w-[200px] mx-auto">
                        <CreateTeamButton locale={locale} canCreate={canCreate} />
                    </div>
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
