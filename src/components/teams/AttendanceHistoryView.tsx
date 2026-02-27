'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ar, he } from 'date-fns/locale'

interface AttendanceHistoryViewProps {
    data: {
        trainees: { id: string; name_ar: string; name_en: string }[]
        events: { id: string; event_date: string; type: string; title_ar: string; title_en: string; title_he: string; start_time: string }[]
        attendanceMap: Record<string, string>
    }
    locale: string
}

function formatDate(dateString: string, formatStr: string, locale: string) {
    try {
        return format(parseISO(dateString), formatStr, { locale: locale === 'he' ? he : ar })
    } catch {
        return dateString
    }
}

export function AttendanceHistoryView({ data, locale }: AttendanceHistoryViewProps) {
    const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
    const { trainees, events, attendanceMap } = data

    // Summary stats
    const totalRecords = Object.keys(attendanceMap).length
    const presentCount = Object.values(attendanceMap).filter(s => s === 'present').length
    const lateCount = Object.values(attendanceMap).filter(s => s === 'late').length
    const absentCount = Object.values(attendanceMap).filter(s => s === 'absent').length
    const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0

    if (events.length === 0) {
        return (
            <div className="text-center py-16">
                <p className="text-white/30 font-medium text-sm">لا توجد سجلات حضور في آخر 30 يوم</p>
            </div>
        )
    }

    return (
        <div className="space-y-4" dir="rtl">
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

                    // Per-event counts
                    let evPresent = 0, evLate = 0, evAbsent = 0
                    trainees.forEach(t => {
                        const s = attendanceMap[`${event.id}_${t.id}`]
                        if (s === 'present') evPresent++
                        else if (s === 'late') evLate++
                        else if (s === 'absent') evAbsent++
                    })

                    return (
                        <div key={event.id} className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                            {/* Card header — tap to expand */}
                            <button
                                type="button"
                                onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                                className="w-full flex items-center justify-between px-4 py-3.5 text-right transition-colors hover:bg-white/5 active:bg-white/10 touch-manipulation min-h-[56px]"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-black text-white">
                                            {formatDate(event.event_date, 'd MMMM', locale)}
                                        </span>
                                        <span className="text-[11px] text-white/40">
                                            {formatDate(event.event_date, 'EEEE', locale)}
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
                                    {/* Attendance badges */}
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
                            </button>

                            {/* Expanded trainee list */}
                            {isExpanded && (
                                <div className="border-t border-white/8 px-4 py-2 space-y-1 animate-in fade-in duration-200">
                                    {trainees.map(trainee => {
                                        const status = attendanceMap[`${event.id}_${trainee.id}`]
                                        return (
                                            <div key={trainee.id} className="flex items-center justify-between py-1.5">
                                                <span className="text-sm text-white/80">{trainee.name_ar}</span>
                                                {status === 'present' && <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />}
                                                {status === 'late' && <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                                                {status === 'absent' && <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                                                {!status && <span className="text-white/20 text-xs">—</span>}
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
