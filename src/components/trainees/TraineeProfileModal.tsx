'use client'

import { useState, useEffect } from 'react'

import { JerseyNumber } from '@/components/ui/JerseyNumber'
import { PaymentModal } from '@/components/payments/PaymentModal'
import { getTraineeAttendanceStats, updateTrainee } from '@/app/actions'
import { User, Phone, Users, Calendar, X, CreditCard, Activity, Edit2, Save, Loader2, Hash } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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
            setIsEditing(false)
            router.refresh()
            // Optional: update local trainee state if parent doesn't refresh instantly
        } else {
            alert(res.error || 'فشل تحديث بيانات اللاعب')
        }
        setSaving(false)
    }

    if (showPayment) {
        return <PaymentModal trainee={trainee} locale={locale} onClose={() => setShowPayment(false)} />
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-500 max-h-[90vh] overflow-y-auto ring-1 ring-black/5">
                
                {/* Header / Cover */}
                <div className="relative h-48 bg-gradient-to-br from-indigo-900 via-blue-800 to-indigo-900">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                    
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 p-2.5 bg-black/10 hover:bg-black/20 text-white rounded-full backdrop-blur-md transition-all hover:scale-110 active:scale-95 z-20 border border-white/10"
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
                        <div className="p-1.5 bg-white rounded-3xl dark:bg-gray-900 shadow-2xl ring-4 ring-black/5">
                            {editForm.jersey_number ? (
                                <JerseyNumber number={parseInt(editForm.jersey_number.toString())} className="w-24 h-24 text-4xl shadow-inner" />
                            ) : (
                                <div className="w-24 h-24 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 border-2 border-dashed border-gray-200">
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
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{'الاسم (انجليزي)'}</label>
                                            <input 
                                                className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                                                value={editForm.name_en} 
                                                onChange={e => setEditForm(p => ({ ...p, name_en: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{'رقم الهاتف'}</label>
                                            <input 
                                                className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                                                value={editForm.phone} 
                                                onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                                                dir="ltr"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{'رقم القميص'}</label>
                                            <input 
                                                type="number"
                                                className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none transition-all"
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
                                            className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                                        >
                                            {'إلغاء'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{name}</h1>
                                    <div className="flex items-center gap-4 text-gray-500 mt-2 font-medium">
                                        {trainee.phone && (
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg text-sm group hover:bg-gray-100 transition-colors cursor-default">
                                                <Phone className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
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
                                className="group shrink-0 relative overflow-hidden bg-gray-900 text-white px-6 py-3 rounded-2xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-gray-200"
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
                                    <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                                        <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
                                            <Activity className="w-4 h-4" />
                                        </div>
                                        {'ملخص الحضور'}
                                    </h3>
                                </div>
                                
                                {loadingStats ? (
                                    <div className="flex gap-4 animate-pulse">
                                        {[1,2,3].map(i => <div key={i} className="h-28 flex-1 bg-gray-100 rounded-2xl" />)}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-5">
                                        <div className="group p-5 bg-white border border-green-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
                                            <div className="text-4xl font-extrabold text-green-600 mb-1">{stats.present}</div>
                                            <div className="text-[10px] font-bold text-green-700 uppercase tracking-widest opacity-60">{'حاضر'}</div>
                                        </div>
                                        <div className="group p-5 bg-white border border-orange-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
                                            <div className="text-4xl font-extrabold text-orange-500 mb-1">{stats.late}</div>
                                            <div className="text-[10px] font-bold text-orange-700 uppercase tracking-widest opacity-60">{'متأخر'}</div>
                                        </div>
                                        <div className="group p-5 bg-white border border-red-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
                                            <div className="text-4xl font-extrabold text-red-500 mb-1">{stats.absent}</div>
                                            <div className="text-[10px] font-bold text-red-700 uppercase tracking-widest opacity-60">{'غائب'}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Recent Activity / Payment History */}
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 max-h-[250px] overflow-y-auto custom-scrollbar">
                                <div className="flex items-center gap-3 mb-4 sticky top-0 bg-slate-50/95 backdrop-blur-sm pb-2 z-10">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                        <span className="font-bold text-green-600">₪</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-800">
                                        {'سجل المدفوعات'}
                                    </span>
                                </div>
                                
                                {loadingLogs ? (
                                    <div className="space-y-2">
                                        {[1,2].map(i => <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />)}
                                    </div>
                                ) : logs.length > 0 ? (
                                    <div className="space-y-3">
                                        {logs.map((log) => (
                                            <div key={log.id} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-gray-900">{log.amount} ₪</span>
                                                        <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-bold">{'تم الدفع'}</span>
                                                    </div>
                                                    {log.note && <p className="text-[10px] text-gray-400 mt-0.5">{log.note}</p>}
                                                </div>
                                                <div className="text-right text-[10px] text-gray-400 font-medium">
                                                    {new Date(log.payment_date).toLocaleDateString(locale)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-xs text-gray-400 py-8 italic">{'لا توجد مدفوعات مسجلة بعد'}</p>
                                )}
                            </div>
                        </>
                    )}

                </div>
            </div>
        </div>
    )
}
