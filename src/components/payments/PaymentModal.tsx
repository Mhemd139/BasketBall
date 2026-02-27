'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Save, Loader2, Plus } from 'lucide-react'
import { JerseyNumber } from '@/components/ui/JerseyNumber'
import { updateTraineePayment } from '@/app/actions'
import { useToast } from '@/components/ui/Toast'
import { Portal } from '@/components/ui/Portal'
type PaymentTrainee = {
    id: string
    name_ar: string
    name_he: string
    name_en: string
    jersey_number: number | null
    phone: string | null
    is_paid: boolean | null
    amount_paid: number | null
    payment_comment_ar: string | null
    payment_comment_he: string | null
    payment_comment_en: string | null
    gender: string | null
}

interface PaymentModalProps {
    trainee: PaymentTrainee
    onClose: () => void
}

export function PaymentModal({ trainee, onClose }: PaymentModalProps) {
    const original = trainee.amount_paid || 0
    const [amount, setAmount] = useState(original)
    const [comment, setComment] = useState(trainee.payment_comment_ar || '')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const { toast } = useToast()

    const isFemale = trainee.gender === 'female'
    const goal = 3000
    const progress = Math.min((amount / goal) * 100, 100)
    const isPaidFull = amount >= goal
    const delta = amount - original

    const handleSave = async () => {
        setLoading(true)
        const res = await updateTraineePayment(trainee.id, delta, comment)
        if (res.success) {
            toast('تم تحديث الدفع بنجاح', 'success')
            router.refresh()
            onClose()
        } else {
            toast('حدث خطأ أثناء التحديث', 'error')
        }
        setLoading(false)
    }

    const adjust = (d: number) => setAmount(c => Math.max(0, Math.min(goal, c + d)))

    return (
        <Portal>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[200] backdrop-blur-sm bg-[#060d1a]/60 animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div
                className="fixed bottom-0 inset-x-0 z-[201] sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-6"
                dir="rtl"
            >
                <div className={`bg-[#0B132B] w-full sm:max-w-sm rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 sm:zoom-in-95 sm:slide-in-from-bottom-0 duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isFemale ? 'border-t-pink-500/70' : 'border-t-indigo-500/70'}`}>

                    {/* Drag pill */}
                    <div className="flex justify-center pt-2.5 sm:hidden">
                        <div className="w-8 h-[3px] rounded-full bg-white/20" />
                    </div>

                    {/* ── HERO ─────────────────────────────────── */}
                    <div className="px-5 pt-4 pb-5">
                        {/* Top bar */}
                        <div className="flex items-center justify-between mb-4">
                            <button type="button" onClick={onClose} aria-label="رجوع"
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white transition-all cursor-pointer">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            <span className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full ring-1 ${isFemale
                                ? 'bg-pink-500/15 text-pink-300 ring-pink-500/25'
                                : 'bg-indigo-500/15 text-indigo-300 ring-indigo-500/25'
                            }`}>
                                المدفوعات
                            </span>
                            <div className="w-8" />
                        </div>

                        {/* Identity + amount in one row */}
                        <div className="flex items-center gap-3 mb-4">
                            <JerseyNumber
                                number={trainee.jersey_number}
                                gender={trainee.gender}
                                className="w-11 h-11 text-base flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                                <p className="text-base font-black text-white leading-tight">{trainee.name_ar}</p>
                                {trainee.phone && (
                                    <p className="text-xs text-white/30 mt-0.5 tabular-nums" dir="ltr">{trainee.phone}</p>
                                )}
                            </div>
                            {/* Amount right-aligned */}
                            <div className="flex-shrink-0 text-right">
                                <div className="flex items-baseline gap-1.5">
                                    <span className={`text-2xl font-black tabular-nums leading-none ${isPaidFull ? 'text-green-400' : 'text-white'}`} dir="ltr">
                                        {amount.toLocaleString()}
                                    </span>
                                    {delta !== 0 && (
                                        <span className={`text-xs font-black tabular-nums ${delta > 0 ? 'text-green-400' : 'text-red-400'}`} dir="ltr">
                                            {delta > 0 ? '+' : ''}{delta.toLocaleString()}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] text-white/30 tabular-nums mt-0.5" dir="ltr">/ {goal.toLocaleString()} ₪</p>
                                {isPaidFull && (
                                    <span className="text-[9px] font-bold text-green-400 bg-green-400/10 ring-1 ring-green-400/20 px-1.5 py-0.5 rounded-full inline-block mt-1">مكتمل</span>
                                )}
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${isPaidFull ? 'bg-green-400' : isFemale ? 'bg-pink-400' : 'bg-indigo-400'}`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* ── BODY (scrollable) ────────────────────── */}
                    <div className="px-4 pt-3 pb-2 space-y-3 overflow-y-auto">

                        {/* Amount editor */}
                        <div className="rounded-2xl bg-white/[0.07] ring-1 ring-white/10 p-3">
                            <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-2.5">تعديل المبلغ</p>

                            {/* Direct input only — no flanking ± buttons */}
                            <input
                                type="number"
                                aria-label="المبلغ المدفوع"
                                value={amount}
                                onChange={e => { const v = Number(e.target.value); if (!isNaN(v)) setAmount(Math.max(0, Math.min(goal, v))) }}
                                className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/10 focus:border-white/30 outline-none text-white/80 text-sm font-mono text-center transition-colors [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                                dir="ltr"
                            />

                            {/* Quick-add chips — flex row */}
                            <div className="flex gap-1.5 mt-2">
                                {[100, 250, 500, 1000].map(n => (
                                    <button key={n} type="button"
                                        onClick={() => adjust(n)}
                                        className={`flex-1 py-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-0.5 transition-all active:scale-95 cursor-pointer ring-1 ${isFemale
                                            ? 'bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 ring-pink-500/20'
                                            : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 ring-indigo-500/20'
                                        }`}>
                                        <Plus className="w-2.5 h-2.5" />{n}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Comment */}
                        <div>
                            <label className="block text-[10px] font-bold text-white/35 uppercase tracking-widest mb-1.5">ملاحظات</label>
                            <textarea
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                placeholder="أضف ملاحظة..."
                                rows={1}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.07] border border-white/10 focus:border-white/25 outline-none text-white text-sm resize-none transition-colors placeholder:text-white/20"
                            />
                        </div>
                    </div>

                    {/* ── STICKY SAVE ──────────────────────────── */}
                    <div className={`px-4 pt-3 pb-20 bg-gradient-to-t from-[#0B132B] via-[#0B132B] to-transparent`}>
                        <button type="button" onClick={handleSave} disabled={loading}
                            className={`w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 cursor-pointer ${isFemale
                                ? 'bg-pink-500 hover:bg-pink-400 text-white shadow-lg shadow-pink-500/25'
                                : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/25'
                            }`}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {delta !== 0
                                ? <span dir="ltr" className="tabular-nums">{original.toLocaleString()} → {amount.toLocaleString()} ₪</span>
                                : 'حفظ التغييرات'
                            }
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    )
}
