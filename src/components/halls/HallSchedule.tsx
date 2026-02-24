'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { InteractiveEventModal } from './InteractiveEventModal';
import { AttendanceModal } from './AttendanceModal';
import {
    format, addDays, startOfDay, isSameDay, parseISO,
    startOfWeek, startOfMonth, endOfWeek, endOfMonth, eachDayOfInterval, isBefore,
    addMonths, subMonths
} from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Calendar, Clock, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { upsertEvent, fetchHallEvents, getOrCreateEventForSchedule } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';

interface Event {
    id: string;
    title_en: string;
    title_ar: string;
    title_he: string;
    start_time: string;
    end_time: string;
    event_date: string;
    type: 'game' | 'training';
    description?: string;
    schedule_id?: string | null;
    class_id?: string | null;
    trainers?: { name_he: string; name_ar: string; name_en: string } | null;
}

interface WeeklySchedule {
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    notes: string | null;
    classes: {
        id: string;
        name_he: string;
        name_ar: string;
        name_en: string;
        trainer_id: string;
        trainers: {
            name_he: string;
            name_ar: string;
            name_en: string;
        } | null;
    };
}

interface HallScheduleProps {
    hallId: string;
    events: Event[];
    weeklySchedules: WeeklySchedule[];
    locale: string;
    isEditable?: boolean;
}

