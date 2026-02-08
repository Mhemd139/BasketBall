'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
    format, addDays, startOfDay, isSameDay, parseISO, 
    startOfWeek, startOfMonth, endOfWeek, endOfMonth, eachDayOfInterval 
} from 'date-fns';
import { enUS, arSA, he } from 'date-fns/locale';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

import { upsertEvent } from '@/app/actions'; // Import action
import { CoachEventModal } from './CoachEventModal'; // Import Modal

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

export function HallSchedule({ hallId, events, locale, isEditable = false }: HallScheduleProps) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [view, setView] = useState<'week' | 'month'>('week'); 
    const [now, setNow] = useState<Date | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false); // Modal State
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null); // New state

    const dateLocale = locale === 'ar' ? arSA : locale === 'he' ? he : enUS;
    const isRTL = locale === 'ar' || locale === 'he';

    // ... (useEffect and memo logic remains same) ...

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
        setSelectedEvent(null);
        setIsModalOpen(true);
    };

    const handleEditEvent = (event: Event) => {
        setSelectedEvent(event);
        setIsModalOpen(true);
    };

    const handleSaveEvent = async (eventData: any) => {
        // Optimistic update or just wait for revalidatePath from server action
        // For simplicity, we rely on server action revalidation
        await upsertEvent({
            ...eventData,
            id: selectedEvent?.id, // Include ID if editing
            hall_id: hallId
        });
        setIsModalOpen(false);
        setSelectedEvent(null);
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
            {/* Header / View Picker */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800">
                        <Calendar className="w-5 h-5 text-indigo-500" />
                        {locale === 'ar' ? 'جدول القاعة' : locale === 'he' ? 'לוח זמנים' : 'Hall Schedule'}
                    </h3>
                    
                    <div className="flex items-center gap-2">
                         <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                            <button 
                                onClick={() => setView('week')}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${view === 'week' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {locale === 'ar' ? 'أسبوع' : locale === 'he' ? 'שבוע' : 'Week'}
                            </button>
                            <button 
                                onClick={() => setView('month')}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${view === 'month' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {locale === 'ar' ? 'شهر' : locale === 'he' ? 'חודש' : 'Month'}
                            </button>
                         </div>
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
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 scale-105 z-10' 
                                        : !isCurrentMonth && view === 'month'
                                            ? 'bg-gray-50/50 text-gray-300 border-transparent'
                                            : 'bg-white text-gray-600 border-gray-100 hover:border-indigo-300 hover:bg-indigo-50'
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
                                        ${isSelected ? 'bg-white' : 'bg-indigo-500'}
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
                         {locale === 'ar' ? 'أحداث اليوم' : locale === 'he' ? 'אירועי היום' : 'Today\'s Events'}
                    </h4>
                    {isEditable && (
                        <button 
                            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-1"
                            onClick={handleAddEvent}
                        >
                            <span className="text-lg leading-none">+</span>
                            {locale === 'ar' ? 'إضافة حدث' : locale === 'he' ? 'הוסף אירוע' : 'Add Event'}
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
                                            onClick={() => {/* Can open details/attendance modal here later */}}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={`font-bold text-sm ${
                                                    event.type === 'game' ? 'text-orange-900' : 'text-blue-900'
                                                }`}>
                                                    {locale === 'ar' ? event.title_ar : locale === 'he' ? event.title_he : event.title_en}
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
                                                    Edit
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
                                {locale === 'ar' ? 'لا توجد أحداث لهذا اليوم' : locale === 'he' ? 'אין אירועים ליום זה' : 'No events scheduled for this day'}
                            </p>
                            <p className="text-xs max-w-[200px] text-center mt-1 opacity-70">
                                {locale === 'ar' ? 'القاعة متاحة للحجز' : locale === 'he' ? 'האולם פנוי להזמנה' : 'The hall is available for booking'}
                            </p>
                        </div>
                    )}
                </div>

                {isEditable && (
                    <CoachEventModal 
                        isOpen={isModalOpen} 
                        onClose={() => setIsModalOpen(false)} 
                        onSave={handleSaveEvent}
                        initialDate={selectedDate}
                        initialEvent={selectedEvent} // Pass for editing
                        locale={locale}
                    />
                )}
            </div>
        </div>
    );
}
