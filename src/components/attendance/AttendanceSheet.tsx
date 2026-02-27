'use client'

import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'
import { saveAttendance, bulkSaveAttendance } from '@/app/actions'
import { cn } from '@/lib/utils'
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
}
// ... (rest of interfaces)

const statusCycle: AttendanceStatus[] = ['present', 'absent', 'late']

const statusConfig = {
  present: {
    icon: Check,
    bg: 'bg-green-500/15',
    border: 'border-green-400/30',
    text: 'text-green-300',
    iconBg: 'bg-green-500',
    label: 'حاضر',
  },
  absent: {
    icon: X,
    border: 'border-red-400/30',
    bg: 'bg-red-500/15',
    text: 'text-red-300',
    iconBg: 'bg-red-500',
    label: 'غائب',
  },
  late: {
    icon: Clock,
    border: 'border-amber-400/30',
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    iconBg: 'bg-amber-500',
    label: 'متأخر',
  },
} as const

export function AttendanceSheet({ eventId, trainees, initialAttendance }: AttendanceSheetProps) {
  const router = useRouter()
  const [showSuccess, setShowSuccess] = useState(false)
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>(() => {
    const map: Record<string, AttendanceStatus> = {}
    trainees.forEach(t => { map[t.id] = 'absent' })
    initialAttendance.forEach(a => { map[a.trainee_id] = a.status })
    return map
  })
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  const toggleStatus = useCallback(async (traineeId: string) => {
    const current = attendance[traineeId] || 'absent'
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
  }, [attendance, eventId])

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
          className="btn flex-1 text-sm py-2.5 px-3 rounded-xl bg-green-500/20 text-green-300 border border-green-400/30 hover:bg-green-500/30 transition-colors"
        >
          <CheckCheck className="w-4 h-4" />
          {'الكل حاضر'}
        </button>
        <button
          onClick={() => markAll('absent')}
          className="btn flex-1 text-sm py-2.5 px-3 rounded-xl bg-red-500/20 text-red-300 border border-red-400/30 hover:bg-red-500/30 transition-colors"
        >
          <XCircle className="w-4 h-4" />
          {'الكل غائب'}
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
              {'تم الحفظ بنجاح!'}
            </h3>
            <p className="text-gray-500 text-sm">
              {'جاري العودة...'}
            </p>
          </div>
        </div>
      )}

      {/* Trainee List */}
      <div className="space-y-2">
        {trainees.map((trainee) => {
          const status = attendance[trainee.id] || 'absent'
          const config = statusConfig[status]
          const StatusIcon = config.icon
          const isSaving = saving[trainee.id]

          return (
            <button
              key={trainee.id}
              onClick={() => toggleStatus(trainee.id)}
              disabled={isSaving}
              className={cn(
                'w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all active:scale-[0.98]',
                config.bg, config.border,
                isSaving && 'opacity-60'
              )}
            >
              {/* Jersey Number */}
              <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center font-bold text-lg text-white shadow-sm flex-shrink-0">
                #{trainee.jersey_number ?? '—'}
              </div>

              {/* Name */}
              <div className="flex-1 text-start min-w-0">
                <p className="font-semibold text-white truncate">
                  {trainee.name_ar}
                </p>
                <p className={cn('text-xs font-medium', config.text)}>
                  {config.label}
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
        })}
      </div>

      {/* Summary Bar + Submit — in-flow, sticky to bottom of viewport */}
      <div className="sticky bottom-[72px] md:bottom-0 z-30 mt-4 px-1">
        <div className="flex items-center justify-between bg-white/10 backdrop-blur-lg rounded-2xl p-3 border border-white/20 shadow-lg gap-3">
          <button
            onClick={() => {
              setShowSuccess(true);
              setTimeout(() => {
                router.back();
              }, 1500);
            }}
            className="btn btn-primary shadow-lg shadow-indigo-200 text-sm py-2.5 px-4 flex-shrink-0"
          >
            <CheckCheck className="w-4 h-4" />
            {'إنهاء وحفظ'}
          </button>

          <div className="flex items-center gap-3 text-sm font-semibold">
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
            <span className="flex items-center gap-1.5 text-white/50">
              <Users className="w-4 h-4" />
              <span className="font-medium text-white/70">{trainees.length}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
