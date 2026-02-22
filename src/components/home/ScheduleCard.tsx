'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getOrCreateEventForSchedule } from '@/app/actions'
import { getLocalizedField } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Building2, User, Clock } from 'lucide-react'

interface ScheduleCardProps {
    schedule: {
        id: string
        start_time: string
        end_time: string
        classes: {
            id: string
            name_he: string
            name_ar: string
            name_en: string
            trainers: { name_he: string; name_ar: string; name_en: string } | null
            categories: { name_he: string; name_ar: string; name_en: string } | null
        } | null
        halls: { id: string; name_he: string; name_ar: string; name_en: string } | null
    }
    locale: string
    date: string
    index: number
}

export function ScheduleCard({ schedule, locale, date, index }: ScheduleCardProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleClick = async () => {
        if (loading) return
        setLoading(true)
        try {
            const res = await getOrCreateEventForSchedule(schedule.id, date)
            if (res.success && res.eventId) {
                router.push(`/${locale}/attendance/${res.eventId}`)
            }
        } finally {
            setLoading(false)
        }
    }

    const teamName = schedule.classes ? getLocalizedField(schedule.classes, 'name', locale) : 'تدريب'
    const categoryName = schedule.classes?.categories ? getLocalizedField(schedule.classes.categories, 'name', locale) : null
    const trainerName = schedule.classes?.trainers ? getLocalizedField(schedule.classes.trainers, 'name', locale) : null
    const hallName = schedule.halls ? getLocalizedField(schedule.halls, 'name', locale) : null
    const startTime = schedule.start_time?.slice(0, 5) // "15:30"
    const endTime = schedule.end_time?.slice(0, 5)

    return (
        <button onClick={handleClick} disabled={loading} className="w-full text-start">
            <Card interactive className={`animate-fade-in-up stagger-${Math.min(index + 1, 5)} overflow-hidden relative group hover:-translate-y-1 transition-all ${loading ? 'opacity-70' : ''}`}>
                {loading && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 backdrop-blur-[2px] rounded-3xl">
                        <div className="w-8 h-8 rounded-full border-3 border-white/30 border-t-white animate-spin" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-center gap-4 relative z-10">
                    {/* Time Block */}
                    <div className="text-center min-w-[3.5rem] shrink-0 bg-white/10 p-2.5 rounded-xl border border-white/5">
                        <div className="text-sm font-black text-white drop-shadow-md leading-none" dir="ltr">
                            {startTime}
                        </div>
                        <div className="text-[10px] text-indigo-200/40 font-bold mt-1" dir="ltr">
                            {endTime}
                        </div>
                    </div>

                    {/* Type Indicator Bar */}
                    <div className="w-1 h-12 rounded-full shrink-0 bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.4)]" />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-green-300 bg-green-500/15 px-2 py-0.5 rounded-md border border-green-500/20">
                                {'تدريب'}
                            </span>
                            {categoryName && (
                                <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded-md border border-indigo-500/20 truncate">
                                    {categoryName}
                                </span>
                            )}
                        </div>
                        <h3 className="font-bold text-white text-sm truncate leading-tight mb-1 drop-shadow-md">
                            {categoryName ? `${teamName} - ${categoryName}` : teamName}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-indigo-200/60 font-medium">
                            {hallName && (
                                <span className="flex items-center gap-1 truncate">
                                    <Building2 className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{hallName}</span>
                                </span>
                            )}
                            {trainerName && (
                                <span className="flex items-center gap-1 truncate">
                                    <User className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{trainerName}</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        </button>
    )
}
