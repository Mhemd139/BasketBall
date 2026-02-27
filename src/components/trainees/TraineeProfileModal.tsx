'use client'

import { useState } from 'react'
import { JerseyNumber } from '@/components/ui/JerseyNumber'
import { PaymentModal } from '@/components/payments/PaymentModal'
import { updateTrainee } from '@/app/actions'
import { Phone, X, ChevronRight, CreditCard, Edit2, Save, Loader2, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { Portal } from '@/components/ui/Portal'

type AttendanceStats = { total: number; present: number; late: number; absent: number }

interface TraineeProfileModalProps {
    trainee: any
    locale: string
    teamName?: string
    trainerName?: string
    isAdmin?: boolean
    attendanceStats?: AttendanceStats
    onClose: () => void
}

export function TraineeProfileModal({ trainee, teamName, isAdmin, attendanceStats, onClose }: TraineeProfileModalProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [showPayment, setShowPayment] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [saving, setSaving] = useState(false)

    const [editForm, setEditForm] = useState({
        name_ar: trainee.name_ar || '',
        name_en: trainee.name_en || '',
        name_he: trainee.name_he || '',
        phone: trainee.phone || '',
        jersey_number: trainee.jersey_number ?? '',
        gender: trainee.gender || 'male',
    })

    const isFemale = trainee.gender === 'female'
    const amountPaid = trainee.amount_paid ?? 0
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
        })
        if (res.success) {
            toast('تم تحديث البيانات', 'success')
            setIsEditing(false)
            router.refresh()
        } else {
            toast(res.error || 'فشل التحديث', 'error')
        }
        setSaving(false)
    }

    if (showPayment) {
        return <PaymentModal trainee={trainee} onClose={() => setShowPayment(false)} />
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
                <div className={`bg-[#0B132B] w-full sm:max-w-sm rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 sm:slide-in-from-bottom-0 duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${isFemale ? 'border-t-pink-500/70' : 'border-t-indigo-500/70'}`}>

                    {/* Drag pill */}
                    <div className="flex justify-center pt-2.5 sm:hidden">
                        <div className="w-8 h-[3px] rounded-full bg-white/20" />
                    </div>

                    {/* ── HERO ─────────────────────────────────── */}
                    <div className="relative px-5 pt-4 pb-6">

                        {/* top row: close / gender / edit */}
                        <div className="flex items-center justify-between mb-5">
                            <button type="button" onClick={isEditing ? () => setIsEditing(false) : onClose} aria-label={isEditing ? 'رجوع' : 'إغلاق'}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white transition-all">
                                {isEditing ? <ChevronRight className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            </button>

                            <span className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full ring-1 ${isFemale ? 'bg-pink-500/15 text-pink-300 ring-pink-500/25' : 'bg-indigo-500/15 text-indigo-300 ring-indigo-500/25'}`}>
                                {isFemale ? 'لاعبة' : 'لاعب'}
                            </span>

                            {isAdmin && !isEditing ? (
                                <button type="button" onClick={() => setIsEditing(true)} aria-label="تعديل"
                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white transition-all">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            ) : <div className="w-8" />}
                        </div>

                        {/* Jersey + name block */}
                        <div className="flex items-center gap-4">
                            <JerseyNumber
                                number={trainee.jersey_number}
                                gender={trainee.gender}
                                className="w-16 h-16 text-2xl flex-shrink-0 shadow-xl"
                            />
                            <div className="min-w-0 flex-1">
                                <h2 className="text-[22px] font-black text-white leading-tight tracking-tight">{trainee.name_ar}</h2>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                                    {trainee.phone && (
                                        <a href={`tel:${trainee.phone}`} dir="ltr"
                                            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
                                            <Phone className="w-3 h-3" />{trainee.phone}
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
                    <div className="px-4 pb-20 space-y-3">

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
                                <div className="flex gap-2 pt-1">
                                    <button type="button" onClick={handleSave} disabled={saving}
                                        className="flex-[2] py-3 rounded-xl bg-white text-[#0f1623] font-black text-sm flex items-center justify-center gap-2 hover:bg-white/90 disabled:opacity-40 active:scale-[0.98] transition-all">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        حفظ التغييرات
                                    </button>
                                    <button type="button" onClick={() => setIsEditing(false)}
                                        className="flex-1 py-3 rounded-xl bg-white/10 border border-white/10 text-white/50 font-bold text-sm hover:bg-white/10 active:scale-[0.98] transition-all">
                                        إلغاء
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3 animate-in fade-in duration-200">

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
                                    {trainee.payment_comment_ar && (
                                        <p className="text-[11px] text-white/25 mt-2 leading-relaxed">{trainee.payment_comment_ar}</p>
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
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Portal>
    )
}
