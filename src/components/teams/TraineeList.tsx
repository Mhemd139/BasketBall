'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { deleteTrainee, toggleTraineePayment } from '@/app/actions'
import { TraineeProfileModal } from '@/components/trainees/TraineeProfileModal'
import { TraineeItem, Trainee } from './TraineeItem'

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

  const handleDelete = useCallback(async (e: React.MouseEvent, id: string, name: string) => {
     e.stopPropagation()
     if (!confirm(locale === 'ar' ? `حذف ${name}؟` : locale === 'he' ? `למחוק את ${name}?` : `Delete ${name}?`)) return
     
     setLoadingId(id)
     const res = await deleteTrainee(id)
     setLoadingId(null)
     if (res.success) {
        router.refresh()
     } else {
        alert('Failed to delete')
     }
  }, [locale, router])

  const handleTogglePaid = useCallback(async (e: React.MouseEvent, id: string, currentStatus: boolean) => {
    e.stopPropagation()
    if (!isAdmin) return
    setLoadingId(id)
    const res = await toggleTraineePayment(id, !currentStatus)
    setLoadingId(null)
    if (res.success) {
      router.refresh()
    }
  }, [isAdmin, router])

  const handleSelect = useCallback((trainee: Trainee) => {
      setSelectedTrainee(trainee)
  }, [])

  return (
    <>
      <div className="grid gap-4">
        {trainees.map((trainee) => (
           <TraineeItem
              key={trainee.id}
              trainee={trainee}
              locale={locale}
              isAdmin={isAdmin}
              isLoading={loadingId === trainee.id}
              onDelete={handleDelete}
              onTogglePaid={handleTogglePaid}
              onSelect={handleSelect}
           />
        ))}
        
        {trainees.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <p>{locale === 'ar' ? 'لا يوجد متدربين' : locale === 'he' ? 'אין מתאמנים' : 'No trainees yet'}</p>
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
