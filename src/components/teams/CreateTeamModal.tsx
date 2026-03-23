'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Loader2, Trash2, ChevronRight, Check, Search, MapPin } from 'lucide-react'
import { getEventRefData, createTeam, updateTeam, deleteTeam } from '@/app/actions'
import { useToast } from '@/components/ui/Toast'
import { Portal } from '@/components/ui/Portal'

interface CreateTeamModalProps {
    isOpen: boolean
    onClose: () => void
    locale: string
    isEdit?: boolean
    initialData?: {
        id: string
        name_en: string
        name_ar: string
        name_he: string
        trainer_id: string | null
        hall_id: string | null
    }
}

const AVATAR_COLORS = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-amber-600',
    'from-pink-500 to-rose-600',
    'from-teal-500 to-emerald-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
]

function getName(item: any, locale: string): string {
    return locale === 'he' ? (item.name_he || item.name_ar || '') : (item.name_ar || item.name_he || '')
}

function StepDots({ current, total }: { current: number; total: number }) {
    return (
        <div className="flex items-center gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
                <motion.div
                    key={i}
                    animate={{ width: i === current - 1 ? 20 : 6, opacity: i < current ? 1 : 0.25 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className={`h-1.5 rounded-full ${i < current ? 'bg-indigo-400' : 'bg-white/20'}`}
                />
            ))}
        </div>
    )
}

function TrainerGrid({ trainers, selectedId, onSelect, locale }: {
    trainers: any[]
    selectedId: string
    onSelect: (id: string) => void
    locale: string
}) {
    const [search, setSearch] = useState('')
    const filtered = trainers.filter(t => getName(t, locale).includes(search))

    return (
        <div className="flex flex-col gap-4">
            <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                <input
                    type="text"
                    placeholder={locale === 'he' ? 'חיפוש מאמן...' : 'بحث عن مدرب...'}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-white/[0.06] border border-white/10 rounded-2xl pr-10 pl-4 py-3.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-indigo-500/60 focus:bg-white/10 transition-all"
                />
            </div>
            <div className="grid grid-cols-4 gap-2">
                {filtered.map((trainer, i) => {
                    const name = getName(trainer, locale)
                    const isSelected = selectedId === trainer.id
                    const gradient = AVATAR_COLORS[i % AVATAR_COLORS.length]
                    return (
                        <motion.button
                            key={trainer.id}
                            onClick={() => onSelect(trainer.id)}
                            whileTap={{ scale: 0.92 }}
                            className="flex flex-col items-center gap-2 py-3 px-1 rounded-2xl transition-colors active:bg-white/5"
                        >
                            <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-lg transition-all duration-200 ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0B132B] scale-110' : selectedId ? 'opacity-40' : 'opacity-100'}`}>
                                <span className="text-white font-black text-lg drop-shadow">{name.slice(0, 1)}</span>
                                <AnimatePresence>
                                    {isSelected && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                            className="absolute inset-0 rounded-2xl bg-black/30 flex items-center justify-center"
                                        >
                                            <Check className="w-5 h-5 text-white drop-shadow" strokeWidth={3} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <span className={`text-[11px] truncate w-full text-center leading-tight transition-colors ${isSelected ? 'text-white font-bold' : selectedId ? 'text-white/30' : 'text-white/60'}`}>
                                {name}
                            </span>
                        </motion.button>
                    )
                })}
                {filtered.length === 0 && (
                    <p className="col-span-4 text-center text-white/25 text-sm py-8">
                        {locale === 'he' ? 'לא נמצאו מאמנים' : 'لا توجد نتائج'}
                    </p>
                )}
            </div>
        </div>
    )
}

function HallList({ halls, selectedId, onSelect, locale }: {
    halls: any[]
    selectedId: string
    onSelect: (id: string) => void
    locale: string
}) {
    return (
        <div className="flex flex-col gap-2.5">
            {halls.map(hall => {
                const isSelected = selectedId === hall.id
                return (
                    <motion.button
                        key={hall.id}
                        onClick={() => onSelect(hall.id)}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-right ${
                            isSelected
                                ? 'border-emerald-400/40 bg-emerald-500/10 shadow-[0_0_20px_rgba(52,211,153,0.08)]'
                                : 'border-white/8 bg-white/[0.04] active:bg-white/10'
                        }`}
                    >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'bg-emerald-500/25' : 'bg-white/8'}`}>
                            <MapPin className={`w-5 h-5 transition-colors ${isSelected ? 'text-emerald-400' : 'text-white/30'}`} />
                        </div>
                        <span className={`font-bold text-base flex-1 transition-colors ${isSelected ? 'text-white' : 'text-white/50'}`}>
                            {getName(hall, locale)}
                        </span>
                        <AnimatePresence>
                            {isSelected && (
                                <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}>
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={3} />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                )
            })}
        </div>
    )
}

