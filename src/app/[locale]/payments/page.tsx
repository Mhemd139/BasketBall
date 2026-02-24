
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { Locale } from '@/lib/i18n/config'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Users, ChevronRight, Trophy } from 'lucide-react'
import Link from 'next/link'
import { BottomNav } from '@/components/layout/BottomNav'
import { getSession } from '@/app/actions'
import { AnimatedMeshBackground } from '@/components/ui/AnimatedMeshBackground'

export default async function PaymentsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale)
  const supabase = await createServerSupabaseClient()
  const session = await getSession()

  // Fetch classes with trainee counts
  const { data: classes, error } = await (supabase as any)
    .from('classes')
    .select(`
      *,
      trainees (count),
      trainers (name_en, name_ar, name_he)
    `)
    .order('name_ar')
    .limit(50)

  const safeClasses = (classes || []) as any[]

  return (
    <AnimatedMeshBackground className="min-h-screen flex text-white" suppressHydrationWarning>
      <Sidebar locale={locale} role={session?.role} />
      <div className="flex-1 flex flex-col md:ml-[240px] relative z-10 w-full overflow-x-hidden">
        <div className="bg-white/70 backdrop-blur-xl border-b border-white/20 sticky top-0 z-40">
          <Header 
              locale={locale} 
              title={dict.payments.title}
              showBack
              backHref={`/${locale}/more`}
          />
        </div>

        <main className="flex-1 pt-20 pb-24 md:pb-8 px-3 md:px-5 w-full">
            <div className="max-w-4xl mx-auto space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    {'اختر الفريق'}
                </h2>
                
                <div className="grid gap-4 md:grid-cols-2">
                    {safeClasses.map((cls) => {
                        const name = cls.name_ar
                        const trainerName = cls.trainers 
                            ? cls.trainers.name_ar
                            : '-'
                        const count = cls.trainees?.[0]?.count || 0

                        return (
                            <Link key={cls.id} href={`/${locale}/payments/${cls.id}`}>
                                <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between group border-l-4 border-white/40 border-l-blue-500 bg-white/70 backdrop-blur-lg">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">{name}</h3>
                                        <p className="text-sm text-gray-500 mb-2">{trainerName}</p>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-gray-100/50 w-fit px-2 py-1 rounded-md">
                                            <Users className="w-3.5 h-3.5" />
                                            {count} {'لاعب'}
                                        </div>
                                    </div>
                                    <ChevronRight className={`w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors ${locale === 'ar' || locale === 'he' ? 'rotate-180' : ''}`} />
                                </Card>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </main>
        <div className="relative z-50">
          <BottomNav locale={locale} role={session?.role} />
        </div>
      </div>
    </AnimatedMeshBackground>
  )
}