export function HallSchedule({ hallId, events: initialEvents, weeklySchedules, locale, isEditable = false }: HallScheduleProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [view] = useState<'week' | 'month'>('month');
    const [now, setNow] = useState<Date | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [events, setEvents] = useState<Event[]>(initialEvents);
    const [loadingScheduleId, setLoadingScheduleId] = useState<string | null>(null);

    const dateLocale = arSA;
    const isRTL = true;

    const refetchEvents = useCallback(async () => {
        const start = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
        const end = format(endOfMonth(selectedDate), 'yyyy-MM-dd');
        const res = await fetchHallEvents(hallId, start, end);
        if (res.success && res.events) {
            setEvents(res.events as Event[]);
        }
    }, [selectedDate, hallId]);

    // Refetch on mount and when date/hall changes
    const mountRef = useRef(0);
    useEffect(() => {
        // Always refetch — covers both initial mount and dependency changes
        refetchEvents();
        mountRef.current++;
    }, [refetchEvents]);

    // Re-fetch when returning to this page (tab switch, app switch, browser back/forward)
    useEffect(() => {
        const onVisibility = () => {
            if (document.visibilityState === 'visible') refetchEvents();
        };
        const onPageShow = (e: PageTransitionEvent) => {
            if (e.persisted) refetchEvents();
        };
        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('pageshow', onPageShow);
        window.addEventListener('focus', refetchEvents);
        return () => {
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('pageshow', onPageShow);
            window.removeEventListener('focus', refetchEvents);
        };
    }, [refetchEvents]);

    useEffect(() => {
        setNow(new Date());
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const calendarDays = useMemo(() => {
        const start = startOfWeek(startOfMonth(selectedDate), { weekStartsOn: 0 });
        const end = endOfWeek(endOfMonth(selectedDate), { weekStartsOn: 0 });
        return eachDayOfInterval({ start, end });
    }, [selectedDate]);

    // All events for the selected date
    const allDayEvents = useMemo(() => {
        return events
            .filter(e => isSameDay(parseISO(e.event_date), selectedDate))
            .sort((a, b) => a.start_time.localeCompare(b.start_time));
    }, [events, selectedDate]);

    // Manual/one-off events (no schedule — games, etc.)
    const dailyEvents = useMemo(() => {
        return allDayEvents.filter(e => !e.schedule_id && !e.class_id);
    }, [allDayEvents]);

    // Schedule-based: events that exist in DB + template schedules with no event yet
    const dailySchedules = useMemo(() => {
        const dayOfWeek = selectedDate.getDay();

        // Events that belong to a schedule — always use their own times
        const scheduledEvents = allDayEvents
            .filter(e => e.schedule_id || e.class_id)
            .map(e => {
                const schedule = weeklySchedules.find(s => s.id === e.schedule_id)
                    ?? weeklySchedules.find(s => s.classes?.id === e.class_id && s.day_of_week === dayOfWeek);
                return {
                    id: e.schedule_id ?? schedule?.id ?? e.id,
                    day_of_week: dayOfWeek,
                    start_time: e.start_time,
                    end_time: e.end_time,
                    notes: schedule?.notes ?? null,
                    classes: schedule?.classes ?? null,
                    event: e,
                };
            });

        // Template schedules that have no event yet (future dates)
        const coveredScheduleIds = new Set(scheduledEvents.map(x => x.id));
        const templates = weeklySchedules
            .filter(s => s.day_of_week === dayOfWeek && s.start_time !== '00:00:00' && !coveredScheduleIds.has(s.id))
            .map(s => ({ ...s, event: undefined as Event | undefined }));

        return [...scheduledEvents, ...templates]
            .sort((a, b) => a.start_time.localeCompare(b.start_time));
    }, [weeklySchedules, selectedDate, allDayEvents]);

    // Check if a day has events or schedules
    const hasContent = (date: Date) => {
        const hasEvent = events.some(e => isSameDay(parseISO(e.event_date), date));
        const dayOfWeek = date.getDay();
        const hasSchedule = weeklySchedules.some(s => s.day_of_week === dayOfWeek && s.start_time !== '00:00:00');
        return hasEvent || hasSchedule;
    };

    const formatTimeStr = (timeStr: string) => timeStr.slice(0, 5);

    const handleAddEvent = () => {
        const today = startOfDay(new Date());
        if (isBefore(startOfDay(selectedDate), today)) return;
        setSelectedEvent(null);
        setIsModalOpen(true);
    };

    const handleEditEvent = (event: Event) => {
        setSelectedEvent(event);
        setIsModalOpen(true);
    };

    const handleSaveEvent = async (eventData: any) => {
        const res = await upsertEvent({
            ...eventData,
            id: selectedEvent?.id,
            hall_id: hallId
        });
        if (res.success && res.event) {
            setIsModalOpen(false);
            setSelectedEvent(null);
            setEvents(prev => {
                const newEvent = res.event as Event;
                const exists = prev.find(e => e.id === newEvent.id);
                if (exists) {
                    return prev.map(e => e.id === newEvent.id ? newEvent : e);
                }
                return [...prev, newEvent];
            });
        }
    };

    const handleEventClick = (event: Event) => {
        if (!isEditable) return;
        // Schedule-derived events → navigate to attendance page directly
        if (event.schedule_id) {
            router.push(`/${locale}/attendance/${event.id}`);
            return;
        }
        const eventDate = parseISO(event.event_date);
        const today = startOfDay(new Date());
        const isPastOrToday = isBefore(eventDate, addDays(today, 1));
        setSelectedEvent(event);
        if (isPastOrToday) {
            setIsAttendanceModalOpen(true);
        } else {
            setIsModalOpen(true);
        }
    };

    const handleScheduleClick = async (schedule: { id: string; event?: Event; classes?: WeeklySchedule['classes'] | null }) => {
        const today = startOfDay(new Date());
        const isFuture = isBefore(today, startOfDay(selectedDate));
        if (isFuture) return;

        // If event already exists, navigate directly — no DB call
        if (schedule.event) {
            router.push(`/${locale}/attendance/${schedule.event.id}`);
            return;
        }

        setLoadingScheduleId(schedule.id);
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const res = await getOrCreateEventForSchedule(schedule.id, dateStr);
            if (res.success && res.eventId) {
                router.push(`/${locale}/attendance/${res.eventId}`);
            } else {
                toast('فشل في تحميل الحدث', 'error');
            }
        } catch {
            toast('فشل في تحميل الحدث', 'error');
        } finally {
            setLoadingScheduleId(null);
        }
    };

    const hasAnyContent = dailySchedules.length > 0 || dailyEvents.length > 0;

    return (
        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/10 overflow-hidden transition-all duration-300">
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-white drop-shadow-md">
                        <Calendar className="w-5 h-5 text-gold-400" />
                        {'جدول القاعة'}
                    </h3>
                </div>

                <div className="flex items-center justify-between mb-2 px-1">
                     <button
                        onClick={() => setSelectedDate(subMonths(selectedDate, 1))}
                        aria-label="Previous month"
                        className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/70"
                     >
                        <ChevronLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                     </button>
                     <span className="font-bold text-white text-sm md:text-base drop-shadow-md">
                        {format(selectedDate, 'MMMM yyyy', { locale: dateLocale })}
                     </span>
                     <button
                        onClick={() => setSelectedDate(addMonths(selectedDate, 1))}
                        aria-label="Next month"
                        className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/70"
                     >
                        <ChevronRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                     </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2 transition-all">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                        <div key={day} className="text-center text-[10px] text-indigo-200/50 font-medium uppercase py-1">
                            {format(addDays(startOfWeek(new Date()), i), 'EEEEE', { locale: dateLocale })}
                        </div>
                    ))}

                    {calendarDays.map((date) => {
                        const isSelected = isSameDay(date, selectedDate);
                        const isCurrentMonth = date.getMonth() === selectedDate.getMonth();
                        const hasDay = hasContent(date);

                        return (
                            <button
                                key={date.toISOString()}
                                onClick={() => setSelectedDate(date)}
                                className={`
                                    relative flex flex-col items-center justify-center rounded-xl transition-all border
                                    h-10 md:h-14 w-full aspect-square md:aspect-auto
                                    ${isSelected
                                        ? 'bg-indigo-600/80 text-white border-indigo-500/50 shadow-lg shadow-indigo-500/20 scale-105 z-10'
                                        : !isCurrentMonth
                                            ? 'bg-white/3 text-white/20 border-transparent'
                                            : 'bg-white/5 text-white/70 border-white/10 hover:border-gold-400/30 hover:bg-white/10'
                                    }
                                `}
                            >
                                <span className="font-bold text-xs md:text-sm">
                                    {format(date, 'd')}
                                </span>
                                {hasDay && (
                                    <div className={`absolute bottom-1 w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-gold-500'}`} />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Timeline View */}
            <div className="p-4 border-t border-white/10 bg-white/3 min-h-[300px]">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-white flex items-center gap-2 drop-shadow-md">
                         <Clock className="w-4 h-4 text-indigo-400" />
                         {'تدريبات وأحداث اليوم'}
                    </h4>
                    {isEditable && (
                        <button
                            className={`text-xs px-3 py-1.5 rounded-lg shadow-sm transition-colors flex items-center gap-1 ${
                                isBefore(startOfDay(selectedDate), startOfDay(new Date()))
                                    ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-500 border border-indigo-500/50'
                            }`}
                            onClick={handleAddEvent}
                            disabled={isBefore(startOfDay(selectedDate), startOfDay(new Date()))}
                        >
                            <span className="text-lg leading-none">+</span>
                            {'إضافة حدث'}
                        </button>
                    )}
                </div>

                <div className="space-y-3 relative">
                    {hasAnyContent ? (
                        <>
                            <div className={`absolute top-2 bottom-2 w-0.5 bg-white/10 ${isRTL ? 'right-14' : 'left-14'}`}></div>

                            {/* Weekly Schedules (recurring) */}
                            {dailySchedules.map((schedule) => {
                                const currentTime = now ? format(now, 'HH:mm:ss') : '';
                                const isToday = now && isSameDay(selectedDate, now);
                                const isCurrent = isToday && schedule.start_time <= currentTime && schedule.end_time >= currentTime;
                                const teamName = schedule.classes?.name_he || '';
                                const trainerName = schedule.classes?.trainers?.name_he || '';
                                const isLoading = loadingScheduleId === schedule.id;
                                const isPastOrToday = !isBefore(startOfDay(new Date()), startOfDay(selectedDate));

                                return (
                                    <div key={schedule.id} className="relative flex items-start gap-3">
                                        <div className={`w-14 shrink-0 flex flex-col items-center text-[10px] font-bold text-indigo-200/60 z-10 bg-transparent py-1 ${isRTL ? 'pl-1' : 'pr-1'}`}>
                                            <span className="text-white/80">{formatTimeStr(schedule.event?.start_time ?? schedule.start_time)}</span>
                                            <div className={`h-8 w-0.5 my-0.5 ${isCurrent ? 'bg-green-400' : 'bg-white/15'}`}></div>
                                            <span className="text-white/40 font-normal">{formatTimeStr(schedule.event?.end_time ?? schedule.end_time)}</span>
                                        </div>

                                        <div
                                            className={`relative flex-1 rounded-2xl p-3 border-l-4 shadow-sm transition-all bg-green-500/10 border-green-400 ${isCurrent ? 'ring-2 ring-green-400 ring-offset-0' : ''} ${isPastOrToday ? 'cursor-pointer hover:shadow-md active:scale-[0.99] touch-manipulation' : ''} ${isLoading ? 'opacity-70' : ''}`}
                                            onClick={() => isPastOrToday && handleScheduleClick(schedule)}
                                        >
                                            {isLoading && (
                                                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 backdrop-blur-[2px] rounded-2xl">
                                                    <div className="w-6 h-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                                </div>
                                            )}
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-sm text-green-300">
                                                    {teamName}
                                                </h4>
                                                {isCurrent && (
                                                    <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                                                        NOW
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-white/50">
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    {trainerName}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatTimeStr(schedule.event?.start_time ?? schedule.start_time)} - {formatTimeStr(schedule.event?.end_time ?? schedule.end_time)}
                                                </span>
                                            </div>
                                            {schedule.notes && (
                                                <p className="text-[10px] text-white/30 mt-1">{schedule.notes}</p>
                                            )}
                                        </div>

                                        <div className={`absolute top-4 w-3 h-3 rounded-full border-2 border-white shadow-sm z-10 transition-colors ${
                                            isRTL ? 'right-14 translate-x-1/2' : 'left-14 -translate-x-1/2'
                                        } ${isCurrent ? 'bg-green-600 scale-125' : 'bg-green-500'}`}></div>
                                    </div>
                                );
                            })}

                            {/* One-time Events */}
                            {dailyEvents.map((event) => {
                                const isToday = now && isSameDay(parseISO(event.event_date), now);
                                const currentTime = now ? format(now, 'HH:mm:ss') : '';
                                const isCurrent = isToday && event.start_time <= currentTime && event.end_time >= currentTime;

                                return (
                                    <div key={event.id} className="relative flex items-start gap-3 group">
                                        <div className={`w-14 shrink-0 flex flex-col items-center text-[10px] font-bold text-indigo-200/60 z-10 bg-transparent py-1 ${isRTL ? 'pl-1' : 'pr-1'}`}>
                                            <span className="text-white/80">{formatTimeStr(event.start_time)}</span>
                                            <div className={`h-8 w-0.5 my-0.5 ${isCurrent ? 'bg-indigo-400' : 'bg-white/15'}`}></div>
                                            <span className="text-white/40 font-normal">{formatTimeStr(event.end_time)}</span>
                                        </div>

                                        <div className={`flex-1 rounded-2xl p-3 border-l-4 shadow-sm transition-all hover:shadow-md active:scale-[0.99] touch-manipulation cursor-pointer ${
                                            event.type === 'game'
                                                ? 'bg-orange-500/10 border-orange-400'
                                                : 'bg-blue-500/10 border-blue-400'
                                        } ${isCurrent ? 'ring-2 ring-indigo-400 ring-offset-0' : ''}`}
                                            onClick={() => handleEventClick(event)}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={`font-bold text-sm ${event.type === 'game' ? 'text-orange-300' : 'text-blue-300'}`}>
                                                    {event.title_ar}
                                                </h4>
                                                {isCurrent && (
                                                    <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                                                        NOW
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-white/50">
                                                {event.trainers && (
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-3 h-3" />
                                                        {event.trainers.name_he || event.trainers.name_ar}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatTimeStr(event.start_time)} - {formatTimeStr(event.end_time)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className={`absolute top-4 w-3 h-3 rounded-full border-2 border-white shadow-sm z-10 transition-colors ${
                                            isRTL ? 'right-14 translate-x-1/2' : 'left-14 -translate-x-1/2'
                                        } ${isCurrent ? 'bg-indigo-600 scale-125' : (event.type === 'game' ? 'bg-orange-500' : 'bg-blue-500')}`}></div>

                                        {isEditable && (
                                            <div className="absolute top-2 end-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    className="p-1 px-2 bg-white/10 backdrop-blur-md rounded-md hover:bg-white/20 text-xs font-bold text-white/80 shadow-sm border border-white/10"
                                                    onClick={(e) => { e.stopPropagation(); handleEditEvent(event); }}
                                                >
                                                    {'تعديل'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-white/40">
                            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-3">
                                <Clock className="w-8 h-8 text-white/20" />
                            </div>
                            <p className="font-medium text-white/50">{'لا توجد تدريبات أو أحداث لهذا اليوم'}</p>
                            <p className="text-xs max-w-[200px] text-center mt-1 text-white/30">{'القاعة متاحة للحجز'}</p>
                        </div>
                    )}
                </div>

                {isEditable && (
                    <>
                        <InteractiveEventModal
                            isOpen={isModalOpen}
                            onClose={() => setIsModalOpen(false)}
                            onSave={handleSaveEvent}
                            initialDate={selectedDate}
                            initialEvent={selectedEvent}
                            locale={locale}
                        />
                        <AttendanceModal
                            isOpen={isAttendanceModalOpen}
                            onClose={() => setIsAttendanceModalOpen(false)}
                            event={selectedEvent}
                            locale={locale}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