export function CreateTeamModal({ isOpen, onClose, locale, isEdit, initialData }: CreateTeamModalProps) {
    const { toast } = useToast()
    const sheetRef = useRef<HTMLDivElement>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [refData, setRefData] = useState<{ trainers: any[]; halls: any[] }>({ trainers: [], halls: [] })
    const [formData, setFormData] = useState({ name: '', trainer_id: '', hall_id: '' })

    useEffect(() => {
        if (!isOpen) return
        const scrollY = window.scrollY
        document.body.style.overflow = 'hidden'
        document.body.style.position = 'fixed'
        document.body.style.top = `-${scrollY}px`
        document.body.style.width = '100%'

        const blockTouchMove = (e: TouchEvent) => {
            const target = e.target as HTMLElement
            if (target.closest('[data-sheet-scroll]')) return
            e.preventDefault()
        }
        document.addEventListener('touchmove', blockTouchMove, { passive: false })

        return () => {
            document.body.style.overflow = ''
            document.body.style.position = ''
            document.body.style.top = ''
            document.body.style.width = ''
            window.scrollTo(0, scrollY)
            document.removeEventListener('touchmove', blockTouchMove)
        }
    }, [isOpen])

    useEffect(() => {
        if (!isOpen || !window.visualViewport) return
        const vv = window.visualViewport

        const reposition = () => {
            if (!sheetRef.current) return
            const keyboardHeight = window.innerHeight - vv.height - vv.offsetTop
            sheetRef.current.style.bottom = `${keyboardHeight}px`
            sheetRef.current.style.maxHeight = `${vv.height - 16}px`
        }

        vv.addEventListener('resize', reposition)
        vv.addEventListener('scroll', reposition)
        return () => {
            vv.removeEventListener('resize', reposition)
            vv.removeEventListener('scroll', reposition)
            if (sheetRef.current) {
                sheetRef.current.style.bottom = '0px'
                sheetRef.current.style.maxHeight = ''
            }
        }
    }, [isOpen])

    useEffect(() => {
        if (!isOpen) return
        setStep(1)
        setShowDeleteConfirm(false)
        setFormData({
            name: initialData?.name_ar || initialData?.name_he || '',
            trainer_id: initialData?.trainer_id || '',
            hall_id: initialData?.hall_id || '',
        })
        getEventRefData().then(res => {
            if (res.success) setRefData({ trainers: res.trainers || [], halls: res.halls || [] })
        })
    }, [isOpen, initialData])

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast(locale === 'he' ? 'נא להזין שם לקבוצה' : 'يرجى إدخال اسم الفريق', 'warning')
            return
        }
        setLoading(true)
        const payload = {
            name_en: formData.name, name_ar: formData.name, name_he: formData.name,
            trainer_id: formData.trainer_id || null, hall_id: formData.hall_id || null,
        }
        const res = isEdit && initialData?.id ? await updateTeam(initialData.id, payload) : await createTeam(payload)
        if (res.success) {
            toast(isEdit ? (locale === 'he' ? 'הקבוצה עודכנה' : 'تم تحديث الفريق') : (locale === 'he' ? 'הקבוצה נוצרה' : 'تم إنشاء الفريق'), 'success')
            onClose()
        } else {
            toast(res.error || (locale === 'he' ? 'הפעולה נכשלה' : 'فشلت العملية'), 'error')
        }
        setLoading(false)
    }

    const handleDelete = async () => {
        if (!initialData?.id) return
        setDeleting(true)
        const res = await deleteTeam(initialData.id)
        if (res.success) {
            toast(locale === 'he' ? 'הקבוצה נמחקה' : 'تم حذف الفريق', 'success')
            onClose()
        } else {
            toast(res.error || (locale === 'he' ? 'מחיקה נכשלה' : 'فشل الحذف'), 'error')
        }
        setDeleting(false)
    }

    const totalSteps = isEdit ? 1 : 2
    const isLastStep = step === totalSteps
    const canAdvance = step !== 1 || formData.name.trim().length > 0

    if (!isOpen) return null

    return (
        <Portal>
            <AnimatePresence>
                <motion.div
                    key="backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    onClick={onClose}
                    className="fixed inset-0 z-[99] bg-black/70 backdrop-blur-sm touch-none"
                />

                <motion.div
                    key="sheet"
                    ref={sheetRef}
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 48, stiffness: 380, mass: 1.1 }}
                    drag="y"
                    dragConstraints={{ top: 0 }}
                    dragElastic={{ top: 0, bottom: 0.3 }}
                    dragMomentum={false}
                    onDragEnd={(_, info) => {
                        const sheetHeight = sheetRef.current?.offsetHeight ?? 400
                        if (info.velocity.y > 500 || info.offset.y > sheetHeight * 0.5) onClose()
                    }}
                    className="fixed inset-x-0 bottom-0 z-[100] flex flex-col rounded-t-3xl overflow-hidden"
                    style={{ maxHeight: '92dvh', background: 'linear-gradient(180deg, #0d1530 0%, #0B132B 40%)' }}
                    dir="rtl"
                >
                    {/* Subtle top accent */}
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

                    {/* Drag handle visual */}
                    <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                        <div className="w-10 h-1 rounded-full bg-white/15" />
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 pt-2 pb-4 flex-shrink-0">
                        <div className="w-9 flex justify-start">
                            {step > 1 && (
                                <motion.button
                                    onClick={() => setStep(s => s - 1)}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-2 rounded-xl bg-white/5 text-white/50 hover:text-white transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </motion.button>
                            )}
                        </div>

                        {isEdit
                            ? <span className="text-xs font-bold text-white/30 uppercase tracking-widest">{locale === 'he' ? 'עריכת קבוצה' : 'تعديل الفريق'}</span>
                            : <StepDots current={step} total={totalSteps} />
                        }

                        <div className="w-9 flex justify-end">
                            <motion.button
                                onClick={onClose}
                                whileTap={{ scale: 0.9 }}
                                className="p-2 rounded-xl bg-white/5 text-white/50 hover:text-white transition-colors"
                                aria-label="إغلاق"
                            >
                                <X className="w-5 h-5" />
                            </motion.button>
                        </div>
                    </div>

                    {/* Scrollable content */}
                    <div
                        ref={scrollRef}
                        data-sheet-scroll
                        className="flex-1 overflow-y-auto overscroll-contain px-5 min-h-0"
                        onTouchStart={e => { if ((scrollRef.current?.scrollTop ?? 0) > 0) e.stopPropagation() }}
                    >
                        <AnimatePresence mode="wait">

                            {showDeleteConfirm && (
                                <motion.div
                                    key="delete"
                                    initial={{ opacity: 0, y: 24 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -24 }}
                                    className="flex flex-col items-center justify-center gap-6 py-16 text-center"
                                >
                                    <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                        <Trash2 className="w-9 h-9 text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white mb-2">{locale === 'he' ? 'מחק קבוצה?' : 'حذف الفريق؟'}</h3>
                                        <p className="text-white/35 text-sm">{locale === 'he' ? 'הפעולה אינה ניתנת לביטול' : 'لا يمكن التراجع عن هذا الإجراء'}</p>
                                    </div>
                                    <div className="flex gap-3 w-full">
                                        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-bold">
                                            {locale === 'he' ? 'ביטול' : 'إلغاء'}
                                        </motion.button>
                                        <motion.button whileTap={{ scale: 0.97 }} onClick={handleDelete} disabled={deleting} className="flex-1 py-4 rounded-2xl bg-red-500/15 border border-red-500/25 text-red-400 font-bold flex items-center justify-center gap-2">
                                            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            {locale === 'he' ? 'מחק' : 'حذف'}
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}

                            {!showDeleteConfirm && step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 24 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -24 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                                    className="flex flex-col gap-5 pt-2 pb-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                            <span className="text-lg">🏀</span>
                                        </div>
                                        <div>
                                            <p className="text-base font-black text-white leading-tight">
                                                {isEdit ? (locale === 'he' ? 'עריכת שם הקבוצה' : 'تعديل اسم الفريق') : (locale === 'he' ? 'קבוצה חדשה' : 'فريق جديد')}
                                            </p>
                                            <p className="text-xs text-white/30">
                                                {isEdit ? (locale === 'he' ? 'ערוך את השם למטה' : 'عدّل الاسم أدناه') : (locale === 'he' ? 'בחר שם לקבוצה' : 'اختر اسماً للفريق')}
                                            </p>
                                        </div>
                                    </div>
                                    <input
                                        value={formData.name}
                                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                        onKeyDown={e => { if (e.key === 'Enter' && !isEdit && formData.name.trim()) setStep(2) }}
                                        placeholder={locale === 'he' ? 'לדוגמה: נוער נבחרת' : 'مثال: تحت 14 نخبة'}
                                        className="w-full px-5 py-4 rounded-2xl bg-white/[0.06] border border-white/10 focus:bg-white/10 focus:border-indigo-500/70 outline-none transition-all font-bold text-white text-lg placeholder-white/20"
                                        dir="rtl"
                                        autoFocus
                                    />
                                    <motion.button
                                        onClick={isEdit ? handleSubmit : () => setStep(2)}
                                        disabled={(isEdit && loading) || !formData.name.trim()}
                                        whileTap={formData.name.trim() ? { scale: 0.97 } : {}}
                                        className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all ${
                                            formData.name.trim()
                                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_4px_24px_rgba(99,102,241,0.35)]'
                                                : 'bg-white/5 text-white/20 cursor-not-allowed'
                                        }`}
                                    >
                                        {isEdit && loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isEdit ? <Save className="w-5 h-5" /> : null}
                                        {isEdit ? (locale === 'he' ? 'שמור' : 'حفظ') : (locale === 'he' ? 'המשך' : 'متابعة')}
                                    </motion.button>
                                    {isEdit && (
                                        <motion.button
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/25 text-red-400 transition-all hover:bg-red-500/20"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                            {locale === 'he' ? 'מחק קבוצה' : 'حذف الفريق'}
                                        </motion.button>
                                    )}
                                </motion.div>
                            )}

                            {!showDeleteConfirm && step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 24 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -24 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                                    className="flex flex-col gap-5 pt-2 pb-4"
                                >
                                    <p className="text-xs font-bold text-white/30 uppercase tracking-widest px-1">{locale === 'he' ? 'בחר מאמן' : 'اختر المدرب'}</p>
                                    <TrainerGrid
                                        trainers={refData.trainers}
                                        selectedId={formData.trainer_id}
                                        onSelect={id => setFormData(p => ({ ...p, trainer_id: id }))}
                                        locale={locale}
                                    />
                                </motion.div>
                            )}


                        </AnimatePresence>
                    </div>

                    {/* Pinned footer — only for steps 2+ where content scrolls */}
                    {!showDeleteConfirm && step > 1 && (
                        <div
                            className="flex-shrink-0 px-5 pt-3 border-t border-white/[0.06]"
                            style={{ paddingBottom: 'max(1.75rem, env(safe-area-inset-bottom, 1.75rem))' }}
                        >
                            <motion.button
                                onClick={isLastStep ? handleSubmit : () => setStep(s => s + 1)}
                                disabled={(isLastStep && loading) || (!canAdvance)}
                                whileTap={canAdvance ? { scale: 0.97 } : {}}
                                className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all ${
                                    canAdvance
                                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_4px_24px_rgba(99,102,241,0.35)]'
                                        : 'bg-white/5 text-white/20 cursor-not-allowed'
                                }`}
                            >
                                {isLastStep && loading
                                    ? <Loader2 className="w-5 h-5 animate-spin" />
                                    : isLastStep
                                        ? <Save className="w-5 h-5" />
                                        : null
                                }
                                {isLastStep
                                    ? (isEdit ? (locale === 'he' ? 'שמור' : 'حفظ') : (locale === 'he' ? 'צור קבוצה' : 'إنشاء الفريق'))
                                    : (locale === 'he' ? 'המשך' : 'متابعة')
                                }
                            </motion.button>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </Portal>
    )
}
