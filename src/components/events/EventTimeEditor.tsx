'use client'

import { useState, useTransition } from 'react'
import { Clock, Check, X } from 'lucide-react'
import { updateEventTime } from '@/app/actions'
import { useToast } from '@/components/ui/Toast'
import { useRouter } from 'next/navigation'

interface EventTimeEditorProps {
    eventId: string
    startTime: string
    endTime: string
}

export function EventTimeEditor({ eventId, startTime, endTime }: EventTimeEditorProps) {
    const [editing, setEditing] = useState(false)
    const [start, setStart] = useState(startTime.slice(0, 5))
    const [end, setEnd] = useState(endTime.slice(0, 5))
    const [isPending, startTransition] = useTransition()
    const { toast } = useToast()
    const router = useRouter()

    const handleSave = () => {
        startTransition(async () => {
            const res = await updateEventTime(eventId, start + ':00', end + ':00')
            if (res.success) {
                toast('تم تحديث الوقت', 'success')
                setEditing(false)
                router.refresh()
            } else {
                toast(res.error || 'فشل تحديث الوقت', 'error')
            }
        })
    }

    const handleCancel = () => {
        setStart(startTime.slice(0, 5))
        setEnd(endTime.slice(0, 5))
        setEditing(false)
    }

    if (!editing) {
        return (
            <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors group"
            >
                <Clock className="w-4 h-4" />
                <span>{startTime.slice(0, 5)} - {endTime.slice(0, 5)}</span>
                <span className="text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">{'تعديل'}</span>
            </button>
        )
    }

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
            <input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                aria-label="Start time"
                className="bg-white/80 border border-indigo-200 rounded-lg px-2 py-1 text-sm font-bold text-navy-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-[100px]"
            />
            <span className="text-gray-400 text-sm">-</span>
            <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                aria-label="End time"
                className="bg-white/80 border border-indigo-200 rounded-lg px-2 py-1 text-sm font-bold text-navy-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-[100px]"
            />
            <button
                onClick={handleSave}
                disabled={isPending}
                aria-label="Save time"
                className="w-8 h-8 rounded-lg bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors active:scale-95 disabled:opacity-50"
            >
                <Check className="w-4 h-4" />
            </button>
            <button
                onClick={handleCancel}
                disabled={isPending}
                aria-label="Cancel"
                className="w-8 h-8 rounded-lg bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-300 transition-colors active:scale-95 disabled:opacity-50"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}
