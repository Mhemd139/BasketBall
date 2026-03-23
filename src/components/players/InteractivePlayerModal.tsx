'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getEventRefData, addTrainee, searchTrainees, transferTrainee } from '@/app/actions'
import { useConfirm } from '@/components/ui/ConfirmModal'
import { useToast } from '@/components/ui/Toast'
import { useRouter } from 'next/navigation'
import { JerseyNumber } from '@/components/ui/JerseyNumber'
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2, X, Search, UserPlus, RefreshCw, Phone, Users, User, Check } from 'lucide-react'
import { NewPlayerSVG } from '@/components/ui/svg/NewPlayerSVG'
import { TransferPlayerSVG } from '@/components/ui/svg/TransferPlayerSVG'
import { formatPhoneNumber } from '@/lib/utils'

interface InteractivePlayerModalProps {
    isOpen: boolean
    onClose: () => void
    locale: string
    classId?: string
}

type Step = 'choice' | 'details' | 'team' | 'search' | 'success'

export function InteractivePlayerModal({ isOpen, onClose, locale, classId }: InteractivePlayerModalProps) {
    const [step, setStep] = useState<Step>('choice')
    const [mode, setMode] = useState<'new' | 'existing'>('new')
    const [loading, setLoading] = useState(false)
    const [classes, setClasses] = useState<any[]>([])
    const [successMessage, setSuccessMessage] = useState('')

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        jerseyNumber: '',
        gender: 'male' as 'male' | 'female',
        classId: classId || ''
    })

    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [searching, setSearching] = useState(false)

    const { confirm } = useConfirm()
    const { toast } = useToast()
    const router = useRouter()
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const refDataCache = useRef<{ data: any[]; ts: number } | null>(null)

    useEffect(() => {
        if (isOpen) {
            setStep('choice')
            setMode('new')
            setFormData({ name: '', phone: '', jerseyNumber: '', gender: 'male', classId: classId || '' })
            setSearchQuery('')
            setSearchResults([])
            setSuccessMessage('')
            loadClasses()
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'auto'
        }
        return () => { document.body.style.overflow = 'auto' }
    }, [isOpen, classId])

    useEffect(() => {
        if (step !== 'search' || searchQuery.length < 2) {
            setSearchResults([])
            return
        }
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(async () => {
            setSearching(true)
            const res = await searchTrainees(searchQuery)
            if (res.success) setSearchResults(res.trainees || [])
            setSearching(false)
        }, 300)
        return () => clearTimeout(debounceRef.current)
    }, [searchQuery, step])

    const loadClasses = async () => {
        if (refDataCache.current && Date.now() - refDataCache.current.ts < 5 * 60 * 1000) {
            setClasses(refDataCache.current.data)
            return
        }
        const res = await getEventRefData()
        if (res.success && res.classes) {
            refDataCache.current = { data: res.classes, ts: Date.now() }
            setClasses(res.classes)
        }
    }

    const handleNext = () => {
        if (step === 'choice') {
            setStep(mode === 'new' ? 'details' : 'search')
        } else if (step === 'details') {
            if (!formData.name.trim()) {
                toast('يرجى إدخال اسم اللاعب', 'error')
                return
            }
            if (classId || formData.classId) {
                handleSaveNew()
            } else {
                setStep('team')
            }
        }
    }

    const handleBack = () => {
        if (step === 'details' || step === 'search') setStep('choice')
        else if (step === 'team') setStep('details')
    }

    const handleSaveNew = async () => {
        const targetClassId = formData.classId || classId
        if (!targetClassId) {
            toast('يرجى اختيار فريق', 'error')
            return
        }
        setLoading(true)
        const res = await addTrainee({
            classId: targetClassId,
            name: formData.name.trim(),
            phone: formData.phone || undefined,
            jerseyNumber: formData.jerseyNumber ? (Number(formData.jerseyNumber) || null) : null,
            gender: formData.gender,
        })
        setLoading(false)
        if (res.success) {
            setSuccessMessage('تمت إضافة اللاعب بنجاح!')
            setStep('success')
            router.refresh()
        } else {
            toast(res.error || 'فشلت الإضافة', 'error')
        }
    }

    const handleTransfer = async (trainee: any) => {
        const targetClassId = classId
        if (!targetClassId) {
            toast('لا يمكن النقل بدون فريق', 'error')
            return
        }
        if (trainee.class_id === targetClassId) {
            toast('اللاعب موجود في هذا الفريق بالفعل', 'error')
            return
        }
        const confirmed = await confirm({
            title: 'نقل اللاعب',
            message: `هل أنت متأكد من نقل ${trainee.name_ar} إلى هذا الفريق؟`,
            confirmText: 'نقل',
            cancelText: 'إلغاء',
            variant: 'warning',
        })
        if (!confirmed) return
        setLoading(true)
        const res = await transferTrainee(trainee.id, targetClassId)
        setLoading(false)
        if (res.success) {
            setSuccessMessage('تم نقل اللاعب بنجاح!')
            setStep('success')
            router.refresh()
        } else {
            toast(res.error || 'فشل النقل', 'error')
        }
    }

    const getName = (item: any) => locale === 'he' ? (item.name_he || item.name_ar) : (item.name_ar || item.name_he)
    const getCategory = (item: any) => item.categories ? (locale === 'he' ? (item.categories.name_he || item.categories.name_ar) : (item.categories.name_ar || item.categories.name_he)) : null

    const avatarColors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500']

    const getSteps = (): string[] => {
        if (step === 'search' || step === 'success') return ['choice', 'search']
        if (classId) return ['choice', 'details']
        return ['choice', 'details', 'team']
    }

    const getStepIndex = () => {
        const steps = getSteps()
        if (step === 'success') return steps.length
        return steps.indexOf(step)
    }

    const slideVariants: any = {
        hidden: { opacity: 0, x: 50 },
        visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
        exit: { opacity: 0, x: -50, transition: { duration: 0.2 } }
    }

    if (typeof window === 'undefined') return null

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex flex-col justify-end sm:justify-center sm:items-center sm:p-6" dir="rtl">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
                        exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#0B132B]/80"
                    />

                    {/* Drawer — dark glass */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%', transition: { type: 'spring', bounce: 0, duration: 0.4 } }}
                        transition={{ type: 'spring', bounce: 0.1, duration: 0.5 }}
                        className="relative w-full max-w-lg bg-[#0B132B] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:h-[700px] shadow-float mt-auto border border-white/10"
                    >
                        {/* Header */}
                        <div className="bg-[#0B132B] p-8 text-white relative flex-shrink-0 border-b border-white/10">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-electric/15 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-[50px] translate-y-1/2 -translate-x-1/2" />

                            <div className="relative z-10 flex justify-between items-center mb-6">
                                <h2 className="text-3xl font-syncopate font-bold tracking-tight text-white">
                                    {step === 'success' ? 'تم!' : step === 'search' ? 'نقل لاعب' : 'إضافة لاعب'}
                                </h2>
                                <button onClick={onClose} aria-label="إغلاق" className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors active:scale-95">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {step !== 'success' && (
                                <div className="relative z-10 flex space-x-2 rtl:space-x-reverse">
                                    {getSteps().map((s, i) => (
                                        <div key={s} className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
                                            <motion.div
                                                initial={false}
                                                animate={{ width: getStepIndex() >= i ? '100%' : '0%' }}
                                                transition={{ duration: 0.4 }}
                                                className="h-full bg-electric"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative min-h-0">
                            <AnimatePresence mode="wait">
                                {/* CHOICE */}
                                {step === 'choice' && (
                                    <motion.div key="choice" variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-6">
                                        <h3 className="text-xl font-bold text-white/80 mb-2">كيف تريد إضافة اللاعب؟</h3>

                                        <motion.button
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => setMode('new')}
                                            className={`relative w-full h-32 rounded-[2rem] overflow-hidden p-5 flex flex-col justify-end transition-shadow ${mode === 'new' ? 'ring-4 ring-electric shadow-lg shadow-electric/20' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}
                                        >
                                            <div className={`absolute inset-0 ${mode === 'new' ? 'bg-gradient-to-br from-electric/20 to-blue-900/40' : 'bg-gradient-to-br from-white/5 to-transparent'}`} />
                                            <NewPlayerSVG className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" />
                                            <div className="relative z-10">
                                                <h4 className="text-3xl font-syncopate font-bold text-white">لاعب جديد</h4>
                                                <p className="text-white/50 font-outfit font-medium">تسجيل لاعب جديد تماماً</p>
                                            </div>
                                        </motion.button>

                                        {classId && (
                                            <motion.button
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => setMode('existing')}
                                                className={`relative w-full h-32 rounded-[2rem] overflow-hidden p-5 flex flex-col justify-end transition-shadow ${mode === 'existing' ? 'ring-4 ring-green-500 shadow-lg shadow-green-500/20' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}
                                            >
                                                <div className={`absolute inset-0 ${mode === 'existing' ? 'bg-gradient-to-br from-green-500/20 to-green-900/40' : 'bg-gradient-to-br from-white/5 to-transparent'}`} />
                                                <TransferPlayerSVG className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" />
                                                <div className="relative z-10">
                                                    <h4 className="text-3xl font-syncopate font-bold text-white">لاعب مسجّل</h4>
                                                    <p className="text-white/50 font-outfit font-medium">نقل لاعب من فريق آخر</p>
                                                </div>
                                            </motion.button>
                                        )}
                                    </motion.div>
                                )}

                                {/* DETAILS */}
                                {step === 'details' && (
                                    <motion.div key="details" variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-5 pb-10">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                                <span className="w-7 h-7 rounded-full bg-electric/20 text-electric text-sm flex items-center justify-center font-bold">1</span>
                                                بيانات اللاعب
                                            </h3>
                                            <button type="button" onClick={handleBack} className="sm:hidden text-sm font-bold text-white/40 hover:text-white/70 transition-colors flex items-center gap-1">
                                                <ArrowRight className="w-4 h-4" />
                                                رجوع
                                            </button>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5 mr-1">الاسم</label>
                                            <input
                                                autoFocus
                                                className="w-full bg-white/10 border border-white/10 rounded-2xl px-5 py-4 font-outfit text-base text-white/90 outline-none focus:border-white/30 transition-all placeholder:text-white/20"
                                                placeholder="مثال: محمد علي"
                                                value={formData.name}
                                                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5 mr-1">الهاتف</label>
                                                <input
                                                    type="tel"
                                                    className="w-full bg-white/10 border border-white/10 rounded-2xl px-5 py-4 font-outfit text-base text-white/90 outline-none focus:border-white/30 transition-all placeholder:text-white/20"
                                                    placeholder="05..."
                                                    value={formData.phone}
                                                    onChange={e => setFormData(p => ({ ...p, phone: formatPhoneNumber(e.target.value) }))}
                                                    dir="ltr"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5 mr-1">رقم القميص</label>
                                                <input
                                                    type="number"
                                                    className="w-full bg-white/10 border border-white/10 rounded-2xl px-5 py-4 font-outfit text-base text-white/90 outline-none focus:border-white/30 transition-all placeholder:text-white/20 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                                                    placeholder="7"
                                                    value={formData.jerseyNumber}
                                                    onChange={e => setFormData(p => ({ ...p, jerseyNumber: e.target.value }))}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5 mr-1">الجنس</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(p => ({ ...p, gender: 'male' }))}
                                                    className={`py-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] border ${formData.gender === 'male'
                                                        ? 'border-indigo-400/50 bg-indigo-500/15 text-indigo-300'
                                                        : 'border-white/8 bg-white/5 text-white/30'}`}
                                                >
                                                    ذكر
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(p => ({ ...p, gender: 'female' }))}
                                                    className={`py-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] border ${formData.gender === 'female'
                                                        ? 'border-pink-400/50 bg-pink-500/15 text-pink-300'
                                                        : 'border-white/8 bg-white/5 text-white/30'}`}
                                                >
                                                    أنثى
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* TEAM SELECTION */}
                                {step === 'team' && (
                                    <motion.div key="team" variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-4 pb-10">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                                <span className="w-7 h-7 rounded-full bg-electric/20 text-electric text-sm flex items-center justify-center font-bold">2</span>
                                                اختر الفريق
                                            </h3>
                                            <button type="button" onClick={handleBack} className="sm:hidden text-sm font-bold text-white/40 hover:text-white/70 transition-colors flex items-center gap-1">
                                                <ArrowRight className="w-4 h-4" />
                                                رجوع
                                            </button>
                                        </div>

                                        <TeamPicker
                                            classes={classes}
                                            selectedId={formData.classId}
                                            onSelect={(id: string) => setFormData(p => ({ ...p, classId: id }))}
                                            locale={locale}
                                            getName={getName}
                                            getCategory={getCategory}
                                            avatarColors={avatarColors}
                                        />
                                    </motion.div>
                                )}

                                {/* SEARCH EXISTING */}
                                {step === 'search' && (
                                    <motion.div key="search" variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-4 pb-10">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-base font-bold text-white">ابحث عن اللاعب</h3>
                                            <button type="button" onClick={handleBack} className="text-sm font-bold text-white/40 hover:text-white/70 transition-colors flex items-center gap-1">
                                                <ArrowRight className="w-4 h-4" />
                                                رجوع
                                            </button>
                                        </div>

                                        <div className="relative">
                                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                                            <input
                                                autoFocus
                                                type="text"
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                placeholder="ابحث بالاسم أو رقم الهاتف..."
                                                className="w-full bg-white/10 border border-white/10 rounded-xl pr-10 pl-4 py-3 text-sm text-white/90 outline-none focus:border-white/30 transition-all placeholder:text-white/20"
                                                dir="rtl"
                                            />
                                            {searching && <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-electric" />}
                                        </div>

                                        <div className="max-h-[300px] overflow-y-auto rounded-2xl border border-white/10 divide-y divide-white/5 bg-white/5">
                                            {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                                                <div className="py-8 text-center text-sm text-white/30">لا توجد نتائج</div>
                                            )}
                                            {searchQuery.length < 2 && (
                                                <div className="py-8 text-center text-sm text-white/30">اكتب حرفين على الأقل</div>
                                            )}
                                            {searchResults.map((trainee) => {
                                                const isSameTeam = trainee.class_id === classId
                                                return (
                                                    <button
                                                        key={trainee.id}
                                                        type="button"
                                                        onClick={() => !isSameTeam && handleTransfer(trainee)}
                                                        disabled={loading || isSameTeam}
                                                        className={`w-full flex items-center gap-3 px-4 py-3 text-right transition-colors active:scale-[0.99] touch-manipulation ${isSameTeam ? 'opacity-40' : 'hover:bg-white/10'}`}
                                                    >
                                                        <JerseyNumber number={trainee.jersey_number} gender={trainee.gender} className="w-10 h-10 text-sm flex-shrink-0" />
                                                        <div className="flex-1 min-w-0 text-right">
                                                            <p className="font-bold text-sm text-white leading-tight">{trainee.name_ar}</p>
                                                            <div className="flex items-center gap-2 mt-0.5 flex-row-reverse justify-end">
                                                                {trainee.phone && (
                                                                    <span className="flex items-center gap-1 text-[11px] text-white/40">
                                                                        <Phone className="w-3 h-3" />
                                                                        <span dir="ltr">{trainee.phone}</span>
                                                                    </span>
                                                                )}
                                                                {trainee.classes && (
                                                                    <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                                                                        {trainee.classes.name_ar}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {isSameTeam ? (
                                                            <span className="text-[10px] font-bold text-white/30 bg-white/10 px-2 py-1 rounded-full shrink-0">في الفريق</span>
                                                        ) : (
                                                            <RefreshCw className="w-4 h-4 text-electric shrink-0" />
                                                        )}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </motion.div>
                                )}

                                {/* SUCCESS */}
                                {step === 'success' && (
                                    <motion.div key="success" variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col items-center justify-center h-full text-center gap-6 py-8">
                                        <div className="relative">
                                            <div className="absolute inset-0 rounded-full blur-xl bg-green-400/30" />
                                            <div className="relative w-28 h-28 rounded-full flex items-center justify-center border-4 border-white/20 shadow-xl bg-gradient-to-br from-green-400 to-emerald-600">
                                                <CheckCircle2 className="w-12 h-12 text-white" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-syncopate font-black text-white mb-2">{successMessage}</h3>
                                            {formData.name && (
                                                <p className="text-white/50 font-outfit font-medium">{formData.name} أصبح الآن عضواً في الفريق</p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Sticky Footer */}
                        <div className="p-5 bg-[#0B132B] border-t border-white/10 shrink-0 flex items-center justify-between z-20" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))' }}>
                            {step !== 'choice' && step !== 'success' && step !== 'search' ? (
                                <motion.button whileTap={{ scale: 0.95 }} onClick={handleBack} className="flex hidden items-center justify-center w-14 h-14 rounded-2xl border-2 border-white/10 text-white/50 hover:bg-white/10 sm:flex shrink-0">
                                    <ArrowRight className="w-6 h-6" />
                                </motion.button>
                            ) : step === 'success' ? null : <div className="w-14" />}

                            {step !== 'success' && step !== 'search' && (
                                <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    onClick={step === 'team' ? handleSaveNew : handleNext}
                                    disabled={loading || (step === 'team' && !formData.classId)}
                                    className={`flex-1 ml-4 sm:ml-0 h-14 rounded-2xl font-bold text-lg text-white shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-40 ${
                                        mode === 'existing' ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/30' : 'bg-gradient-to-r from-electric to-blue-600 shadow-electric/30'
                                    }`}
                                >
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" />
                                        : step === 'team' ? 'إضافة اللاعب'
                                        : step === 'details' && classId ? 'إضافة اللاعب'
                                        : 'متابعة'}
                                    {!loading && step === 'choice' && <ArrowLeft className="w-5 h-5" />}
                                    {!loading && step === 'details' && !classId && <ArrowLeft className="w-5 h-5" />}
                                </motion.button>
                            )}

                            {step === 'success' && (
                                <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    onClick={onClose}
                                    className="flex-1 h-14 rounded-2xl font-bold text-lg text-white shadow-lg flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/30"
                                >
                                    إغلاق
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}

function TeamPicker({ classes, selectedId, onSelect, locale, getName, getCategory, avatarColors }: {
    classes: any[]
    selectedId: string
    onSelect: (id: string) => void
    locale: string
    getName: (item: any) => string
    getCategory: (item: any) => string | null
    avatarColors: string[]
}) {
    const [query, setQuery] = useState('')
    const filtered = query.trim()
        ? classes.filter((c: any) => {
            const name = getName(c)?.toLowerCase() || ''
            const cat = getCategory(c)?.toLowerCase() || ''
            return name.includes(query.toLowerCase()) || cat.includes(query.toLowerCase())
        })
        : classes

    return (
        <div className="flex flex-col gap-2">
            <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="ابحث عن فريق..."
                    className="w-full bg-white/10 border border-white/10 rounded-xl pr-10 pl-4 py-3 text-sm text-white/90 outline-none focus:border-white/30 transition-all placeholder:text-white/20"
                    dir="rtl"
                />
            </div>
            <div className="max-h-[250px] overflow-y-auto rounded-2xl border border-white/10 divide-y divide-white/5 bg-white/5">
                {filtered.length === 0 && (
                    <div className="py-6 text-center text-sm text-white/30">لا توجد نتائج</div>
                )}
                {filtered.map((item: any, idx: number) => {
                    const isSelected = selectedId === item.id
                    const label = getName(item)
                    const category = getCategory(item)
                    const initials = label?.trim().split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase() || '?'
                    const avatarColor = avatarColors[idx % avatarColors.length]
                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => onSelect(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-right transition-colors active:scale-[0.99] touch-manipulation ${isSelected ? 'bg-electric/15' : 'hover:bg-white/10'}`}
                        >
                            <div className={`w-9 h-9 rounded-full ${avatarColor}/20 border ${avatarColor.replace('bg-', 'border-')}/30 flex items-center justify-center shrink-0 text-xs font-bold ${avatarColor.replace('bg-', 'text-').replace('-500', '-300')}`}>
                                {initials}
                            </div>
                            <div className="flex-1 min-w-0 text-right">
                                <p className={`font-bold text-sm leading-tight ${isSelected ? 'text-electric' : 'text-white'}`}>{label}</p>
                                {category && (
                                    <span className="inline-block mt-0.5 text-[10px] font-bold text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded-full">{category}</span>
                                )}
                            </div>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-electric shrink-0" />}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
