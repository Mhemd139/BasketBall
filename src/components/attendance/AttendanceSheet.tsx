'use client'

import { useRouter } from 'next/navigation'
import { useState, useCallback, memo } from 'react'
import { saveAttendance, bulkSaveAttendance } from '@/app/actions'
import { getLocalizedField, cn } from '@/lib/utils'
import { Check, X, Clock, Users, CheckCheck, XCircle } from 'lucide-react'

type AttendanceStatus = 'present' | 'absent' | 'late'

interface Trainee {
  id: string
  name_ar: string
  name_he: string
  name_en: string
  jersey_number: number | null
}

interface AttendanceRecord {
  trainee_id: string
  status: AttendanceStatus
}

interface AttendanceSheetProps {
  eventId: string
  trainees: Trainee[]
  initialAttendance: AttendanceRecord[]
  locale: string
}
// ... (rest of interfaces)

const statusCycle: AttendanceStatus[] = ['present', 'absent', 'late']

const statusConfig = {
  present: {
    icon: Check,
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    iconBg: 'bg-green-500',
    label: { ar: 'حاضر', he: 'נוכח', en: 'Present' },
  },
  absent: {
    icon: X,
    border: 'border-red-200',
    bg: 'bg-red-50',
    text: 'text-red-700',
    iconBg: 'bg-red-500',
    label: { ar: 'غائب', he: 'חסר', en: 'Absent' },
  },
  late: {
    icon: Clock,
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    iconBg: 'bg-amber-500',
    label: { ar: 'متأخر', he: 'מאחר', en: 'Late' },
  },
} as const

// Memoized item component to prevent unnecessary re-renders of the entire list
const TraineeItem = memo(({
  trainee,
  status,
  isSaving,
  onToggle,
  locale
}: {
  trainee: Trainee,
  status: AttendanceStatus,
  isSaving: boolean,
  onToggle: (id: string, currentStatus: AttendanceStatus) => void,
  locale: string
}) => {
  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <button
      onClick={() => onToggle(trainee.id, status)}
      disabled={isSaving}
      className={cn(
        'w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all active:scale-[0.98]',
        config.bg, config.border,
        isSaving && 'opacity-60'
      )}
    >
      {/* Jersey Number */}
      <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center font-bold text-lg text-gray-800 shadow-sm flex-shrink-0">
        #{trainee.jersey_number ?? '—'}
      </div>

      {/* Name */}
      <div className="flex-1 text-start min-w-0">
        <p className="font-semibold text-gray-900 truncate">
          {getLocalizedField(trainee, 'name', locale)}
        </p>
        <p className={cn('text-xs font-medium', config.text)}>
          {config.label[locale as keyof typeof config.label] || config.label.en}
        </p>
      </div>

      {/* Status Icon */}
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform',
        config.iconBg,
      )}>
        <StatusIcon className="w-5 h-5 text-white" strokeWidth={3} />
      </div>
    </button>
  )
})
TraineeItem.displayName = 'TraineeItem'

