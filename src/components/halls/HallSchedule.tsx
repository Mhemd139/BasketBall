'use client';

import { useState, useMemo } from 'react';
import { format, addDays, startOfDay, isSameDay, parseISO } from 'date-fns';
import { enUS, arSA, he } from 'date-fns/locale';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

interface Event {
    id: string;
    title_en: string;
    title_ar: string;
    title_he: string;
    start_time: string; // HH:mm:ss
    end_time: string;   // HH:mm:ss
    event_date: string; // YYYY-MM-DD
    type: 'game' | 'training';
}

interface HallScheduleProps {
    hallId: string;
    events: Event[];
    locale: string;
}

export function HallSchedule({ hallId, events, locale }: HallScheduleProps) {
    const [selectedDate, setSelectedDate] = useState(new Date());

    const dateLocale = locale === 'ar' ? arSA : locale === 'he' ? he : enUS;
    const isRTL = locale === 'ar' || locale === 'he';

    // Generate next 7 days
    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i));
    }, []);

    // Filter events for selected date
    const dailyEvents = useMemo(() => {
        return events.filter(e => isSameDay(parseISO(e.event_date), selectedDate))
                     .sort((a, b) => a.start_time.localeCompare(b.start_time));
    }, [events, selectedDate]);

    const formatTime = (timeStr: string) => {
        // Simple HH:mm parser
        return timeStr.slice(0, 5);
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header / Week Picker */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800">
                        <Calendar className="w-5 h-5 text-indigo-500" />
                        {locale === 'ar' ? 'جدول القاعة' : locale === 'he' ? 'לוח זמנים' : 'Hall Schedule'}
                    </h3>
                    <div className="text-sm font-medium text-gray-500">
                        {format(selectedDate, 'MMMM yyyy', { locale: dateLocale })}
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {weekDays.map((date) => {
                        const isSelected = isSameDay(date, selectedDate);
                        return (
                            <button
                                key={date.toISOString()}
                                onClick={() => setSelectedDate(date)}
                                className={`
                                    flex flex-col items-center justify-center min-w-[3.5rem] h-16 rounded-2xl transition-all border
                                    ${isSelected 
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 scale-105' 
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                                    }
                                `}
                            >
                                <span className="text-xs font-medium uppercase opacity-80">
                                    {format(date, 'EEE', { locale: dateLocale })}
                                </span>
                                <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                                    {format(date, 'd')}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Timeline View */}
            <div className="p-4 min-h-[300px]">
                {dailyEvents.length > 0 ? (
                    <div className="space-y-3 relative">
                        {/* Vertical line for timeline */}
                        <div className={`absolute top-2 bottom-2 w-0.5 bg-gray-100 ${isRTL ? 'right-[4.5rem]' : 'left-[4.5rem]'}`}></div>

                        {dailyEvents.map((event) => (
                            <div key={event.id} className="relative flex items-center group">
                                {/* Time Column */}
                                <div className={`w-[4.5rem] shrink-0 flex flex-col items-center text-xs font-bold text-gray-500 z-10 bg-white py-1 ${isRTL ? 'pl-2' : 'pr-2'}`}>
                                    <span>{formatTime(event.start_time)}</span>
                                    <div className="h-4 w-0.5 bg-gray-200 my-0.5"></div>
                                    <span className="text-gray-400 font-normal">{formatTime(event.end_time)}</span>
                                </div>

                                {/* Event Card */}
                                <div className={`flex-1 rounded-2xl p-3 border-l-4 shadow-sm transition-all hover:shadow-md hover:scale-[1.01] ${isRTL ? 'mr-3' : 'ml-3'} ${
                                    event.type === 'game' 
                                        ? 'bg-orange-50 border-orange-400' 
                                        : 'bg-blue-50 border-blue-400'
                                }`}>
                                    <h4 className={`font-bold text-sm mb-1 ${
                                        event.type === 'game' ? 'text-orange-900' : 'text-blue-900'
                                    }`}>
                                        {locale === 'ar' ? event.title_ar : locale === 'he' ? event.title_he : event.title_en}
                                    </h4>
                                    <div className="flex items-center gap-2 text-xs opacity-75">
                                        <Clock className="w-3 h-3" />
                                        <span>
                                            {formatTime(event.start_time)} - {formatTime(event.end_time)}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Dot on timeline */}
                                <div className={`absolute w-3 h-3 rounded-full border-2 border-white shadow-sm z-10 ${
                                    isRTL ? 'right-[4.2rem] translate-x-1/2' : 'left-[4.2rem] -translate-x-1/2'
                                } ${
                                    event.type === 'game' ? 'bg-orange-500' : 'bg-blue-500'
                                }`}></div>
                            </div>
                        ))}
                    </div>
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
        </div>
    );
}
