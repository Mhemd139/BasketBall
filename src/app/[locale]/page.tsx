import { getDictionary } from '@/lib/i18n/get-dictionary'
import type { Locale } from '@/lib/i18n/config'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale)

  return (
    <>
      <Header
        title={dict.home.title}
        action={<LocaleSwitcher currentLocale={locale} />}
      />

      <main className="min-h-[calc(100vh-56px-64px)] p-4 pb-20">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Hero Section */}
          <Card className="border-basketball-orange-500/20 bg-gradient-to-br from-basketball-orange-50 to-white dark:from-basketball-orange-900/10 dark:to-background">
            <CardHeader className="text-center">
              <div className="mb-4 text-6xl">🏀</div>
              <CardTitle className="text-3xl text-basketball-orange-500">
                Basketball Manager
              </CardTitle>
              <CardDescription className="text-base">
                {locale === 'ar' && 'نظام إدارة التدريب الشامل'}
                {locale === 'he' && 'מערכת ניהול אימונים מקיפה'}
                {locale === 'en' && 'Comprehensive Training Management System'}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>✅</span>
                <span>
                  {locale === 'ar' && 'المرحلة 1 مكتملة'}
                  {locale === 'he' && 'שלב 1 הושלם'}
                  {locale === 'en' && 'Phase 1 Complete'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="success">✓</Badge>
                  <span className="text-sm">Next.js 15 + App Router</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success">✓</Badge>
                  <span className="text-sm">TypeScript & Tailwind CSS</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success">✓</Badge>
                  <span className="text-sm">
                    {locale === 'ar' && 'دعم 3 لغات مع RTL'}
                    {locale === 'he' && 'תמיכה ב-3 שפות עם RTL'}
                    {locale === 'en' && 'Multi-language (ar/he/en) + RTL'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success">✓</Badge>
                  <span className="text-sm">
                    {locale === 'ar' && 'اتصال Supabase'}
                    {locale === 'he' && 'אינטגרציית Supabase'}
                    {locale === 'en' && 'Supabase Integration'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success">✓</Badge>
                  <span className="text-sm">
                    {locale === 'ar' && 'مكونات واجهة المستخدم'}
                    {locale === 'he' && 'רכיבי UI'}
                    {locale === 'en' && 'UI Components'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success">✓</Badge>
                  <span className="text-sm">
                    {locale === 'ar' && 'تنقل الهاتف المحمول'}
                    {locale === 'he' && 'ניווט מובייל'}
                    {locale === 'en' && 'Mobile Navigation'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Locale Card */}
          <Card>
            <CardHeader>
              <CardTitle>
                {locale === 'ar' && '📍 اللغة الحالية'}
                {locale === 'he' && '📍 שפה נוכחית'}
                {locale === 'en' && '📍 Current Locale'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {locale === 'ar' && '🇵🇸 العربية'}
                  {locale === 'he' && '🇮🇱 עברית'}
                  {locale === 'en' && '🇬🇧 English'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {locale === 'ar' && 'الاتجاه: من اليمين إلى اليسار (RTL)'}
                  {locale === 'he' && 'כיוון: מימין לשמאל (RTL)'}
                  {locale === 'en' && 'Direction: Left-to-Right (LTR)'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps Card */}
          <Card>
            <CardHeader>
              <CardTitle>
                {locale === 'ar' && '🚀 الخطوات التالية'}
                {locale === 'he' && '🚀 שלבים הבאים'}
                {locale === 'en' && '🚀 Next Steps'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>
                  {locale === 'ar' && '• إعداد مشروع Supabase'}
                  {locale === 'he' && '• הגדרת פרויקט Supabase'}
                  {locale === 'en' && '• Set up Supabase project'}
                </div>
                <div>
                  {locale === 'ar' && '• إنشاء قاعدة البيانات'}
                  {locale === 'he' && '• יצירת מסד נתונים'}
                  {locale === 'en' && '• Create database schema'}
                </div>
                <div>
                  {locale === 'ar' && '• بناء صفحات إدارة القاعات'}
                  {locale === 'he' && '• בניית דפי ניהול אולמות'}
                  {locale === 'en' && '• Build hall management pages'}
                </div>
                <div>
                  {locale === 'ar' && '• تنفيذ نظام الجدولة'}
                  {locale === 'he' && '• יישום מערכת תזמון'}
                  {locale === 'en' && '• Implement scheduling system'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav locale={locale} dict={dict} />
    </>
  )
}
