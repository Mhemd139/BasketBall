import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, User, MapPin, Save, Loader2, Trash2, AlertTriangle } from 'lucide-react'
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

export function CreateTeamModal({ isOpen, onClose, locale, isEdit, initialData }: CreateTeamModalProps) {
    const { toast } = useToast()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [refData, setRefData] = useState<{ trainers: any[], halls: any[] }>({ trainers: [], halls: [] })
    const [formData, setFormData] = useState({
        name: initialData?.name_ar || initialData?.name_he || '',
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
                    name: initialData.name_ar || initialData.name_he || '',
                    trainer_id: initialData.trainer_id || '',
                    hall_id: initialData.hall_id || ''
                })
            } else {
                setFormData({ name: '', trainer_id: '', hall_id: '' })
            }
        }
    }, [isOpen, isEdit, initialData])

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast(locale === 'he' ? 'נא להזין שם לקבוצה' : 'يرجى إدخال اسم الفريق', 'warning')
            return
        }

        setLoading(true)
        const payload = {
            name_en: formData.name,
            name_ar: formData.name,
            name_he: formData.name,
            trainer_id: formData.trainer_id || null,
            hall_id: formData.hall_id || null
        }

        const res = isEdit && initialData?.id
            ? await updateTeam(initialData.id, payload)
            : await createTeam(payload)

        if (res.success) {
            toast(isEdit ? (locale === 'he' ? 'הקבוצה עודכנה בהצלחה' : 'تم تحديث الفريق بنجاح') : (locale === 'he' ? 'הקבוצה נוצרה בהצלחה' : 'تم إنشاء الفريق بنجاح'), 'success')
            onClose()
            setStep(1)
            setFormData({ name: '', trainer_id: '', hall_id: '' })
        } else {
            toast(res.error || (locale === 'he' ? 'הפעולה נכשלה' : 'فشلت العملية'), 'error')
        }
        setLoading(false)
    }

    const handleDelete = async () => {
        if (!initialData?.id) return
        setLoading(true)
        const res = await deleteTeam(initialData.id)
        if (res.success) {
            toast(locale === 'he' ? 'הקבוצה נמחקה בהצלחה' : 'تم حذف الفريق بنجاح', 'success')
            onClose()
        } else {
            toast(res.error || (locale === 'he' ? 'מחיקת הקבוצה נכשלה' : 'فشل حذف الفريق'), 'error')
        }
        setLoading(false)
    }

    if (!isOpen) return null

    const getName = (item: any) => locale === 'he' ? (item.name_he || item.name_ar) : (item.name_ar || item.name_he)

    return (
        <Portal>
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
                className="relative w-full max-w-lg bg-[#0B132B]/90 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 ring-1 ring-white/5"
                dir="rtl"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 drop-shadow-sm">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white drop-shadow-md">
                                {isEdit
                                    ? (locale === 'he' ? 'עריכת קבוצה' : 'تعديل الفريق')
                                    : (locale === 'he' ? 'יצירת קבוצה חדשה' : 'إنشاء فريق جديد')}
                            </h2>
                            <p className="text-[10px] uppercase font-bold text-indigo-200/50 tracking-wider">
                                {step === 1
                                    ? (locale === 'he' ? 'שלב 1: מידע בסיסי' : 'الخطوة 1: المعلومات الأساسية')
                                    : (locale === 'he' ? 'שלב 2: הקצאה' : 'الخطوة 2: التعيين')}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isEdit && (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="p-2 hover:bg-red-500/20 rounded-xl transition-colors text-red-400"
                                title={locale === 'he' ? 'מחק קבוצה' : 'حذف الفريق'}
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/50 hover:text-white">
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
                            <h3 className="text-xl font-black text-slate-900 mb-2">
                                {locale === 'he' ? 'האם אתה בטוח שברצונך למחוק קבוצה זו?' : 'هل أنت متأكد من حذف هذا الفريق؟'}
                            </h3>
                            <p className="text-sm text-slate-500 mb-8 max-w-[250px]">
                                {locale === 'he' ? 'כל הנתונים המקושרים לקבוצה יימחקו לצמיתות.' : 'سيتم حذف جميع البيانات المرتبطة بالفريق نهائياً.'}
                            </p>
                            <div className="flex gap-4 w-full">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold transition-all"
                                >
                                    {locale === 'he' ? 'ביטול' : 'إلغاء'}
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-red-100"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    {locale === 'he' ? 'מחק' : 'حذف'}
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
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-black text-indigo-200/50 px-1 tracking-widest flex items-center gap-2">
                                        <Users className="w-3.5 h-3.5 text-indigo-400" /> {locale === 'he' ? 'שם הקבוצה' : 'اسم الفريق'}
                                    </label>
                                    <input
                                        value={formData.name}
                                        onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                        placeholder={locale === 'he' ? 'לדוגמה: נוער נבחרת' : 'مثال: تحت الـ 14 نخبة'}
                                        className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:bg-white/10 focus:border-indigo-500 outline-none transition-all font-bold text-white placeholder-indigo-200/30 text-right"
                                        dir="rtl"
                                        autoFocus
                                    />
                                </div>
                                <button
                                    onClick={() => setStep(2)}
                                    className="w-full btn btn-primary py-4 text-sm"
                                >
                                    {locale === 'he' ? 'המשך' : 'متابعة'}
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
                                        <label className="text-sm font-bold text-indigo-100/70 px-1 flex items-center gap-2">
                                            <User className="w-4 h-4 text-indigo-400 drop-shadow-sm" /> {locale === 'he' ? 'מאמן ראשי' : 'تعيين المدرب الرئيسي'}
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {refData.trainers.map(trainer => (
                                                <button
                                                    key={trainer.id}
                                                    onClick={() => setFormData(p => ({ ...p, trainer_id: trainer.id }))}
                                                    className={`p-4 rounded-2xl text-sm font-bold transition-all border flex items-center gap-3 ${
                                                        formData.trainer_id === trainer.id
                                                        ? 'border-indigo-400 bg-indigo-500/30 text-white shadow-inner'
                                                        : 'border-white/10 bg-white/5 text-indigo-100/70 hover:border-white/20 hover:bg-white/10'
                                                    }`}
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <span className="truncate">{getName(trainer)}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-indigo-100/70 px-1 flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-emerald-400 drop-shadow-sm" /> {locale === 'he' ? 'אולם ראשי' : 'القاعة الرئيسية'}
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {refData.halls.map(hall => (
                                                <button
                                                    key={hall.id}
                                                    onClick={() => setFormData(p => ({ ...p, hall_id: hall.id }))}
                                                    className={`p-4 rounded-2xl text-sm font-bold transition-all border flex items-center gap-3 ${
                                                        formData.hall_id === hall.id
                                                        ? 'border-emerald-400 bg-emerald-500/30 text-white shadow-inner'
                                                        : 'border-white/10 bg-white/5 text-indigo-100/70 hover:border-white/20 hover:bg-white/10'
                                                    }`}
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                                        <MapPin className="w-4 h-4" />
                                                    </div>
                                                    <span className="truncate">{getName(hall)}</span>
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
                                        {locale === 'he' ? 'חזור' : 'رجوع'}
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="btn btn-primary flex-[2] py-4"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        {isEdit
                                            ? (locale === 'he' ? 'שמור שינויים' : 'حفظ التغييرات')
                                            : (locale === 'he' ? 'צור קבוצה' : 'إنشاء الفريق')}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
        </Portal>
    )
}
