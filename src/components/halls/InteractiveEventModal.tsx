'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getEventRefData } from '@/app/actions';
import { GameSVG } from '../ui/svg/GameSVG';
import { TrainingSVG } from '../ui/svg/TrainingSVG';
import { format } from 'date-fns';
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2, Trash2, Clock, Calendar, X, Check, Search } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface InteractiveEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (eventData: any) => Promise<void>;
    initialDate?: Date;
    initialEvent?: any;
    locale: string;
    onDelete?: (eventId: string) => Promise<void>;
    initialStep?: Step;
}

type Step = 'type' | 'details' | 'time' | 'review' | 'delete-confirm';

const avatarColors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];

function getItemName(item: any, locale: string) {
    return locale === 'he' ? (item.name_he || item.name_ar) : (item.name_ar || item.name_he);
}

function getItemCategory(item: any, locale: string) {
    return item.categories ? (locale === 'he' ? (item.categories.name_he || item.categories.name_ar) : (item.categories.name_ar || item.categories.name_he)) : null;
}

function SearchPicker({ items, selectedId, onSelect, placeholder, showCategory = false, showAvailability = false, locale }: {
    items: any[];
    selectedId: string;
    onSelect: (id: string) => void;
    placeholder?: string;
    showCategory?: boolean;
    showAvailability?: boolean;
    locale: string;
}) {
    const [query, setQuery] = useState('');
    const filtered = query.trim()
        ? items.filter((item: any) => {
            const name = getItemName(item, locale)?.toLowerCase() || '';
            const cat = showCategory ? (getItemCategory(item, locale)?.toLowerCase() || '') : '';
            return name.includes(query.toLowerCase()) || cat.includes(query.toLowerCase());
        })
        : items;

    return (
        <div className="flex flex-col gap-2">
            <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder || 'بحث...'}
                    className="w-full bg-white/10 border border-white/10 rounded-xl pr-10 pl-4 py-3 text-sm text-white/90 outline-none focus:border-white/30 transition-all placeholder:text-white/20"
                    dir="rtl"
                />
            </div>

            <div className="max-h-[220px] overflow-y-auto rounded-2xl border border-white/10 divide-y divide-white/5 bg-white/5">
                {filtered.length === 0 && (
                    <div className="py-6 text-center text-sm text-white/30">لا توجد نتائج</div>
                )}
                {filtered.map((item: any, idx: number) => {
                    const isSelected = selectedId === item.id;
                    const label = getItemName(item, locale);
                    const category = showCategory ? getItemCategory(item, locale) : null;
                    const initials = label?.trim().split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase() || '?';
                    const avatarColor = avatarColors[idx % avatarColors.length];
                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => onSelect(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-right transition-colors active:scale-[0.99] touch-manipulation ${
                                isSelected ? 'bg-electric/15' : 'hover:bg-white/10'
                            }`}
                        >
                            <div className={`w-9 h-9 rounded-full ${avatarColor}/20 border ${avatarColor.replace('bg-', 'border-')}/30 flex items-center justify-center shrink-0 text-xs font-bold ${avatarColor.replace('bg-', 'text-').replace('-500', '-300')}`}>
                                {initials}
                            </div>

                            <div className="flex-1 min-w-0 text-right">
                                <p className={`font-bold text-sm leading-tight ${isSelected ? 'text-electric' : 'text-white'}`}>{label}</p>
                                {category && (
                                    <span className="inline-block mt-0.5 text-[10px] font-bold text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded-full">
                                        {category}
                                    </span>
                                )}
                                {showAvailability && item.availability?.length > 0 && (
                                    <div className="flex gap-1 mt-0.5 flex-row-reverse">
                                        {item.availability.slice(0, 3).map((day: string) => (
                                            <span key={day} className="text-[9px] uppercase font-bold text-white/40 bg-white/10 px-1.5 py-0.5 rounded">
                                                {day.slice(0, 2)}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {isSelected && <Check className="w-4 h-4 text-electric shrink-0" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

const HOURS = Array.from({ length: 18 }, (_, i) => String(i + 6).padStart(2, '0'))
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

function TimeStepContent({ startTime, endTime, setStartTime, setEndTime, type, slideVariants }: {
    startTime: string; endTime: string;
    setStartTime: (v: string) => void; setEndTime: (v: string) => void;
    type: 'training' | 'game'; slideVariants: any;
}) {
    const [editing, setEditing] = useState<'start' | 'end'>('start')
    const activeTime = editing === 'start' ? startTime : endTime
    const [activeHH, activeMM] = activeTime.split(':')
    const isGame = type === 'game'

    const [startHH, startMM] = startTime.split(':').map(Number)
    const [endHH, endMM] = endTime.split(':').map(Number)
    const diff = (endHH * 60 + endMM) - (startHH * 60 + startMM)

    const setTime = (hh: string, mm: string) => {
        const newTime = `${hh}:${mm}`
        if (editing === 'start') {
            setStartTime(newTime)
            const newStartMin = parseInt(hh) * 60 + parseInt(mm)
            const endMin = endHH * 60 + endMM
            if (endMin <= newStartMin) {
                const bumped = newStartMin + 60
                const nh = Math.min(23, Math.floor(bumped / 60))
                const nm = bumped % 60 - (bumped % 60 % 5)
                setEndTime(`${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`)
            }
        } else {
            const endMin = parseInt(hh) * 60 + parseInt(mm)
            const startMin = startHH * 60 + startMM
            if (endMin <= startMin) return
            setEndTime(newTime)
        }
    }

    const pickHour = (h: string) => setTime(h, activeMM)
    const pickMinute = (m: string) => {
        setTime(activeHH, m)
        if (editing === 'start') setTimeout(() => setEditing('end'), 200)
    }

    const isHourDisabled = (h: string) => {
        if (editing === 'start') return false
        return parseInt(h) < startHH || (parseInt(h) === startHH && parseInt(activeMM) <= startMM)
    }

    const durationLabel = (() => {
        if (diff <= 0) return null
        const hours = Math.floor(diff / 60)
        const mins = diff % 60
        if (hours > 0 && mins > 0) return `${hours} ساعة ${mins} دقيقة`
        if (hours > 0) return `${hours} ${hours === 1 ? 'ساعة' : hours === 2 ? 'ساعتين' : 'ساعات'}`
        return `${mins} دقيقة`
    })()

    return (
        <motion.div key="time" variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-3 pb-2" dir="rtl">
            {/* Start / End tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setEditing('start')}
                    className={`flex-1 py-2.5 rounded-xl text-center transition-all border ${
                        editing === 'start'
                            ? isGame ? 'bg-neon/15 border-neon/40 ring-2 ring-neon/20' : 'bg-electric/15 border-electric/40 ring-2 ring-electric/20'
                            : 'bg-white/5 border-white/10'
                    }`}
                >
                    <p className={`text-[9px] font-bold uppercase tracking-widest mb-0.5 ${editing === 'start' ? 'text-white/50' : 'text-white/30'}`}>البدء</p>
                    <p className={`text-xl font-space font-black ${editing === 'start' ? 'text-white' : 'text-white/40'}`} dir="ltr">{startTime}</p>
                </button>
                <div className="flex items-center pt-3">
                    <ArrowLeft className="w-3.5 h-3.5 text-white/20" />
                </div>
                <button
                    onClick={() => setEditing('end')}
                    className={`flex-1 py-2.5 rounded-xl text-center transition-all border ${
                        editing === 'end'
                            ? isGame ? 'bg-neon/15 border-neon/40 ring-2 ring-neon/20' : 'bg-electric/15 border-electric/40 ring-2 ring-electric/20'
                            : 'bg-white/5 border-white/10'
                    }`}
                >
                    <p className={`text-[9px] font-bold uppercase tracking-widest mb-0.5 ${editing === 'end' ? 'text-white/50' : 'text-white/30'}`}>الانتهاء</p>
                    <p className={`text-xl font-space font-black ${editing === 'end' ? 'text-white' : 'text-white/40'}`} dir="ltr">{endTime}</p>
                </button>
            </div>

            {/* Duration badge */}
            {durationLabel && (
                <div className="flex justify-center">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                        isGame ? 'bg-neon/10 text-neon/80 border-neon/20' : 'bg-electric/10 text-electric/80 border-electric/20'
                    }`}>
                        <Clock className="w-3 h-3" />
                        {durationLabel}
                    </div>
                </div>
            )}

            {/* Hour grid */}
            <div>
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1.5">الساعة</p>
                <div className="grid grid-cols-6 gap-1">
                    {HOURS.map(h => {
                        const selected = h === activeHH
                        const disabled = isHourDisabled(h)
                        return (
                            <button
                                key={h}
                                onClick={() => !disabled && pickHour(h)}
                                disabled={disabled}
                                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                                    selected
                                        ? isGame ? 'bg-neon text-white shadow-lg shadow-neon/30' : 'bg-electric text-white shadow-lg shadow-electric/30'
                                        : disabled
                                            ? 'bg-white/[0.02] text-white/10'
                                            : 'bg-white/5 text-white/60 hover:bg-white/10 active:scale-95'
                                }`}
                            >
                                {h}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Minute grid */}
            <div>
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1.5">الدقائق</p>
                <div className="grid grid-cols-6 gap-1">
                    {MINUTES.map(m => {
                        const selected = m === activeMM
                        return (
                            <button
                                key={m}
                                onClick={() => pickMinute(m)}
                                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                                    selected
                                        ? isGame ? 'bg-neon text-white shadow-lg shadow-neon/30' : 'bg-electric text-white shadow-lg shadow-electric/30'
                                        : 'bg-white/5 text-white/60 hover:bg-white/10 active:scale-95'
                                }`}
                            >
                                {m}
                            </button>
                        )
                    })}
                </div>
            </div>
        </motion.div>
    )
}

