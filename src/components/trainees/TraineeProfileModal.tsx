'use client'

import { useState, useEffect } from 'react'

import { JerseyNumber } from '@/components/ui/JerseyNumber'
import { PaymentModal } from '@/components/payments/PaymentModal'
import { getTraineeAttendanceStats, updateTrainee } from '@/app/actions'
import { User, Phone, Users, Calendar, X, CreditCard, Activity, Edit2, Save, Loader2, Hash } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

type Trainee = Database['public']['Tables']['trainees']['Row']

interface TraineeProfileModalProps {
    trainee: any // Using any for flexibility to generic fields
    locale: string
    teamName?: string
    trainerName?: string
    isAdmin?: boolean
    onClose: () => void
}

export function TraineeProfileModal({ trainee, locale, teamName, trainerName, isAdmin, onClose }: TraineeProfileModalProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [showPayment, setShowPayment] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [stats, setStats] = useState({ total: 0, present: 0, late: 0, absent: 0 })
    const [logs, setLogs] = useState<any[]>([])
    const [loadingLogs, setLoadingLogs] = useState(true)
    const [loadingStats, setLoadingStats] = useState(true)
    const [saving, setSaving] = useState(false)

    const [editForm, setEditForm] = useState({
        name_en: trainee.name_en,
        name_ar: trainee.name_ar,
        name_he: trainee.name_he,
        phone: trainee.phone || '',
        jersey_number: trainee.jersey_number || '',
        gender: trainee.gender || 'male'
    })

    const name = trainee.name_ar

    useEffect(() => {
        getTraineeAttendanceStats(trainee.id).then(res => {
            if (res.success && res.stats) {
                setStats(res.stats)
            }
            setLoadingStats(false)
        })

        const fetchLogs = async () => {
             const supabase = createClient()
             const { data } = await supabase
                .from('payment_logs')
                .select('*')
                .eq('trainee_id', trainee.id)
                .order('payment_date', { ascending: false })
             
             if (data) setLogs(data)
             setLoadingLogs(false)
        }
        fetchLogs()
    }, [trainee.id])

    const handleSaveEdit = async () => {
        setSaving(true)
        const res = await updateTrainee(trainee.id, {
            ...editForm,
            jersey_number: editForm.jersey_number ? parseInt(editForm.jersey_number.toString()) : null
        })
        if (res.success) {
            toast('تم تحديث بيانات اللاعب بنجاح', 'success')
            setIsEditing(false)
            router.refresh()
        } else {
            toast(res.error || 'فشل تحديث بيانات اللاعب', 'error')
        }
        setSaving(false)
    }

    if (showPayment) {
        return <PaymentModal trainee={trainee} onClose={() => setShowPayment(false)} />
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-[#0B132B]/90 backdrop-blur-3xl w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-500 max-h-[90vh] overflow-y-auto ring-1 ring-white/10 border border-white/5">
                
                {/* Header / Cover */}
                <div className="relative h-48 bg-gradient-to-br from-[#0B132B] via-blue-900/40 to-indigo-900/40 border-b border-white/10">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                    
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 p-2.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-full backdrop-blur-md transition-all hover:scale-110 active:scale-95 z-20 border border-white/10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {isAdmin && !isEditing && (
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="absolute top-4 left-4 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all z-20 border border-white/10"
                        >
                            <Edit2 className="w-5 h-5" />
                        </button>
                    )}

                    {/* Team & Trainer Info */}
                    <div className="absolute top-8 left-16 md:left-24 text-white z-10 flex flex-col items-start gap-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-1">
                           <Users className="w-3.5 h-3.5 text-blue-200" />
                           <span className="text-[10px] font-bold tracking-wider text-blue-100 uppercase">Team Profile</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
                            {teamName || 'الفريق'}
                        </h2>
                        {trainerName && (
                            <div className="flex items-center gap-1.5 text-blue-100/90 text-sm">
                                <User className="w-3.5 h-3.5" />
                                <span className="font-medium tracking-wide">{trainerName}</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="absolute -bottom-10 left-8 flex items-end gap-5 z-20">
                        <div className="p-2 bg-white/5 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl ring-1 ring-white/20">
                            {editForm.jersey_number ? (
                                <JerseyNumber number={parseInt(editForm.jersey_number.toString())} className="w-24 h-24 text-4xl shadow-inner" />
                            ) : (
                                <div className="w-24 h-24 rounded-2xl bg-white/5 flex items-center justify-center text-white/30 border-2 border-dashed border-white/20">
                                    <Hash className="w-10 h-10" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-16 px-8 pb-8 space-y-10">
                    
                    {/* Basic Info & Actions */}
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                        <div className="flex-1 w-full">
                            {isEditing ? (
                                <div className="space-y-4 w-full">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-indigo-200/50 uppercase tracking-widest ml-1">{'الاسم (عربي)'}</label>
                                            <input
                                                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:bg-white/10 focus:border-indigo-500 outline-none transition-all text-white placeholder-indigo-200/30"
                                                value={editForm.name_ar}
                                                onChange={e => setEditForm(p => ({ ...p, name_ar: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-indigo-200/50 uppercase tracking-widest ml-1">{'رقم الهاتف'}</label>
                                            <input 
                                                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:bg-white/10 focus:border-indigo-500 outline-none transition-all text-white placeholder-indigo-200/30"
                                                value={editForm.phone} 
                                                onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                                                dir="ltr"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-indigo-200/50 uppercase tracking-widest ml-1">{'رقم القميص'}</label>
                                            <input 
                                                type="number"
                                                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:bg-white/10 focus:border-indigo-500 outline-none transition-all text-white placeholder-indigo-200/30"
                                                value={editForm.jersey_number} 
                                                onChange={e => setEditForm(p => ({ ...p, jersey_number: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <button 
                                            onClick={handleSaveEdit}
                                            disabled={saving}
                                            className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95"
                                        >
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            {'حفظ التغييرات'}
                                        </button>
                                        <button 
                                            onClick={() => setIsEditing(false)}
                                            className="px-6 py-3 bg-white/5 text-white/70 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-all"
                                        >
                                            {'إلغاء'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-3xl font-bold text-white drop-shadow-md tracking-tight">{name}</h1>
                                    <div className="flex items-center gap-4 text-indigo-200/70 mt-2 font-medium">
                                        {trainee.phone && (
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm group hover:bg-white/10 transition-all cursor-default text-white/80">
                                                <Phone className="w-3.5 h-3.5 text-white/50 group-hover:text-blue-300 transition-colors" />
                                                <span dir="ltr">{trainee.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                        
                        {!isEditing && (
                            <button 
                                onClick={() => setShowPayment(true)}
                                className="group shrink-0 relative overflow-hidden bg-white/5 border border-white/10 text-white px-6 py-3 rounded-2xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-blue-900/20"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="relative flex items-center gap-2.5">
                                    <CreditCard className="w-4 h-4" />
                                    <span>{'إدارة المدفوعات'}</span>
                                </div>
                            </button>
                        )}
                    </div>

                    {/* Analytics Section */}
                    {!isEditing && (
                        <>
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-lg font-bold flex items-center gap-2 text-white drop-shadow-md">
                                        <div className="p-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 drop-shadow-sm">
                                            <Activity className="w-4 h-4" />
                                        </div>
                                        {'ملخص الحضور'}
                                    </h3>
                                </div>
                                
                                {loadingStats ? (
                                    <div className="flex gap-4 animate-pulse">
                                        {[1,2,3].map(i => <div key={i} className="h-28 flex-1 bg-white/10 rounded-2xl" />)}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-5">
                                        <div className="group p-5 bg-white/5 border border-white/10 rounded-2xl shadow-sm hover:bg-white/10 transition-all">
                                            <div className="text-4xl font-extrabold text-green-400 drop-shadow-sm mb-1">{stats.present}</div>
                                            <div className="text-[10px] font-bold text-green-400/70 uppercase tracking-widest">{'حاضر'}</div>
                                        </div>
                                        <div className="group p-5 bg-white/5 border border-white/10 rounded-2xl shadow-sm hover:bg-white/10 transition-all">
                                            <div className="text-4xl font-extrabold text-orange-400 drop-shadow-sm mb-1">{stats.late}</div>
                                            <div className="text-[10px] font-bold text-orange-400/70 uppercase tracking-widest">{'متأخر'}</div>
                                        </div>
                                        <div className="group p-5 bg-white/5 border border-white/10 rounded-2xl shadow-sm hover:bg-white/10 transition-all">
                                            <div className="text-4xl font-extrabold text-red-400 drop-shadow-sm mb-1">{stats.absent}</div>
                                            <div className="text-[10px] font-bold text-red-400/70 uppercase tracking-widest">{'غائب'}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Recent Activity / Payment History */}
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 max-h-[250px] overflow-y-auto custom-scrollbar">
                                <div className="flex items-center gap-3 mb-4 sticky top-0 bg-[#0B132B]/95 backdrop-blur-sm pb-2 z-10">
                                    <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                                        <span className="font-bold text-green-400 drop-shadow-sm">₪</span>
                                    </div>
                                    <span className="text-sm font-bold text-white drop-shadow-md">
                                        {'سجل المدفوعات'}
                                    </span>
                                </div>
                                
                                {loadingLogs ? (
                                    <div className="space-y-2">
                                        {[1,2].map(i => <div key={i} className="h-16 bg-white/10 rounded-xl animate-pulse" />)}
                                    </div>
                                ) : logs.length > 0 ? (
                                    <div className="space-y-3">
                                        {logs.map((log) => (
                                            <div key={log.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl shadow-sm border border-white/10">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-white drop-shadow-md">{log.amount} ₪</span>
                                                        <span className="text-[10px] text-green-400 bg-green-500/20 border border-green-500/30 px-2 py-0.5 rounded-full font-bold">{'تم الدفع'}</span>
                                                    </div>
                                                    {log.note && <p className="text-[10px] text-indigo-200/50 mt-0.5">{log.note}</p>}
                                                </div>
                                                <div className="text-right text-[10px] text-indigo-200/50 font-medium">
                                                    {new Date(log.payment_date).toLocaleDateString(locale)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-xs text-indigo-200/50 py-8 italic">{'لا توجد مدفوعات مسجلة بعد'}</p>
                                )}
                            </div>
                        </>
                    )}

                </div>
            </div>
        </div>
    )
}
