'use client'

import { useState, useTransition } from 'react'
import { Clock, Check, X } from 'lucide-react'
import { updateEventTime } from '@/app/actions'
import { useToast } from '@/components/ui/Toast'
import { useRouter } from 'next/navigation'
import { ScrollTimePicker } from '@/components/ui/ScrollTimePicker'

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
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        if (eh * 60 + em <= sh * 60 + sm) {
            toast('وقت النهاية يجب أن يكون بعد وقت البداية', 'error');
            return;
        }
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
        <div className="w-full mt-3">
            <div className="flex flex-col gap-4">
                <ScrollTimePicker value={start} onChange={setStart} label="وقت البدء" />
                <ScrollTimePicker value={end} onChange={setEnd} label="وقت الانتهاء" />
            </div>
            <div className="flex gap-3 mt-4">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isPending}
                    className="flex-1 h-12 rounded-2xl bg-green-500 text-white font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-colors active:scale-95 disabled:opacity-50"
                >
                    <Check className="w-4 h-4" />
                    حفظ
                </button>
                <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isPending}
                    className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-600 font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors active:scale-95 disabled:opacity-50"
                >
                    <X className="w-4 h-4" />
                    إلغاء
                </button>
            </div>
        </div>
    )
}
