'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile } from '@/app/actions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { User, Save, Loader2, LogOut, Check } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'

export default function ProfilePage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // We need to resolve params first
  // But wait, this is a Client Component. 
  // Params in Next.js 15 are async props even in Client Components? 
  // Actually, for Client Components, we use `useParams()` usually, but `page.tsx` props are passed.
  // Let's use `useParams` for safety or `use` hook.
  // For simplicity, let's make the page async/server and pass to client form?
  // No, `use client` is at top. 
  // Typescript might complain about params promise.
  // I will use `use()` hook or just standard `useParams`.
  
  // Let's try use(params) pattern if Next 15, or just standard prop.
  // Actually, easiest is `useParams` hook.
  
  return <ProfileContent />
}

import { useParams } from 'next/navigation'

function ProfileContent() {
  const params = useParams()
  const locale = params.locale as Locale
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    
    setLoading(true)
    const res = await updateProfile(name)
    setLoading(false)
    
    if (res.success) {
       setSuccess(true)
       // Refresh and redirect after short delay
       router.refresh()
       setTimeout(() => {
         router.push(`/${locale}/more`)
       }, 2000)
    } else {
       alert('Error: ' + res.error)
    }
  }
  
  const handleLogout = async () => {
    document.cookie = 'admin_session=; Max-Age=0; path=/;'
    router.refresh()
    router.push(`/${locale}/login`)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar locale={locale} />
      <div className="flex-1 flex flex-col md:ml-[240px]">
        <Header 
          locale={locale} 
          title={locale === 'ar' ? 'الملف الشخصي' : locale === 'he' ? 'פרופיל' : 'Profile'} 
          showBack 
          backHref={`/${locale}/more`} 
        />
        
        <main className="flex-1 pt-24 px-5">
          <div className="max-w-md mx-auto">
             <Card className="p-6 relative overflow-hidden transition-all duration-500">
                {success ? (
                   <div className="flex flex-col items-center justify-center py-10 animate-fade-in text-center">
                      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-6 animate-scale-in">
                         <div className="w-10 h-10 border-4 border-green-600 rounded-full flex items-center justify-center border-t-transparent animate-spin" style={{ animationDuration: '0.4s', animationIterationCount: 1, borderTopColor: 'currentColor' }} />
                         <Check className="w-10 h-10 absolute text-green-600 animate-bounce" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                         {locale === 'ar' ? 'تم الحفظ!' : locale === 'he' ? 'נשמר!' : 'Saved!'}
                      </h2>
                      <p className="text-gray-500">
                         {locale === 'ar' ? 'تم تحديث اسمك بنجاح' : locale === 'he' ? 'השם שלך עודכן בהצלחה' : 'Your name has been updated'}
                      </p>
                   </div>
                ) : (
                    <>
                <div className="flex flex-col items-center mb-8">
                   <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                      <User className="w-10 h-10" />
                   </div>
                   <h2 className="text-xl font-bold">
                      {locale === 'ar' ? 'تعديل الملف الشخصي' : locale === 'he' ? 'ערוך פרופיל' : 'Edit Profile'}
                   </h2>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                         {locale === 'ar' ? 'الاسم' : locale === 'he' ? 'שם' : 'Name'}
                      </label>
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="MuhammadM"
                        className="w-full p-3 border rounded-xl text-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        required
                      />
                   </div>
                   
                   <Button 
                     type="submit" 
                     className="w-full py-6 text-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                     disabled={loading}
                   >
                     {loading ? (
                       <Loader2 className="w-6 h-6 animate-spin" />
                     ) : (
                       <>
                         <Save className="w-5 h-5 ml-2" />
                         {locale === 'ar' ? 'حفظ' : locale === 'he' ? 'שמור' : 'Save'}
                       </>
                     )}
                   </Button>
                </form>

                <div className="mt-8 pt-8 border-t">
                   <button 
                     onClick={handleLogout}
                     className="w-full flex items-center justify-center gap-2 text-red-500 font-medium py-3 hover:bg-red-50 rounded-xl transition-colors"
                   >
                      <LogOut className="w-5 h-5" />
                      {locale === 'ar' ? 'تسجيل الخروج' : locale === 'he' ? 'התנתק' : 'Logout'}
                   </button>
                </div>
                </>
                )}
             </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
