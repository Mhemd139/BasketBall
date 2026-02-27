'use client'

import { useState, useTransition } from 'react'
import { Pencil, Check, X, Clock, MapPin } from 'lucide-react'
import { updateClassSchedule } from '@/app/actions'
import { useToast } from '@/components/ui/Toast'
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
}

const dayLabels: Record<number, string> = {
    0: 'الأحد', 1: 'الإثنين', 2: 'الثلاثاء', 3: 'الأربعاء',
    4: 'الخميس', 5: 'الجمعة', 6: 'السبت',
}

export function ScheduleEditor({ schedules, halls, locale }: ScheduleEditorProps) {
    const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
    const [hallId, setHallId] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [isPending, startTransition] = useTransition()
    const { toast } = useToast()
    const router = useRouter()

    const getLocName = (obj: { name_ar: string; name_he: string; name_en: string }) => {
        const key = `name_${locale}` as keyof typeof obj
        return obj[key] || obj.name_ar
    }

    const startEdit = (s: Schedule) => {
        setEditingSchedule(s)
        setHallId(s.halls?.id || '')
        setStartTime(s.start_time.slice(0, 5))
        setEndTime(s.end_time.slice(0, 5))
    }

    const handleClose = () => {
        setEditingSchedule(null)
        setHallId('')
        setStartTime('')
        setEndTime('')
    }

    const handleSave = () => {
        if (!editingSchedule || !hallId) return
        if (!startTime || !endTime) {
            toast('يرجى تحديد وقت البداية والنهاية', 'error')
            return
        }
        const [sh, sm] = startTime.split(':').map(Number)
        const [eh, em] = endTime.split(':').map(Number)
        if (!Number.isFinite(sh) || !Number.isFinite(sm) || !Number.isFinite(eh) || !Number.isFinite(em)) {
            toast('وقت غير صالح', 'error')
            return
        }
        if (eh * 60 + em <= sh * 60 + sm) {
            toast('وقت النهاية يجب أن يكون بعد وقت البداية', 'error')
            return
        }
        startTransition(async () => {
            const res = await updateClassSchedule(editingSchedule.id, hallId, startTime + ':00', endTime + ':00')
            if (res.success) {
                toast('تم تحديث الجدول', 'success')
                setEditingSchedule(null)
                router.refresh()
            } else {
                toast(res.error || 'فشل التحديث', 'error')
            }
        })
    }

    const validSchedules = schedules.filter(s => s.start_time !== '00:00:00')
        .sort((a, b) => a.day_of_week - b.day_of_week)

    if (validSchedules.length === 0) {
        return <p className="font-black text-white/40 text-sm">{'غير محدد'}</p>
    }

    return (
        <>
            {/* Schedule list — view only */}
            <div className="space-y-2">
                {validSchedules.map(s => (
                    <button
                        key={s.id}
                        type="button"
                        onClick={() => startEdit(s)}
                        className="w-full flex items-center gap-2 text-sm rounded-xl px-2 py-1.5 -mx-2 hover:bg-white/10 transition-colors group text-right"
                    >
                        <span className="font-bold text-white">{dayLabels[s.day_of_week]}</span>
                        <span dir="ltr" className="text-white/50 font-medium text-xs">
                            {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                        </span>
                        {s.halls && (
                            <span className="text-white/30 text-xs truncate">• {getLocName(s.halls)}</span>
                        )}
                        <Pencil className="w-3 h-3 text-white/30 group-hover:text-white/60 ms-auto shrink-0 transition-colors" />
                    </button>
                ))}
            </div>

            {/* Edit modal — Portal so it escapes any overflow */}
            {editingSchedule && (
                <Portal>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-portal"
                        onClick={handleClose}
                    />

                    {/* Bottom sheet */}
                    <div
                        className="fixed bottom-0 inset-x-0 z-[201] sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4"
                        dir="rtl"
                    >
                        <div className="bg-white w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl">

                            {/* Drag handle */}
                            <div className="flex justify-center pt-3 pb-1 sm:hidden">
                                <div className="w-10 h-1 rounded-full bg-slate-200" />
                            </div>

                            {/* Header */}
                            <div className="flex items-center justify-between px-6 pt-4 pb-4 border-b border-slate-100">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900">
                                        {'تعديل الجدول'}
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {dayLabels[editingSchedule.day_of_week]}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    aria-label="إغلاق"
                                    className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="px-6 py-5 space-y-5">
                                {/* Hall picker */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <MapPin className="w-3.5 h-3.5 text-orange-500" />
                                        {'القاعة'}
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {halls.map(h => (
                                            <button
                                                key={h.id}
                                                type="button"
                                                onClick={() => setHallId(h.id)}
                                                className={`py-2.5 px-3 rounded-xl text-sm font-bold border-2 transition-all ${
                                                    hallId === h.id
                                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                                                }`}
                                            >
                                                {getLocName(h)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Time inputs */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                                        {'الوقت'}
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 space-y-1">
                                            <p className="text-[10px] text-slate-400 font-bold text-center">{'من'}</p>
                                            <input
                                                type="time"
                                                value={startTime}
                                                onChange={e => setStartTime(e.target.value)}
                                                aria-label="وقت البداية"
                                                dir="ltr"
                                                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-400 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 text-center outline-none transition-colors"
                                            />
                                        </div>
                                        <span className="text-slate-400 font-bold mt-4">{'—'}</span>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-[10px] text-slate-400 font-bold text-center">{'إلى'}</p>
                                            <input
                                                type="time"
                                                value={endTime}
                                                onChange={e => setEndTime(e.target.value)}
                                                aria-label="وقت النهاية"
                                                dir="ltr"
                                                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-400 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 text-center outline-none transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 pb-8 sm:pb-6 flex gap-3 border-t border-slate-100 pt-4">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={isPending}
                                    className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors disabled:opacity-50"
                                >
                                    {'إلغاء'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={isPending || !hallId}
                                    className="flex-[2] py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-40 transition-all shadow-lg shadow-indigo-200"
                                >
                                    <Check className="w-4 h-4" strokeWidth={2.5} />
                                    {'حفظ التغييرات'}
                                </button>
                            </div>
                        </div>
                    </div>
                </Portal>
            )}
        </>
    )
}
