'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getTrainerWorkingHours } from '@/app/actions'
import { Clock, Loader2 } from 'lucide-react'

type Period = 'current' | 'last' | 'custom'

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

export function TrainerWorkingHours({ trainerId }: { trainerId: string }) {
    const [period, setPeriod] = useState<Period>('current')
    const [customStart, setCustomStart] = useState('')
    const [customEnd, setCustomEnd] = useState('')
    const [result, setResult] = useState<{ hours: number; minutes: number; totalEvents: number } | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

    const requestSeqRef = useRef(0)

    const fetchHours = useCallback(async (start: string, end: string) => {
        const seq = ++requestSeqRef.current
        setLoading(true)
        setError('')
        try {
            const res = await getTrainerWorkingHours(trainerId, start, end)
            if (seq !== requestSeqRef.current) return
            if (res.success) {
                setResult({ hours: res.hours ?? 0, minutes: res.minutes ?? 0, totalEvents: res.totalEvents ?? 0 })
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
                    )}
                </div>
            </div>
        </section>
    )
}
