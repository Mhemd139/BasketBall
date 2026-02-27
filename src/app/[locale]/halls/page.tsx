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

  const [session, { data: halls }] = await Promise.all([
    getSession(),
    supabase.from('halls').select('id, name_ar, name_he, name_en, description_ar, description_he, description_en').order('created_at', { ascending: true }).limit(50),
  ])

  return (
    <AnimatedMeshBackground className="min-h-screen flex text-white" suppressHydrationWarning>
      <Sidebar locale={locale} role={session?.role} />
      
      <div className="flex-1 flex flex-col md:ml-[240px] relative z-10 w-full">
        <div className="bg-[#0B132B]/60 backdrop-blur-3xl border-b border-white/10 sticky top-0 z-40">
          <Header locale={locale} title={'القاعات'} />
        </div>

        <main className="flex-1 pt-20 pb-nav md:pb-8 px-3 md:px-5 w-full">
          <div className="max-w-4xl mx-auto w-full">


            {/* Halls List */}
            <section>
              {halls && halls.length > 0 ? (
                <div className="space-y-3">
                  {halls.map((hall, index) => (
                    <Link key={hall.id} href={`/${locale}/halls/${hall.id}`} className="block">
                      <Card 
                        interactive 
                        className={`animate-fade-in-up stagger-${Math.min(index + 1, 4)} accent-hall-orange bg-white/5 backdrop-blur-2xl border border-white/10 shadow-xl overflow-hidden relative group hover:-translate-y-1 transition-all`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-center gap-3 relative z-10">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-orange-500/20 border border-orange-500/30">
                            <Building2 className="w-5 h-5" strokeWidth={2.5} />
                          </div>
                          
                          <div className="flex-1 min-w-0 flex justify-between items-center">
                            <div>
                              <h3 className="text-sm font-bold text-white mb-0.5 truncate drop-shadow-md">
                                {getLocalizedField(hall, 'name', locale)}
                              </h3>
                              <p className="text-xs text-indigo-100/70 truncate font-medium">
                                {getLocalizedField(hall, 'description', locale) || (
                                  'لا تدريبات اليوم'
                                )}
                              </p>
                            </div>
                          </div>
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
