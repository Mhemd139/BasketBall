'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteTrainee, toggleTraineePayment } from '@/app/actions'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmModal'
import { Trash2, Shield, Phone } from 'lucide-react'
import { JerseyNumber } from '@/components/ui/JerseyNumber'
import { TraineeProfileModal } from '@/components/trainees/TraineeProfileModal'

interface Trainee {
  id: string
  name_en: string
  name_ar: string
  name_he: string
  phone?: string | null
  jersey_number?: number | null
  is_paid?: boolean | null
  amount_paid?: number | null
  payment_comment_en?: string | null
  payment_comment_ar?: string | null
  payment_comment_he?: string | null
  gender?: string | null
}

type AttendanceStats = { total: number; present: number; late: number; absent: number }

interface TraineeListProps {
  trainees: Trainee[]
  locale: string
  isAdmin: boolean
  teamName?: string
  trainerName?: string
  attendanceStatsMap?: Record<string, AttendanceStats>
}

export function TraineeList({ trainees, locale, isAdmin, teamName, trainerName, attendanceStatsMap }: TraineeListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation()
    const confirmed = await confirm({
      title: 'حذف اللاعب',
      message: `هل أنت متأكد من حذف ${name}؟`,
      confirmText: 'حذف',
      cancelText: 'إلغاء',
      variant: 'danger',
    })
    if (!confirmed) return

    setLoadingId(id)
    const res = await deleteTrainee(id)
    setLoadingId(null)
    if (res.success) {
      toast('تم حذف اللاعب بنجاح', 'success')
      router.refresh()
    } else {
      toast('فشل الحذف', 'error')
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

  if (trainees.length === 0) {
    return (
      <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
        <p className="text-white/40 font-medium">{'لا يوجد متدربين'}</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {trainees.map((trainee) => {
          const name = trainee.name_ar
          const isPaid = trainee.is_paid

          const isFemale = trainee.gender === 'female'

          return (
            <div
              key={trainee.id}
              onClick={() => setSelectedTrainee(trainee)}
              className={`group flex items-center justify-between gap-3 px-4 py-3.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 hover:border-white/20 active:scale-[0.99] transition-all touch-manipulation border-r-2 ${isFemale ? 'border-r-pink-400' : 'border-r-indigo-400'}`}
            >
              <div className="flex items-center gap-3">
                {/* Jersey number — always shown, gender-colored */}
                <div className="relative flex-shrink-0">
                  <JerseyNumber number={trainee.jersey_number} gender={trainee.gender} className="w-12 h-12 text-base" />

                  {/* Payment indicator */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={(e) => handleTogglePaid(e, trainee.id, !!isPaid)}
                      className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#0B132B] border border-white/20 flex items-center justify-center shadow-md"
                      title={`${trainee.amount_paid || 0} / 3000 ₪`}
                      aria-label={`الدفع: ${trainee.amount_paid || 0} / 3000 ₪`}
                    >
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={(trainee.amount_paid || 0) >= 3000 ? '#22c55e' : '#6366f1'}
                          strokeWidth="4"
                          strokeDasharray={`${Math.min(100, Math.max(0, ((trainee.amount_paid || 0) / 3000) * 100))}, 100`}
                        />
                      </svg>
                      <span className={`absolute text-[8px] font-black ${(trainee.amount_paid || 0) >= 3000 ? 'text-green-400' : 'text-white/50'}`}>
                        ₪
                      </span>
                    </button>
                  )}
                </div>

                {/* Name + phone */}
                <div>
                  <p className="font-bold text-white text-sm">{name}</p>
                  {trainee.phone && (
                    <div className="flex items-center gap-1 text-xs text-white/40 mt-0.5">
                      <Phone className="w-3 h-3" />
                      <span dir="ltr">{trainee.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {!isAdmin && isPaid && (
                  <Shield className="w-4 h-4 text-green-400 fill-green-400/20" />
                )}
                {isAdmin && (
                  <button
                    type="button"
                    disabled={loadingId === trainee.id}
                    onClick={(e) => handleDelete(e, trainee.id, name)}
                    className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                    aria-label={`حذف ${name}`}
                    title={`حذف ${name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {selectedTrainee && (
        <TraineeProfileModal
          trainee={selectedTrainee as any}
          locale={locale}
          teamName={teamName}
          trainerName={trainerName}
          isAdmin={isAdmin}
          attendanceStats={attendanceStatsMap?.[selectedTrainee.id]}
          onClose={() => setSelectedTrainee(null)}
        />
      )}
    </>
  )
}
