'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { JerseyNumber } from '@/components/ui/JerseyNumber'
import { PaymentModal } from '@/components/payments/PaymentModal'
import { getTraineeAttendanceStats } from '@/app/actions'
import { User, Phone, Users, Calendar, X, CreditCard, Activity } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'

type Trainee = Database['public']['Tables']['trainees']['Row']

interface TraineeProfileModalProps {
    trainee: any // Using any for flexibility to generic fields
    locale: string
    teamName?: string
    trainerName?: string
    onClose: () => void
}

export function TraineeProfileModal({ trainee, locale, teamName, trainerName, onClose }: TraineeProfileModalProps) {
    const [showPayment, setShowPayment] = useState(false)
    const [stats, setStats] = useState({ total: 0, present: 0, late: 0, absent: 0 })
    const [logs, setLogs] = useState<any[]>([])
    const [loadingLogs, setLoadingLogs] = useState(true)
    const [loadingStats, setLoadingStats] = useState(true) // Added loading state for logs

    // Theme based on Team (if passed, or default blue)
    const theme = {
        primary: 'from-blue-600 to-indigo-700',
        accent: 'text-indigo-600',
        bg: 'bg-indigo-50'
    }

    const name = locale === 'ar' ? trainee.name_ar : locale === 'he' ? trainee.name_he : trainee.name_en
    const profileImage = null // Placeholder if we had images

    useEffect(() => {
        // Fetch Attendance Stats
        getTraineeAttendanceStats(trainee.id).then(res => {
            if (res.success && res.stats) {
                setStats(res.stats)
            }
            setLoadingStats(false)
        })

        // Fetch Payment Logs
        const fetchLogs = async () => {
             const supabase = createClient()
             const { data } = await supabase
                .from('payment_logs')
                .select('*')
                .eq('trainee_id', trainee.id)
                .order('payment_date', { ascending: false })
             
             if (data) setLogs(data)
             setLoadingLogs(false) // Set loading to false after fetching
        }
        fetchLogs()
    }, [trainee.id])

    if (showPayment) {
        return <PaymentModal trainee={trainee} locale={locale} onClose={() => setShowPayment(false)} />
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-500 max-h-[90vh] overflow-y-auto ring-1 ring-black/5">
                
                {/* Header / Cover */}
                <div className="relative h-48 bg-gradient-to-br from-indigo-900 via-blue-800 to-indigo-900">
                    {/* Decorative patterns */}
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                    <div className="absolute top-0 right-0 p-12 bg-blue-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
                    <div className="absolute bottom-0 left-0 p-16 bg-purple-500 rounded-full blur-3xl opacity-20 -ml-10 -mb-10"></div>

                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 p-2.5 bg-black/10 hover:bg-black/20 text-white rounded-full backdrop-blur-md transition-all hover:scale-110 active:scale-95 z-20 border border-white/10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Team & Trainer Info - Premium Typography */}
                    <div className="absolute top-8 left-8 text-white z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-3 animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
                           <Users className="w-3.5 h-3.5 text-blue-200" />
                           <span className="text-xs font-semibold tracking-wide text-blue-100 uppercase">Team Profile</span>
                        </div>
                        <h2 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-lg animate-in fade-in slide-in-from-left-4 duration-700 delay-200">
                            {teamName || (locale === 'ar' ? 'الفريق' : locale === 'he' ? 'הקבוצה' : 'Team')}
                        </h2>
                        {trainerName && (
                            <div className="flex items-center gap-2 mt-2 text-blue-100 animate-in fade-in slide-in-from-left-4 duration-700 delay-300">
                                <div className="p-1 bg-white/10 rounded-full">
                                    <User className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-sm font-medium tracking-wide opacity-90">{trainerName}</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="absolute -bottom-10 left-8 flex items-end gap-5 z-20">
                        <div className="p-1.5 bg-white rounded-3xl dark:bg-gray-900 shadow-2xl ring-4 ring-black/5 animate-in zoom-in-50 duration-500 delay-300">
                            {trainee.jersey_number ? (
                                <JerseyNumber number={trainee.jersey_number} className="w-24 h-24 text-4xl shadow-inner" />
                            ) : (
                                <div className="w-24 h-24 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 border-2 border-dashed border-gray-200">
                                    <User className="w-10 h-10" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-16 px-8 pb-8 space-y-10">
                    
                    {/* Basic Info & Actions */}
                    <div className="flex justify-between items-start animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{name}</h1>
                            <div className="flex items-center gap-4 text-gray-500 mt-2 font-medium">
                                {trainee.phone && (
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg text-sm group hover:bg-gray-100 transition-colors cursor-default">
                                        <Phone className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                        <span dir="ltr">{trainee.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => setShowPayment(true)}
                            className="group relative overflow-hidden bg-gray-900 text-white px-6 py-3 rounded-2xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-gray-200"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative flex items-center gap-2.5">
                                <CreditCard className="w-4 h-4" />
                                <span>Manage Payments</span>
                            </div>
                        </button>
                    </div>

                    {/* Analytics Section */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                                <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
                                    <Activity className="w-4 h-4" />
                                </div>
                                Attendance Overview
                            </h3>
                            {stats && stats.total > 0 && (
                                <span className="text-xs font-bold px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
                                    Last 30 Days
                                </span>
                            )}
                        </div>
                        
                        {loadingStats ? (
                            <div className="flex gap-4 animate-pulse">
                                {[1,2,3].map(i => <div key={i} className="h-28 flex-1 bg-gray-100 rounded-2xl" />)}
                            </div>
                        ) : stats ? (
                            <div className="grid grid-cols-3 gap-5">
                                <div className="group p-5 bg-white border border-green-100 rounded-2xl shadow-[0_2px_10px_-4px_rgba(34,197,94,0.2)] hover:shadow-[0_8px_20px_-6px_rgba(34,197,94,0.3)] transition-all hover:-translate-y-1">
                                    <div className="text-4xl font-extrabold text-green-600 mb-1">{stats.present}</div>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-green-700 uppercase tracking-wider opacity-80">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                        Present
                                    </div>
                                    <div className="w-full bg-green-50 h-1 mt-3 rounded-full overflow-hidden">
                                        <div className="bg-green-500 h-full rounded-full" style={{ width: stats.total ? `${(stats.present / stats.total) * 100}%` : '0%' }}></div>
                                    </div>
                                </div>

                                <div className="group p-5 bg-white border border-orange-100 rounded-2xl shadow-[0_2px_10px_-4px_rgba(249,115,22,0.2)] hover:shadow-[0_8px_20px_-6px_rgba(249,115,22,0.3)] transition-all hover:-translate-y-1">
                                    <div className="text-4xl font-extrabold text-orange-500 mb-1">{stats.late}</div>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-orange-700 uppercase tracking-wider opacity-80">
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                                        Late
                                    </div>
                                    <div className="w-full bg-orange-50 h-1 mt-3 rounded-full overflow-hidden">
                                        <div className="bg-orange-500 h-full rounded-full" style={{ width: stats.total ? `${(stats.late / stats.total) * 100}%` : '0%' }}></div>
                                    </div>
                                </div>

                                <div className="group p-5 bg-white border border-red-100 rounded-2xl shadow-[0_2px_10px_-4px_rgba(239,68,68,0.2)] hover:shadow-[0_8px_20px_-6px_rgba(239,68,68,0.3)] transition-all hover:-translate-y-1">
                                    <div className="text-4xl font-extrabold text-red-500 mb-1">{stats.absent}</div>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 uppercase tracking-wider opacity-80">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                        Absent
                                    </div>
                                    <div className="w-full bg-red-50 h-1 mt-3 rounded-full overflow-hidden">
                                        <div className="bg-red-500 h-full rounded-full" style={{ width: stats.total ? `${(stats.absent / stats.total) * 100}%` : '0%' }}></div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-400 font-medium">No attendance data collected yet</p>
                            </div>
                        )}
                    </div>

                    {/* Recent Activity / Payment History */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                     <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl border border-gray-100 max-h-[250px] overflow-y-auto custom-scrollbar">
                         <div className="flex items-center gap-3 mb-4 sticky top-0 bg-gray-50/95 backdrop-blur-sm pb-2 z-10">
                             <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                <span className="font-bold text-green-600">₪</span>
                             </div>
                             <span className="text-sm font-bold text-gray-800">
                                {locale === 'ar' ? 'سجل المدفوعات' : locale === 'he' ? 'היסטוריית תשלומים' : 'Payment History'}
                             </span>
                         </div>
                         
                         {loadingLogs ? (
                            <div className="space-y-3">
                                {[1,2,3].map(i => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse">
                                        <div className="space-y-2">
                                            <div className="h-4 w-24 bg-gray-200 rounded"></div>
                                            <div className="h-3 w-32 bg-gray-100 rounded"></div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-3 w-20 bg-gray-200 rounded"></div>
                                            <div className="h-2 w-16 bg-gray-100 rounded"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                         ) : logs.length > 0 ? (
                             <div className="space-y-3">
                                 {logs.map((log) => (
                                     <div key={log.id} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                                         <div>
                                             <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900">{log.amount} ₪</span>
                                                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                                                    {locale === 'ar' ? 'تم الدفع' : locale === 'he' ? 'שולם' : 'Paid'}
                                                </span>
                                             </div>
                                             {log.note && (
                                                <p className="text-xs text-gray-400 mt-1">{log.note}</p>
                                             )}
                                         </div>
                                         <div className="text-right">
                                             <div className="text-xs font-medium text-gray-500">
                                                {new Date(log.payment_date).toLocaleDateString(locale)}
                                             </div>
                                             <div className="text-[10px] text-gray-400">
                                                {new Date(log.payment_date).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                                             </div>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         ) : (
                             <p className="text-center text-xs text-gray-400 py-8">
                                {locale === 'ar' ? 'لا يوجد سجل مدفوعات' : locale === 'he' ? 'אין היסטוריית תשלומים' : 'No payment history available'}
                             </p>
                         )}
                     </div>
                </div>

                </div>
            </div>
        </div>
    )
}
