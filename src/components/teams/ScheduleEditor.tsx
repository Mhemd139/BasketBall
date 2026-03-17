'use client'

import { useState, useTransition } from 'react'
import { Pencil, Check, X, Clock, MapPin, Plus, Trash2, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { updateClassSchedule, addClassSchedule, deleteClassSchedule } from '@/app/actions'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmModal'
import { useRouter } from 'next/navigation'
import { Portal } from '@/components/ui/Portal'

interface Schedule {
    id: string
    day_of_week: number
    start_time: string
    end_time: string
    halls: { id: string; name_he: string; name_ar: string; name_en: string } | null
}

interface Hall {
    id: string
    name_ar: string
    name_he: string
    name_en: string
}

interface ScheduleEditorProps {
    schedules: Schedule[]
    halls: Hall[]
    locale: string
    classId?: string
}

const dayLabels: Record<number, string> = {
    0: 'الأحد', 1: 'الإثنين', 2: 'الثلاثاء', 3: 'الأربعاء',
    4: 'الخميس', 5: 'الجمعة', 6: 'السبت',
}

export function ScheduleEditor({ schedules, halls, locale, classId }: ScheduleEditorProps) {
    const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
    const [isAdding, setIsAdding] = useState(false)
    const [dayOfWeek, setDayOfWeek] = useState(0)
    const [hallId, setHallId] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [isPending, startTransition] = useTransition()
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const { toast } = useToast()
    const { confirm } = useConfirm()
    const router = useRouter()

    const getLocName = (obj: { name_ar: string; name_he: string; name_en: string }) => {
        const key = `name_${locale}` as keyof typeof obj
        return obj[key] || obj.name_ar
    }

    const startEdit = (s: Schedule) => {
        setEditingSchedule(s)
        setIsAdding(false)
        setHallId(s.halls?.id || '')
        setStartTime(s.start_time.slice(0, 5))
        setEndTime(s.end_time.slice(0, 5))
    }

    const startAdd = () => {
        setEditingSchedule(null)
        setIsAdding(true)
        setDayOfWeek(0)
        setHallId(halls[0]?.id || '')
        setStartTime('16:00')
        setEndTime('17:30')
    }

    const handleClose = () => {
        setEditingSchedule(null)
        setIsAdding(false)
    }

    const validateTime = (): boolean => {
        if (!startTime || !endTime) {
            toast('يرجى تحديد وقت البداية والنهاية', 'error')
            return false
        }
        const [sh, sm] = startTime.split(':').map(Number)
        const [eh, em] = endTime.split(':').map(Number)
        if (!Number.isFinite(sh) || !Number.isFinite(sm) || !Number.isFinite(eh) || !Number.isFinite(em)) {
            toast('وقت غير صالح', 'error')
            return false
        }
        if (eh * 60 + em <= sh * 60 + sm) {
            toast('وقت النهاية يجب أن يكون بعد وقت البداية', 'error')
            return false
        }
        return true
    }

    const handleSaveEdit = () => {
        if (!editingSchedule || !hallId || !validateTime()) return
        startTransition(async () => {
            const res = await updateClassSchedule(editingSchedule.id, hallId, startTime + ':00', endTime + ':00')
            if (res.success) {
                toast('تم تحديث الجدول', 'success')
                handleClose()
                router.refresh()
            } else {
                toast(res.error || 'فشل التحديث', 'error')
            }
        })
    }

    const handleSaveNew = () => {
        if (!classId || !hallId || !validateTime()) return
        startTransition(async () => {
            const res = await addClassSchedule(classId, dayOfWeek, hallId, startTime + ':00', endTime + ':00')
            if (res.success) {
                toast('تمت إضافة الموعد', 'success')
                handleClose()
                router.refresh()
            } else {
                toast(res.error || 'فشلت الإضافة', 'error')
            }
        })
    }

    const handleDelete = async (s: Schedule) => {
        const confirmed = await confirm({
            title: 'حذف الموعد',
            message: `هل أنت متأكد من حذف موعد ${dayLabels[s.day_of_week]}؟`,
            confirmText: 'حذف',
            cancelText: 'إلغاء',
            variant: 'danger',
        })
        if (!confirmed) return
        setDeletingId(s.id)
        const res = await deleteClassSchedule(s.id)
        setDeletingId(null)
        if (res.success) {
            toast('تم حذف الموعد', 'success')
            router.refresh()
        } else {
            toast(res.error || 'فشل الحذف', 'error')
        }
    }

    const validSchedules = schedules.filter(s => s.start_time !== '00:00:00')
        .sort((a, b) => a.day_of_week - b.day_of_week)

    return (
        <>
            <div className="space-y-2">
                {validSchedules.length === 0 && (
                    <p className="font-black text-white/40 text-sm">{'غير محدد'}</p>
                )}
                {validSchedules.map(s => (
                    <div key={s.id} className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => startEdit(s)}
                            className="flex-1 flex items-center gap-2 text-sm rounded-xl px-2 py-1.5 -mx-2 hover:bg-white/10 transition-colors group text-right"
                        >
                            <Pencil className="w-3 h-3 text-white/30 group-hover:text-white/60 shrink-0 transition-colors" />
                            <span className="font-bold text-white">{dayLabels[s.day_of_week]}</span>
                            <span dir="ltr" className="text-white/50 font-medium text-xs">
                                {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                            </span>
                            {s.halls && (
                                <span className="text-white/30 text-xs truncate">• {getLocName(s.halls)}</span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDelete(s)}
                            disabled={deletingId === s.id}
                            className="p-1.5 text-red-400/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                            aria-label={`حذف موعد ${dayLabels[s.day_of_week]}`}
                        >
                            {deletingId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        </button>
                    </div>
                ))}

                {classId && (
                    <button
                        type="button"
                        onClick={startAdd}
                        className="flex items-center gap-1.5 text-xs font-bold text-electric/70 hover:text-electric transition-colors mt-1"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        إضافة موعد
                    </button>
                )}
            </div>

            {/* Edit / Add modal — dark glass, animated */}
            <AnimatePresence>
            {(editingSchedule || isAdding) && (
                <Portal>
                    <div className="fixed inset-0 z-[200] flex flex-col justify-end sm:justify-center sm:items-center sm:p-4" dir="rtl">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleClose}
                            className="absolute inset-0 bg-[#0B132B]/70 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%', transition: { type: 'spring', bounce: 0, duration: 0.3 } }}
                            transition={{ type: 'spring', bounce: 0.1, duration: 0.45 }}
                            className="relative bg-[#0B132B] w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border border-white/10 mt-auto"
                        >

                            {/* Drag handle */}
                            <div className="flex justify-center pt-3 pb-1 sm:hidden">
                                <div className="w-10 h-1 rounded-full bg-white/20" />
                            </div>

                            {/* Header */}
                            <div className="flex items-center justify-between px-6 pt-4 pb-4 border-b border-white/10">
                                <div>
                                    <h2 className="text-base font-bold text-white">
                                        {isAdding ? 'إضافة موعد' : 'تعديل الجدول'}
                                    </h2>
                                    {editingSchedule && (
                                        <p className="text-xs text-white/40 mt-0.5">
                                            {dayLabels[editingSchedule.day_of_week]}
                                        </p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    aria-label="إغلاق"
                                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:bg-white/20 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="px-6 py-5 space-y-5">
                                {/* Day picker (only for new) */}
                                {isAdding && (
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-1.5 text-xs font-bold text-white/40 uppercase tracking-wider">
                                            اليوم
                                        </label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[0, 1, 2, 3, 4, 5, 6].map(d => (
                                                <button
                                                    key={d}
                                                    type="button"
                                                    onClick={() => setDayOfWeek(d)}
                                                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                                                        dayOfWeek === d
                                                            ? 'border-electric/50 bg-electric/15 text-electric'
                                                            : 'border-white/8 bg-white/5 text-white/40 hover:bg-white/10'
                                                    }`}
                                                >
                                                    {dayLabels[d]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Hall picker */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-1.5 text-xs font-bold text-white/40 uppercase tracking-wider">
                                        <MapPin className="w-3.5 h-3.5 text-orange-400" />
                                        القاعة
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {halls.map(h => (
                                            <button
                                                key={h.id}
                                                type="button"
                                                onClick={() => setHallId(h.id)}
                                                className={`py-2.5 px-3 rounded-xl text-sm font-bold border transition-all ${
                                                    hallId === h.id
                                                        ? 'border-indigo-400/50 bg-indigo-500/15 text-indigo-300'
                                                        : 'border-white/8 bg-white/5 text-white/40 hover:bg-white/10'
                                                }`}
                                            >
                                                {getLocName(h)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Time inputs */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-1.5 text-xs font-bold text-white/40 uppercase tracking-wider">
                                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                                        الوقت
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 space-y-1">
                                            <p className="text-[10px] text-white/30 font-bold text-center">من</p>
                                            <input
                                                type="time"
                                                value={startTime}
                                                onChange={e => setStartTime(e.target.value)}
                                                aria-label="وقت البداية"
                                                dir="ltr"
                                                className="w-full bg-white/10 border border-white/10 focus:border-white/30 rounded-xl px-3 py-2.5 text-sm font-bold text-white/90 text-center outline-none transition-colors"
                                            />
                                        </div>
                                        <span className="text-white/30 font-bold mt-4">—</span>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-[10px] text-white/30 font-bold text-center">إلى</p>
                                            <input
                                                type="time"
                                                value={endTime}
                                                onChange={e => setEndTime(e.target.value)}
                                                aria-label="وقت النهاية"
                                                dir="ltr"
                                                className="w-full bg-white/10 border border-white/10 focus:border-white/30 rounded-xl px-3 py-2.5 text-sm font-bold text-white/90 text-center outline-none transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 pb-8 sm:pb-6 flex gap-3 border-t border-white/10 pt-4">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={isPending}
                                    className="flex-1 py-3 rounded-xl bg-white/10 border border-white/10 text-white/50 font-bold text-sm hover:bg-white/15 transition-colors disabled:opacity-50"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="button"
                                    onClick={isAdding ? handleSaveNew : handleSaveEdit}
                                    disabled={isPending || !hallId}
                                    className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-electric to-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-all shadow-lg shadow-electric/20"
                                >
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" strokeWidth={2.5} />}
                                    {isAdding ? 'إضافة' : 'حفظ التغييرات'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </Portal>
            )}
            </AnimatePresence>
        </>
    )
}
