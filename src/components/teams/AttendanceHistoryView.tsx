'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ar, he } from 'date-fns/locale'
import { createPortal } from 'react-dom'
import { BouncingBasketballLoader } from '@/components/ui/BouncingBasketballLoader'

interface AttendanceHistoryViewProps {
    data: {
        trainees: { id: string; name_ar: string; name_en: string }[]
        events: { id: string; event_date: string; type: string; title_ar: string; title_en: string; title_he: string; start_time: string }[]
        attendanceMap: Record<string, string>
        reasonMap?: Record<string, string>
    }
    locale: string
    classId?: string
    hasGymTrainer?: boolean
    onTabChange?: (tab: 'basketball' | 'gym') => void
}

function fmtDate(dateString: string, formatStr: string, locale: string) {
    try {
        return format(parseISO(dateString), formatStr, { locale: locale === 'he' ? he : ar })
    } catch {
        return dateString
    }
}

export function AttendanceHistoryView({ data, locale, hasGymTrainer, onTabChange }: AttendanceHistoryViewProps) {
    const router = useRouter()
    const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
    const [navigating, setNavigating] = useState(false)
    const [activeTab, setActiveTab] = useState<'basketball' | 'gym'>('basketball')
    const { trainees, events, attendanceMap, reasonMap = {} } = data

    const totalSlots = trainees.length * events.length
    const presentCount = Object.values(attendanceMap).filter(s => s === 'present').length
    const lateCount = Object.values(attendanceMap).filter(s => s === 'late').length
    const absentCount = totalSlots - presentCount - lateCount
    const attendanceRate = totalSlots > 0 ? Math.round((presentCount / totalSlots) * 100) : 0

    useEffect(() => { setNavigating(false) }, [data])

    const handleEdit = (eventId: string) => {
        setNavigating(true)
        router.push(`/${locale}/attendance/${eventId}`)
    }

    if (events.length === 0) {
        return (
            <div className="text-center py-16">
                <p className="text-white/30 font-medium text-sm">لا توجد سجلات حضور في آخر 30 يوم</p>
            </div>
        )
    }

    const handleTabSwitch = (tab: 'basketball' | 'gym') => {
        setActiveTab(tab)
        onTabChange?.(tab)
    }

    return (
        <div className="space-y-4" dir="rtl">
            {/* Basketball/Gym filter tabs */}
            {hasGymTrainer && (
                <div className="flex gap-2">
                    <button
                        onClick={() => handleTabSwitch('basketball')}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'basketball'
                                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                : 'bg-white/5 text-white/40 border border-white/10'
                        }`}
                    >
                        كرة سلة
                    </button>
                    <button
                        onClick={() => handleTabSwitch('gym')}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'gym'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-white/5 text-white/40 border border-white/10'
                        }`}
                    >
                        لياقة بدنية
                    </button>
                </div>
            )}

            {/* Navigation overlay — app-wide basketball loader */}
            {navigating && typeof window !== 'undefined' && createPortal(
                <div className="fixed inset-0 bg-[#0B132B]/90 backdrop-blur-3xl flex flex-col items-center justify-center z-[200]">
                    <BouncingBasketballLoader />
                </div>,
                document.body
            )}

            {/* Summary card */}
            <div className="rounded-2xl bg-white/[0.07] ring-1 ring-white/10 p-4">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">الإحصائيات العامة</p>
                <div className="grid grid-cols-4 gap-2">
                    <div className="flex flex-col items-center gap-1 rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/20 py-3">
                        <span className="text-xl font-black text-indigo-300 leading-none">{events.length}</span>
                        <span className="text-[10px] font-bold text-indigo-400/60">حصص</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 rounded-xl bg-green-500/10 ring-1 ring-green-500/20 py-3">
                        <span className="text-xl font-black text-green-400 leading-none">{attendanceRate}%</span>
                        <span className="text-[10px] font-bold text-green-400/60">حضور</span>
                    </div>
                    <div className={`flex flex-col items-center gap-1 rounded-xl py-3 ${lateCount > 0 ? 'bg-amber-500/10 ring-1 ring-amber-500/20' : 'bg-white/[0.04] ring-1 ring-white/8'}`}>
                        <span className={`text-xl font-black leading-none ${lateCount > 0 ? 'text-amber-400' : 'text-white/25'}`}>{lateCount}</span>
                        <span className={`text-[10px] font-bold ${lateCount > 0 ? 'text-amber-400/60' : 'text-white/20'}`}>متأخر</span>
                    </div>
                    <div className={`flex flex-col items-center gap-1 rounded-xl py-3 ${absentCount > 0 ? 'bg-red-500/10 ring-1 ring-red-500/20' : 'bg-white/[0.04] ring-1 ring-white/8'}`}>
                        <span className={`text-xl font-black leading-none ${absentCount > 0 ? 'text-red-400' : 'text-white/25'}`}>{absentCount}</span>
                        <span className={`text-[10px] font-bold ${absentCount > 0 ? 'text-red-400/60' : 'text-white/20'}`}>غائب</span>
                    </div>
                </div>
            </div>

            {/* Event cards */}
            <div className="space-y-2">
                {events.map(event => {
                    const isExpanded = expandedEventId === event.id

                    let evPresent = 0, evLate = 0, evAbsent = 0
                    trainees.forEach(t => {
                        const s = attendanceMap[`${event.id}_${t.id}`]
                        if (s === 'present') evPresent++
                        else if (s === 'late') evLate++
                        else evAbsent++
                    })

                    return (
                        <div key={event.id} className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                            {/* Card header row */}
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedEventId(isExpanded ? null : event.id) } }}
                                aria-expanded={isExpanded}
                                className="flex items-center min-h-[56px] px-4 py-3.5 cursor-pointer transition-colors hover:bg-white/5 active:bg-white/10 touch-manipulation"
                            >
                                <div className="flex-1 flex items-center justify-between text-right">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-black text-white">
                                                {fmtDate(event.event_date, 'd MMMM', locale)}
                                            </span>
                                            <span className="text-[11px] text-white/40">
                                                {fmtDate(event.event_date, 'EEEE', locale)}
                                            </span>
                                            <span dir="ltr" className="text-[11px] text-white/30 font-mono">
                                                {event.start_time?.slice(0, 5)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-white/40 mt-0.5 truncate">
                                            {locale === 'he' ? (event.title_he || event.title_ar) : event.title_ar}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0 mr-3">
                                        <div className="flex items-center gap-1.5">
                                            {evPresent > 0 && (
                                                <span className="flex items-center gap-0.5 text-[11px] font-black text-green-400">
                                                    <CheckCircle2 className="w-3 h-3" />{evPresent}
                                                </span>
                                            )}
                                            {evLate > 0 && (
                                                <span className="flex items-center gap-0.5 text-[11px] font-black text-amber-400">
                                                    <Clock className="w-3 h-3" />{evLate}
                                                </span>
                                            )}
                                            {evAbsent > 0 && (
                                                <span className="flex items-center gap-0.5 text-[11px] font-black text-red-400">
                                                    <XCircle className="w-3 h-3" />{evAbsent}
                                                </span>
                                            )}
                                        </div>
                                        {isExpanded
                                            ? <ChevronUp className="w-4 h-4 text-white/30" />
                                            : <ChevronDown className="w-4 h-4 text-white/30" />
                                        }
                                    </div>
                                </div>

                                {/* Edit button */}
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleEdit(event.id) }}
                                    className="px-3 py-2 rounded-xl text-[10px] font-black bg-electric/15 text-electric border border-electric/30 hover:bg-electric/25 hover:text-white active:scale-95 transition-all shrink-0"
                                >
                                    تعديل الحضور
                                </button>
                            </div>

                            {/* Expanded trainee list */}
                            {isExpanded && (
                                <div className="border-t border-white/8 px-4 py-1.5 space-y-0.5 animate-in fade-in duration-200">
                                    {trainees.map(trainee => {
                                        const key = `${event.id}_${trainee.id}`
                                        const status = attendanceMap[key]
                                        const reason = reasonMap[key]
                                        const isAbsent = !status || status === 'absent'
                                        const isLate = status === 'late'

                                        return (
                                            <div key={trainee.id} className="flex items-center justify-between py-1.5 gap-2">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <span className="text-sm text-white/80 truncate">{trainee.name_ar}</span>
                                                    {reason && (
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full truncate max-w-[120px] shrink ${
                                                            isAbsent
                                                                ? 'bg-red-500/15 text-red-300 border border-red-500/20'
                                                                : isLate
                                                                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                                                                    : 'bg-white/10 text-white/40'
                                                        }`}>
                                                            {reason}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-shrink-0">
                                                    {status === 'present' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                                                    {isLate && <Clock className="w-4 h-4 text-amber-400" />}
                                                    {isAbsent && <XCircle className="w-4 h-4 text-red-400" />}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
