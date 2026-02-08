import { ArrowLeft, ArrowRight, Globe, User } from 'lucide-react';
import Link from 'next/link';
import { getSession } from '@/app/actions';

interface SettingsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { locale } = await params;
  const session = await getSession();
  const isRTL = locale === 'ar' || locale === 'he';
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const settingsItems = [
    {
      label: locale === 'ar' ? 'اللغة' : locale === 'he' ? 'שפה' : 'Language',
      description: locale === 'ar' ? 'تغيير لغة التطبيق' : locale === 'he' ? 'שנה את שפת האפליקציה' : 'Change app language',
      href: `/${locale}/settings/language`,
      icon: Globe,
    },
  ];

  // Add Profile link if logged in
  if (session && session.id) {
    settingsItems.unshift({
      label: locale === 'ar' ? 'ملفي الشخصي' : locale === 'he' ? 'הפרופיל שלי' : 'My Profile',
      description: locale === 'ar' ? 'تعديل المعلومات وحذف الحساب' : locale === 'he' ? 'עריכת פרטים ומחיקת חשבון' : 'Edit details & delete account',
      href: `/${locale}/trainers/${session.id}`,
      icon: User,
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/more`} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
            <BackIcon className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="font-outfit font-bold text-lg text-navy-900">
             {locale === 'ar' ? 'الإعدادات' : locale === 'he' ? 'הגדרות' : 'Settings'}
          </h1>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
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
                <div className="text-gray-300">
                  {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  );
}
