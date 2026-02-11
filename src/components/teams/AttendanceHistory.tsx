'use client'

import { useState, useEffect } from 'react'
import { getTeamAttendanceHistory } from '@/app/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Loader2, Check, X, Clock, Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ar, he } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface AttendanceHistoryProps {
    classId: string
    locale: string
}

export function AttendanceHistory({ classId, locale }: AttendanceHistoryProps) {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await getTeamAttendanceHistory(classId)
                if (res.success) {
                    setData(res.data)
                }
            } catch (error) {
                console.error('Failed to fetch history', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [classId])

    const formatDate = (dateString: string, formatStr: string) => {
        try {
            const date = parseISO(dateString)
            return format(date, formatStr, { locale: locale === 'he' ? he : ar })
        } catch (e) {
            return dateString
        }
    }

    if (loading) return (
        <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
    )

    if (!data || !data.events || data.events.length === 0) return null

    const { trainees, events, attendanceMap } = data

    return (
        <Card className="overflow-hidden border-0 shadow-lg bg-white/80 backdrop-blur w-full max-w-[calc(100vw-2rem)] md:max-w-full mx-auto">
            <CardHeader className="border-b bg-gray-50/50 p-4">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                    {'سجل الحضور (آخر 30 يوم)'}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-sm text-right border-collapse min-w-max">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="sticky right-0 z-20 bg-gray-50 px-3 py-3 font-semibold text-gray-900 min-w-[120px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-start">
                                    {'اللاعب / التاريخ'}
                                </th>
                                {events.map((event: any) => (
                                    <th key={event.id} className="px-2 py-2 font-medium text-gray-600 min-w-[90px] text-center border-l border-gray-100 bg-gray-50/50">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-xs font-bold text-indigo-900 whitespace-nowrap">
                                                {formatDate(event.event_date, 'd MMM')}
                                            </span>
                                            <div className="flex flex-col text-[10px] text-gray-500 leading-tight">
                                                 <span className="font-semibold text-indigo-400">
                                                     {formatDate(event.event_date, 'EEEE')}
                                                 </span>
                                                 <span className="whitespace-nowrap font-medium text-gray-400 max-w-[80px] truncate">
                                                    {locale === 'he' ? (event.title_he || event.title_ar) : event.title_ar}
                                                </span>
                                                <span className="whitespace-nowrap opacity-70 text-[9px]">
                                                    {event.start_time?.slice(0, 5)}
                                                </span>
                                            </div>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {trainees.map((trainee: any) => (
                                <tr key={trainee.id} className="hover:bg-slate-50/50 transition-colors group">
                                    {/* Sticky Player Name Column */}
                                    <td className="sticky right-0 z-10 bg-white group-hover:bg-slate-50/50 px-3 py-3 font-medium text-gray-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] border-b border-gray-50">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900 text-xs md:text-sm whitespace-nowrap">{trainee.name_ar}</span>
                                        </div>
                                    </td>

                                    {/* Event Status Cells */}
                                    {events.map((event: any) => {
                                        const status = attendanceMap[`${event.id}_${trainee.id}`]
                                        return (
                                            <td key={`${trainee.id}-${event.id}`} className="px-2 py-2 text-center border-l border-gray-50">
                                                <div className="flex justify-center">
                                                    {status === 'present' && (
                                                        <div className="w-6 h-6 md:w-7 md:h-7 rounded-md bg-green-100 text-green-600 flex items-center justify-center shadow-sm" title="حاضر">
                                                            <Check className="w-3 h-3 md:w-4 md:h-4" />
                                                        </div>
                                                    )}
                                                    {status === 'absent' && (
                                                        <div className="w-6 h-6 md:w-7 md:h-7 rounded-md bg-red-100 text-red-500 flex items-center justify-center shadow-sm" title="غائب">
                                                            <X className="w-3 h-3 md:w-4 md:h-4" />
                                                        </div>
                                                    )}
                                                    {status === 'late' && (
                                                        <div className="w-6 h-6 md:w-7 md:h-7 rounded-md bg-yellow-100 text-yellow-600 flex items-center justify-center shadow-sm" title="متأخر">
                                                            <Clock className="w-3 h-3 md:w-4 md:h-4" />
                                                        </div>
                                                    )}
                                                    {!status && (
                                                        <div className="w-6 h-6 md:w-7 md:h-7 rounded-md bg-gray-50 text-gray-300 flex items-center justify-center" title="لم يسجل">
                                                            <span className="text-[10px]">-</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}
