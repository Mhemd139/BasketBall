import { getDictionary } from '@/lib/i18n/get-dictionary'
import type { Locale } from '@/lib/i18n/config'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSession } from '@/app/actions'
import { getLocalizedField } from '@/lib/utils'
import type { Database } from '@/lib/supabase/types'
import Link from 'next/link'
import { Building2 } from 'lucide-react'

type Hall = Database['public']['Tables']['halls']['Row']

export default async function HallsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale)
  const supabase = await createServerSupabaseClient()
  const session = await getSession()

  const { data: halls } = await supabase
    .from('halls')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(50)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex" suppressHydrationWarning>
      <Sidebar locale={locale} role={session?.role} />
      
      <div className="flex-1 flex flex-col md:ml-[240px]">
        <Header locale={locale} />

        <main className="flex-1 pt-20 pb-24 md:pb-8 px-3 md:px-5 w-full">
          <div className="max-w-4xl mx-auto w-full">
            {/* Header */}
            <section className="py-4 text-center md:text-start">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <h1 className="heading-lg">
                  {'القاعات'}
                </h1>
              </div>
              <p className="text-gray-500">
                {'استعرض قاعات كرة السلة'}
              </p>
            </section>

            {/* Halls List */}
            <section>
              {halls && halls.length > 0 ? (
                <div className="space-y-3">
                  {halls.map((hall: Hall, index: number) => (
                    <Link key={hall.id} href={`/${locale}/halls/${hall.id}`}>
                      <Card 
                        interactive 
                        className={`animate-fade-in-up stagger-${Math.min(index + 1, 4)} active:scale-[0.98] transition-transform duration-100`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center flex-shrink-0 relative">
                            <Building2 className="w-6 h-6 text-orange-600" strokeWidth={2.5} />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <h3 className="text-base font-semibold text-gray-900 mb-1">
                                {getLocalizedField(hall, 'name', locale)}
                              </h3>
                            </div>
                            <p className="text-xs font-medium text-green-600 bg-green-50 inline-block px-2 py-0.5 rounded-md mb-1">
                                {'مفتوح الآن'}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {getLocalizedField(hall, 'description', locale) || (
                                'قاعة كرة السلة'
                              )}
                            </p>
                          </div>
                          
                          <div className="text-gray-300 text-lg flex-shrink-0">
                            {'←'}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <Card className="animate-fade-in-up">
                  <CardContent className="py-16 text-center">
                    <div className="flex justify-center mb-4">
                      <Building2 className="w-16 h-16 text-gray-300" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {'لا توجد قاعات بعد'}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {'سيتم إضافة القاعات قريباً'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </section>
          </div>
        </main>

        <BottomNav locale={locale} role={session?.role} />
      </div>
    </div>
  )
}
