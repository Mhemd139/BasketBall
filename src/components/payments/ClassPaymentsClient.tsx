
'use client'

import { useState, useDeferredValue, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card } from '@/components/ui/Card'
import { Search, DollarSign, Users, Phone, Edit2, Save, X, User as UserIcon } from 'lucide-react'
import { JerseyNumber } from '@/components/ui/JerseyNumber'
import { updateTraineePayment } from '@/app/actions'
import type { Database } from '@/lib/supabase/types'
import { PaymentModal } from '@/components/payments/PaymentModal'

type Trainee = Database['public']['Tables']['trainees']['Row']

interface ClassPaymentsClientProps {
  trainees: Trainee[]
  classData: any
  locale: string
  dict: any
}

export default function ClassPaymentsClient({ trainees, classData, locale, dict }: ClassPaymentsClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearch = useDeferredValue(searchTerm)
  const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null)

  const className = classData
        ? (locale === 'ar' ? classData.name_ar : locale === 'he' ? classData.name_he : classData.name_en)
        : ''
  const trainerName = classData?.trainers
        ? (locale === 'ar' ? classData.trainers.name_ar : locale === 'he' ? classData.trainers.name_he : classData.trainers.name_en)
        : ''

  const filteredTrainees = useMemo(() => trainees.filter(t => {
      const name = locale === 'ar' ? t.name_ar : locale === 'he' ? t.name_he : t.name_en
      return name.toLowerCase().includes(deferredSearch.toLowerCase())
  }), [trainees, deferredSearch, locale])

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar locale={locale} />
      <div className="flex-1 flex flex-col md:ml-[240px]">
        <Header 
            locale={locale} 
            title={className}
            showBack
            backHref={`/${locale}/payments`}
        />

        <main className="flex-1 pt-20 pb-24 md:pb-8 px-3 md:px-5">
            <div className="max-w-5xl mx-auto space-y-6">
                
                {/* Header Info */}
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-gray-500 text-sm">{locale === 'ar' ? 'المدرب' : locale === 'he' ? 'מאמן' : 'Trainer'}</h2>
                        <p className="font-semibold text-lg">{trainerName}</p>
                    </div>
                    <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        {filteredTrainees.length} {locale === 'ar' ? 'لاعب' : locale === 'he' ? 'שחקנים' : 'Players'}
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder={locale === 'ar' ? 'بحث عن لاعب...' : locale === 'he' ? 'חיפוש שחקן...' : 'Search player...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                    />
                </div>

                {/* List */}
                <div className="grid gap-3">
                    {filteredTrainees.map(trainee => (
                        <TraineeRow 
                            key={trainee.id} 
                            trainee={trainee} 
                            locale={locale} 
                            onClick={() => setSelectedTrainee(trainee)}
                        />
                    ))}
                    {filteredTrainees.length === 0 && (
                        <div className="text-center py-12 text-gray-400">No players found</div>
                    )}
                </div>
            </div>
        </main>

        {/* Payment Detail Modal (Reusable) */}
        {selectedTrainee && (
            <PaymentModal 
                trainee={selectedTrainee} 
                locale={locale} 
                onClose={() => setSelectedTrainee(null)} 
            />
        )}
      </div>
    </div>
  )
}

function TraineeRow({ trainee, locale, onClick }: { trainee: Trainee, locale: string, onClick: () => void }) {
    const name = locale === 'ar' ? trainee.name_ar : locale === 'he' ? trainee.name_he : trainee.name_en
    const amount = trainee.amount_paid || 0
    const goal = 3000
    const isPaid = amount >= goal

    return (
        <Card onClick={onClick} className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors group">
            <div className="flex items-center gap-4">
                {trainee.jersey_number ? (
                    <JerseyNumber number={trainee.jersey_number} className="w-10 h-10" />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <UserIcon className="w-5 h-5" />
                    </div>
                )}
                <div>
                    <h3 className="font-bold text-gray-900">{name}</h3>
                    {trainee.phone && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                             <Phone className="w-3 h-3" />
                             <span dir="ltr">{trainee.phone}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="text-right">
                <div className={`font-mono font-bold ${isPaid ? 'text-green-600' : 'text-gray-700'}`}>
                    ₪{amount.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">
                    of ₪{goal.toLocaleString()}
                </div>
            </div>
        </Card>
    )
}
