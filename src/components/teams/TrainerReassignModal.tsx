'use client'

import { useState, useEffect } from 'react'
import { X, Search, Loader2, Check, UserRound } from 'lucide-react'
import { updateTeamTrainer } from '@/app/actions'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { getLocalizedField } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { Portal } from '@/components/ui/Portal'
import { BouncingBasketballLoader } from '@/components/ui/BouncingBasketballLoader'

interface TrainerReassignModalProps {
    classId: string
    currentTrainerId?: string | null
    locale: string
    onClose: () => void
}

const AVATAR_COLORS = [
    'bg-violet-500', 'bg-blue-500', 'bg-emerald-500',
    'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-rose-500',
]

type Trainer = {
    id: string
    name_ar: string | null
    name_he: string | null
    name_en: string | null
    phone: string | null
}

export function TrainerReassignModal({ classId, currentTrainerId, locale, onClose }: TrainerReassignModalProps) {
    const [trainers, setTrainers] = useState<Trainer[]>([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedId, setSelectedId] = useState<string | null>(currentTrainerId || null)
    const router = useRouter()
    const { toast } = useToast()
    const isRTL = locale === 'ar' || locale === 'he'

    useEffect(() => {
        async function fetchTrainers() {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('trainers')
                .select('id, name_ar, name_he, name_en, phone')
                .order('name_ar')
                .limit(200)
            if (error) {
                setFetchError('فشل تحميل المدربين')
            } else if (data) {
                setTrainers(data)
            }
            setLoading(false)
        }
        fetchTrainers()
    }, [])

    const handleSave = async () => {
        if (!selectedId) return
        setSaving(true)
        const res = await updateTeamTrainer(classId, selectedId)
        if (res.success) {
            toast('تم تعيين المدرب بنجاح', 'success')
            router.refresh()
            onClose()
        } else {
            toast(res.error || 'فشل تحديث المدرب', 'error')
        }
        setSaving(false)
    }

    const filteredTrainers = trainers.filter(t => {
        const name = getLocalizedField(t, 'name', locale).toLowerCase()
        return name.includes(searchQuery.toLowerCase())
    })

    const getInitials = (trainer: Trainer) => {
        const name = getLocalizedField(trainer, 'name', locale) || ''
        return name.trim().split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase()
    }

    const canSave = selectedId && selectedId !== currentTrainerId && !saving

    return (
        <Portal>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[200] bg-[#0a1628]/0 backdrop-blur-sm animate-in fade-in duration-500"
                onClick={onClose}
            />

            {/* Sheet */}
            <div
                className="fixed bottom-0 inset-x-0 z-[201] sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4"
                dir={isRTL ? 'rtl' : 'ltr'}
            >
                <div className="bg-[#0B132B] w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[88dvh] animate-in slide-in-from-bottom-8 sm:zoom-in-95 sm:slide-in-from-bottom-0 duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] border-t-indigo-500/70">

                    {/* Drag handle (mobile) */}
                    <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
                        <div className="w-8 h-[3px] rounded-full bg-white/20" />
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-white/8">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                <UserRound className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-white leading-tight">{'تعيين مدرب'}</h2>
                                <p className="text-xs text-white/40">{'اختر مدرباً لهذا الفريق'}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="إغلاق"
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="px-4 pt-4 pb-2">
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                            <input
                                type="text"
                                className="w-full bg-white/[0.07] border border-white/10 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25 transition-all"
                                placeholder={'ابحث عن مدرب...'}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                dir="rtl"
                            />
                        </div>
                    </div>

                    {/* Trainer list */}
                    <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5">
                        {loading ? (
                            <div className="py-8 flex flex-col items-center gap-3 text-white/30">
                                <BouncingBasketballLoader />
                            </div>
                        ) : fetchError ? (
                            <div className="py-12 text-center text-red-400/70 text-sm">
                                {fetchError}
                            </div>
                        ) : filteredTrainers.length === 0 ? (
                            <div className="py-12 text-center text-white/30 text-sm">
                                {'لا توجد نتائج'}
                            </div>
                        ) : (
                            filteredTrainers.map((trainer, idx) => {
                                const isSelected = selectedId === trainer.id
                                const isCurrent = currentTrainerId === trainer.id
                                const initials = getInitials(trainer)
                                const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length]

                                return (
                                    <button
                                        type="button"
                                        key={trainer.id}
                                        onClick={() => setSelectedId(trainer.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all text-right ${
                                            isSelected
                                                ? 'bg-indigo-500/15 ring-1 ring-indigo-500/40'
                                                : 'hover:bg-white/5'
                                        }`}
                                    >
                                        {/* Avatar */}
                                        <div className={`w-10 h-10 rounded-xl ${avatarColor} flex items-center justify-center shrink-0 text-white font-bold text-sm`}>
                                            {initials || <UserRound className="w-5 h-5" />}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-bold text-sm truncate ${isSelected ? 'text-indigo-300' : 'text-white'}`}>
                                                {getLocalizedField(trainer, 'name', locale)}
                                            </div>
                                            {isCurrent && (
                                                <span className="inline-block text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full mt-0.5">
                                                    {'المدرب الحالي'}
                                                </span>
                                            )}
                                        </div>

                                        {/* Radio circle */}
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                            isSelected
                                                ? 'bg-indigo-500 border-indigo-500'
                                                : 'border-white/20'
                                        }`}>
                                            {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                        </div>
                                    </button>
                                )
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 pt-3 pb-6 sm:pb-4 border-t border-white/8 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl bg-white/10 text-white/60 font-bold text-sm hover:bg-white/15 transition-colors"
                        >
                            {'إلغاء'}
                        </button>
                        <button
                            type="button"
                            disabled={!canSave}
                            onClick={handleSave}
                            className="flex-[2] py-3 rounded-xl bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/25"
                        >
                            {saving
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Check className="w-4 h-4" strokeWidth={2.5} />
                            }
                            {'حفظ التغييرات'}
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    )
}
