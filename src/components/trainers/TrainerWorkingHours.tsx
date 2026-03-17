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

    const fetchHours = useCallback(async (start: string, end: string) => {
        if (!start || !end) return
        setLoading(true)
        setError('')
        const res = await getTrainerWorkingHours(trainerId, start, end)
        if (res.success) {
            setResult({ hours: res.hours ?? 0, minutes: res.minutes ?? 0, totalEvents: res.totalEvents ?? 0 })
        } else {
            setError(res.error || 'خطأ غير متوقع')
            setResult(null)
        }
        setLoading(false)
    }, [trainerId])

    useEffect(() => {
        if (period === 'current') {
            const { start, end } = getMonthRange(0)
            fetchHours(start, end)
        } else if (period === 'last') {
            const { start, end } = getMonthRange(-1)
            fetchHours(start, end)
        }
    }, [period, fetchHours])

    useEffect(() => {
        if (period !== 'custom' || !customStart || !customEnd) return
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            fetchHours(customStart, customEnd)
        }, 300)
        return () => clearTimeout(debounceRef.current)
    }, [period, customStart, customEnd, fetchHours])

    const chips: { key: Period; label: string }[] = [
        { key: 'current', label: 'هذا الشهر' },
        { key: 'last', label: 'الشهر الماضي' },
        { key: 'custom', label: 'مخصص' },
    ]

    return (
        <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                ساعات العمل
            </h2>

            <div className="bg-white/70 backdrop-blur-xl rounded-xl border border-white/40 shadow-sm p-5 space-y-4">
                {/* Period chips */}
                <div className="flex gap-2 flex-wrap">
                    {chips.map(chip => (
                        <button
                            key={chip.key}
                            onClick={() => setPeriod(chip.key)}
                            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
                                period === chip.key
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100'
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
                            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white"
                        />
                        <span className="text-gray-400">—</span>
                        <input
                            type="date"
                            value={customEnd}
                            onChange={e => setCustomEnd(e.target.value)}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white"
                        />
                    </div>
                )}

                {/* Result display */}
                {loading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                    </div>
                ) : error ? (
                    <p className="text-red-500 text-sm font-medium">{error}</p>
                ) : result && (
                    <div className="text-center py-2">
                        <div className="text-3xl font-black text-gray-900">
                            {result.hours} <span className="text-lg font-bold text-gray-500">ساعة</span>
                            {result.minutes > 0 && (
                                <>
                                    {' '}{result.minutes} <span className="text-lg font-bold text-gray-500">دقيقة</span>
                                </>
                            )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1 font-medium">
                            {result.totalEvents} تدريبات
                        </p>
                    </div>
                )}
            </div>
        </section>
    )
}
