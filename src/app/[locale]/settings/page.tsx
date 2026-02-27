import { ArrowLeft, ArrowRight, Globe, User } from 'lucide-react';
import Link from 'next/link';
import { getSession } from '@/app/actions';
import { AnimatedMeshBackground } from '@/components/ui/AnimatedMeshBackground';
import { Card } from '@/components/ui/Card';

interface SettingsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { locale } = await params;
  const session = await getSession();
  const isRTL = true; // Both AR and HE are RTL
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const settingsItems = [
    // Language settings removed
  ];

  // Add Profile link if logged in
  if (session && session.id) {
    settingsItems.unshift({
      label: locale === 'he' ? 'הפרופיל שלי' : 'ملفي الشخصي',
      description: locale === 'he' ? 'עריכת פרטים ומחיקת חשבון' : 'تعديل المعلومات وحذف الحساب',
      href: `/${locale}/trainers/${session.id}`,
      icon: User,
    });
  }

  return (
    <AnimatedMeshBackground className="min-h-screen flex flex-col text-white" suppressHydrationWarning>
      {/* Header */}
      <div className="bg-[#0B132B]/60 backdrop-blur-3xl p-4 border-b border-white/10 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/more`} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
            <BackIcon className="w-5 h-5 text-white" />
          </Link>
          <h1 className="font-outfit font-black text-xl tracking-wide text-white drop-shadow-sm">
             {locale === 'he' ? 'הגדרות' : 'الإعدادات'}
          </h1>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto w-full relative z-10 pt-10">
        <Card className="overflow-hidden divide-y divide-white/20 !p-0">
          {settingsItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <Link
                key={i}
                href={item.href}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-navy-50 text-navy-600 flex items-center justify-center group-hover:bg-navy-100 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-navy-900 text-sm">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.description}</p>
                  </div>
                </div>
                <div className="text-navy-400 group-hover:text-gold-500 transition-colors">
                  {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </div>
              </Link>
            )
          })}
        </Card>
      </div>
    </AnimatedMeshBackground>
  );
}
