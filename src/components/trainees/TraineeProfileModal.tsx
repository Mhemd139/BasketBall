'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useScrollLock } from '@/hooks/useScrollLock'
import { JerseyNumber } from '@/components/ui/JerseyNumber'
import { PaymentModal } from '@/components/payments/PaymentModal'
import { updateTrainee, deleteTrainee } from '@/app/actions'
import { SCHOOL_CLASSES } from '@/lib/utils'
import { Phone, X, ChevronRight, CreditCard, Edit2, Save, Loader2, CheckCircle2, Clock, XCircle, Trash2, Cake, GraduationCap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmModal'
import { Portal } from '@/components/ui/Portal'

const ITEM_HEIGHT = 40

function ScrollWheel({ items, value, onChange }: {
    items: { v: string; l: string }[]
    value: string
    onChange: (v: string) => void
}) {
    const ref = useRef<HTMLDivElement>(null)
    const snapTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const isSnapping = useRef(false)

    const selectedIdx = items.findIndex(i => i.v === value)

    // Scroll to selected item on mount and when value changes externally
    useEffect(() => {
        const el = ref.current
        if (!el) return
        const idx = selectedIdx >= 0 ? selectedIdx : 0
        el.scrollTop = idx * ITEM_HEIGHT
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const snapToNearest = useCallback(() => {
        const el = ref.current
        if (!el) return
        isSnapping.current = true
        const idx = Math.round(el.scrollTop / ITEM_HEIGHT)
        const clamped = Math.max(0, Math.min(idx, items.length - 1))
        el.scrollTo({ top: clamped * ITEM_HEIGHT, behavior: 'smooth' })
        onChange(items[clamped]?.v ?? '')
        // clear snapping flag after animation
        setTimeout(() => { isSnapping.current = false }, 200)
    }, [items, onChange])

    // onScroll: fires for both native touch scroll AND mouse drag scroll.
    // For touch: CSS snap handles alignment; we just read the final position.
    // For mouse: we debounce and call snapToNearest.
    const onScroll = () => {
        if (isSnapping.current) return
        clearTimeout(snapTimer.current)
        snapTimer.current = setTimeout(snapToNearest, 150)
    }

    // Attach mousedown imperatively so nothing in the React tree can intercept it
    useEffect(() => {
        const el = ref.current
        if (!el) return

        const onMouseDown = (e: MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
            const startY = e.clientY
            const startScroll = el.scrollTop

            const onMove = (ev: MouseEvent) => {
                el.scrollTop = startScroll + (startY - ev.clientY)
            }
            const onUp = () => {
                snapToNearest()
                document.removeEventListener('mousemove', onMove)
                document.removeEventListener('mouseup', onUp)
            }
            document.addEventListener('mousemove', onMove)
            document.addEventListener('mouseup', onUp)
        }

        el.addEventListener('mousedown', onMouseDown)
        return () => el.removeEventListener('mousedown', onMouseDown)
    }, [snapToNearest])

    return (
        <div className="relative flex-1">
            {/* selected highlight bar */}
            <div className="absolute inset-x-0 pointer-events-none z-10" style={{ top: '50%', transform: 'translateY(-50%)', height: ITEM_HEIGHT }}>
                <div className="h-full bg-white/10 rounded-xl ring-1 ring-white/15 mx-1" />
            </div>
            {/* fade top/bottom */}
            <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#0B132B] to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#0B132B] to-transparent pointer-events-none z-10" />
            <div
                ref={ref}
                onScroll={onScroll}
                className="overflow-y-scroll scrollbar-hide relative z-20 cursor-grab active:cursor-grabbing touch-pan-y"
                style={{ height: ITEM_HEIGHT * 5, scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
            >
                {/* padding items top/bottom so first/last can center */}
                <div style={{ height: ITEM_HEIGHT * 2 }} />
                {items.map(item => (
                    <div
                        key={item.v}
                        style={{ height: ITEM_HEIGHT, scrollSnapAlign: 'center' }}
                        className={`flex items-center justify-center text-sm font-bold transition-all cursor-pointer select-none ${
                            item.v === value ? 'text-white' : 'text-white/25'
                        }`}
                        onClick={() => {
                            const el = ref.current
                            const idx = items.findIndex(i => i.v === item.v)
                            el?.scrollTo({ top: idx * ITEM_HEIGHT, behavior: 'smooth' })
                            onChange(item.v)
                        }}
                    >
                        {item.l}
                    </div>
                ))}
                <div style={{ height: ITEM_HEIGHT * 2 }} />
            </div>
        </div>
    )
}

type AttendanceStats = { total: number; present: number; late: number; absent: number }

interface TraineeProfileModalProps {
    trainee: any
    locale: string
    teamName?: string
    trainerName?: string
    isAdmin?: boolean
    attendanceStats?: AttendanceStats
    onClose: () => void
    onSave?: (updated: { name_ar: string; phone: string; jersey_number: number | null; gender: string; date_of_birth: string; school_class: string }) => void
}

export function TraineeProfileModal({ trainee, teamName, isAdmin, attendanceStats, onClose, onSave }: TraineeProfileModalProps) {
    const router = useRouter()
    const { toast } = useToast()
    const { confirm } = useConfirm()
    const [showPayment, setShowPayment] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)

    useScrollLock()
    const initialForm = {
        name_ar: trainee.name_ar || '',
        name_en: trainee.name_en || '',
        name_he: trainee.name_he || '',
        phone: trainee.phone || '',
        jersey_number: trainee.jersey_number ?? '',
        gender: trainee.gender || 'male',
        date_of_birth: trainee.date_of_birth || '',
        school_class: trainee.school_class || '',
    }
    const savedForm = useRef(initialForm)
    const [editForm, setEditForm] = useState(initialForm)

    const isFemale = editForm.gender === 'female'
    const [amountPaid, setAmountPaid] = useState(trainee.amount_paid ?? 0)
    const [paymentComment, setPaymentComment] = useState(trainee.payment_comment_ar || '')
    const paymentGoal = 3000
    const paymentPct = Math.min(100, Math.round((amountPaid / paymentGoal) * 100))
    const isPaidFull = amountPaid >= paymentGoal

    const stats = attendanceStats ?? { total: 0, present: 0, late: 0, absent: 0 }
    const attendanceRate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : null
    const rateColor = attendanceRate === null ? 'text-white/30'
        : attendanceRate >= 75 ? 'text-green-400'
        : attendanceRate >= 50 ? 'text-amber-400'
        : 'text-red-400'

    const handleSave = async () => {
        setSaving(true)
        const res = await updateTrainee(trainee.id, {
            ...editForm,
            jersey_number: editForm.jersey_number !== '' ? parseInt(String(editForm.jersey_number)) : null,
            date_of_birth: editForm.date_of_birth || null,
            school_class: editForm.school_class || null,
        })
        if (res.success) {
            toast('تم تحديث البيانات', 'success')
            savedForm.current = { ...editForm }
            onSave?.({
                name_ar: editForm.name_ar,
                phone: editForm.phone,
                jersey_number: editForm.jersey_number !== '' ? parseInt(String(editForm.jersey_number)) : null,
                gender: editForm.gender,
                date_of_birth: editForm.date_of_birth,
                school_class: editForm.school_class,
            })
            setIsEditing(false)
            router.refresh()
        } else {
            toast(res.error || 'فشل التحديث', 'error')
        }
        setSaving(false)
    }

    const handleDelete = async () => {
        const confirmed = await confirm({
            title: 'حذف اللاعب',
            message: `هل أنت متأكد من حذف ${trainee.name_ar}؟`,
            confirmText: 'حذف',
            cancelText: 'إلغاء',
            variant: 'danger',
        })
        if (!confirmed) return

        setDeleting(true)
        const res = await deleteTrainee(trainee.id)
        setDeleting(false)
        if (res.success) {
            toast('تم حذف اللاعب بنجاح', 'success')
            router.refresh()
            onClose()
        } else {
            toast(res.error || 'فشل الحذف', 'error')
        }
    }

    if (showPayment) {
        return <PaymentModal
            trainee={{ ...trainee, amount_paid: amountPaid, payment_comment_ar: paymentComment }}
            onClose={() => setShowPayment(false)}
            onSave={(amount, comment) => { setAmountPaid(amount); setPaymentComment(comment) }}
        />
    }

    return (
        <Portal>
            <div
                className="fixed inset-0 z-[200] bg-[#0a1628]/0 backdrop-blur-sm animate-in fade-in duration-500"
                onClick={onClose}
            />

            <div
                className="fixed bottom-0 inset-x-0 z-[201] sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-6"
                dir="rtl"
            >
                <div className={`bg-[#0B132B] w-full sm:max-w-sm rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border border-white/10 flex flex-col max-h-[92dvh] sm:max-h-[90vh] animate-in slide-in-from-bottom-8 sm:zoom-in-95 sm:slide-in-from-bottom-0 duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${isFemale ? 'border-t-pink-500/70' : 'border-t-indigo-500/70'}`}>

                    {/* Drag pill */}
                    <div className="flex justify-center pt-2.5 sm:hidden">
                        <div className="w-8 h-[3px] rounded-full bg-white/20" />
                    </div>

                    {/* ── HERO ─────────────────────────────────── */}
                    <div className="relative px-5 pt-4 pb-6">

                        {/* top row: close / gender / edit */}
                        <div className="flex items-center justify-between mb-5">
                            <button type="button" onClick={isEditing ? () => { setEditForm(savedForm.current); setIsEditing(false) } : onClose} aria-label={isEditing ? 'رجوع' : 'إغلاق'}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white transition-all">
                                {isEditing ? <ChevronRight className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            </button>

                            <span className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full ring-1 ${isFemale ? 'bg-pink-500/15 text-pink-300 ring-pink-500/25' : 'bg-indigo-500/15 text-indigo-300 ring-indigo-500/25'}`}>
                                {isFemale ? 'لاعبة' : 'لاعب'}
                            </span>

                            {!isEditing ? (
                                <button type="button" onClick={() => setIsEditing(true)} aria-label="تعديل"
                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white transition-all">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            ) : <div className="w-8" />}
                        </div>

                        {/* Jersey + name block */}
                        <div className="flex items-center gap-4">
                            <JerseyNumber
                                number={editForm.jersey_number !== '' ? Number(editForm.jersey_number) : null}
                                gender={editForm.gender}
                                className="w-16 h-16 text-2xl flex-shrink-0 shadow-xl"
                            />
                            <div className="min-w-0 flex-1">
                                <h2 className="text-[22px] font-black text-white leading-tight tracking-tight">{editForm.name_ar}</h2>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                                    {editForm.phone && (
                                        <a href={`tel:${editForm.phone}`} dir="ltr"
                                            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
                                            <Phone className="w-3 h-3" />{editForm.phone}
                                        </a>
                                    )}
                                    {teamName && <span className="text-xs text-white/20">{teamName}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Attendance rate badge — shown only if data exists */}
                        {attendanceRate !== null && (
                            <div className={`absolute top-4 left-12 sm:hidden`} />
                        )}
                    </div>

                    {/* ── BODY ─────────────────────────────────── */}
                    <div className="px-4 pb-8 space-y-3 overflow-y-auto flex-1">

                        {isEditing ? (
                            <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                                <div>
                                    <label className="block text-[10px] font-semibold text-white/35 uppercase tracking-widest mb-1.5">الاسم (عربي)</label>
                                    <input placeholder="الاسم بالعربي"
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/10 focus:border-white/30 outline-none text-white/80 text-sm transition-colors placeholder:text-white/20"
                                        value={editForm.name_ar}
                                        onChange={e => setEditForm(p => ({ ...p, name_ar: e.target.value }))} />
                                </div>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="block text-[10px] font-semibold text-white/35 uppercase tracking-widest mb-1.5">الهاتف</label>
                                        <input placeholder="05x..." dir="ltr"
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/10 focus:border-white/30 outline-none text-white/80 text-sm transition-colors placeholder:text-white/20"
                                            value={editForm.phone}
                                            onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-semibold text-white/35 uppercase tracking-widest mb-1.5">رقم القميص</label>
                                        <input placeholder="#" type="number"
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/10 focus:border-white/30 outline-none text-white/80 text-sm transition-colors placeholder:text-white/20 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                                            value={editForm.jersey_number}
                                            onChange={e => setEditForm(p => ({ ...p, jersey_number: e.target.value }))} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-white/35 uppercase tracking-widest mb-1.5">الجنس</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['male', 'female'] as const).map(g => (
                                            <button key={g} type="button" onClick={() => setEditForm(p => ({ ...p, gender: g }))}
                                                className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${editForm.gender === g
                                                    ? g === 'female' ? 'border-pink-400/50 bg-pink-500/15 text-pink-300' : 'border-indigo-400/50 bg-indigo-500/15 text-indigo-300'
                                                    : 'border-white/8 bg-white/8 text-white/30'}`}>
                                                {g === 'female' ? 'أنثى' : 'ذكر'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-[10px] font-semibold text-white/35 uppercase tracking-widest">تاريخ الميلاد</label>
                                        {editForm.date_of_birth && (
                                            <button type="button" onClick={() => setEditForm(p => ({ ...p, date_of_birth: '' }))}
                                                className="flex items-center gap-1 text-[11px] text-white/25 hover:text-white/50 transition-colors">
                                                مسح <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="rounded-2xl bg-white/[0.06] ring-1 ring-white/10 overflow-hidden" dir="ltr">
                                        <div className="flex" style={{ height: 200 }}>
                                            {[
                                                { label: 'يوم', items: Array.from({ length: 31 }, (_, i) => ({ v: String(i + 1).padStart(2, '0'), l: String(i + 1) })), part: 2 },
                                                { label: 'شهر', items: ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'].map((n, i) => ({ v: String(i + 1).padStart(2, '0'), l: n })), part: 1 },
                                                { label: 'سنة', items: Array.from({ length: new Date().getFullYear() - 1989 }, (_, i) => { const y = new Date().getFullYear() - i; return { v: String(y), l: String(y) } }), part: 0 },
                                            ].map(({ label, items, part }, colIdx) => (
                                                <div key={label} className={`flex flex-col flex-1 ${colIdx < 2 ? 'border-l border-white/[0.07]' : ''}`}>
                                                    <div className="text-center text-[9px] font-bold text-white/20 uppercase tracking-widest pt-1.5 pb-0.5">{label}</div>
                                                    <ScrollWheel
                                                        items={items}
                                                        value={editForm.date_of_birth ? editForm.date_of_birth.split('-')[part] : ''}
                                                        onChange={v => {
                                                            const parts = (editForm.date_of_birth || `${new Date().getFullYear()}-01-01`).split('-')
                                                            parts[part] = v
                                                            setEditForm(p => ({ ...p, date_of_birth: v ? parts.join('-') : '' }))
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-[10px] font-semibold text-white/35 uppercase tracking-widest">الصف الدراسي</label>
                                        {editForm.school_class && (
                                            <button type="button" onClick={() => setEditForm(p => ({ ...p, school_class: '' }))}
                                                className="flex items-center gap-1 text-[11px] text-white/25 hover:text-white/50 transition-colors">
                                                مسح <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {SCHOOL_CLASSES.map(sc => (
                                            <button key={sc.value} type="button" onClick={() => setEditForm(p => ({ ...p, school_class: p.school_class === sc.value ? '' : sc.value }))}
                                                className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all ${editForm.school_class === sc.value
                                                    ? 'border-electric/50 bg-electric/15 text-electric'
                                                    : 'border-white/8 bg-white/5 text-white/40 hover:bg-white/10'}`}>
                                                {sc.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <button type="button" onClick={handleSave} disabled={saving}
                                        className="flex-[2] py-3 rounded-xl bg-white text-[#0f1623] font-black text-sm flex items-center justify-center gap-2 hover:bg-white/90 disabled:opacity-40 active:scale-[0.98] transition-all">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        حفظ التغييرات
                                    </button>
                                    <button type="button" onClick={() => { setEditForm(savedForm.current); setIsEditing(false) }}
                                        className="flex-1 py-3 rounded-xl bg-white/10 border border-white/10 text-white/50 font-bold text-sm hover:bg-white/10 active:scale-[0.98] transition-all">
                                        إلغاء
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3 animate-in fade-in duration-200">

                                {/* ── DOB & School Class (always visible, tappable) ── */}
                                <button type="button" onClick={() => setIsEditing(true)}
                                    className={`w-full rounded-2xl p-4 space-y-3 text-right transition-all active:scale-[0.98] relative group ${
                                        editForm.date_of_birth || editForm.school_class
                                            ? 'bg-white/[0.07] ring-1 ring-white/10 hover:bg-white/[0.10]'
                                            : 'bg-white/[0.03] border border-dashed border-white/15 hover:border-white/25 hover:bg-white/[0.05]'
                                    }`}>
                                    <Edit2 className="absolute top-3 left-3 w-3.5 h-3.5 text-white/15 group-hover:text-white/40 transition-colors" />
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                                            <Cake className="w-3.5 h-3.5 text-amber-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider">تاريخ الميلاد</p>
                                            {editForm.date_of_birth ? (
                                                <p className="text-sm font-bold text-white/80 mt-0.5">
                                                    {new Date(editForm.date_of_birth).toLocaleDateString('ar', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                    <span className="text-white/30 text-xs mr-1.5">
                                                        ({Math.floor((Date.now() - new Date(editForm.date_of_birth).getTime()) / 31557600000)} سنة)
                                                    </span>
                                                </p>
                                            ) : (
                                                <p className="text-xs text-amber-400/40 mt-0.5">اضغط لإضافة تاريخ الميلاد</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                                            <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider">الصف الدراسي</p>
                                            {editForm.school_class ? (
                                                <p className="text-sm font-bold text-white/80 mt-0.5">
                                                    {SCHOOL_CLASSES.find(sc => sc.value === editForm.school_class)?.label || editForm.school_class}
                                                </p>
                                            ) : (
                                                <p className="text-xs text-blue-400/40 mt-0.5">اضغط لتحديد الصف</p>
                                            )}
                                        </div>
                                    </div>
                                </button>

                                {/* ── Attendance ──────────────────── */}
                                <div className="rounded-2xl bg-white/[0.07] ring-1 ring-white/10 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">الحضور</span>
                                        {attendanceRate !== null && (
                                            <span className={`text-sm font-black ${rateColor}`}>{attendanceRate}%</span>
                                        )}
                                    </div>

                                    {stats.total === 0 ? (
                                        <p className="text-xs text-white/25 text-center py-1">لا توجد بيانات حضور بعد</p>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-2">
                                            {/* Present */}
                                            <div className={`flex flex-col items-center gap-1.5 rounded-xl py-3 ${stats.present > 0 ? 'bg-green-500/10 ring-1 ring-green-500/20' : 'bg-white/[0.04] ring-1 ring-white/8'}`}>
                                                <CheckCircle2 className={`w-4 h-4 ${stats.present > 0 ? 'text-green-400' : 'text-white/20'}`} />
                                                <span className={`text-xl font-black leading-none ${stats.present > 0 ? 'text-green-400' : 'text-white/25'}`}>{stats.present}</span>
                                                <span className={`text-[10px] font-bold uppercase tracking-wide ${stats.present > 0 ? 'text-green-400/50' : 'text-white/20'}`}>حاضر</span>
                                            </div>
                                            {/* Late */}
                                            <div className={`flex flex-col items-center gap-1.5 rounded-xl py-3 ${stats.late > 0 ? 'bg-amber-500/10 ring-1 ring-amber-500/20' : 'bg-white/[0.04] ring-1 ring-white/8'}`}>
                                                <Clock className={`w-4 h-4 ${stats.late > 0 ? 'text-amber-400' : 'text-white/20'}`} />
                                                <span className={`text-xl font-black leading-none ${stats.late > 0 ? 'text-amber-400' : 'text-white/25'}`}>{stats.late}</span>
                                                <span className={`text-[10px] font-bold uppercase tracking-wide ${stats.late > 0 ? 'text-amber-400/50' : 'text-white/20'}`}>متأخر</span>
                                            </div>
                                            {/* Absent */}
                                            <div className={`flex flex-col items-center gap-1.5 rounded-xl py-3 ${stats.absent > 0 ? 'bg-red-500/10 ring-1 ring-red-500/20' : 'bg-white/[0.04] ring-1 ring-white/8'}`}>
                                                <XCircle className={`w-4 h-4 ${stats.absent > 0 ? 'text-red-400' : 'text-white/20'}`} />
                                                <span className={`text-xl font-black leading-none ${stats.absent > 0 ? 'text-red-400' : 'text-white/25'}`}>{stats.absent}</span>
                                                <span className={`text-[10px] font-bold uppercase tracking-wide ${stats.absent > 0 ? 'text-red-400/50' : 'text-white/20'}`}>غائب</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* ── Payment ─────────────────────── */}
                                <div className="rounded-2xl bg-white/[0.07] ring-1 ring-white/10 px-4 py-3.5">
                                    <div className="flex items-center justify-between mb-2.5">
                                        <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">المدفوعات</span>
                                        <div className="flex items-center gap-2">
                                            {isPaidFull && (
                                                <span className="text-[10px] font-bold text-green-400 bg-green-400/10 ring-1 ring-green-400/20 px-2 py-0.5 rounded-full">مكتمل</span>
                                            )}
                                            <span className={`text-sm font-black tabular-nums ${isPaidFull ? 'text-green-400' : 'text-white/60'}`} dir="ltr">
                                                {amountPaid.toLocaleString()}<span className="text-white/25 font-normal text-xs"> / {paymentGoal.toLocaleString()} ₪</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${isPaidFull ? 'bg-green-400' : isFemale ? 'bg-pink-400' : 'bg-indigo-400'}`}
                                            style={{ width: `${paymentPct}%` }}
                                        />
                                    </div>
                                    {paymentComment && (
                                        <p className="text-[11px] text-white/25 mt-2 leading-relaxed">{paymentComment}</p>
                                    )}
                                </div>

                                {/* ── Payment CTA ─────────────────── */}
                                {isAdmin && (
                                    <button type="button" onClick={() => setShowPayment(true)}
                                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all active:scale-[0.98] ${isFemale
                                            ? 'bg-pink-500/12 hover:bg-pink-500/20 text-pink-200 ring-1 ring-pink-500/20'
                                            : 'bg-indigo-500/12 hover:bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-500/20'}`}>
                                        <div className="flex items-center gap-2.5">
                                            <CreditCard className="w-4 h-4 opacity-70" />
                                            <span>إدارة المدفوعات</span>
                                        </div>
                                        <span className="text-white/20 text-sm">←</span>
                                    </button>
                                )}

                                {/* ── Delete ─────────────────────── */}
                                {isAdmin && (
                                    <button type="button" onClick={handleDelete} disabled={deleting}
                                        className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all active:scale-[0.98] bg-red-500/12 hover:bg-red-500/20 text-red-200 ring-1 ring-red-500/20 disabled:opacity-40">
                                        <div className="flex items-center gap-2.5">
                                            {deleting ? <Loader2 className="w-4 h-4 animate-spin opacity-70" /> : <Trash2 className="w-4 h-4 opacity-70" />}
                                            <span>حذف اللاعب</span>
                                        </div>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Portal>
    )
}