export function InteractiveEventModal({ isOpen, onClose, onSave, onDelete, initialDate, initialEvent, locale, initialStep = 'type' }: InteractiveEventModalProps) {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<Step>(initialStep);
    const [refData, setRefData] = useState<{ trainers: any[], classes: any[] }>({ trainers: [], classes: [] });

    const [type, setType] = useState<'training' | 'game'>(initialEvent?.type || 'training');

    const [selectedTrainer, setSelectedTrainer] = useState<string>(initialEvent?.trainer_id || '');
    const [selectedClass, setSelectedClass] = useState<string>(() => {
        if (initialEvent?.class_id) return initialEvent.class_id;
        if (initialEvent?.notes_en) {
            try { return JSON.parse(initialEvent.notes_en).class_id || ''; } catch { return ''; }
        }
        return '';
    });

    const [homeTeam, setHomeTeam] = useState<string>(() => {
        if (initialEvent?.notes_en) {
            try { return JSON.parse(initialEvent.notes_en).homeBtn || ''; } catch { return ''; }
        }
        return '';
    });
    const [awayTeamName, setAwayTeamName] = useState<string>(() => {
        if (initialEvent?.notes_en) {
            try { return JSON.parse(initialEvent.notes_en).awayName || ''; } catch { return ''; }
        }
        return '';
    });

    const { toast } = useToast();

    const [startTime, setStartTime] = useState(initialEvent?.start_time || '16:00');
    const [endTime, setEndTime] = useState(initialEvent?.end_time || '18:00');

    useEffect(() => {
        if (isOpen) {
            setStep(initialStep);
            loadRefData();
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen, initialStep]);

    const refDataCache = useRef<{ data: { trainers: any[]; classes: any[] }; ts: number } | null>(null);

    const loadRefData = async () => {
        if (refDataCache.current && Date.now() - refDataCache.current.ts < 5 * 60 * 1000) {
            setRefData(refDataCache.current.data);
            return;
        }
        try {
            const res = await getEventRefData();
            if (!res.success) {
                toast(res.error || 'فشل تحميل البيانات', 'error');
                return;
            }
            const data = { trainers: res.trainers ?? [], classes: res.classes ?? [] };
            refDataCache.current = { data, ts: Date.now() };
            setRefData(data);
        } catch {
            toast('فشل تحميل البيانات', 'error');
        }
    };

    const handleNext = () => {
        if (step === 'type') setStep('details');
        else if (step === 'details') setStep('time');
        else if (step === 'time') {
            const [sh, sm] = startTime.split(':').map(Number);
            const [eh, em] = endTime.split(':').map(Number);
            if (eh * 60 + em <= sh * 60 + sm) {
                toast('وقت النهاية يجب أن يكون بعد وقت البداية', 'error');
                return;
            }
            setStep('review');
        }
    };

    const handleBack = () => {
        if (step === 'details') setStep('type');
        else if (step === 'time') setStep('details');
        else if (step === 'review') setStep('time');
        else if (step === 'delete-confirm') setStep('review');
    };

    const generateTitle = () => {
        if (type === 'training') {
            const cls = refData.classes.find(c => c.id === selectedClass);
            return cls ? `تدريب - ${cls.name_ar}` : 'تدريب جديد';
        } else {
            const home = refData.classes.find(c => c.id === homeTeam);
            return `${home ? home.name_ar : 'مضيف'} vs ${awayTeamName || 'ضيف'}`;
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const generated = generateTitle();
            const title = (initialEvent && generated === 'تدريب جديد')
                ? (initialEvent.title_ar || initialEvent.title_he || generated)
                : generated;

            let existingNotes: Record<string, any> = {};
            if (initialEvent?.notes_en) {
                try { existingNotes = JSON.parse(initialEvent.notes_en); } catch {}
            }

            const notes = {
                ...existingNotes,
                class_id: type === 'training' ? selectedClass : homeTeam,
                homeBtn: homeTeam,
                awayName: awayTeamName
            };

            const [sh, sm] = startTime.split(':').map(Number);
            const [eh, em] = endTime.split(':').map(Number);
            if (eh * 60 + em <= sh * 60 + sm) {
                toast('وقت النهاية يجب أن يكون بعد وقت البداية', 'error');
                setLoading(false);
                return;
            }

            await onSave({
                type,
                title_en: title,
                title_ar: title,
                title_he: title,
                start_time: startTime,
                end_time: endTime,
                event_date: initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
                hall_id: initialEvent?.hall_id || null,
                trainer_id: selectedTrainer || initialEvent?.trainer_id || null,
                notes_en: JSON.stringify(notes),
            });
            onClose();
        } catch (error) {
            // error handled by parent
        } finally {
            setLoading(false);
        }
    };

    const slideVariants: any = {
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
        exit: { opacity: 0, y: -8, transition: { duration: 0.15 } }
    };

    if (typeof window === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex flex-col justify-end sm:justify-center sm:items-center sm:p-6" dir="rtl">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#0B132B]/80 backdrop-blur-xl"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%', transition: { type: 'spring', bounce: 0, duration: 0.4 } }}
                        transition={{ type: 'spring', bounce: 0.1, duration: 0.5 }}
                        className="relative w-full max-w-lg bg-[#0B132B] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[97dvh] sm:max-h-[92dvh] sm:h-[700px] shadow-float mt-auto border border-white/10"
                    >
                        {/* Header */}
                        <div className="bg-[#0B132B] p-8 text-white relative flex-shrink-0 border-b border-white/10">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-electric/15 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-[50px] translate-y-1/2 -translate-x-1/2" />

                            <div className="relative z-10 flex justify-between items-center mb-6">
                                <h2 className="text-3xl font-syncopate font-bold tracking-tight text-white">
                                    {step === 'delete-confirm' ? 'حذف' : initialEvent ? 'تعديل' : 'إضافة'}
                                </h2>
                                <button onClick={onClose} aria-label="إغلاق" className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors active:scale-95">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {step !== 'delete-confirm' && (
                                <div className="relative z-10 flex space-x-2 rtl:space-x-reverse">
                                    {['type', 'details', 'time', 'review'].map((s, i) => {
                                        const isActive = ['type', 'details', 'time', 'review'].indexOf(step) >= i;
                                        return (
                                            <div key={s} className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
                                                <motion.div
                                                    initial={false}
                                                    animate={{ width: isActive ? '100%' : '0%' }}
                                                    transition={{ duration: 0.4 }}
                                                    className={`h-full transition-colors duration-300 ${type === 'game' ? 'bg-neon' : 'bg-electric'}`}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative min-h-0">
                            <AnimatePresence mode="wait">
                                {/* TYPE SELECTION */}
                                {step === 'type' && (
                                    <motion.div key="type" variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-6">
                                        <h3 className="text-xl font-bold text-white/80 mb-2">{locale === 'he' ? 'בחר סוג פעילות' : 'اختر نوع الفعالية'}</h3>

                                        <motion.button
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => setType('training')}
                                            className={`relative w-full h-32 rounded-[2rem] overflow-hidden p-5 flex flex-col justify-end transition-all ${
                                                type === 'training'
                                                    ? 'ring-4 ring-electric shadow-lg shadow-electric/20'
                                                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                            }`}
                                        >
                                            <div className={`absolute inset-0 ${type === 'training' ? 'bg-gradient-to-br from-electric/20 to-blue-900/40' : 'bg-gradient-to-br from-white/5 to-transparent'}`} />
                                            <TrainingSVG className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" />
                                            <div className="relative z-10">
                                                <h4 className="text-3xl font-syncopate font-bold text-white">تدريب</h4>
                                                <p className="text-white/50 font-outfit font-medium">حصة تدريبية اعتيادية</p>
                                            </div>
                                        </motion.button>

                                        <motion.button
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => setType('game')}
                                            className={`relative w-full h-32 rounded-[2rem] overflow-hidden p-5 flex flex-col justify-end transition-all ${
                                                type === 'game'
                                                    ? 'ring-4 ring-neon shadow-lg shadow-neon/20'
                                                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                            }`}
                                        >
                                            <div className={`absolute inset-0 ${type === 'game' ? 'bg-gradient-to-br from-neon/20 to-orange-900/40' : 'bg-gradient-to-br from-white/5 to-transparent'}`} />
                                            <GameSVG className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" />
                                            <div className="relative z-10">
                                                <h4 className="text-3xl font-syncopate font-bold text-white">مباراة</h4>
                                                <p className="text-white/50 font-outfit font-medium">مباراة تنافسية</p>
                                            </div>
                                        </motion.button>
                                    </motion.div>
                                )}

                                {/* DETAILS */}
                                {step === 'details' && (
                                    <motion.div key="details" variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-6 pb-10">
                                        {type === 'training' ? (
                                            <>
                                                <div>
                                                    <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                                                        <span className="w-7 h-7 rounded-full bg-electric/20 text-electric text-sm flex items-center justify-center font-bold">1</span>
                                                        المدرب المسؤول
                                                    </h3>
                                                    <SearchPicker
                                                        items={refData.trainers}
                                                        selectedId={selectedTrainer}
                                                        onSelect={setSelectedTrainer}
                                                        placeholder="ابحث عن مدرب..."
                                                        showAvailability
                                                        locale={locale}
                                                    />
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                                                        <span className="w-7 h-7 rounded-full bg-electric/20 text-electric text-sm flex items-center justify-center font-bold">2</span>
                                                        الفريق المستهدف
                                                    </h3>
                                                    <SearchPicker
                                                        items={refData.classes}
                                                        selectedId={selectedClass}
                                                        onSelect={setSelectedClass}
                                                        placeholder="ابحث عن فريق..."
                                                        showCategory
                                                        locale={locale}
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div>
                                                    <h3 className="text-base font-bold text-white mb-3">الفريق المضيف</h3>
                                                    <SearchPicker
                                                        items={refData.classes}
                                                        selectedId={homeTeam}
                                                        onSelect={setHomeTeam}
                                                        placeholder="ابحث عن الفريق المضيف..."
                                                        showCategory
                                                        locale={locale}
                                                    />
                                                </div>

                                                <div className="flex justify-center">
                                                    <div className="bg-neon/10 text-neon font-syncopate font-black text-2xl px-6 py-2 rounded-full border border-neon/20">VS</div>
                                                </div>

                                                <div>
                                                    <h3 className="text-base font-bold text-white mb-3">الفريق الضيف</h3>
                                                    <input
                                                        value={awayTeamName}
                                                        onChange={(e) => setAwayTeamName(e.target.value)}
                                                        placeholder="أدخل اسم الفريق"
                                                        className="w-full bg-white/10 border border-white/10 rounded-2xl p-5 font-outfit text-lg text-white/90 outline-none focus:border-white/30 transition-all placeholder:text-white/20"
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                )}

                                {/* TIME */}
                                {step === 'time' && (
                                    <TimeStepContent
                                        startTime={startTime}
                                        endTime={endTime}
                                        setStartTime={setStartTime}
                                        setEndTime={setEndTime}
                                        type={type}
                                        slideVariants={slideVariants}
                                    />
                                )}

                                {/* REVIEW */}
                                {step === 'review' && (
                                    <motion.div key="review" variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col items-center justify-center h-full text-center gap-6">
                                        <div className="relative">
                                            <div className={`absolute inset-0 rounded-full blur-xl ${type === 'game' ? 'bg-neon/40' : 'bg-electric/40'}`} />
                                            <div className={`relative w-28 h-28 rounded-full flex items-center justify-center border-4 border-white/20 shadow-xl ${type === 'game' ? 'bg-gradient-to-br from-orange-400 to-neon' : 'bg-gradient-to-br from-blue-400 to-electric'}`}>
                                                <CheckCircle2 className="w-12 h-12 text-white" />
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-3xl font-syncopate font-black text-white mb-2">{generateTitle()}</h3>
                                            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full font-space text-white/70 font-bold border border-white/10">
                                                <Calendar className="w-4 h-4" /> {initialDate ? format(initialDate, 'dd/MM/yyyy') : ''}
                                                <span className="mx-2 opacity-30">|</span>
                                                <Clock className="w-4 h-4" /> {startTime} - {endTime}
                                            </div>
                                        </div>

                                        {onDelete && initialEvent && (
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setStep('delete-confirm')}
                                                className="mt-8 flex items-center gap-2 text-red-400 font-bold bg-red-500/15 px-6 py-3 rounded-xl hover:bg-red-500/25 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" /> حذف الفعالية
                                            </motion.button>
                                        )}
                                    </motion.div>
                                )}

                                {/* DELETE CONFIRM */}
                                {step === 'delete-confirm' && (
                                    <motion.div key="delete" variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col items-center justify-center h-full text-center gap-8">
                                        <div className="w-32 h-32 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 animate-pulse">
                                            <Trash2 className="w-16 h-16" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-white mb-4">هل أنت متأكد؟</h3>
                                            <p className="text-white/60">هذا الإجراء لا يمكن التراجع عنه. سيتم حذف الفعالية وكل ما يرتبط بها.</p>
                                        </div>

                                        <div className="w-full flex flex-col gap-3 mt-4">
                                            <motion.button
                                                whileTap={{ scale: 0.96 }}
                                                onClick={async () => {
                                                    setLoading(true);
                                                    if (initialEvent && onDelete) await onDelete(initialEvent.id);
                                                    setLoading(false);
                                                    onClose();
                                                }}
                                                className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl shadow-lg shadow-red-500/30 flex items-center justify-center"
                                            >
                                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'نعم، قم بالحذف قطعيًا'}
                                            </motion.button>
                                            <button onClick={() => setStep('review')} className="py-4 font-bold text-white/60 hover:bg-white/10 rounded-2xl transition-colors">
                                                تراجع
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer */}
                        <div className="p-5 bg-[#0B132B] border-t border-white/10 shrink-0 flex items-center justify-between z-20" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))' }}>
                            {step !== 'type' && step !== 'delete-confirm' && step !== 'review' ? (
                                <motion.button whileTap={{ scale: 0.95 }} onClick={handleBack} className="flex items-center justify-center w-14 h-14 rounded-2xl border-2 border-white/10 text-white/50 hover:bg-white/10 shrink-0">
                                    <ArrowRight className="w-6 h-6" />
                                </motion.button>
                            ) : <div className="w-14" />}

                            {step !== 'delete-confirm' && (
                                <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    onClick={step === 'review' ? handleSave : handleNext}
                                    disabled={loading}
                                    className={`flex-1 ml-4 sm:ml-0 h-14 rounded-2xl font-bold text-lg text-white shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-40 ${
                                        type === 'game' ? 'bg-gradient-to-r from-neon to-orange-500 shadow-neon/30' : 'bg-gradient-to-r from-electric to-blue-600 shadow-electric/30'
                                    }`}
                                >
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : step === 'review' ? 'تأكيد الحفظ' : 'متابعة'}
                                    {!loading && step !== 'review' && <ArrowLeft className="w-5 h-5" />}
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
