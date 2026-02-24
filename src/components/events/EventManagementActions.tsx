'use client'

import { useState } from 'react'
import { InteractiveEventModal } from '@/components/halls/InteractiveEventModal'
import { Pencil, Trash2 } from 'lucide-react'
import { upsertEvent, deleteEvent } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import type { Database } from '@/lib/supabase/types'

type EventRow = Database['public']['Tables']['events']['Row']

interface EventManagementActionsProps {
    event: EventRow
    locale: string
}

export function EventManagementActions({ event, locale }: EventManagementActionsProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [initialStep, setInitialStep] = useState<'type' | 'delete-confirm'>('type')
    const router = useRouter()
    const { toast } = useToast()

    const handleSave = async (eventData: any) => {
        const res = await upsertEvent({ ...eventData, id: event.id })
        if (res.success) {
            setIsOpen(false)
            toast('تم تحديث الحدث بنجاح', 'success')
            router.refresh()
        } else {
            toast(res.error || 'فشل تحديث الحدث', 'error')
        }
    }

    const handleDelete = async (eventId: string) => {
        const res = await deleteEvent(eventId)
        if (res.success) {
            setIsOpen(false)
            toast('تم حذف الحدث بنجاح', 'success')
            router.push(`/${locale}/schedule`)
        } else {
            toast('فشل حذف الحدث', 'error')
        }
    }

    return (
        <>
            <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm border border-white/50 shadow-sm rounded-2xl p-1.5 transition-all hover:shadow-md hover:bg-white">
                <button 
                    onClick={() => {
                        setInitialStep('type');
                        setIsOpen(true);
                    }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-navy-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-95"
                    title={'تعديل الحدث'}
                >
                    <Pencil className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-gray-200 mx-0.5"></div>
                <button 
                    onClick={() => {
                        setInitialStep('delete-confirm');
                        setIsOpen(true);
                    }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-navy-400 hover:bg-red-50 hover:text-red-500 transition-all active:scale-95 group"
                    title={'حذف الحدث'}
                >
                    <Trash2 className="w-4 h-4 transition-transform group-hover:rotate-12" />
                </button>
            </div>

            <InteractiveEventModal 
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onSave={handleSave}
                onDelete={handleDelete}
                initialEvent={event}
                initialDate={new Date(event.event_date)}
                locale={locale}
                initialStep={initialStep}
            />
        </>
    )
}
