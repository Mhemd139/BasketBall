'use client'

import { useState } from 'react'
import { InteractiveEventModal } from '@/components/halls/InteractiveEventModal'
import { Pencil, Trash2, Clock, MapPin, Dumbbell, Swords, Trophy } from 'lucide-react'
import { upsertEvent, deleteEvent } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { formatDate, getLocalizedField } from '@/lib/utils'

type Step = 'type' | 'details' | 'time' | 'review' | 'delete-confirm'

interface EventInfoCardsProps {
    event: {
        id: string
        type: string
        event_date: string
        class_id: string | null
        trainer_id: string | null
        hall_id: string | null
        title_ar: string | null
        title_he: string | null
        title_en: string | null
        start_time: string
        end_time: string
        notes_en: string | null
    }
    trainerName: string | null
    className: string | null
    hallName: string | null
    locale: string
    date: string
}

const typeConfig = {
    training: { label: 'تدريب', icon: Dumbbell, color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20' },
    game: { label: 'مباراة', icon: Trophy, color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/20' },
    gym: { label: 'لياقة بدنية', icon: Swords, color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/20' },
} as const

export function EventInfoCards({ event, trainerName, className, hallName, locale, date }: EventInfoCardsProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [initialStep, setInitialStep] = useState<Step>('type')
    const router = useRouter()
    const { toast } = useToast()

    const openModal = (step: Step) => {
        setInitialStep(step)
        setIsOpen(true)
    }

    const handleSave = async (eventData: Parameters<typeof upsertEvent>[0]) => {
        const hallId = eventData.hall_id ?? event.hall_id
        if (!hallId) {
            toast('لا يمكن حفظ الحدث بدون قاعة', 'error')
            return
        }
        const res = await upsertEvent({ ...eventData, id: event.id, hall_id: hallId })
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
            if (event.hall_id) {
                router.push(`/${locale}/halls/${event.hall_id}`)
            } else {
                router.push(`/${locale}/schedule`)
            }
        } else {
            toast('فشل حذف الحدث', 'error')
        }
    }

    const config = typeConfig[event.type as keyof typeof typeConfig] || typeConfig.training
    const TypeIcon = config.icon

    return (
        <>
            <section className="py-4 space-y-3">
                {/* Title + Date + Delete */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <h1 className="text-lg font-semibold text-white truncate">
                            {getLocalizedField(event, 'title', locale)}
                        </h1>
                        <span className="text-xs text-white/40 shrink-0">{formatDate(date, locale)}</span>
                    </div>
                    <button
                        onClick={() => openModal('delete-confirm')}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                        aria-label="حذف الحدث"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                {/* Info Cards Row */}
                <div className="grid grid-cols-3 gap-2">
                    {/* Card 1: Type */}
                    <button
                        onClick={() => openModal('type')}
                        className={`bg-white/5 border border-white/10 rounded-2xl p-3 text-right transition-all hover:bg-white/[0.08] hover:border-white/15 active:scale-[0.98] group relative`}
                    >
                        <Pencil className="w-3 h-3 text-white/20 group-hover:text-white/40 transition-colors absolute top-2 left-2" />
                        <div className={`w-8 h-8 rounded-xl ${config.bg} ${config.border} border flex items-center justify-center mb-2`}>
                            <TypeIcon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        <p className="text-xs text-white/40 mb-0.5">النوع</p>
                        <p className={`text-sm font-semibold ${config.color}`}>{config.label}</p>
                    </button>

                    {/* Card 2: Trainer + Team */}
                    <button
                        onClick={() => openModal('details')}
                        className="bg-white/5 border border-white/10 rounded-2xl p-3 text-right transition-all hover:bg-white/[0.08] hover:border-white/15 active:scale-[0.98] group relative"
                    >
                        <Pencil className="w-3 h-3 text-white/20 group-hover:text-white/40 transition-colors absolute top-2 left-2" />
                        <p className="text-xs text-white/40 mb-1">المدرب</p>
                        <p className="text-sm font-semibold text-white/90 truncate">{trainerName || '—'}</p>
                        <p className="text-xs text-white/40 mt-1.5 truncate">{className || '—'}</p>
                    </button>

                    {/* Card 3: Time + Hall */}
                    <button
                        onClick={() => openModal('time')}
                        className="bg-white/5 border border-white/10 rounded-2xl p-3 text-right transition-all hover:bg-white/[0.08] hover:border-white/15 active:scale-[0.98] group relative"
                    >
                        <Pencil className="w-3 h-3 text-white/20 group-hover:text-white/40 transition-colors absolute top-2 left-2" />
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <Clock className="w-3.5 h-3.5 text-white/40" />
                            <span className="text-sm font-semibold text-white/90">
                                {event.start_time.slice(0, 5)}
                            </span>
                        </div>
                        <p className="text-xs text-white/50">{event.end_time.slice(0, 5)} ←</p>
                        {hallName && (
                            <div className="flex items-center gap-1 mt-1.5">
                                <MapPin className="w-3 h-3 text-white/30" />
                                <span className="text-xs text-white/40 truncate">{hallName}</span>
                            </div>
                        )}
                    </button>
                </div>
            </section>

            <InteractiveEventModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onSave={handleSave}
                onDelete={handleDelete}
                initialEvent={event}
                initialDate={(() => { const [y, m, d] = event.event_date.split('-').map(Number); return new Date(y, m - 1, d) })()}
                locale={locale}
                initialStep={initialStep}
            />
        </>
    )
}
