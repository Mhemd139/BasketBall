'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Globe } from 'lucide-react'

export function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const router = useRouter()
  const pathname = usePathname()

  const switchLanguage = (newLocale: string) => {
    // Replace the locale segment in the path
    const newPath = pathname.replace(`/${currentLocale}`, `/${newLocale}`)
    router.push(newPath)
  }

  return (
    <div className="flex justify-center gap-4 mb-8" dir="ltr">
      <button 
        onClick={() => switchLanguage('en')}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
          currentLocale === 'en' 
            ? 'bg-white text-indigo-600 shadow-md' 
            : 'bg-indigo-50/50 text-gray-500 hover:bg-white/50'
        }`}
      >
        English
      </button>
      <button 
        onClick={() => switchLanguage('ar')}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
          currentLocale === 'ar' 
            ? 'bg-white text-indigo-600 shadow-md' 
            : 'bg-indigo-50/50 text-gray-500 hover:bg-white/50'
        }`}
      >
        العربية
      </button>
      <button 
        onClick={() => switchLanguage('he')}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
          currentLocale === 'he' 
            ? 'bg-white text-indigo-600 shadow-md' 
            : 'bg-indigo-50/50 text-gray-500 hover:bg-white/50'
        }`}
      >
        עברית
      </button>
    </div>
  )
}
