'use client'

import { useState, useTransition } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { updateClassSchedule } from '@/app/actions'
import { useToast } from '@/components/ui/Toast'
import { useRouter } from 'next/navigation'

interface Schedule {
    id: string
    day_of_week: number
    start_time: string
    end_time: string
    halls: { id: string; name_he: string; name_ar: string; name_en: string } | null
}

interface Hall {
    id: string
    name_ar: string
    name_he: string
    name_en: string
}

interface ScheduleEditorProps {
    schedules: Schedule[]
    halls: Hall[]
    locale: string
}

const dayLabels: Record<number, string> = {
    0: 'الأحد', 1: 'الإثنين', 2: 'الثلاثاء', 3: 'الأربعاء',
    4: 'الخميس', 5: 'الجمعة', 6: 'السبت',
}

export function ScheduleEditor({ schedules, halls, locale }: ScheduleEditorProps) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [hallId, setHallId] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [isPending, startTransition] = useTransition()
    const { toast } = useToast()
    const router = useRouter()

    const getLocName = (obj: { name_ar: string; name_he: string; name_en: string }) => {
        const key = `name_${locale}` as keyof typeof obj
        return obj[key] || obj.name_ar
    }

    const startEdit = (s: Schedule) => {
        setEditingId(s.id)
        setHallId(s.halls?.id || '')
        setStartTime(s.start_time.slice(0, 5))
        setEndTime(s.end_time.slice(0, 5))
    }

    const handleSave = () => {
        if (!editingId || !hallId) return
        startTransition(async () => {
            const res = await updateClassSchedule(editingId, hallId, startTime + ':00', endTime + ':00')
            if (res.success) {
                toast('تم تحديث الجدول', 'success')
                setEditingId(null)
                router.refresh()
            } else {
                toast(res.error || 'فشل التحديث', 'error')
            }
        })
    }

    const validSchedules = schedules.filter(s => s.start_time !== '00:00:00')
        .sort((a, b) => a.day_of_week - b.day_of_week)

    if (validSchedules.length === 0) {
        return <p className="font-black text-navy-900 text-sm">{'غير محدد'}</p>
    }

    return (
        <div className="space-y-2">
            {validSchedules.map(s => (
                <div key={s.id}>
                    {editingId === s.id ? (
                        <div className="space-y-2 bg-gray-50 p-3 rounded-xl">
                            <div className="flex items-center gap-2 text-sm font-bold text-navy-900">
                                {dayLabels[s.day_of_week]}
                            </div>
                            <select
                                value={hallId}
                                onChange={e => setHallId(e.target.value)}
                                aria-label="Select hall"
                                className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm font-medium"
                            >
                                <option value="">{'اختر القاعة'}</option>
                                {halls.map(h => (
                                    <option key={h.id} value={h.id}>{getLocName(h)}</option>
                                ))}
                            </select>
                            <div className="flex items-center gap-2">
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={e => setStartTime(e.target.value)}
                                    aria-label="Start time"
                                    className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm font-bold flex-1"
                                />
                                <span className="text-gray-400">-</span>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={e => setEndTime(e.target.value)}
                                    aria-label="End time"
                                    className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm font-bold flex-1"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSave}
                                    disabled={isPending}
                                    aria-label="Save"
                                    className="flex-1 flex items-center justify-center gap-1 bg-green-500 text-white rounded-lg py-1.5 text-sm font-bold hover:bg-green-600 transition-colors disabled:opacity-50"
                                >
                                    <Check className="w-4 h-4" />
                                    {'حفظ'}
                                </button>
                                <button
                                    onClick={() => setEditingId(null)}
                                    disabled={isPending}
                                    aria-label="Cancel"
                                    className="flex items-center justify-center px-3 bg-gray-200 text-gray-600 rounded-lg py-1.5 text-sm hover:bg-gray-300 transition-colors disabled:opacity-50"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => startEdit(s)}
                            className="w-full flex items-center gap-2 text-sm group hover:bg-gray-50 rounded-lg p-1 -m-1 transition-colors"
                        >
                            <span className="font-bold text-navy-900">{dayLabels[s.day_of_week]}</span>
                            <span dir="ltr" className="text-gray-600 font-medium">{s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}</span>
                            {s.halls && (
                                <span className="text-gray-400 text-xs">• {getLocName(s.halls)}</span>
                            )}
                            <Pencil className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity ms-auto" />
                        </button>
                    )}
                </div>
            ))}
        </div>
    )
}
