'use client';

import { useState, useMemo, useEffect } from 'react';
import { InteractiveEventModal } from './InteractiveEventModal';
import { AttendanceModal } from './AttendanceModal';
import { 
    format, addDays, startOfDay, isSameDay, parseISO, 
    startOfWeek, startOfMonth, endOfWeek, endOfMonth, eachDayOfInterval, isBefore 
} from 'date-fns';
import { enUS, arSA, he } from 'date-fns/locale';
import { Calendar, Clock, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { upsertEvent, fetchHallEvents } from '@/app/actions';

interface Event {
    id: string;
    title_en: string;
    title_ar: string;
    title_he: string;
    start_time: string; // HH:mm:ss
    end_time: string;   // HH:mm:ss
    event_date: string; // YYYY-MM-DD
    type: 'game' | 'training';
    description?: string;
    // ... potentially other fields
}

interface HallScheduleProps {
    hallId: string;
    events: Event[];
    locale: string;
    isEditable?: boolean;
}

export function HallSchedule({ hallId, events: initialEvents, locale, isEditable = false }: HallScheduleProps) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [view, setView] = useState<'week' | 'month'>('month');
    const [now, setNow] = useState<Date | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false); // Edit Modal State
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false); // Attendance Modal State
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [events, setEvents] = useState<Event[]>(initialEvents);
    const [loading, setLoading] = useState(false);

    const dateLocale = arSA;
    const isRTL = true;

    // Fetch events when month changes
    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            const start = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
            const end = format(endOfMonth(selectedDate), 'yyyy-MM-dd');
            
            const res = await fetchHallEvents(hallId, start, end);
            if (res.success && res.events) {
                setEvents(res.events as Event[]);
            }
            setLoading(false);
        };
        fetchEvents();
    }, [selectedDate, hallId]);

    // Set current time on client side only to avoid hydration mismatch
    useEffect(() => {
        setNow(new Date());
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Generate days based on view
    const calendarDays = useMemo(() => {
        if (view === 'week') {
            return Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i));
        } else {
            const start = startOfWeek(startOfMonth(selectedDate), { weekStartsOn: 0 });
            const end = endOfWeek(endOfMonth(selectedDate), { weekStartsOn: 0 });
            return eachDayOfInterval({ start, end });
        }
    }, [view, selectedDate]);

    // Filter events for selected date
    const dailyEvents = useMemo(() => {
        return events.filter(e => isSameDay(parseISO(e.event_date), selectedDate))
                     .sort((a, b) => a.start_time.localeCompare(b.start_time));
    }, [events, selectedDate]);

    // Helper to check if a day has events
    const hasEvents = (date: Date) => {
        return events.some(e => isSameDay(parseISO(e.event_date), date));
    };

    const formatTime = (timeStr: string) => {
        return timeStr.slice(0, 5);
    };

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
        // Optimistic update or just wait for revalidatePath from server action
        const res = await upsertEvent({
            ...eventData,
            id: selectedEvent?.id, // Include ID if editing
            hall_id: hallId
        });
        
        if (res.success && res.event) {
            setIsModalOpen(false);
            setSelectedEvent(null);
            
            // Update local state smoothly
            setEvents(prev => {
                // Ensure proper type matching
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

        const eventDate = parseISO(event.event_date);
        const today = startOfDay(new Date());
        // Check if event is today or in the past
        const isPastOrToday = isBefore(eventDate, addDays(today, 1)); // < tomorrow starts = today or past

        setSelectedEvent(event);
        
        if (isPastOrToday) {
            setIsAttendanceModalOpen(true);
        } else {
            setIsModalOpen(true); // Edit for future logic is same as create
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
            {/* Header / View Picker */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800">
                        <Calendar className="w-5 h-5 text-gold-500" />
                        {'جدول القاعة'}
                    </h3>
                    
                    <div className="flex items-center gap-2">
                         {/* View toggle removed as per user request - Month view only */}
                    </div>
                </div>

                <div className="flex items-center justify-between mb-2 px-1">
                     <button 
                        onClick={() => setSelectedDate(addDays(selectedDate, view === 'week' ? -7 : -30))}
                        className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                     >
                        <ChevronLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                     </button>
                     <span className="font-bold text-gray-800 text-sm md:text-base">
                        {format(selectedDate, 'MMMM yyyy', { locale: dateLocale })}
                     </span>
                     <button 
                        onClick={() => setSelectedDate(addDays(selectedDate, view === 'week' ? 7 : 30))}
                        className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                     >
                        <ChevronRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                     </button>
                </div>

                {/* Calendar Grid */}
                <div className={`
                    grid gap-2 transition-all
                    ${view === 'month' ? 'grid-cols-7' : 'flex overflow-x-auto pb-2 scrollbar-hide gap-2'}
                `}>
                    {/* Month View Weekday Headers */}
                    {view === 'month' && ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                        <div key={day} className="text-center text-[10px] text-gray-400 font-medium uppercase py-1">
                            {format(addDays(startOfWeek(new Date()), i), 'EEEEE', { locale: dateLocale })}
                        </div>
                    ))}

                    {calendarDays.map((date, i) => {
                        const isSelected = isSameDay(date, selectedDate);
                        const isToday = isSameDay(date, new Date());
                        const isCurrentMonth = isSameDay(date, selectedDate) || date.getMonth() === selectedDate.getMonth(); 
                        const hasEvent = hasEvents(date);

                        return (
                            <button
                                key={date.toISOString()}
                                onClick={() => {
                                    setSelectedDate(date);
                                    if(view === 'month') {
                                        // Optional: switch to day view or just update selected
                                    }
                                }} 
                                className={`
                                    relative flex flex-col items-center justify-center rounded-xl transition-all border
                                    ${view === 'month' ? 'h-10 md:h-14 w-full aspect-square md:aspect-auto' : 'min-w-[3.5rem] h-16 shrink-0'}
                                    ${isSelected 
                                        ? 'bg-navy-600 text-white border-navy-600 shadow-md shadow-navy-200 scale-105 z-10' 
                                        : !isCurrentMonth && view === 'month'
                                            ? 'bg-gray-50/50 text-gray-300 border-transparent'
                                            : 'bg-white text-gray-600 border-gray-100 hover:border-gold-300 hover:bg-navy-50'
                                    }
                                `}
                            >
                                <span className={`text-[10px] font-medium opacity-80 ${view === 'month' ? 'hidden' : 'block'}`}>
                                    {format(date, 'EEE', { locale: dateLocale })}
                                </span>
                                <span className={`font-bold ${view === 'month' ? 'text-xs md:text-sm' : 'text-lg'}`}>
                                    {format(date, 'd')}
                                </span>
                                
                                {/* Event Indicator Dot */}
                                {hasEvent && (
                                    <div className={`
                                        absolute bottom-1 w-1 h-1 md:w-1.5 md:h-1.5 rounded-full 
                                        ${isSelected ? 'bg-white' : 'bg-gold-500'}
                                    `} />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Timeline View */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/30 min-h-[300px]">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                         <Clock className="w-4 h-4 text-indigo-500" />
                         {'أحداث اليوم'}
                    </h4>
                    {isEditable && (
                        <button 
                            className={`text-xs px-3 py-1.5 rounded-lg shadow-sm transition-colors flex items-center gap-1 ${
                                isBefore(startOfDay(selectedDate), startOfDay(new Date()))
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
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
                    {dailyEvents.length > 0 ? (
                        <>
                            {/* Vertical line for timeline */}
                            <div className={`absolute top-2 bottom-2 w-0.5 bg-gray-100 ${isRTL ? 'right-14' : 'left-14'}`}></div>

                            {dailyEvents.map((event) => {
                                 const isToday = now && isSameDay(parseISO(event.event_date), now);
                                 const currentTime = now ? format(now, 'HH:mm:ss') : '';
                                 const isCurrent = isToday && event.start_time <= currentTime && event.end_time >= currentTime;

                                 return (
                                    <div key={event.id} className="relative flex items-start gap-3 group">
                                        {/* Time Column */}
                                        <div className={`w-14 shrink-0 flex flex-col items-center text-[10px] font-bold text-gray-500 z-10 bg-white py-1 ${isRTL ? 'pl-1' : 'pr-1'}`}>
                                            <span>{formatTime(event.start_time)}</span>
                                            <div className={`h-8 w-0.5 my-0.5 ${isCurrent ? 'bg-indigo-500' : 'bg-gray-200'}`}></div>
                                            <span className="text-gray-400 font-normal">{formatTime(event.end_time)}</span>
                                        </div>

                                        {/* Event Card */}
                                        <div className={`flex-1 rounded-2xl p-3 border-l-4 shadow-sm transition-all hover:shadow-md active:scale-[0.99] touch-manipulation cursor-pointer ${
                                            event.type === 'game' 
                                                ? 'bg-orange-50/50 border-orange-400' 
                                                : 'bg-blue-50/50 border-blue-400'
                                        } ${isCurrent ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
                                            onClick={() => handleEventClick(event)}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={`font-bold text-sm ${
                                                    event.type === 'game' ? 'text-orange-900' : 'text-blue-900'
                                                }`}>
                                                    {event.title_ar}
                                                </h4>
                                                {isCurrent && (
                                                    <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                                                        NOW
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs opacity-75">
                                                <Clock className="w-3 h-3" />
                                                <span>
                                                    {formatTime(event.start_time)} - {formatTime(event.end_time)}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Dot on timeline */}
                                        <div className={`absolute top-4 w-3 h-3 rounded-full border-2 border-white shadow-sm z-10 transition-colors ${
                                            isRTL ? 'right-14 translate-x-1/2' : 'left-14 -translate-x-1/2'
                                        } ${
                                            isCurrent ? 'bg-indigo-600 scale-125' : (event.type === 'game' ? 'bg-orange-500' : 'bg-blue-500')
                                        }`}></div>

                                        {/* Edit Logic (Visual only) */}
                                        {isEditable && (
                                            <div className="absolute top-2 end-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    className="p-1 px-2 bg-white/80 rounded-md hover:bg-white text-xs font-bold text-gray-600 shadow-sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent card click
                                                        handleEditEvent(event);
                                                    }}
                                                >
                                                    {'تعديل'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                <Clock className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="font-medium">
                                {'لا توجد أحداث لهذا اليوم'}
                            </p>
                            <p className="text-xs max-w-[200px] text-center mt-1 opacity-70">
                                {'القاعة متاحة للحجز'}
                            </p>
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
                            initialEvent={selectedEvent} // Pass for editing
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
