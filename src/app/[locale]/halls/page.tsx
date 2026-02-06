import { getDictionary } from '@/lib/i18n/get-dictionary'
import type { Locale } from '@/lib/i18n/config'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

export default async function HallsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale)

  return (
    <>
      <Header title={dict.halls.title} />

      <main className="min-h-[calc(100vh-56px-64px)] p-4 pb-20">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>🏟️ {dict.halls.title}</CardTitle>
              <CardDescription>
                {locale === 'ar' && 'إدارة قاعات كرة السلة الثلاثة'}
                {locale === 'he' && 'נהל את שלושת אולמות הכדורסל'}
                {locale === 'en' && 'Manage your 3 basketball halls'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {locale === 'ar' && 'قريباً - سيتم إضافة صفحة إدارة القاعات'}
                {locale === 'he' && 'בקרוב - דף ניהול אולמות יתווסף'}
                {locale === 'en' && 'Coming soon - Hall management page will be added'}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav locale={locale} dict={dict} />
    </>
  )
}
