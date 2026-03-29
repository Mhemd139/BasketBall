'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getTrainerWorkingHoursDetailed } from '@/app/actions'
import { Clock, Loader2, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Period = 'current' | 'last' | 'custom'

interface DetailedEvent {
    id: string
    eventDate: string
    startTime: string
    endTime: string
    type: string
    titleAr: string
    titleHe: string
    titleEn: string
    teamNameAr: string
    teamNameHe: string
    teamNameEn: string
    duration: number
}

interface DetailedResult {
    hours: number
    minutes: number
    totalEvents: number
    events: DetailedEvent[]
}

function getMonthRange(offset: number): { start: string; end: string } {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + offset
    const first = new Date(year, month, 1)
    const last = new Date(year, month + 1, 0)
    return {
        start: first.toISOString().slice(0, 10),
        end: last.toISOString().slice(0, 10),
    }
}

function formatDate(dateStr: string): string {
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
}

function formatTime(time: string): string {
    return time?.slice(0, 5) || ''
}

const typeBadgeConfig: Record<string, { label: string; classes: string }> = {
    training: { label: 'تدريب', classes: 'text-green-300 bg-green-500/15 border-green-500/20' },
    gym: { label: 'لياقة', classes: 'text-purple-300 bg-purple-500/15 border-purple-500/20' },
    game: { label: 'مباراة', classes: 'text-orange-300 bg-orange-500/15 border-orange-500/20' },
}

export function TrainerWorkingHours({ trainerId, locale = 'ar' }: { trainerId: string; locale?: string }) {
    const router = useRouter()
    const [period, setPeriod] = useState<Period>('current')
    const [customStart, setCustomStart] = useState('')
    const [customEnd, setCustomEnd] = useState('')
    const [result, setResult] = useState<DetailedResult | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [expanded, setExpanded] = useState(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const requestSeqRef = useRef(0)

    const fetchHours = useCallback(async (start: string, end: string) => {
        const seq = ++requestSeqRef.current
        setLoading(true)
        setError('')
        setExpanded(false)
        try {
            const res = await getTrainerWorkingHoursDetailed(trainerId, start, end)
            if (seq !== requestSeqRef.current) return
            if (res.success) {
                setResult({
                    hours: res.hours ?? 0,
                    minutes: res.minutes ?? 0,
                    totalEvents: res.totalEvents ?? 0,
                    events: res.events ?? [],
                })
            } else {
                setResult(null)
                setError(res.error || 'فشل تحميل الساعات')
            }
        } catch {
            if (seq !== requestSeqRef.current) return
            setResult(null)
            setError('فشل تحميل الساعات')
        } finally {
            if (seq === requestSeqRef.current) setLoading(false)
        }
    }, [trainerId])

    useEffect(() => {
        if (period === 'current') {
            const { start, end } = getMonthRange(0)
            fetchHours(start, end)
        } else if (period === 'last') {
            const { start, end } = getMonthRange(-1)
            fetchHours(start, end)
        } else if (period === 'custom' && customStart && customEnd) {
            clearTimeout(debounceRef.current)
            debounceRef.current = setTimeout(() => fetchHours(customStart, customEnd), 500)
            return () => clearTimeout(debounceRef.current)
        }
    }, [period, customStart, customEnd, fetchHours])

    const chips: { key: Period; label: string }[] = [
        { key: 'current', label: 'الشهر الحالي' },
        { key: 'last', label: 'الشهر الماضي' },
        { key: 'custom', label: 'مخصص' },
    ]

    const groupedEvents = result?.events.reduce<Record<string, DetailedEvent[]>>((acc, ev) => {
        if (!acc[ev.eventDate]) acc[ev.eventDate] = []
        acc[ev.eventDate].push(ev)
        return acc
    }, {})

    if (groupedEvents) {
        for (const date in groupedEvents) {
            groupedEvents[date].sort((a, b) => a.startTime.localeCompare(b.startTime))
        }
    }

    const sortedDates = groupedEvents ? Object.keys(groupedEvents).sort((a, b) => b.localeCompare(a)) : []

    return (
        <section>
            <div className="bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/8">
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        ساعات التدريب المجدولة
                    </h3>
                </div>

                <div className="p-4 space-y-4">
                    {/* Period chips */}
                    <div className="flex gap-2 flex-wrap">
                        {chips.map(chip => (
                            <button
                                key={chip.key}
                                onClick={() => setPeriod(chip.key)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 border ${
                                    period === chip.key
                                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                        : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
                                }`}
                            >
                                {chip.label}
                            </button>
                        ))}
                    </div>

                    {/* Custom date inputs */}
                    {period === 'custom' && (
                        <div className="flex items-center gap-3" dir="ltr">
                            <input
                                type="date"
                                value={customStart}
                                onChange={e => setCustomStart(e.target.value)}
                                className="flex-1 px-3 py-1.5 rounded-xl border border-white/10 text-sm text-white/80 bg-white/[0.07] outline-none focus:border-white/25 transition-all"
                            />
                            <span className="text-white/30">—</span>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={e => setCustomEnd(e.target.value)}
                                className="flex-1 px-3 py-1.5 rounded-xl border border-white/10 text-sm text-white/80 bg-white/[0.07] outline-none focus:border-white/25 transition-all"
                            />
                        </div>
                    )}

                    {/* Result display */}
                    {loading ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-400/60" />
                        </div>
                    ) : error ? (
                        <p className="text-red-400 text-sm font-medium text-center">{error}</p>
                    ) : result && (
                        <>
                            <div className="text-center py-2">
                                <div className="text-3xl font-black text-white">
                                    {result.hours} <span className="text-lg font-bold text-white/40">ساعة</span>
                                    {result.minutes > 0 && (
                                        <>
                                            {' '}{result.minutes} <span className="text-lg font-bold text-white/40">دقيقة</span>
                                        </>
                                    )}
                                </div>
                                <p className="text-sm text-white/50 mt-1 font-bold">
                                    {result.totalEvents} تدريبات
                                </p>
                            </div>

                            {/* Details toggle */}
                            {result.totalEvents > 0 && (
                                <button
                                    onClick={() => setExpanded(prev => !prev)}
                                    className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-indigo-300/80 hover:text-indigo-300 transition-colors"
                                >
                                    {expanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
                                </button>
                            )}

                            {/* Expanded event timeline */}
                            {expanded && groupedEvents && (
                                <div className="max-h-[420px] overflow-y-auto [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden" dir="rtl">
                                    <div className="space-y-3">
                                        {sortedDates.map(date => (
                                            <div key={date}>
                                                {/* Date header */}
                                                <div className="flex items-center gap-2 pb-2 sticky top-0 z-10">
                                                    <span className="text-[11px] font-bold text-white/80 tabular-nums">{formatDate(date)}</span>
                                                    <div className="flex-1 h-px bg-white/5" />
                                                    <span className="text-[10px] font-semibold text-white/25">{groupedEvents[date].length} جلسات</span>
                                                </div>

                                                <div className="space-y-2">
                                                {groupedEvents[date].map(ev => {
                                                    const badge = typeBadgeConfig[ev.type] || typeBadgeConfig.training
                                                    const dotColor = ev.type === 'game' ? 'bg-orange-400' : ev.type === 'gym' ? 'bg-purple-400' : 'bg-green-400'

                                                    return (
                                                        <button
                                                            key={ev.id}
                                                            onClick={() => router.push(`/${locale}/attendance/${ev.id}`)}
                                                            className={`flex items-stretch gap-0 w-full text-right rounded-2xl overflow-hidden transition-all active:scale-[0.98] group border ${
                                                                ev.type === 'game' ? 'bg-orange-500/[0.06] border-orange-500/15 hover:bg-orange-500/10'
                                                                : ev.type === 'gym' ? 'bg-purple-500/[0.06] border-purple-500/15 hover:bg-purple-500/10'
                                                                : 'bg-green-500/[0.06] border-green-500/15 hover:bg-green-500/10'
                                                            }`}
                                                        >
                                                            <div className={`w-1 shrink-0 ${dotColor}`} />
                                                            <div className="flex items-center gap-3 flex-1 min-w-0 px-3 py-3">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-0.5">
                                                                        <span className="text-[13px] font-bold text-white/80 group-hover:text-white transition-colors truncate">{ev.teamNameAr || ev.titleAr || '—'}</span>
                                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${badge.classes}`}>{badge.label}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-3 mt-0.5">
                                                                        <span className="text-[11px] text-white/35 tabular-nums font-medium" dir="ltr">{formatTime(ev.startTime)} — {formatTime(ev.endTime)}</span>
                                                                        <span className="text-[10px] font-bold text-white/20 tabular-nums">{ev.duration}د</span>
                                                                    </div>
                                                                </div>
                                                                <ChevronDown className="w-3.5 h-3.5 text-white/15 group-hover:text-white/30 -rotate-90 shrink-0 transition-colors" />
                                                            </div>
                                                        </button>
                                                    )
                                                })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </section>
    )
}
