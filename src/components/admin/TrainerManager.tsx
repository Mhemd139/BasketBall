'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Phone, Trash2, Plus, Search, ShieldCheck, X, Loader2, Save, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { deleteTrainer, upsertTrainer } from '@/app/actions'
import Link from 'next/link'

interface Trainer {
  id: string
  name_en: string | null
  name_ar: string | null
  phone: string | null
  role?: string
}

export default function TrainerManager({ initialTrainers, locale = 'ar' }: { initialTrainers: Trainer[], locale?: string }) {
  const [trainers, setTrainers] = useState<Trainer[]>(initialTrainers)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const { toast } = useToast()

  // Add Trainer Form State
  const [newPhone, setNewPhone] = useState('')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<'trainer' | 'headcoach'>('trainer')
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Trainer | null>(null)

  const filteredTrainers = trainers.filter(t =>
    (t.name_ar?.toLowerCase() || t.name_en?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (t.phone || '').includes(searchQuery)
  )

  const handleDelete = async () => {
    if (!deleteTarget) return

    setIsLoading(true)
    try {
        const res = await deleteTrainer(deleteTarget.id)
        if (res.success) {
            setTrainers(trainers.filter(t => t.id !== deleteTarget.id))
            toast('تم حذف المدرب بنجاح', 'success')
            router.refresh()
        } else {
            toast(res.error || 'فشل الحذف', 'error')
        }
    } finally {
        setIsLoading(false)
        setDeleteTarget(null)
    }
  }

  const resetForm = () => {
    setNewPhone('')
    setNewName('')
    setNewRole('trainer')
    setError('')
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
        const res = await upsertTrainer(newPhone, newName, newRole)
        if (res.success) {
            // Optimistic update — add to local state so UI updates immediately
            let cleanPhone = newPhone.replace(/\D/g, '')
            if (cleanPhone.startsWith('05')) {
                cleanPhone = '972' + cleanPhone.substring(1)
            }
            const existing = trainers.find(t => t.phone === cleanPhone)
            if (existing) {
                setTrainers(trainers.map(t => t.phone === cleanPhone
                    ? { ...t, name_ar: newName, name_en: newName, role: newRole }
                    : t
                ))
            } else {
                setTrainers([...trainers, {
                    id: crypto.randomUUID(),
                    name_ar: newName,
                    name_en: newName,
                    phone: cleanPhone,
                    role: newRole,
                }])
            }
            setIsAddModalOpen(false)
            resetForm()
            toast('تمت إضافة المدرب بنجاح', 'success')
            router.refresh()
        } else {
            setError(res.error || 'فشل في إضافة المدرب')
        }
    } catch {
        setError('حدث خطأ ما')
    } finally {
        setIsLoading(false)
    }
  }

  const isHeadCoach = (trainer: Trainer) => trainer.role === 'headcoach'

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96 group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
            <input
                type="text"
                placeholder="بحث عن مدرب..."
                className="w-full pl-4 pr-12 py-3 bg-white/50 backdrop-blur-md border border-white/20 rounded-2xl shadow-sm focus:shadow-lg focus:shadow-amber-500/10 focus:border-amber-500/50 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>

        <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
            <Plus className="w-5 h-5" />
            <span>إضافة مدرب جديد</span>
        </button>
      </div>

      {/* Trainers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
            {filteredTrainers.map((trainer, index) => (
                <motion.div
                    key={trainer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                >
                    <Card className="relative overflow-hidden border-0 bg-white/60 backdrop-blur-xl shadow-xl rounded-3xl group hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/0 pointer-events-none" />

                        {/* Top accent — amber for headcoach, indigo for trainer */}
                        <div className={`absolute top-0 left-0 w-full h-1 ${
                            isHeadCoach(trainer)
                                ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                                : 'bg-gradient-to-r from-indigo-400 to-blue-500'
                        }`} />

                        <div className="absolute inset-0 border border-white/40 rounded-3xl pointer-events-none" />

                        <div className="p-6 relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-2xl shadow-inner ${
                                    isHeadCoach(trainer)
                                        ? 'bg-gradient-to-br from-amber-50 to-orange-50'
                                        : 'bg-gradient-to-br from-indigo-50 to-blue-50'
                                }`}>
                                    {isHeadCoach(trainer)
                                        ? <ShieldCheck className="w-6 h-6 text-amber-600" />
                                        : <User className="w-6 h-6 text-indigo-600" />
                                    }
                                </div>
                                <button
                                    onClick={() => setDeleteTarget(trainer)}
                                    disabled={isLoading}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            <Link href={`/${locale}/trainers/${trainer.id}`} className="block group/link">
                                <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover/link:text-indigo-600 transition-colors">
                                    {trainer.name_ar || trainer.name_en || 'بدون اسم'}
                                </h3>

                                <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-4" dir="ltr">
                                    <Phone className="w-4 h-4" />
                                    {trainer.phone?.startsWith('972') ? '0' + trainer.phone.slice(3) : trainer.phone}
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                                        isHeadCoach(trainer)
                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                            : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                    }`}>
                                        {isHeadCoach(trainer) ? (
                                            <><ShieldCheck className="w-3 h-3" /> رئيس المدربين</>
                                        ) : (
                                            <><User className="w-3 h-3" /> مدرب</>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </Card>
                </motion.div>
            ))}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
            <>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setDeleteTarget(null)}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="fixed inset-0 m-auto w-full max-w-sm h-fit p-4 z-50"
                >
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-red-600" />
                        <div className="p-8 text-center">
                            <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                                <AlertTriangle className="w-7 h-7 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">حذف المدرب</h3>
                            <p className="text-gray-500 text-sm mb-1">
                                هل أنت متأكد من حذف
                            </p>
                            <p className="text-gray-900 font-bold text-lg mb-6">
                                {deleteTarget.name_ar || deleteTarget.name_en || 'بدون اسم'}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    className="flex-1 py-3 font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isLoading}
                                    className="flex-1 py-3 font-bold text-white bg-gradient-to-r from-red-500 to-red-600 hover:shadow-lg hover:shadow-red-500/30 rounded-xl transition-all flex justify-center items-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Trash2 className="w-5 h-5" /> حذف</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
            <>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => { setIsAddModalOpen(false); resetForm() }}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="fixed inset-0 m-auto w-full max-w-lg h-fit p-4 z-50"
                >
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden relative">
                         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-600" />

                        <div className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">إضافة مدرب جديد</h2>
                                <button onClick={() => { setIsAddModalOpen(false); resetForm() }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X className="w-6 h-6 text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleAdd} className="space-y-5">
                                {/* Phone */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">رقم الهاتف</label>
                                    <div className="relative">
                                        <input
                                            type="tel"
                                            value={newPhone}
                                            onChange={(e) => setNewPhone(e.target.value)}
                                            className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all font-medium text-left"
                                            placeholder="054..."
                                            dir="ltr"
                                            autoFocus
                                        />
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    </div>
                                    <p className="text-xs text-gray-400">سيتم استخدام هذا الرقم لتسجيل الدخول</p>
                                </div>

                                {/* Name */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">الاسم</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all font-medium"
                                            placeholder="اسم المدرب"
                                        />
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    </div>
                                    <p className="text-xs text-gray-400">سيظهر هذا الاسم عند تسجيل الدخول — لا حاجة لإدخاله مجدداً</p>
                                </div>

                                {/* Role Selector */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">الدور / الصلاحيات</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setNewRole('trainer')}
                                            className={`relative p-4 rounded-2xl border-2 transition-all duration-200 text-center ${
                                                newRole === 'trainer'
                                                    ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100'
                                                    : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className={`mx-auto w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
                                                newRole === 'trainer' ? 'bg-indigo-100' : 'bg-gray-100'
                                            }`}>
                                                <User className={`w-5 h-5 ${newRole === 'trainer' ? 'text-indigo-600' : 'text-gray-400'}`} />
                                            </div>
                                            <div className={`text-sm font-bold ${newRole === 'trainer' ? 'text-indigo-700' : 'text-gray-500'}`}>
                                                مدرب
                                            </div>
                                            <div className={`text-[10px] mt-0.5 ${newRole === 'trainer' ? 'text-indigo-400' : 'text-gray-400'}`}>
                                                صلاحيات تدريب فقط
                                            </div>
                                            {newRole === 'trainer' && (
                                                <div className="absolute top-2 end-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setNewRole('headcoach')}
                                            className={`relative p-4 rounded-2xl border-2 transition-all duration-200 text-center ${
                                                newRole === 'headcoach'
                                                    ? 'border-amber-500 bg-amber-50 shadow-md shadow-amber-100'
                                                    : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className={`mx-auto w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
                                                newRole === 'headcoach' ? 'bg-amber-100' : 'bg-gray-100'
                                            }`}>
                                                <ShieldCheck className={`w-5 h-5 ${newRole === 'headcoach' ? 'text-amber-600' : 'text-gray-400'}`} />
                                            </div>
                                            <div className={`text-sm font-bold ${newRole === 'headcoach' ? 'text-amber-700' : 'text-gray-500'}`}>
                                                رئيس مدربين
                                            </div>
                                            <div className={`text-[10px] mt-0.5 ${newRole === 'headcoach' ? 'text-amber-400' : 'text-gray-400'}`}>
                                                صلاحيات كاملة
                                            </div>
                                            {newRole === 'headcoach' && (
                                                <div className="absolute top-2 end-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2">
                                        <X className="w-4 h-4 shrink-0" /> {error}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => { setIsAddModalOpen(false); resetForm() }}
                                        className="flex-1 py-3 font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-1 py-3 font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-lg hover:shadow-amber-500/30 rounded-xl transition-all flex justify-center items-center gap-2"
                                    >
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> حفظ</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>
    </div>
  )
}