export function AttendanceSheet({ eventId, trainees, initialAttendance, locale }: AttendanceSheetProps) {
  const router = useRouter()
  const [showSuccess, setShowSuccess] = useState(false)
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>(() => {
    const map: Record<string, AttendanceStatus> = {}
    trainees.forEach(t => { map[t.id] = 'absent' })
    initialAttendance.forEach(a => { map[a.trainee_id] = a.status })
    return map
  })
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  // Updated toggleStatus to accept currentStatus, removing dependency on 'attendance' state
  const toggleStatus = useCallback(async (traineeId: string, currentStatus: AttendanceStatus) => {
    // const current = attendance[traineeId] || 'absent' // Removed usage of state
    const current = currentStatus
    const currentIndex = statusCycle.indexOf(current)
    const next = statusCycle[(currentIndex + 1) % statusCycle.length]

    // Optimistic update
    setAttendance(prev => ({ ...prev, [traineeId]: next }))
    setSaving(prev => ({ ...prev, [traineeId]: true }))

    // Use Server Action
    const result = await saveAttendance(traineeId, eventId, next)

    if (!result.success) {
      // Revert on error
      setAttendance(prev => ({ ...prev, [traineeId]: current }))
      console.error('Failed to save attendance:', result.error)
    }

    setSaving(prev => ({ ...prev, [traineeId]: false }))
  }, [eventId])

  const markAll = useCallback(async (status: AttendanceStatus) => {
    const prev = { ...attendance }
    const newAttendance: Record<string, AttendanceStatus> = {}
    trainees.forEach(t => { newAttendance[t.id] = status })
    setAttendance(newAttendance)

    const upserts = trainees.map(t => ({
      trainee_id: t.id,
      event_id: eventId,
      status,
    }))

    // Use Server Action
    const result = await bulkSaveAttendance(upserts)

    if (!result.success) {
      setAttendance(prev)
      console.error('Failed to bulk save:', result.error)
    }
  }, [attendance, trainees, eventId])

  // Counts
  const counts = {
    present: Object.values(attendance).filter(s => s === 'present').length,
    absent: Object.values(attendance).filter(s => s === 'absent').length,
    late: Object.values(attendance).filter(s => s === 'late').length,
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => markAll('present')}
          className="btn flex-1 text-sm py-2.5 px-3 rounded-xl bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
        >
          <CheckCheck className="w-4 h-4" />
          {locale === 'ar' ? 'الكل حاضر' : locale === 'he' ? 'כולם נוכחים' : 'All Present'}
        </button>
        <button
          onClick={() => markAll('absent')}
          className="btn flex-1 text-sm py-2.5 px-3 rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
        >
          <XCircle className="w-4 h-4" />
          {locale === 'ar' ? 'الكل غائب' : locale === 'he' ? 'כולם חסרים' : 'All Absent'}
        </button>
      </div>

      {/* Success Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-300 scale-105">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4 animate-bounce">
              <CheckCheck className="w-10 h-10 text-green-600" strokeWidth={3} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {locale === 'ar' ? 'تم الحفظ بنجاح!' : locale === 'he' ? 'נשמר בהצלחה!' : 'Saved Successfully!'}
            </h3>
            <p className="text-gray-500 text-sm">
              {locale === 'ar' ? 'جاري العودة...' : locale === 'he' ? 'חוזר...' : 'Returning...'}
            </p>
          </div>
        </div>
      )}

      {/* Trainee List */}
      <div className="space-y-2">
        {trainees.map((trainee) => {
          const status = attendance[trainee.id] || 'absent'
          const isSaving = saving[trainee.id] || false

          return (
            <TraineeItem
              key={trainee.id}
              trainee={trainee}
              status={status}
              isSaving={isSaving}
              onToggle={toggleStatus}
              locale={locale}
            />
          )
        })}
      </div>

      {/* Summary Bar */}
      <div className="sticky bottom-28 md:bottom-6 z-[110] transition-all duration-300 ease-in-out space-y-3">
        
        {/* Submit Button */}
        <div className="flex justify-end">
            <button 
                onClick={() => {
                   setShowSuccess(true);
                   setTimeout(() => {
                        router.back(); 
                   }, 1500);
                }}
                className="btn btn-primary shadow-xl shadow-indigo-200 animate-in slide-in-from-bottom-4"
            >
                <CheckCheck className="w-5 h-5" />
                {locale === 'ar' ? 'إنهاء وحفظ' : locale === 'he' ? 'סיום ושמירה' : 'Finish & Save'}
            </button>
        </div>

        <div className="flex items-center justify-between bg-white/95 backdrop-blur-lg rounded-2xl p-4 border shadow-lg">
          <div className="flex items-center gap-1.5 text-sm">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-600">{trainees.length}</span>
          </div>
          <div className="flex items-center gap-4 text-sm font-semibold">
            <span className="flex items-center gap-1 text-green-600">
              <Check className="w-4 h-4" strokeWidth={3} />
              {counts.present}
            </span>
            <span className="flex items-center gap-1 text-red-600">
              <X className="w-4 h-4" strokeWidth={3} />
              {counts.absent}
            </span>
            <span className="flex items-center gap-1 text-amber-600">
              <Clock className="w-4 h-4" strokeWidth={2.5} />
              {counts.late}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
