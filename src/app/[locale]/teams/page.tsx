import type { Locale } from '@/lib/i18n/config'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSession } from '@/app/actions'
import { TeamsClientView } from '@/components/teams/TeamsClientView'
import { AnimatedMeshBackground } from '@/components/ui/AnimatedMeshBackground'

export default async function TeamsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()

  const [session, { data: classes }] = await Promise.all([
    getSession(),
    supabase
      .from('classes')
      .select('*, trainees(count), categories(name_ar, name_he, name_en)')
      .order('created_at', { ascending: true })
      .limit(50),
  ])
  const canCreate = !!session

  return (
    <AnimatedMeshBackground className="min-h-screen flex text-white" suppressHydrationWarning>
      <Sidebar locale={locale} role={session?.role} />

      <div className="flex-1 flex flex-col md:ml-[240px] relative z-10 w-full">
        <div className="bg-[#0B132B]/60 backdrop-blur-3xl border-b border-white/10 sticky top-0 z-40">
          <Header locale={locale} title={'الفرق'} />
        </div>

        <main className="flex-1 pt-20 pb-nav md:pb-8 px-3 md:px-5 w-full">
          <div className="max-w-4xl mx-auto w-full">
            <TeamsClientView
              classes={classes || []}
              locale={locale}
              canCreate={canCreate}
            />
          </div>
        </main>

        <div className="relative z-50">
          <BottomNav locale={locale} role={session?.role} />
        </div>
      </div>
    </AnimatedMeshBackground>
  )
}
