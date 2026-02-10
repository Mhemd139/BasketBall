import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, User, MapPin, Save, Loader2, Globe, Languages, Trash2, AlertTriangle } from 'lucide-react'
import { getEventRefData, createTeam, updateTeam, deleteTeam } from '@/app/actions'

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

export function CreateTeamModal({ isOpen, onClose, locale, isEdit, initialData }: CreateTeamModalProps) {
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [refData, setRefData] = useState<{ trainers: any[], halls: any[] }>({ trainers: [], halls: [] })
    const [formData, setFormData] = useState({
        name_en: initialData?.name_en || '',
        name_ar: initialData?.name_ar || '',
        name_he: initialData?.name_he || '',
        trainer_id: initialData?.trainer_id || '',
        hall_id: initialData?.hall_id || ''
    })

    useEffect(() => {
        if (isOpen) {
            const fetchRefData = async () => {
                const res = await getEventRefData()
                if (res.success) {
                    setRefData({ 
                        trainers: res.trainers || [], 
                        halls: res.halls || [] 
                    })
                }
            }
            fetchRefData()

            if (isEdit && initialData) {
                setFormData({
                    name_en: initialData.name_en,
                    name_ar: initialData.name_ar,
                    name_he: initialData.name_he,
                    trainer_id: initialData.trainer_id || '',
                    hall_id: initialData.hall_id || ''
                })
            } else {
                setFormData({ name_en: '', name_ar: '', name_he: '', trainer_id: '', hall_id: '' })
            }
        }
    }, [isOpen, isEdit, initialData])

    const handleSubmit = async () => {
        if (!formData.name_en || !formData.name_ar || !formData.name_he) {
            alert('يرجى ملء جميع الأسماء')
            return
        }

        setLoading(true)
        const payload = {
            name_en: formData.name_en,
            name_ar: formData.name_ar,
            name_he: formData.name_he,
            trainer_id: formData.trainer_id || null,
            hall_id: formData.hall_id || null
        }

        const res = isEdit && initialData?.id 
            ? await updateTeam(initialData.id, payload)
            : await createTeam(payload)

        if (res.success) {
            onClose()
            setStep(1)
            setFormData({ name_en: '', name_ar: '', name_he: '', trainer_id: '', hall_id: '' })
        } else {
            alert(res.error || 'فشلت العملية')
        }
        setLoading(false)
    }

    const handleDelete = async () => {
        if (!initialData?.id) return
        setLoading(true)
        const res = await deleteTeam(initialData.id)
        if (res.success) {
            onClose()
        } else {
            alert(res.error || 'فشل حذف الفريق')
        }
        setLoading(false)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
                dir="rtl"
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900">
                                {isEdit 
                                    ? 'تعديل الفريق'
                                    : 'إنشاء فريق جديد'}
                            </h2>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                {step === 1 ? 'الخطوة 1: المعلومات الأساسية' : 'الخطوة 2: التعيين'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isEdit && (
                            <button 
                                onClick={() => setShowDeleteConfirm(true)}
                                className="p-2 hover:bg-red-50 rounded-xl transition-colors text-red-400"
                                title="حذف الفريق"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Delete Confirmation Overlay */}
                <AnimatePresence>
                    {showDeleteConfirm && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 bg-white/95 flex flex-col items-center justify-center p-8 text-center"
                        >
                            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-6 animate-bounce">
                                <AlertTriangle className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">{'هل أنت متأكد من حذف هذا الفريق؟'}</h3>
                            <p className="text-sm text-slate-500 mb-8 max-w-[250px]">
                                {'سيتم حذف جميع البيانات المرتبطة بالفريق نهائياً.'}
                            </p>
                            <div className="flex gap-4 w-full">
                                <button 
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold transition-all"
                                >
                                    {'إلغاء'}
                                </button>
                                <button 
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-red-100"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    {'حذف'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Content */}
                <div className="p-8">
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div 
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase font-black text-slate-400 px-1 tracking-widest flex items-center gap-2">
                                            <Globe className="w-3.5 h-3.5" /> {'الاسم (انجليزي)'}
                                        </label>
                                        <input 
                                            value={formData.name_en}
                                            onChange={(e) => setFormData(p => ({ ...p, name_en: e.target.value }))}
                                            placeholder="e.g. Under 14 Elite"
                                            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-slate-900"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase font-black text-slate-400 px-1 tracking-widest flex items-center gap-2">
                                            <Languages className="w-3.5 h-3.5 text-emerald-500" /> بالعربية
                                        </label>
                                        <input 
                                            value={formData.name_ar}
                                            onChange={(e) => setFormData(p => ({ ...p, name_ar: e.target.value }))}
                                            placeholder="مثال: تحت الـ 14 نخبة"
                                            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500 outline-none transition-all font-bold text-slate-900 text-right"
                                            dir="rtl"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase font-black text-slate-400 px-1 tracking-widest flex items-center gap-2">
                                            <Languages className="w-3.5 h-3.5 text-orange-500" /> עברית
                                        </label>
                                        <input 
                                            value={formData.name_he}
                                            onChange={(e) => setFormData(p => ({ ...p, name_he: e.target.value }))}
                                            placeholder="לדוגמה: מתחת לגיל 14 עילית"
                                            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-900 text-right"
                                            dir="rtl"
                                        />
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setStep(2)}
                                    className="w-full btn btn-primary py-4 text-sm"
                                >
                                    {'متابعة'}
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="step2"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 px-1 flex items-center gap-2">
                                            <User className="w-4 h-4 text-indigo-500" /> {'تعيين المدرب الرئيسي'}
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {refData.trainers.map(trainer => (
                                                <button
                                                    key={trainer.id}
                                                    onClick={() => setFormData(p => ({ ...p, trainer_id: trainer.id }))}
                                                    className={`p-4 rounded-2xl text-sm font-bold transition-all border-2 flex items-center gap-3 ${
                                                        formData.trainer_id === trainer.id
                                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                                        : 'border-slate-50 bg-white text-slate-500 hover:border-slate-200 shadow-sm'
                                                    }`}
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <span className="truncate">{trainer.name_en}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 px-1 flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-emerald-500" /> {'القاعة الرئيسية'}
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {refData.halls.map(hall => (
                                                <button
                                                    key={hall.id}
                                                    onClick={() => setFormData(p => ({ ...p, hall_id: hall.id }))}
                                                    className={`p-4 rounded-2xl text-sm font-bold transition-all border-2 flex items-center gap-3 ${
                                                        formData.hall_id === hall.id
                                                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                                                        : 'border-slate-50 bg-white text-slate-500 hover:border-slate-200 shadow-sm'
                                                    }`}
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                                        <MapPin className="w-4 h-4" />
                                                    </div>
                                                    <span className="truncate">{hall.name_en}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => setStep(1)}
                                        className="btn btn-secondary flex-1 py-4"
                                    >
                                        {'رجوع'}
                                    </button>
                                    <button 
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="btn btn-primary flex-[2] py-4"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        {isEdit ? 'حفظ التغييرات' : 'إنشاء الفريق'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    )
}
