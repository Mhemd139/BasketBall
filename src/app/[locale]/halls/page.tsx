import type { Locale } from '@/lib/i18n/config'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card } from '@/components/ui/Card'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSession } from '@/app/actions'
import { getLocalizedField } from '@/lib/utils'
import Link from 'next/link'
import { Building2 } from 'lucide-react'
import { AnimatedMeshBackground } from '@/components/ui/AnimatedMeshBackground'

export default async function HallsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()

  const [session, { data: halls, error: hallsError }] = await Promise.all([
    getSession(),
    supabase.from('halls').select('id, name_ar, name_he, name_en, description_ar, description_he, description_en').order('created_at', { ascending: true }).limit(50),
  ])

  if (hallsError) {
    console.error('Failed to fetch halls:', hallsError.message)
  }

  return (
    <AnimatedMeshBackground className="min-h-screen flex text-white" suppressHydrationWarning>
      <Sidebar locale={locale} role={session?.role} />
      
      <div className="flex-1 flex flex-col md:ml-[240px] relative z-10 w-full">
        <div className="bg-[#0B132B]/60 backdrop-blur-3xl border-b border-white/10 sticky top-0 z-40">
          <Header locale={locale} title={'القاعات'} />
        </div>

        <main className="flex-1 pt-[80px] pb-nav md:pb-8 px-3 md:px-5 w-full">
          <div className="max-w-4xl mx-auto w-full">
            {/* Halls List */}
            <section>
              {halls && halls.length > 0 ? (
                <div className="space-y-3">
                  {halls.map((hall) => (
                    <Link key={hall.id} href={`/${locale}/halls/${hall.id}`} className="block group">
                      <Card
                        interactive
                        className="bg-white/5 backdrop-blur-2xl border border-white/10 shadow-xl overflow-hidden relative transition-all hover:-translate-y-1 hover:bg-white/10 border-r-2 border-r-orange-400"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex flex-col items-center gap-1.5 relative z-10 py-4 px-5">
                          <h3 className="text-base font-bold text-white truncate drop-shadow-md max-w-full">
                            {getLocalizedField(hall, 'name', locale)}
                          </h3>
                          <span className="text-[10px] font-bold text-orange-300 bg-orange-500/15 px-2 py-0.5 rounded-md border border-orange-500/20">
                            {getLocalizedField(hall, 'description', locale) || 'قاعة تدريب'}
                          </span>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl animate-fade-in-up mt-8 shadow-xl">
                    <div className="bg-orange-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-orange-500/30">
                      <Building2 className="w-8 h-8 text-orange-400" />
                    </div>
                    <h3 className="text-lg font-black text-white mb-1 drop-shadow-md">
                      {'لا توجد قاعات بعد'}
                    </h3>
                    <p className="text-sm font-bold text-indigo-100/70 mb-6 drop-shadow-sm">
                      {'أضف قاعات التدريب لتنظيم الجدول'}
                    </p>
                    <Link 
                      href={`/${locale}/head-coach`}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-orange-500 text-white text-sm font-black hover:bg-orange-600 transition-all active:scale-95 shadow-lg shadow-orange-500/20"
                    >
                      {'لوحة الإدارة'}
                    </Link>
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
