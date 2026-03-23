'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Building2, Check, X } from 'lucide-react'
import { updateHall } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

interface EditHallModalProps {
    isOpen: boolean
    onClose: () => void
    hall: any
    locale: string
}

export function EditHallModal({ isOpen, onClose, hall, locale }: EditHallModalProps) {
    const [loading, setLoading] = useState(false)
    const [nameAr, setNameAr] = useState(hall?.name_ar || '')
    const [nameHe, setNameHe] = useState(hall?.name_he || '')
    const router = useRouter()
    const { toast } = useToast()

    useEffect(() => {
        if (isOpen) {
            setNameAr(hall?.name_ar || '')
            setNameHe(hall?.name_he || '')
            document.body.style.overflow = 'hidden'
        }
        return () => { document.body.style.overflow = '' }
    }, [isOpen, hall])

    const handleSave = async () => {
        if (!nameAr.trim()) {
            toast('يرجى إدخال اسم القاعة', 'error')
            return
        }
        setLoading(true)
        try {
            const res = await updateHall(hall.id, nameAr, nameAr, nameHe)
            if (res.success) {
                toast(locale === 'he' ? 'האולם עודכן בהצלחה' : 'تم تحديث القاعة بنجاح', 'success')
                router.refresh()
                onClose()
            } else {
                toast(locale === 'he' ? 'עדכון האולם נכשל' : 'فشل تحديث القاعة', 'error')
            }
        } catch {
            toast(locale === 'he' ? 'עדכון האולם נכשל' : 'فشل تحديث القاعة', 'error')
        } finally {
            setLoading(false)
        }
    }

    if (typeof window === 'undefined' || !isOpen) return null

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex flex-col justify-end sm:justify-center sm:items-center sm:p-4 touch-none" dir="rtl">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#0a1628]/80 backdrop-blur-sm"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%', transition: { type: 'spring', bounce: 0, duration: 0.3 } }}
                        transition={{ type: 'spring', bounce: 0.08, duration: 0.5 }}
                        className="relative bg-[#0B132B] w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col border-t-orange-500/50"
                    >
                        {/* Drag handle */}
                        <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
                            <div className="w-8 h-[3px] rounded-full bg-white/20" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-white/8">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-orange-400" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white leading-tight">
                                        {locale === 'he' ? 'עריכת אולם' : 'تعديل القاعة'}
                                    </h2>
                                    <p className="text-xs text-white/40">تغيير اسم القاعة</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                aria-label="إغلاق"
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-4 touch-auto">
                            <div>
                                <label className="block text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1.5">
                                    {locale === 'he' ? 'שם (ערבית)' : 'الاسم (عربي)'}
                                </label>
                                <input
                                    autoFocus
                                    value={nameAr}
                                    onChange={(e) => setNameAr(e.target.value)}
                                    className="w-full bg-white/[0.07] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-orange-500/30 transition-all"
                                    placeholder="مثال: القاعة الكبرى"
                                    dir="rtl"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1.5">
                                    {locale === 'he' ? 'שם (עברית)' : 'الاسم (عبري)'}
                                </label>
                                <input
                                    value={nameHe}
                                    onChange={(e) => setNameHe(e.target.value)}
                                    className="w-full bg-white/[0.07] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-orange-500/30 transition-all"
                                    placeholder="לדוגמה: האולם הגדול"
                                    dir="rtl"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-5 pt-3 pb-6 sm:pb-4 border-t border-white/8 flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 rounded-xl bg-white/10 text-white/60 font-bold text-sm hover:bg-white/15 transition-colors"
                            >
                                {locale === 'he' ? 'ביטול' : 'إلغاء'}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="flex-[2] py-3 rounded-xl bg-orange-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/25"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" strokeWidth={2.5} />}
                                {locale === 'he' ? 'שמור' : 'حفظ التغييرات'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}
