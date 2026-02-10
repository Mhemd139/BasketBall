'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Phone, Trash2, Plus, Search, Shield, ShieldCheck, X, Loader2, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { deleteTrainer, upsertTrainer } from '@/app/actions'

interface Trainer {
  id: string
  name_en: string | null
  phone: string | null
  role?: string
}

export default function TrainerManager({ initialTrainers }: { initialTrainers: Trainer[] }) {
  const [trainers, setTrainers] = useState<Trainer[]>(initialTrainers)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  // Add Trainer Form State
  const [newPhone, setNewPhone] = useState('')
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')

  const filteredTrainers = trainers.filter(t => 
    (t.name_en?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (t.phone || '').includes(searchQuery)
  )

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المدرب؟')) return
    
    setIsLoading(true)
    try {
        const res = await deleteTrainer(id)
        if (res.success) {
            setTrainers(trainers.filter(t => t.id !== id))
            router.refresh()
        } else {
            alert(res.error || 'Failed to delete')
        }
    } catch (e) {
        console.error(e)
    } finally {
        setIsLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
        const res = await upsertTrainer(newPhone, newName)
        if (res.success) {
            setIsAddModalOpen(false)
            setNewPhone('')
            setNewName('')
            router.refresh()
            // Optimistic update could go here, or just wait for refresh
            // For now, let's just reload the page/data
            window.location.reload() 
        } else {
            setError(res.error || 'Failed to add trainer')
        }
    } catch (e) {
        setError('Something went wrong')
    } finally {
        setIsLoading(false)
    }
  }

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
                        
                        {/* Gradient Border Effect */}
                        <div className="absolute inset-0 border border-white/40 rounded-3xl pointer-events-none" />
                        
                        <div className="p-6 relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl shadow-inner">
                                    <User className="w-6 h-6 text-indigo-600" />
                                </div>
                                <button 
                                    onClick={() => handleDelete(trainer.id)}
                                    disabled={isLoading}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-1">
                                {trainer.name_en || 'بدون اسم'}
                            </h3>
                            
                            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-4" dir="ltr">
                                <Phone className="w-4 h-4" />
                                {trainer.phone}
                            </div>

                            <div className="flex items-center gap-2">
                                <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                                    ['972543299106', '972587131002'].includes(trainer.phone || '') 
                                    ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                                    : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                }`}>
                                    {['972543299106', '972587131002'].includes(trainer.phone || '') ? (
                                        <><ShieldCheck className="w-3 h-3" /> Head Coach</>
                                    ) : (
                                        <><User className="w-3 h-3" /> Trainer</>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            ))}
        </AnimatePresence>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsAddModalOpen(false)}
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
                                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X className="w-6 h-6 text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleAdd} className="space-y-5">
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
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2">
                                        <X className="w-4 h-4" /> {error}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsAddModalOpen(false)}
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
