'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getTrainerProfileServer, logout } from '@/app/actions'
import { EditTrainerProfileModal } from '@/components/trainers/EditTrainerProfileModal'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { User, Calendar, Edit2, LogOut, Medal, Loader2, Phone, Settings } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import Image from 'next/image'
import { formatPhoneNumber } from '@/lib/utils'

const DAY_LABELS = {
    sunday: { ar: 'الأحد', he: 'ראשון', en: 'Sunday' },
    monday: { ar: 'الإثنين', he: 'שני', en: 'Monday' },
    tuesday: { ar: 'الثلاثاء', he: 'שלישי', en: 'Tuesday' },
    wednesday: { ar: 'الأربعاء', he: 'רביעי', en: 'Wednesday' },
    thursday: { ar: 'الخميس', he: 'חמישי', en: 'Thursday' },
    friday: { ar: 'الجمعة', he: 'שישי', en: 'Friday' },
    saturday: { ar: 'السبت', he: 'שבת', en: 'Saturday' },
}

export default function ProfilePage() {
  const params = useParams()
  const locale = params.locale as Locale
  const [trainer, setTrainer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [modalState, setModalState] = useState<{ open: boolean, mode: 'all' | 'personal' | 'schedule' }>({
      open: false,
      mode: 'all'
  })
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchTrainer = async () => {
        try {
            const data = await getTrainerProfileServer()
            if (data) {
                setTrainer(data)
            }
        } catch (error) {
            console.error('Failed to fetch trainer', error)
        } finally {
            setLoading(false)
        }
    }
    fetchTrainer()
  }, [modalState.open]) // Re-fetch when modal closes

  const handleLogout = async () => {
    try {
      await logout()
      router.refresh()
      router.push(`/${locale}/login`)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const openModal = (mode: 'personal' | 'schedule') => {
      setModalState({ open: true, mode })
  }

  if (loading) return (
      <div className="min-h-screen bg-navy-50 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-gold-500 animate-spin" />
      </div>
  )

  if (!trainer) return null

  // Determine correct name to display
  const displayName = trainer[`name_${locale}`] || trainer.name_en || trainer.name || ''

  // Custom Avatar Component
  const CoachAvatar = ({ gender }: { gender: string }) => {
    const isMale = gender === 'male';
    return (
        <div className={`w-36 h-36 md:w-44 md:h-44 rounded-full p-1.5 flex items-center justify-center bg-gradient-to-br ${isMale ? 'from-navy-900 to-indigo-800' : 'from-rose-500 to-pink-500'} shadow-2xl shadow-navy-900/20`}>
            <div className="w-full h-full rounded-full bg-white border-4 border-white overflow-hidden relative flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
                 {isMale ? (
                    <svg viewBox="0 0 100 100" className="w-full h-full transform translate-y-2">
                         <path d="M50 20a15 15 0 1 1 0 30 15 15 0 0 1 0-30zm0 35c-20 0-35 15-35 45h70c0-30-15-45-35-45z" fill="#1e293b" opacity="0.8" />
                         <circle cx="50" cy="35" r="12" fill="#fca5a5" />
                         <path d="M35 80h30v20H35z" fill="#0f172a" />
                    </svg>
                 ) : (
                    <svg viewBox="0 0 100 100" className="w-full h-full transform translate-y-2">
                         <path d="M50 25a12 12 0 1 1 0 24 12 12 0 0 1 0-24zm0 28c-18 0-32 15-32 47h64c0-32-14-47-32-47z" fill="#be185d" opacity="0.8" />
                         <circle cx="50" cy="37" r="10" fill="#fca5a5" />
                         <path d="M35 85h30v15H35z" fill="#831843" />
                         <path d="M20 40 q 30 -20 60 0" stroke="#000" strokeWidth="0" fill="none" /> 
                    </svg>
                 )}
                 
                 {/* Stylized "Coach" Badge overlay if svg fails or looks too simple */}
                 <div className="absolute bottom-4 bg-white/90 backdrop-blur px-3 py-0.5 rounded-full border border-gray-100 shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-navy-900">Coach</span>
                 </div>
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] font-outfit text-navy-900 pb-24 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
           <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-gold-400/20 to-transparent rounded-full blur-3xl opacity-60" />
           <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-tr from-navy-600/10 to-transparent rounded-full blur-3xl opacity-60" />
           {/* Grid Pattern Overlay */}
           <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03]" />
      </div>

      <Sidebar locale={locale} />
      <div className="flex-1 flex flex-col md:ml-[240px] relative z-10">
         {/* Header Wrapper */}
         <div className="bg-white/70 backdrop-blur-xl border-b border-white/20 sticky top-0 z-40 support-backdrop-blur:bg-white/60">
            <Header 
            locale={locale} 
            title={locale === 'ar' ? 'الملف الشخصي' : locale === 'he' ? 'פרופיל' : 'Profile'} 
            showBack 
            backHref={`/${locale}/more`}
            />
        </div>
        
        <main className="flex-1 px-4 md:px-8 py-6 md:py-10 max-w-4xl mx-auto w-full">
            
            {/* Main Card */}
            <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                <div className="text-center mb-10 relative">
                    <div className="relative inline-block group">
                        <CoachAvatar gender={trainer.gender || 'male'} />
                        {/* Only Edit Personal Info from here */}
                        <button 
                            onClick={() => openModal('personal')}
                            className="absolute bottom-2 right-0 w-12 h-12 bg-white text-navy-900 rounded-2xl shadow-xl border border-gray-100 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group-hover:-translate-y-1 hover:text-gold-500 z-10"
                            aria-label="Edit Personal Info"
                        >
                            <Edit2 size={20} className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl font-black text-navy-900 mt-6 mb-2 tracking-tighter drop-shadow-sm px-4">
                        {displayName}
                    </h1>
                    
                    <div className="flex items-center justify-center gap-2">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/50 backdrop-blur-md rounded-full border border-white/40 shadow-sm">
                            <Medal size={16} className="text-gold-500" />
                            <span className="text-sm font-bold text-navy-600 uppercase tracking-wider">
                                {locale === 'ar' ? 'مدرب كرة السلة' : locale === 'he' ? 'מאמן כדורסל' : 'Basketball Coach'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stats / Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Training Schedule Card */}
                    <div className="bg-white/80 backdrop-blur-md rounded-[32px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 group flex flex-col h-full">
                        <div className="flex justify-between items-start mb-6">
                             <div>
                                <h3 className="text-2xl font-black text-navy-900">
                                    {locale === 'ar' ? 'جدول التدريب' : locale === 'he' ? 'לוח אימונים' : 'Training Schedule'}
                                </h3>
                                <p className="text-xs text-gray-400 font-bold mt-1">
                                    {trainer.availability?.length || 0} {locale === 'ar' ? 'أيام نشطة' : locale === 'he' ? 'ימים פעילים' : 'Active Days'}
                                </p>
                             </div>
                             <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500">
                                <Calendar size={24} />
                             </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2.5 mb-6 flex-1 content-start">
                            {trainer.availability && trainer.availability.length > 0 ? (
                                trainer.availability.map((dayId: string) => {
                                    // @ts-ignore
                                    const label = DAY_LABELS[dayId]?.[locale] || dayId
                                    return (
                                        <div 
                                            key={dayId} 
                                            className="px-4 py-2.5 rounded-xl bg-slate-50 text-slate-700 font-bold text-sm border border-slate-100 flex items-center gap-2 hover:bg-gold-50 hover:text-gold-700 hover:border-gold-100 transition-colors"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-gold-400" />
                                            {label}
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="w-full py-6 text-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                                    <p className="text-gray-400 font-medium italic text-sm">
                                        {locale === 'ar' ? 'لم يتم تحديد جدول' : locale === 'he' ? 'לא נקבע לוח זמנים' : 'No schedule set'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Dedicated Edit Schedule Button */}
                        <button 
                            onClick={() => openModal('schedule')}
                            className="w-full py-3 rounded-2xl border-2 border-indigo-50 text-indigo-600 font-bold text-sm hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 group-hover:border-indigo-100"
                        >
                            <Settings className="w-4 h-4" />
                            {locale === 'ar' ? 'تعديل الجدول' : locale === 'he' ? 'ערוך לוח זמנים' : 'Edit Schedule'}
                        </button>
                    </div>

                    {/* Personal Info Card */}
                    <div className="bg-white/80 backdrop-blur-md rounded-[32px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 group flex flex-col h-full">
                        <div className="flex justify-between items-start mb-6">
                             <div>
                                <h3 className="text-2xl font-black text-navy-900">
                                    {locale === 'ar' ? 'المعلومات الشخصية' : locale === 'he' ? 'פרטים אישיים' : 'Personal Info'}
                                </h3>
                                <p className="text-xs text-gray-400 font-bold mt-1">
                                    {locale === 'ar' ? 'تفاصيل الاتصال' : locale === 'he' ? 'פרטי קשר' : 'Contact Details'}
                                </p>
                             </div>
                             <div className={`w-12 h-12 rounded-2xl ${trainer.gender === 'male' ? 'bg-blue-50 text-blue-500' : 'bg-pink-50 text-pink-500'} flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500`}>
                                <User size={24} />
                             </div>
                        </div>

                        <div className="space-y-4 flex-1">
                             <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 transition-all duration-300 shadow-sm hover:shadow">
                                <span className="font-bold text-gray-400 text-xs uppercase tracking-wider">{locale === 'ar' ? 'الجنس' : locale === 'he' ? 'מגדר' : 'Gender'}</span>
                                <span className="font-black text-navy-900 text-lg flex items-center gap-2">
                                    {trainer.gender === 'male' 
                                            ? (locale === 'ar' ? 'ذكر' : locale === 'he' ? 'זכר' : 'Male') 
                                            : (locale === 'ar' ? 'أنثى' : locale === 'he' ? 'נקבה' : 'Female')
                                    }
                                    <div className={`w-2 h-2 rounded-full ${trainer.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'}`} />
                                </span>
                             </div>

                              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 transition-all duration-300 shadow-sm hover:shadow">
                                <span className="font-bold text-gray-400 text-xs uppercase tracking-wider">{locale === 'ar' ? 'رقم الهاتف' : locale === 'he' ? 'טלפון' : 'Phone'}</span>
                                <span className="font-black text-navy-900 text-lg dir-ltr font-mono tracking-tight">
                                    {formatPhoneNumber(trainer.phone || '') || '---'}
                                </span>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Logout Section - Red & Vibrant */}
                <div className="mt-12 flex flex-col items-center gap-4 pb-12">
                    {!showLogoutConfirm ? (
                        <button 
                            onClick={() => setShowLogoutConfirm(true)}
                            className="group relative px-10 py-4 rounded-2xl bg-white border border-red-100 text-red-500 font-black tracking-wide hover:bg-red-50 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-red-500/10"
                        >
                             <span className="relative z-10 flex items-center gap-3">
                                <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                                {locale === 'ar' ? 'تسجيل الخروج' : locale === 'he' ? 'התנתקות' : 'Log Out'}
                            </span>
                        </button>
                    ) : (
                        <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 duration-300">
                            <p className="text-sm font-bold text-red-600 mb-1">
                                {locale === 'ar' ? 'هل أنت متأكد؟' : locale === 'he' ? 'בטוח שברצונך להתנתק?' : 'Are you sure you want to sign out?'}
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={handleLogout}
                                    className="px-8 py-3 rounded-xl bg-red-500 text-white font-black text-sm hover:bg-red-600 shadow-lg shadow-red-200 transition-all active:scale-95"
                                >
                                    {locale === 'ar' ? 'نعم، تسجيل الخروج' : locale === 'he' ? 'כן, התנתק' : 'Yes, Sign Out'}
                                </button>
                                <button 
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="px-8 py-3 rounded-xl bg-gray-100 text-gray-500 font-black text-sm hover:bg-gray-200 transition-all active:scale-95"
                                >
                                    {locale === 'ar' ? 'إلغاء' : locale === 'he' ? 'ביטול' : 'Cancel'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal Integrated */}
            <EditTrainerProfileModal
                isOpen={modalState.open}
                onClose={() => setModalState({ ...modalState, open: false })}
                locale={locale}
                trainer={trainer}
                mode={modalState.mode}
            />
        </main>
      </div>
    </div>
  )
}
