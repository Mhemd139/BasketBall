'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteTrainee, toggleTraineePayment } from '@/app/actions'
import { Card } from '@/components/ui/Card'
import { User, Trash2, Shield, Phone } from 'lucide-react'
import { JerseyNumber } from '@/components/ui/JerseyNumber'
import { TraineeProfileModal } from '@/components/trainees/TraineeProfileModal'

interface Trainee {
  id: string
  name_en: string
  name_ar: string
  name_he: string
  phone?: string | null
  jersey_number?: number | null
  is_paid?: boolean
  // Add other fields needed for profile if any, or mapped roughly
  amount_paid?: number
  payment_comment_en?: string | null
  payment_comment_ar?: string | null
  payment_comment_he?: string | null
  gender?: 'male' | 'female'
}

interface TraineeListProps {
  trainees: Trainee[]
  locale: string
  isAdmin: boolean
  teamName?: string
  trainerName?: string
}

export function TraineeList({ trainees, locale, isAdmin, teamName, trainerName }: TraineeListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null)
  const router = useRouter()

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
     e.stopPropagation()
     if (!confirm(`حذف ${name}؟`)) return
     
     setLoadingId(id)
     const res = await deleteTrainee(id)
     setLoadingId(null)
     if (res.success) {
        router.refresh()
     } else {
        alert('فشل الحذف')
     }
  }

  const handleTogglePaid = async (e: React.MouseEvent, id: string, currentStatus: boolean) => {
    e.stopPropagation()
    if (!isAdmin) return
    setLoadingId(id)
    const res = await toggleTraineePayment(id, !currentStatus)
    setLoadingId(null)
    if (res.success) {
      router.refresh()
    }
  }

  return (
    <>
      <div className="grid gap-4">
        {trainees.map((trainee) => {
           const name = trainee.name_ar
           const isPaid = trainee.is_paid
           
           return (
            <Card 
                key={trainee.id} 
                onClick={() => setSelectedTrainee(trainee)}
                className="p-4 flex items-center justify-between group cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  {trainee.jersey_number ? (
                    <JerseyNumber number={trainee.jersey_number} className="w-8 h-8 text-sm" />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      (trainee.gender || 'male') === 'female' 
                        ? 'bg-pink-100 text-pink-500' 
                        : 'bg-blue-100 text-blue-500'
                    }`}>
                      <User className="w-5 h-5" />
                    </div>
                  )}
                  {isAdmin && (
                     <button 
                       onClick={(e) => handleTogglePaid(e, trainee.id, !!isPaid)}
                       className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-white flex items-center justify-center transition-transform hover:scale-105 shadow-sm group/btn"
                       title={`${trainee.amount_paid || 0} / 3000 ₪`}
                     >
                        {/* Circular Progress */}
                        <div className="relative w-full h-full flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                                {/* Track */}
                                <path
                                    className="text-gray-200"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                {/* Progress */}
                                <path
                                    className={`${(trainee.amount_paid || 0) >= 3000 ? 'text-green-500' : 'text-green-500'}`}
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    strokeDasharray={`${Math.min(100, Math.max(0, ((trainee.amount_paid || 0) / 3000) * 100))}, 100`}
                                />
                            </svg>
                            {/* Icon */}
                            <span className={`absolute text-[10px] font-bold ${(trainee.amount_paid || 0) >= 3000 ? 'text-green-600' : 'text-gray-400'}`}>
                                ₪
                            </span>
                        </div>
                     </button>
                  )}
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900">{name}</h3>
                  {trainee.phone && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Phone className="w-3 h-3" />
                      <span dir="ltr">{trainee.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                     disabled={loadingId === trainee.id}
                     onClick={(e) => handleDelete(e, trainee.id, name)}
                     className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                     title="Delete"
                   >
                      <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              )}
              
              {!isAdmin && isPaid && (
                  <div className="text-green-500">
                      <Shield className="w-4 h-4 fill-green-500/20" />
                  </div>
              )}
            </Card>
          )
        })}
        
        {trainees.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <p>{'لا يوجد متدربين'}</p>
          </div>
        )}
      </div>

      {selectedTrainee && (
        <TraineeProfileModal 
            trainee={selectedTrainee as any} 
            locale={locale} 
            teamName={teamName}
            trainerName={trainerName}
            isAdmin={isAdmin}
            onClose={() => setSelectedTrainee(null)} 
        />
      )}
    </>
  )
}
