'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, User as UserIcon, Phone, Save } from 'lucide-react'
import { JerseyNumber } from '@/components/ui/JerseyNumber'
import { updateTraineePayment } from '@/app/actions'
import type { Database } from '@/lib/supabase/types'

type Trainee = Database['public']['Tables']['trainees']['Row']

interface PaymentModalProps {
    trainee: Trainee
    locale: string
    onClose: () => void
}

export function PaymentModal({ trainee, locale, onClose }: PaymentModalProps) {
    const [amount, setAmount] = useState(trainee.amount_paid || 0)
    const [comment, setComment] = useState(trainee.payment_comment_en || '')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    
    const name = locale === 'ar' ? trainee.name_ar : locale === 'he' ? trainee.name_he : trainee.name_en
    const goal = 3000
    const progress = Math.min((amount / goal) * 100, 100)

    const handleSave = async () => {
        setLoading(true)
        const res = await updateTraineePayment(trainee.id, amount, comment)
        if (res.success) {
            router.refresh()
            onClose()
        } else {
            alert('Error updating')
        }
        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10">
                {/* Header */}
                <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-start">
                    <div className="flex items-center gap-4">
                         {trainee.jersey_number ? (
                             <JerseyNumber number={trainee.jersey_number} className="w-12 h-12 text-lg" />
                         ) : (
                             <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                 <UserIcon className="w-6 h-6 text-gray-400" />
                             </div>
                         )}
                         <div>
                             <h2 className="text-xl font-bold">{name}</h2>
                             <div className="flex items-center gap-2 text-sm text-gray-500">
                                 {trainee.phone && <span dir="ltr" className="flex items-center gap-1"><Phone className="w-3 h-3" /> {trainee.phone}</span>}
                             </div>
                         </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    
                    {/* Progress */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <label className="text-sm font-semibold text-gray-500 uppercase">Payment Status</label>
                            <div className="font-mono font-bold text-xl">
                                ₪{amount.toLocaleString()} <span className="text-gray-400 text-base">/ ₪{goal.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-500 ${amount >= goal ? 'bg-green-500' : 'bg-blue-500'}`} 
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Edit Form */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Total Paid (₪)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-sans">₪</span>
                                <input 
                                    type="number" 
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                    className="w-full pl-8 p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-lg"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                             <label className="block text-xs font-semibold text-gray-500 uppercase">Quick Add</label>
                             <div className="flex gap-2">
                                 <button onClick={() => setAmount(c => c + 100)} className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 border rounded-lg text-sm font-medium transition-colors">+100</button>
                                 <button onClick={() => setAmount(c => c + 500)} className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 border rounded-lg text-sm font-medium transition-colors">+500</button>
                             </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Comments / History</label>
                        <textarea 
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Add notes about payments, discounts, etc."
                            className="w-full p-4 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] text-sm resize-none"
                        />
                    </div>

                    <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                        {loading ? <span className="loading loading-spinner text-white" /> : <><Save className="w-5 h-5" /> Save Changes</>}
                    </button>
                </div>
            </div>
        </div>
    )
}
