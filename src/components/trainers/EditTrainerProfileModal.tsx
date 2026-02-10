'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, AlertCircle, Trash2, Phone, User, Calendar } from 'lucide-react'
import { updateTrainerDetails, deleteAccount } from '@/app/actions'
import { formatPhoneNumber } from '@/lib/utils'

interface EditTrainerProfileModalProps {
    isOpen: boolean
    onClose: () => void
    trainer: any
    locale: string
    mode?: 'all' | 'personal' | 'schedule'
}

export function EditTrainerProfileModal({ isOpen, onClose, trainer, locale, mode = 'all' }: EditTrainerProfileModalProps) {
    const [name, setName] = useState(trainer.name_en || '')
    const [phone, setPhone] = useState(trainer.phone || '')
    const [gender, setGender] = useState<'male' | 'female'>(trainer.gender || 'male')
    const [availability, setAvailability] = useState<string[]>(trainer.availability || [])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [confirmDelete, setConfirmDelete] = useState(false)
    const router = useRouter()

    // Reset state when opening/changing mode
    useEffect(() => {
        if (isOpen) {
            // Try to find the best name match based on locale, fallback to name_en
            const localizedName = trainer.name_ar || ''
            setName(localizedName)
            
            setPhone(trainer.phone || '')
            setGender(trainer.gender || 'male')
            setAvailability(trainer.availability || [])
            setError('')
            setConfirmDelete(false)
        }
    }, [isOpen, trainer, locale])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            // Only send fields relevant to the current mode
            const updateData: any = {}
            
            if (mode === 'all' || mode === 'personal') {
                updateData.name_en = name
                updateData.name_ar = name
                updateData.name_he = name
                updateData.phone = phone
                updateData.gender = gender
            }
            
            if (mode === 'all' || mode === 'schedule') {
                updateData.availability = availability
            }

            const res = await updateTrainerDetails(trainer.id, updateData)

            if (res.success) {
                // Force a hard refresh of the data
                router.refresh()
                // Small delay to allow revalidation to propagate
                setTimeout(() => {
                    onClose()
                }, 100)
            } else {
                setError(res.error || 'فشل التحديث')
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirmDelete) {
            setConfirmDelete(true)
            return
        }

        setLoading(true)
        setError('')
        try {
            const res = await deleteAccount()
            if (res.success) {
                router.push(`/${locale}`)
                router.refresh()
            } else {
                setError(res.error || 'فشل حذف الحساب')
                setLoading(false)
            }
        } catch (err: any) {
            setError(err.message)
            setLoading(false)
        }
    }

    const toggleDay = (day: string) => {
        if (availability.includes(day)) {
            setAvailability(availability.filter(d => d !== day))
        } else {
            setAvailability([...availability, day])
        }
    }

    const days = [
        { id: 'Sunday', label: 'الأحد' },
        { id: 'Monday', label: 'الإثنين' },
        { id: 'Tuesday', label: 'الثلاثاء' },
        { id: 'Wednesday', label: 'الأربعاء' },
        { id: 'Thursday', label: 'الخميس' },
        { id: 'Friday', label: 'الجمعة' },
        { id: 'Saturday', label: 'السبت' },
    ]
    
    // Dynamic titles based on mode
    const title = mode === 'schedule' 
        ? 'تعديل الجدول'
        : 'الملف الشخصي'

    const subtitle = mode === 'schedule'
        ? 'حدد الأيام التي تكون فيها متاحاً للتدريب'
        : 'قم بتحديث معلوماتك الشخصية'

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px] bg-white border-0 shadow-2xl rounded-[32px] p-0 overflow-hidden outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] duration-300">
                {/* Header - Clean & Modern */}
                <div className="pt-8 pb-2 px-6 text-center">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-[800] text-transparent bg-clip-text bg-gradient-to-br from-navy-900 via-indigo-800 to-indigo-600 tracking-tight animate-in slide-in-from-top-2 fade-in duration-500 delay-100 flex items-center justify-center gap-2">
                             {mode === 'schedule' && <Calendar className="w-6 h-6 text-indigo-600" />}
                             {(mode === 'personal' || mode === 'all') && <User className="w-6 h-6 text-indigo-600" />}
                             {title}
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-xs text-gray-400 font-medium mt-1 animate-in slide-in-from-top-1 fade-in duration-500 delay-150">
                        {subtitle}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-7">
                    
                    {/* Input Group */}
                    <div className="space-y-5">
                        
                        {/* Personal Info Fields */}
                        {(mode === 'all' || mode === 'personal') && (
                        <>
                        {/* Name Input - Soft & Tactile */}
                        <div className="space-y-2 animate-in slide-in-from-bottom-2 fade-in duration-500 delay-200">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
                                {'الاسم'}
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-0 text-navy-900 font-bold text-sm focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all duration-300 placeholder:text-gray-300 shadow-sm hover:shadow-md focus:shadow-lg focus:-translate-y-0.5"
                                placeholder="اسم المدرب"
                            />
                        </div>

                        {/* Phone Input */}
                        <div className="space-y-2 animate-in slide-in-from-bottom-2 fade-in duration-500 delay-250">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
                                {'رقم الهاتف'}
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                                    className="w-full pl-11 pr-5 py-3.5 rounded-2xl bg-gray-50 border-0 text-navy-900 font-bold text-sm focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all duration-300 placeholder:text-gray-300 shadow-sm hover:shadow-md focus:shadow-lg focus:-translate-y-0.5"
                                    placeholder="05..."
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        {/* Gender Toggle - iOS Style */}
                        <div className="space-y-2 animate-in slide-in-from-bottom-2 fade-in duration-500 delay-300">
                             <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
                                {'الجنس'}
                            </label>
                            <div className="flex bg-gray-50 p-1.5 rounded-2xl relative cursor-pointer group">
                                <div 
                                    className={`absolute inset-y-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${
                                        gender === 'female' ? 'left-1.5' : 'right-1.5'
                                    }`} 
                                />
                                <button
                                    type="button"
                                    onClick={() => setGender('male')}
                                    className={`flex-1 relative z-10 py-2.5 rounded-xl text-xs font-bold transition-colors duration-300 active:scale-95 ${gender === 'male' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {'ذكر'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setGender('female')}
                                    className={`flex-1 relative z-10 py-2.5 rounded-xl text-xs font-bold transition-colors duration-300 active:scale-95 ${gender === 'female' ? 'text-pink-600' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {'أنثى'}
                                </button>
                            </div>
                        </div>
                        </>
                        )}

                        {/* Availability - Modern Pills */}
                        {(mode === 'all' || mode === 'schedule') && (
                        <div className="space-y-3 animate-in slide-in-from-bottom-2 fade-in duration-500 delay-500">
                            <div className="flex justify-between items-end px-1">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                    {'أيام التدريب'}
                                </label>
                                <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full transition-all duration-300 ${
                                    availability.length > 0 ? 'text-indigo-500 bg-indigo-50 scale-100' : 'text-gray-300 bg-gray-50 scale-90 opacity-50'
                                }`}>
                                    {availability.length} {'نشط'}
                                </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                                {days.map((day, i) => (
                                    <button
                                        type="button"
                                        key={day.id}
                                        onClick={() => toggleDay(day.id)}
                                        style={{ animationDelay: `${500 + (i * 50)}ms` }}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 border-2 active:scale-90 animate-in zoom-in-50 fade-in fill-mode-backwards ${
                                            availability.includes(day.id) 
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-0.5' 
                                            : 'bg-white border-gray-50 text-gray-400 hover:border-indigo-100 hover:text-indigo-500 hover:bg-indigo-50/10'
                                        }`}
                                    >
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        )}
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50/50 backdrop-blur border border-red-100/50 text-red-600 rounded-2xl text-xs font-medium flex items-center gap-3 animate-in slide-in-from-top-2 fade-in duration-300">
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                <AlertCircle className="w-4 h-4" />
                            </div>
                            {error}
                        </div>
                    )}

                    <div className="pt-2 flex flex-col gap-3 animate-in slide-in-from-bottom-2 fade-in duration-500 delay-700">
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full bg-navy-900 text-white py-4 font-bold rounded-2xl shadow-xl shadow-navy-900/10 hover:shadow-navy-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex justify-center items-center gap-2.5 text-sm overflow-hidden relative"
                        >
                            <div className={`flex items-center gap-2 transition-all duration-300 ${loading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                                <CheckCircle2 className="w-4 h-4" />
                                {'حفظ التغييرات'}
                            </div>
                            <div className={`absolute inset-0 flex items-center justify-center gap-2 transition-all duration-300 ${loading ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>{'جاري الحفظ...'}</span>
                            </div>
                        </button>
                        
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="w-full py-3 font-bold rounded-2xl text-gray-400 text-xs hover:bg-gray-50 hover:text-gray-600 transition-colors active:scale-95"
                        >
                            {'إلغاء'}
                        </button>
                    </div>

                    
                    {/* Delete Account - Minimal & Hidden-ish - Only show in 'all' or 'personal' */}
                    {(mode === 'all' || mode === 'personal') && (
                    <div className="flex justify-center pt-2 animate-in fade-in duration-1000 delay-1000">
                        <button
                            type="button"
                            onClick={handleDelete}
                            className={`group flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                                confirmDelete 
                                ? 'bg-red-50 text-red-600 ring-2 ring-red-100 shadow-lg shadow-red-100/50' 
                                : 'text-gray-300 hover:text-red-400 hover:bg-red-50/30'
                            }`}
                        >
                            {confirmDelete ? (
                                <>
                                    <Loader2 className={`w-3 h-3 ${loading ? 'animate-spin' : 'hidden'}`} />
                                    <span className="text-[10px] font-bold">{'تأكيد الحذف'}</span>
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                                    <span className="text-[10px] font-bold">{'حذف الحساب'}</span>
                                </>
                            )}
                        </button>
                    </div>
                    )}

                </form>
            </DialogContent>
        </Dialog>
    )
}
