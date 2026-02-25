'use client'

import { useState, useEffect } from 'react'
import { X, Search, Loader2, Check, UserRound } from 'lucide-react'
import { updateTeamTrainer } from '@/app/actions'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { getLocalizedField } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { Portal } from '@/components/ui/Portal'

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

export function TrainerReassignModal({ classId, currentTrainerId, locale, onClose }: TrainerReassignModalProps) {
    const [trainers, setTrainers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedId, setSelectedId] = useState<string | null>(currentTrainerId || null)
    const router = useRouter()
    const { toast } = useToast()
    const isRTL = locale !== 'he'

    useEffect(() => {
        async function fetchTrainers() {
            const supabase = createClient()
            const { data } = await supabase
                .from('trainers')
                .select('id, name_ar, name_he, name_en, phone')
                .order('name_ar')
            if (data) setTrainers(data)
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

    const getInitials = (trainer: any) => {
        const name = getLocalizedField(trainer, 'name', locale) || ''
        return name.trim().split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase()
    }

    const canSave = selectedId && selectedId !== currentTrainerId && !saving

    return (
        <Portal>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-portal"
                onClick={onClose}
            />

            {/* Sheet — slides up from bottom on mobile */}
            <div
                className="fixed bottom-0 inset-x-0 z-[201] sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4"
                dir={isRTL ? 'rtl' : 'ltr'}
            >
                <div className="bg-white w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl flex flex-col max-h-[88dvh]">

                    {/* Drag handle (mobile) */}
                    <div className="flex justify-center pt-3 pb-1 sm:hidden">
                        <div className="w-10 h-1 rounded-full bg-slate-200" />
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pt-4 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-indigo-100 flex items-center justify-center">
                                <UserRound className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-900 leading-tight">{'تعيين مدرب'}</h2>
                                <p className="text-xs text-slate-400">{'اختر مدرباً لهذا الفريق'}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="إغلاق"
                            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="px-4 pt-4 pb-2">
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
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
                            <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
                                <Loader2 className="w-7 h-7 animate-spin" />
                                <span className="text-xs font-medium">{'جاري التحميل...'}</span>
                            </div>
                        ) : filteredTrainers.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 text-sm">
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
                                                ? 'bg-indigo-50 ring-2 ring-indigo-500 ring-offset-0'
                                                : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        {/* Avatar */}
                                        <div className={`w-10 h-10 rounded-xl ${avatarColor} flex items-center justify-center shrink-0 text-white font-bold text-sm`}>
                                            {initials || <UserRound className="w-5 h-5" />}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-bold text-sm truncate ${isSelected ? 'text-indigo-700' : 'text-slate-900'}`}>
                                                {getLocalizedField(trainer, 'name', locale)}
                                            </div>
                                            {isCurrent && (
                                                <span className="inline-block text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-0.5">
                                                    {'المدرب الحالي'}
                                                </span>
                                            )}
                                        </div>

                                        {/* Check */}
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                            isSelected
                                                ? 'bg-indigo-600 border-indigo-600'
                                                : 'border-slate-300'
                                        }`}>
                                            {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                        </div>
                                    </button>
                                )
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 pt-3 pb-6 sm:pb-4 border-t border-slate-100 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors"
                        >
                            {'إلغاء'}
                        </button>
                        <button
                            type="button"
                            disabled={!canSave}
                            onClick={handleSave}
                            className="flex-[2] py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
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
