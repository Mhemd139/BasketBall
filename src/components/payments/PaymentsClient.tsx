
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card } from '@/components/ui/Card'
import { DollarSign, Search, Filter, TrendingUp, Users, CheckCircle2, AlertCircle, Edit2, Save, X } from 'lucide-react'
import { JerseyNumber } from '@/components/ui/JerseyNumber'
import { updateTraineePayment } from '@/app/actions'
import { useToast } from '@/components/ui/Toast'
import type { Database } from '@/lib/supabase/types'

type Trainee = Database['public']['Tables']['trainees']['Row'] & {
    classes: {
        name_en: string
        name_ar: string
        name_he: string
    } | null
}

interface PaymentsPageProps {
  trainees: Trainee[]
  locale: string
  dict: any
}

export default function PaymentsClient({ trainees, locale, dict }: PaymentsPageProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all')

  const filteredTrainees = trainees.filter(t => {
      const name = t.name_ar
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase())
      
      const isPaid = (t.amount_paid || 0) >= 3000
      const matchesFilter = filter === 'all' 
          ? true 
          : filter === 'paid' ? isPaid : !isPaid
          
      return matchesSearch && matchesFilter
  })

  // Stats
  const totalTrainees = trainees.length
  const totalRevenue = trainees.reduce((sum, t) => sum + (t.amount_paid || 0), 0)
  const paidFullCount = trainees.filter(t => (t.amount_paid || 0) >= 3000).length
  const potentialRevenue = totalTrainees * 3000
  const collectionRate = potentialRevenue > 0 ? Math.round((totalRevenue / potentialRevenue) * 100) : 0

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar locale={locale} />
      <div className="flex-1 flex flex-col md:ml-[240px]">
        <Header 
            locale={locale} 
            title={dict.payments.title}
            showBack
            backHref={`/${locale}/more`}
        />

        <main className="flex-1 pt-24 pb-20 px-4 md:px-8">
            <div className="max-w-5xl mx-auto space-y-8">
                
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4 flex flex-col items-center justify-center text-center bg-white border-l-4 border-l-blue-500 shadow-sm">
                        <div className="text-gray-500 text-sm mb-1">{'المجموع'}</div>
                        <div className="text-2xl font-bold flex items-center gap-2">
                             <Users className="w-5 h-5 text-blue-500" />
                             {totalTrainees}
                        </div>
                    </Card>
                    <Card className="p-4 flex flex-col items-center justify-center text-center bg-white border-l-4 border-l-green-500 shadow-sm">
                        <div className="text-gray-500 text-sm mb-1">{'تم الدفع بالكامل'}</div>
                        <div className="text-2xl font-bold flex items-center gap-2 text-green-600">
                             <CheckCircle2 className="w-5 h-5" />
                             {paidFullCount}
                        </div>
                    </Card>
                    <Card className="p-4 flex flex-col items-center justify-center text-center bg-white border-l-4 border-l-indigo-500 shadow-sm">
                        <div className="text-gray-500 text-sm mb-1">{'الإيرادات'}</div>
                        <div className="text-2xl font-bold flex items-center gap-2 text-indigo-600">
                             <DollarSign className="w-5 h-5" />
                             {totalRevenue.toLocaleString()}
                        </div>
                    </Card>
                    <Card className="p-4 flex flex-col items-center justify-center text-center bg-white border-l-4 border-l-purple-500 shadow-sm">
                        <div className="text-gray-500 text-sm mb-1">{'نسبة التحصيل'}</div>
                        <div className="text-2xl font-bold flex items-center gap-2 text-purple-600">
                             <TrendingUp className="w-5 h-5" />
                             {collectionRate}%
                        </div>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder={'بحث...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                {/* Payment List */}
                <div className="grid gap-4">
                    {filteredTrainees.map((trainee) => (
                        <PaymentRow key={trainee.id} trainee={trainee} locale={locale} />
                    ))}
                    {filteredTrainees.length === 0 && (
                         <div className="p-10 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                             {'لم يتم العثور على متدربين.'}
                         </div>
                    )}
                </div>
            </div>
        </main>
      </div>
    </div>
  )
}

