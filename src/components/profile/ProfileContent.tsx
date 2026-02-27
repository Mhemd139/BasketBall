'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getTrainerProfileServer, logout } from '@/app/actions'
import { EditTrainerProfileModal } from '@/components/trainers/EditTrainerProfileModal'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Calendar, Edit2, LogOut, Loader2, Phone, Clock, ChevronLeft, User } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import { BouncingBasketballLoader } from '@/components/ui/BouncingBasketballLoader'
import { formatPhoneNumber, cn } from '@/lib/utils'

const DAYS_AR: Record<string, string> = {
    Sunday: 'الأحد',
    Monday: 'الإثنين',
    Tuesday: 'الثلاثاء',
    Wednesday: 'الأربعاء',
    Thursday: 'الخميس',
    Friday: 'الجمعة',
    Saturday: 'السبت',
}

interface ProfileContentProps {
    locale: Locale
    role?: string
}

export default function ProfileContent({ locale, role }: ProfileContentProps) {
    const [trainer, setTrainer] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [modalState, setModalState] = useState<{ open: boolean; mode: 'all' | 'personal' | 'schedule' }>({
        open: false,
        mode: 'all',
    })
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const fetchTrainer = async () => {
            try {
                const data = await getTrainerProfileServer()
                if (data) setTrainer(data)
            } catch {
                // silently fail
            } finally {
                setLoading(false)
            }
        }
        fetchTrainer()
    }, [modalState.open])

    const handleLogout = useCallback(async () => {
        setLoggingOut(true)
        try {
            await logout()
            router.refresh()
            router.push(`/${locale}/login`)
        } catch {
            setLoggingOut(false)
        }
    }, [locale, router])

    const openModal = useCallback((mode: 'personal' | 'schedule') => {
        setModalState({ open: true, mode })
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060d1a] flex items-center justify-center">
                <BouncingBasketballLoader />
            </div>
        )
    }

    if (!trainer) return null

    const displayName = trainer[`name_${locale}`] || trainer.name_en || trainer.name || ''
    const initials = displayName
        .trim()
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    const isFemale = trainer.gender === 'female'
    const schedule: { day: string; start: string; end: string }[] =
        trainer.availability_schedule ||
        (trainer.availability || []).map((d: string) => ({ day: d, start: '', end: '' }))

    return (
        <div className="min-h-screen bg-[#060d1a] text-white relative" dir="rtl">
            <Sidebar locale={locale} role={role} />

            <div className="flex-1 flex flex-col md:ml-[240px] relative z-10">
                <Header locale={locale} title="الملف الشخصي" showBack backHref={`/${locale}/more`} />

                <main className="flex-1 pt-2 pb-28 md:pb-8 px-4 md:px-6">
                    <div className="max-w-md mx-auto space-y-5">
                        {/* ─── Profile Hero ─── */}
                        <section className="flex flex-col items-center pt-6 pb-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Avatar */}
                            <div
                                className={cn(
                                    'w-20 h-20 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl rotate-3',
                                    isFemale
                                        ? 'bg-gradient-to-br from-pink-500 to-rose-600'
                                        : 'bg-gradient-to-br from-indigo-500 to-violet-600'
                                )}
                            >
                                {initials || <User className="w-10 h-10" />}
                            </div>

                            {/* Name + role */}
                            <h1 className="text-2xl font-black text-white mt-4 tracking-tight">{displayName}</h1>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span
                                    className={cn(
                                        'text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full ring-1',
                                        isFemale
                                            ? 'bg-pink-500/15 text-pink-300 ring-pink-500/25'
                                            : 'bg-indigo-500/15 text-indigo-300 ring-indigo-500/25'
                                    )}
                                >
                                    {trainer.role === 'headcoach' ? 'رئيس المدربين' : 'مدرب'}
                                </span>
                            </div>
                        </section>

                        {/* ─── Schedule Section ─── */}
                        <section className="rounded-2xl bg-white/[0.06] ring-1 ring-white/10 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                            <div className="flex items-center justify-between px-4 pt-4 pb-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                        <Calendar className="w-4 h-4 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-white leading-tight">جدول التدريب</h2>
                                        <p className="text-[10px] text-white/35">{schedule.length} أيام نشطة</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => openModal('schedule')}
                                    className="p-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] text-white/50 hover:text-indigo-400 transition-all active:scale-95 cursor-pointer"
                                    aria-label="تعديل الجدول"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="px-4 pb-4 space-y-1.5">
                                {schedule.length > 0 ? (
                                    schedule.map((slot) => (
                                        <div
                                            key={slot.day}
                                            className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.05] ring-1 ring-white/[0.06]"
                                        >
                                            <span className="text-sm font-bold text-white/80">
                                                {DAYS_AR[slot.day] || slot.day}
                                            </span>
                                            {slot.start && slot.end ? (
                                                <span className="text-xs font-bold text-indigo-400 tabular-nums flex items-center gap-1.5" dir="ltr">
                                                    <Clock className="w-3 h-3 text-indigo-400/60" />
                                                    {slot.start} – {slot.end}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-white/25">غير محدد</span>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-6 text-center">
                                        <p className="text-sm text-white/25">لم يتم تحديد جدول</p>
                                        <button
                                            type="button"
                                            onClick={() => openModal('schedule')}
                                            className="mt-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                                        >
                                            أضف أيام التدريب
                                        </button>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* ─── Personal Info Section ─── */}
                        <section className="rounded-2xl bg-white/[0.06] ring-1 ring-white/10 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                            <div className="flex items-center justify-between px-4 pt-4 pb-2">
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className={cn(
                                            'w-8 h-8 rounded-xl flex items-center justify-center',
                                            isFemale ? 'bg-pink-500/20' : 'bg-blue-500/20'
                                        )}
                                    >
                                        <User className={cn('w-4 h-4', isFemale ? 'text-pink-400' : 'text-blue-400')} />
                                    </div>
                                    <h2 className="text-sm font-bold text-white leading-tight">المعلومات الشخصية</h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => openModal('personal')}
                                    className="p-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] text-white/50 hover:text-indigo-400 transition-all active:scale-95 cursor-pointer"
                                    aria-label="تعديل المعلومات"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="px-4 pb-4 space-y-1.5">
                                {/* Gender */}
                                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.05] ring-1 ring-white/[0.06]">
                                    <span className="text-xs font-bold text-white/40 uppercase tracking-wider">الجنس</span>
                                    <span className="text-sm font-bold text-white/80 flex items-center gap-2">
                                        {isFemale ? 'أنثى' : 'ذكر'}
                                        <div className={cn('w-2 h-2 rounded-full', isFemale ? 'bg-pink-400' : 'bg-blue-400')} />
                                    </span>
                                </div>

                                {/* Phone */}
                                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.05] ring-1 ring-white/[0.06]">
                                    <span className="text-xs font-bold text-white/40 uppercase tracking-wider">الهاتف</span>
                                    <span className="text-sm font-bold text-white/80 tabular-nums" dir="ltr">
                                        {formatPhoneNumber(trainer.phone || '') || '—'}
                                    </span>
                                </div>
                            </div>
                        </section>

                        {/* ─── Logout ─── */}
                        <section className="pt-4 pb-8 animate-in fade-in duration-500 delay-300">
                            {!showLogoutConfirm ? (
                                <button
                                    type="button"
                                    onClick={() => setShowLogoutConfirm(true)}
                                    className="w-full py-3 rounded-xl bg-white/[0.05] ring-1 ring-red-500/20 text-red-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-500/10 transition-all active:scale-[0.98] cursor-pointer"
                                >
                                    <LogOut className="w-4 h-4" />
                                    تسجيل الخروج
                                </button>
                            ) : (
                                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                                    <p className="text-center text-sm font-bold text-red-400">هل أنت متأكد؟</p>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            disabled={loggingOut}
                                            className="flex-[2] py-3 rounded-xl bg-red-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-400 disabled:opacity-40 transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-red-500/25"
                                        >
                                            {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                                            نعم، تسجيل الخروج
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowLogoutConfirm(false)}
                                            className="flex-1 py-3 rounded-xl bg-white/10 text-white/60 font-bold text-sm hover:bg-white/15 transition-colors active:scale-[0.98] cursor-pointer"
                                        >
                                            إلغاء
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                </main>

                <BottomNav locale={locale} role={role} />
            </div>

            {/* Edit Modal */}
            <EditTrainerProfileModal
                isOpen={modalState.open}
                onClose={() => setModalState((s) => ({ ...s, open: false }))}
                locale={locale}
                trainer={trainer}
                mode={modalState.mode}
            />
        </div>
    )
}
