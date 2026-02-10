'use client'

import { useState, useEffect } from 'react'
import { X, User, Search, Loader2, Save, Check } from 'lucide-react'
import { updateTeamTrainer } from '@/app/actions'
import { createClient } from '@/lib/supabase/client'
import { getLocalizedField } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface TrainerReassignModalProps {
    classId: string
    currentTrainerId?: string | null
    locale: string
    onClose: () => void
}

export function TrainerReassignModal({ classId, currentTrainerId, locale, onClose }: TrainerReassignModalProps) {
    const [trainers, setTrainers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedId, setSelectedId] = useState<string | null>(currentTrainerId || null)
    const router = useRouter()

    useEffect(() => {
        async function fetchTrainers() {
            const supabase = createClient()
            const { data } = await supabase
                .from('trainers')
                .select('*')
                .order('name_en')
            
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
            router.refresh()
            onClose()
        } else {
            alert(res.error || 'فشل تحديث المدرب')
        }
        setSaving(false)
    }

    const filteredTrainers = trainers.filter(t => {
        const name = getLocalizedField(t, 'name', locale).toLowerCase()
        return name.includes(searchQuery.toLowerCase())
    })

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {'تعيين مدرب'}
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                            {'اختر مدرباً لهذا الفريق'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-2.5 text-sm focus:bg-white focus:border-indigo-500 transition-all outline-none"
                            placeholder={'ابحث عن مدرب...'}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <span className="text-xs font-bold uppercase tracking-widest">{'جاري تحميل المدربين...'}</span>
                            </div>
                        ) : filteredTrainers.length > 0 ? (
                            filteredTrainers.map(trainer => (
                                <button
                                    key={trainer.id}
                                    onClick={() => setSelectedId(trainer.id)}
                                    className={`w-full p-4 rounded-2xl flex items-center justify-between border-2 transition-all ${
                                        selectedId === trainer.id 
                                        ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' 
                                        : 'border-slate-50 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200'
                                    }`}
                                >
                                    <div className="flex items-center gap-4 text-left">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                                            selectedId === trainer.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400'
                                        }`}>
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className={`font-bold text-sm ${selectedId === trainer.id ? 'text-indigo-900' : 'text-slate-900'}`}>
                                                {getLocalizedField(trainer, 'name', 'ar')}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                {trainer.phone || 'No phone'}
                                            </div>
                                        </div>
                                    </div>
                                    {selectedId === trainer.id && (
                                        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                                            <Check className="w-4 h-4" />
                                        </div>
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="py-12 text-center text-slate-400 italic text-sm">
                                {'لم يتم العثور على مدرب مطابق لبحثك'}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-slate-50 flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-white/50 transition-colors"
                    >
                        {'إلغاء'}
                    </button>
                    <button 
                        disabled={saving || !selectedId || selectedId === currentTrainerId}
                        onClick={handleSave}
                        className="flex-[2] py-3 px-4 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {'حفظ التغييرات'}
                    </button>
                </div>
            </div>
        </div>
    )
}
