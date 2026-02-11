'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';

import { use } from 'react';

const LANGUAGES = [
  { code: 'ar', label: 'Arabic', native: 'العربية', flag: '🇵🇸', dir: 'rtl' },
  { code: 'he', label: 'Hebrew', native: 'עברית', flag: '🇮🇱', dir: 'rtl' },
];

interface LanguagePageProps {
  params: Promise<{ locale: string }>;
}

export default function LanguageSettingsPage({ params }: LanguagePageProps) {
  const { locale } = use(params);
  const router = useRouter();
  const pathname = usePathname();

  const currentPath = pathname || '';

  const switchLanguage = (newLocale: string) => {
    const segments = currentPath.split('/');
    if (segments.length >= 2) {
      segments[1] = newLocale;
      const newPath = segments.join('/');
      router.push(newPath);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/more`} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowRight className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="font-outfit font-bold text-lg text-navy-900">
            {locale === 'he' ? 'שפה' : 'اللغة'}
          </h1>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {LANGUAGES.map((lang) => {
            const isActive = locale === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => switchLanguage(lang.code)}
                className={`w-full flex items-center justify-between p-4 border-b border-gray-50 last:border-0 transition-colors ${
                  isActive ? 'bg-navy-50/50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl filter drop-shadow-sm">{lang.flag}</span>
                  <div className="text-start">
                    <p className={`font-bold text-base ${isActive ? 'text-navy-900' : 'text-gray-700'}`}>
                      {lang.native}
                    </p>
                    <p className="text-xs text-gray-400 font-medium">
                      {lang.label}
                    </p>
                  </div>
                </div>

                {isActive && (
                  <div className="w-8 h-8 rounded-full bg-gold-400 text-navy-900 flex items-center justify-center shadow-sm">
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6 text-center text-xs text-gray-400 px-8">
          <p>
            {locale === 'he'
              ? 'שינוי השפה יגרום טעינה מחדש של היישום להחלת ההגדרות החדשות.'
              : 'تغيير اللغة سيقوم بإعادة تحميل التطبيق لتطبيق الإعدادات الجديدة.'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
