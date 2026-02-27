'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Check, AlertCircle, Trash2, Phone, User, Calendar, X } from 'lucide-react'
import { updateTrainerDetails, deleteAccount } from '@/app/actions'
import { formatPhoneNumber, cn } from '@/lib/utils'
import { Portal } from '@/components/ui/Portal'

interface EditTrainerProfileModalProps {
    isOpen: boolean
    onClose: () => void
    trainer: any
    locale: string
    mode?: 'all' | 'personal' | 'schedule'
}

type DaySchedule = { day: string; start: string; end: string }

export function EditTrainerProfileModal({ isOpen, onClose, trainer, locale, mode = 'all' }: EditTrainerProfileModalProps) {
    const [name, setName] = useState(trainer.name_ar || '')
    const [phone, setPhone] = useState(trainer.phone || '')
    const [gender, setGender] = useState<'male' | 'female'>(trainer.gender || 'male')
    const [schedule, setSchedule] = useState<DaySchedule[]>(
        trainer.availability_schedule ||
        (trainer.availability || []).map((d: string) => ({ day: d, start: '16:00', end: '20:00' }))
    )
    const [editingDay, setEditingDay] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [confirmDelete, setConfirmDelete] = useState(false)
    const router = useRouter()

    useEffect(() => {
        if (isOpen) {
            setName(trainer.name_ar || '')
            setPhone(trainer.phone || '')
            setGender(trainer.gender || 'male')
            setSchedule(
                trainer.availability_schedule ||
                (trainer.availability || []).map((d: string) => ({ day: d, start: '16:00', end: '20:00' }))
            )
            setError('')
            setConfirmDelete(false)
        }
    }, [isOpen, trainer, locale])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const updateData: any = {}

            if (mode === 'all' || mode === 'personal') {
                updateData.name_en = name
                updateData.name_ar = name
                updateData.name_he = name
                updateData.phone = phone
                updateData.gender = gender
            }

            if (mode === 'all' || mode === 'schedule') {
                updateData.availability_schedule = schedule
                updateData.availability = schedule.map(s => s.day)
            }

            const res = await updateTrainerDetails(trainer.id, updateData)

            if (res.success) {
                router.refresh()
                setTimeout(() => onClose(), 100)
            } else {
                setError(res.error || 'فشل التحديث')
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirmDelete) {
            setConfirmDelete(true)
            return
        }

        setLoading(true)
        setError('')
        try {
            const res = await deleteAccount()
            if (res.success) {
                router.push(`/${locale}`)
                router.refresh()
            } else {
                setError(res.error || 'فشل حذف الحساب')
                setLoading(false)
            }
        } catch (err: any) {
            setError(err.message)
            setLoading(false)
        }
    }

    const handleDayTap = (dayId: string) => {
        const exists = schedule.find(s => s.day === dayId)
        if (exists) {
            if (editingDay === dayId) {
                setSchedule(schedule.filter(s => s.day !== dayId))
                setEditingDay(null)
            } else {
                setEditingDay(dayId)
            }
        } else {
            setSchedule([...schedule, { day: dayId, start: '16:00', end: '20:00' }])
            setEditingDay(dayId)
        }
    }

    const updateTime = (dayId: string, field: 'start' | 'end', value: string) => {
        setSchedule(schedule.map(s => s.day === dayId ? { ...s, [field]: value } : s))
    }

    const days = [
        { id: 'Sunday', label: 'الأحد' },
        { id: 'Monday', label: 'الإثنين' },
        { id: 'Tuesday', label: 'الثلاثاء' },
        { id: 'Wednesday', label: 'الأربعاء' },
        { id: 'Thursday', label: 'الخميس' },
        { id: 'Friday', label: 'الجمعة' },
        { id: 'Saturday', label: 'السبت' },
    ]

    const title = mode === 'schedule' ? 'تعديل الجدول' : 'الملف الشخصي'
    const subtitle = mode === 'schedule' ? 'حدد أيام وساعات التدريب' : 'تحديث المعلومات الشخصية'
    const isFemale = gender === 'female'

    if (!isOpen) return null

    return (
        <Portal>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[200] backdrop-blur-sm bg-[#060d1a]/60 animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Sheet */}
            <div
                className="fixed bottom-0 inset-x-0 z-[201] sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4"
                dir="rtl"
            >
                <div className={cn(
                    'bg-[#0B132B] w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90dvh] animate-in slide-in-from-bottom-8 sm:zoom-in-95 sm:slide-in-from-bottom-0 duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]',
                    isFemale ? 'border-t-pink-500/70' : 'border-t-indigo-500/70'
                )}>

                    {/* Drag handle (mobile) */}
                    <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
                        <div className="w-8 h-[3px] rounded-full bg-white/20" />
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-white/[0.08]">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                'w-9 h-9 rounded-xl flex items-center justify-center',
                                mode === 'schedule' ? 'bg-indigo-500/20' : isFemale ? 'bg-pink-500/20' : 'bg-indigo-500/20'
                            )}>
                                {mode === 'schedule'
                                    ? <Calendar className="w-5 h-5 text-indigo-400" />
                                    : <User className={cn('w-5 h-5', isFemale ? 'text-pink-400' : 'text-indigo-400')} />
                                }
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-white leading-tight">{title}</h2>
                                <p className="text-xs text-white/40">{subtitle}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="إغلاق"
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white transition-all cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Scrollable content */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col">
                        <div className="px-4 py-4 space-y-4 flex-1">

                            {/* Personal Info Fields */}
                            {(mode === 'all' || mode === 'personal') && (
                                <div className="space-y-3">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-white/35 uppercase tracking-widest mb-1.5 px-1">الاسم</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-white/[0.07] border border-white/10 focus:border-white/25 outline-none text-white text-sm font-bold transition-colors placeholder:text-white/20"
                                            placeholder="اسم المدرب"
                                        />
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-white/35 uppercase tracking-widest mb-1.5 px-1">رقم الهاتف</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={e => setPhone(formatPhoneNumber(e.target.value))}
                                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.07] border border-white/10 focus:border-white/25 outline-none text-white text-sm font-bold transition-colors placeholder:text-white/20"
                                                placeholder="05..."
                                                dir="ltr"
                                            />
                                        </div>
                                    </div>

                                    {/* Gender toggle */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-white/35 uppercase tracking-widest mb-1.5 px-1">الجنس</label>
                                        <div className="flex bg-white/[0.05] p-1 rounded-xl relative ring-1 ring-white/10">
                                            <div
                                                className={cn(
                                                    'absolute inset-y-1 w-[calc(50%-4px)] rounded-lg transition-all duration-400 ease-[cubic-bezier(0.32,0.72,0,1)]',
                                                    gender === 'female'
                                                        ? 'right-1 bg-pink-500/30 ring-1 ring-pink-500/40'
                                                        : 'left-1 bg-indigo-500/30 ring-1 ring-indigo-500/40'
                                                )}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setGender('male')}
                                                className={cn(
                                                    'flex-1 relative z-10 py-2.5 rounded-lg text-xs font-bold transition-colors duration-300 active:scale-95 cursor-pointer',
                                                    gender === 'male' ? 'text-indigo-300' : 'text-white/30 hover:text-white/50'
                                                )}
                                            >
                                                ذكر
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setGender('female')}
                                                className={cn(
                                                    'flex-1 relative z-10 py-2.5 rounded-lg text-xs font-bold transition-colors duration-300 active:scale-95 cursor-pointer',
                                                    gender === 'female' ? 'text-pink-300' : 'text-white/30 hover:text-white/50'
                                                )}
                                            >
                                                أنثى
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Schedule Section */}
                            {(mode === 'all' || mode === 'schedule') && (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end px-1">
                                        <label className="text-[10px] font-bold text-white/35 uppercase tracking-widest">أيام التدريب</label>
                                        <span className={cn(
                                            'text-[10px] font-bold px-2.5 py-1 rounded-full transition-all',
                                            schedule.length > 0
                                                ? 'text-indigo-300 bg-indigo-500/15 ring-1 ring-indigo-500/25'
                                                : 'text-white/20 bg-white/5'
                                        )}>
                                            {schedule.length} نشط
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        {/* Day chips — compact 4-column grid */}
                                        <div className="grid grid-cols-4 gap-1.5">
                                            {days.map(day => {
                                                const entry = schedule.find(s => s.day === day.id)
                                                const isActive = !!entry
                                                const isEditing = editingDay === day.id
                                                return (
                                                    <button
                                                        key={day.id}
                                                        type="button"
                                                        onClick={() => handleDayTap(day.id)}
                                                        className={cn(
                                                            'relative flex flex-col items-center py-2.5 rounded-xl text-[11px] font-bold transition-all active:scale-95 cursor-pointer',
                                                            isEditing
                                                                ? 'bg-indigo-500/30 ring-2 ring-indigo-400/60 text-indigo-200'
                                                                : isActive
                                                                    ? 'bg-indigo-500/20 ring-1 ring-indigo-500/30 text-indigo-300'
                                                                    : 'bg-white/[0.04] ring-1 ring-white/[0.06] text-white/25 hover:text-white/40 hover:bg-white/[0.07]'
                                                        )}
                                                    >
                                                        <span>{day.label}</span>
                                                        {isActive && entry && (
                                                            <span className="text-[8px] opacity-60 tabular-nums mt-0.5" dir="ltr">
                                                                {entry.start}–{entry.end}
                                                            </span>
                                                        )}
                                                    </button>
                                                )
                                            })}
                                        </div>

                                        {/* Accordion time editor */}
                                        {editingDay && (() => {
                                            const entry = schedule.find(s => s.day === editingDay)
                                            if (!entry) return null
                                            const dayLabel = days.find(d => d.id === editingDay)?.label || editingDay
                                            return (
                                                <div className="rounded-xl bg-white/[0.06] ring-1 ring-indigo-500/20 p-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-indigo-300">{dayLabel}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSchedule(schedule.filter(s => s.day !== editingDay))
                                                                setEditingDay(null)
                                                            }}
                                                            className="text-[10px] font-bold text-red-400/70 hover:text-red-400 transition-colors cursor-pointer"
                                                        >
                                                            إزالة اليوم
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1">
                                                            <label className="block text-[9px] font-bold text-white/25 mb-1 uppercase tracking-widest">من</label>
                                                            <input
                                                                type="time"
                                                                value={entry.start}
                                                                onChange={e => updateTime(editingDay, 'start', e.target.value)}
                                                                title="وقت البداية"
                                                                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.07] border border-white/10 text-sm font-bold text-white focus:border-indigo-500/50 outline-none transition-colors [color-scheme:dark]"
                                                                dir="ltr"
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <label className="block text-[9px] font-bold text-white/25 mb-1 uppercase tracking-widest">إلى</label>
                                                            <input
                                                                type="time"
                                                                value={entry.end}
                                                                onChange={e => updateTime(editingDay, 'end', e.target.value)}
                                                                title="وقت النهاية"
                                                                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.07] border border-white/10 text-sm font-bold text-white focus:border-indigo-500/50 outline-none transition-colors [color-scheme:dark]"
                                                                dir="ltr"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })()}

                                        {/* Hint */}
                                        {!editingDay && schedule.length > 0 && (
                                            <p className="text-center text-[10px] text-white/20">اضغط على يوم نشط لتعديل الساعات</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mx-4 mb-3 p-3 rounded-xl bg-red-500/10 ring-1 ring-red-500/25 text-red-400 text-xs font-bold flex items-center gap-2.5 animate-in slide-in-from-top-2 fade-in duration-300">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Footer */}
                        <div className="px-4 pt-3 pb-6 sm:pb-4 border-t border-white/[0.08] space-y-3">
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3 rounded-xl bg-white/10 text-white/60 font-bold text-sm hover:bg-white/15 transition-colors cursor-pointer"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={cn(
                                        'flex-[2] py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg cursor-pointer',
                                        isFemale
                                            ? 'bg-pink-500 hover:bg-pink-400 text-white shadow-pink-500/25'
                                            : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/25'
                                    )}
                                >
                                    {loading
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <Check className="w-4 h-4" strokeWidth={2.5} />
                                    }
                                    حفظ التغييرات
                                </button>
                            </div>

                            {/* Delete account */}
                            {(mode === 'all' || mode === 'personal') && (
                                <div className="flex justify-center pt-1">
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className={cn(
                                            'flex items-center gap-2 px-4 py-2 rounded-full transition-all text-[10px] font-bold cursor-pointer',
                                            confirmDelete
                                                ? 'bg-red-500/15 text-red-400 ring-1 ring-red-500/25'
                                                : 'text-white/20 hover:text-red-400 hover:bg-red-500/10'
                                        )}
                                    >
                                        {confirmDelete ? (
                                            <>
                                                {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                                                تأكيد الحذف
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="w-3.5 h-3.5" />
                                                حذف الحساب
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </Portal>
    )
}
