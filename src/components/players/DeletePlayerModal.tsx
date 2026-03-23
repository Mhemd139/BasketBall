'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { searchTrainees, deleteTrainee } from '@/app/actions'
import { useConfirm } from '@/components/ui/ConfirmModal'
import { useToast } from '@/components/ui/Toast'
import { useRouter } from 'next/navigation'
import { Search, Loader2, User, Phone, Users, Trash2, X } from 'lucide-react'

interface DeletePlayerModalProps {
    isOpen: boolean
    onClose: () => void
}

export function DeletePlayerModal({ isOpen, onClose }: DeletePlayerModalProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<any[]>([])
    const [searching, setSearching] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const { confirm } = useConfirm()
    const { toast } = useToast()
    const router = useRouter()
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

    useEffect(() => {
        if (isOpen) {
            setQuery('')
            setResults([])
            document.body.style.overflow = 'hidden'
        }
        return () => { document.body.style.overflow = '' }
    }, [isOpen])

    useEffect(() => {
        if (query.length < 2) {
            setResults([])
            return
        }
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(async () => {
            setSearching(true)
            const res = await searchTrainees(query)
            if (res.success) setResults(res.trainees || [])
            setSearching(false)
        }, 300)
        return () => clearTimeout(debounceRef.current)
    }, [query])

    const handleDelete = async (trainee: any) => {
        const confirmed = await confirm({
            title: 'حذف اللاعب',
            message: `هل أنت متأكد من حذف ${trainee.name_ar}؟`,
            confirmText: 'حذف',
            cancelText: 'إلغاء',
            variant: 'danger',
        })
        if (!confirmed) return

        setDeletingId(trainee.id)
        const res = await deleteTrainee(trainee.id)
        setDeletingId(null)

        if (res.success) {
            toast('تم حذف اللاعب بنجاح', 'success')
            setResults(prev => prev.filter(t => t.id !== trainee.id))
            router.refresh()
        } else {
            toast(res.error || 'فشل الحذف', 'error')
        }
    }

    if (typeof window === 'undefined' || !isOpen) return null

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex flex-col justify-end sm:justify-center sm:items-center sm:p-4 overscroll-none touch-none" dir="rtl">
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
                        className="relative bg-[#0B132B] w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[85dvh] border-t-red-500/50"
                    >
                        {/* Drag handle (mobile) */}
                        <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
                            <div className="w-8 h-[3px] rounded-full bg-white/20" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-white/8">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center">
                                    <Trash2 className="w-5 h-5 text-red-400" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white leading-tight">حذف لاعب</h2>
                                    <p className="text-xs text-white/40">ابحث عن اللاعب لحذفه</p>
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

                        {/* Search */}
                        <div className="px-4 pt-4 pb-2">
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full bg-white/[0.07] border border-white/10 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/30 transition-all"
                                    placeholder="ابحث بالاسم أو رقم الهاتف..."
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    dir="rtl"
                                />
                                {searching && <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-red-400" />}
                            </div>
                        </div>

                        {/* Results */}
                        <div className="flex-1 overflow-y-auto overscroll-contain touch-auto px-4 py-2 space-y-1.5">
                            {query.length < 2 && (
                                <div className="py-12 text-center">
                                    <Search className="w-7 h-7 text-white/10 mx-auto mb-2" />
                                    <p className="text-sm text-white/25">اكتب حرفين على الأقل للبحث</p>
                                </div>
                            )}

                            {query.length >= 2 && !searching && results.length === 0 && (
                                <div className="py-12 text-center">
                                    <p className="text-sm text-white/30">لم يتم العثور على لاعبين</p>
                                </div>
                            )}

                            {searching && results.length === 0 && (
                                <div className="py-12 flex items-center justify-center">
                                    <Loader2 className="w-7 h-7 animate-spin text-red-400/60" />
                                </div>
                            )}

                            {results.map((trainee, idx) => {
                                const isDeleting = deletingId === trainee.id
                                return (
                                    <motion.div
                                        key={trainee.id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.04, duration: 0.25 }}
                                        className={`flex items-center gap-3 px-3 py-3 rounded-2xl transition-all ${isDeleting ? 'opacity-40' : 'hover:bg-white/5'}`}
                                    >
                                        {/* Avatar */}
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                            trainee.gender === 'female' ? 'bg-pink-500/15 text-pink-400' : 'bg-indigo-500/15 text-indigo-400'
                                        }`}>
                                            <User className="w-5 h-5" />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-white truncate">{trainee.name_ar}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {trainee.phone && (
                                                    <span className="flex items-center gap-1 text-[11px] text-white/35">
                                                        <Phone className="w-3 h-3" />
                                                        <span dir="ltr">{trainee.phone}</span>
                                                    </span>
                                                )}
                                                {trainee.classes && (
                                                    <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/15 px-1.5 py-0.5 rounded truncate max-w-[100px]">
                                                        {trainee.classes.name_ar}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Delete button */}
                                        <button
                                            onClick={() => handleDelete(trainee)}
                                            disabled={isDeleting}
                                            className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all shrink-0 active:scale-95 disabled:opacity-40"
                                            aria-label={`حذف ${trainee.name_ar}`}
                                        >
                                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                        </button>
                                    </motion.div>
                                )
                            })}
                        </div>

                        {/* Bottom safe area */}
                        <div className="h-6 sm:h-4 shrink-0" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}