function PaymentRow({ trainee, locale }: { trainee: Trainee, locale: string }) {
    const [isEditing, setIsEditing] = useState(false)
    const [amount, setAmount] = useState(trainee.amount_paid || 0)
    const [comment, setComment] = useState(trainee.payment_comment_en || '')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const { toast } = useToast()

    const goal = 3000
    const progress = Math.min((amount / goal) * 100, 100)
    const isFullyPaid = amount >= goal

    const name = trainee.name_ar
    const className = trainee.classes ? trainee.classes.name_ar : '-'

    const handleSave = async () => {
        setLoading(true)
        const res = await updateTraineePayment(trainee.id, amount, comment)
        if (res.success) {
            toast('تم تحديث الدفع بنجاح', 'success')
            setIsEditing(false)
            router.refresh()
        } else {
            toast('خطأ في تحديث الدفع', 'error')
        }
        setLoading(false)
    }

    return (
        <Card className="p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                     {trainee.jersey_number ? (
                         <JerseyNumber number={trainee.jersey_number} className="w-10 h-10" />
                     ) : (
                         <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                             <Users className="w-5 h-5 text-gray-400" />
                         </div>
                     )}
                     <div>
                         <h3 className="font-bold text-gray-900 text-lg">{name}</h3>
                         <p className="text-gray-500 text-sm">{className}</p>
                     </div>
                </div>
                
                <div className="text-right">
                    <div className="font-mono font-bold text-xl">
                        {amount.toLocaleString()} <span className="text-gray-400 text-sm">/ {goal}</span>
                    </div>
                    {isFullyPaid && (
                        <div className="text-green-600 text-xs font-bold flex items-center justify-end gap-1 mt-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {'تم الدفع'}
                        </div>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            {!isEditing && (
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-500 ${isFullyPaid ? 'bg-green-500' : 'bg-blue-500'}`} 
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}

            {/* Comment Preview (if not editing) */}
            {!isEditing && trainee.payment_comment_en && (
                <div className="text-sm text-gray-500 italic bg-gray-50 p-2 rounded-lg border border-gray-100">
                    "{trainee.payment_comment_en}"
                </div>
            )}

            {/* Editing Mode */}
            {isEditing && (
                <div className="bg-gray-50 p-4 rounded-xl border border-blue-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{'المبلغ المدفوع'}</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="number" 
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                    className="w-full pl-9 p-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                />
                            </div>
                        </div>
                        <div>
                             <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{'إضافة مبلغ'}</label>
                             <div className="flex gap-2">
                                 <button onClick={() => setAmount(curr => curr + 100)} className="flex-1 bg-white border hover:bg-gray-50 py-2 rounded-lg text-sm font-medium">+100</button>
                                 <button onClick={() => setAmount(curr => curr + 500)} className="flex-1 bg-white border hover:bg-gray-50 py-2 rounded-lg text-sm font-medium">+500</button>
                             </div>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{'ملاحظات'}</label>
                        <textarea 
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={'ملاحظات...'}
                            className="w-full p-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm h-20 resize-none"
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button 
                            onClick={handleSave}
                            disabled={loading}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                        >
                            {loading ? <span className="loading loading-spinner text-white" /> : <><Save className="w-4 h-4" /> {'حفظ التغييرات'}</>}
                        </button>
                        <button 
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                        >
                            {'إلغاء'}
                        </button>
                    </div>
                </div>
            )}

            {/* Action Buttons (if not editing) */}
            {!isEditing && (
                <button 
                    onClick={() => setIsEditing(true)}
                    className="w-full py-2 flex items-center justify-center gap-2 text-blue-600 hover:bg-blue-50 border border-blue-100 rounded-lg transition-colors font-medium text-sm"
                >
                    <Edit2 className="w-4 h-4" />
                    {'تعديل الدفع'}
                </button>
            )}
        </Card>
    )
}
