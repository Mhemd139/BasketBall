'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getEventRefData } from '@/app/actions';
import { GameSVG } from '../ui/svg/GameSVG';
import { TrainingSVG } from '../ui/svg/TrainingSVG';
import { ScrollTimePicker } from '../ui/ScrollTimePicker';
import { format } from 'date-fns';
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2, Trash2, Clock, Calendar, X, Check, Search } from 'lucide-react';

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

export function InteractiveEventModal({ isOpen, onClose, onSave, onDelete, initialDate, initialEvent, locale, initialStep = 'type' }: InteractiveEventModalProps) {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<Step>(initialStep);
    const [refData, setRefData] = useState<{ trainers: any[], classes: any[] }>({ trainers: [], classes: [] });

    // Form State
    const [type, setType] = useState<'training' | 'game'>(initialEvent?.type || 'training');
    
    // Training Specific
    const [selectedTrainer, setSelectedTrainer] = useState<string>(initialEvent?.trainer_id || '');
    const [selectedClass, setSelectedClass] = useState<string>(() => {
        // Prefer proper class_id column, fallback to legacy notes_en JSON
        if (initialEvent?.class_id) return initialEvent.class_id;
        if (initialEvent?.notes_en) {
            try { return JSON.parse(initialEvent.notes_en).class_id || ''; } catch { return ''; }
        }
        return '';
    });

    // Game Specific
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

    // Common
    const [startTime, setStartTime] = useState(initialEvent?.start_time || '16:00');
    const [endTime, setEndTime] = useState(initialEvent?.end_time || '18:00');

    useEffect(() => {
        if (isOpen) {
            setStep(initialStep);
            loadRefData();
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen, initialStep]);

    const loadRefData = async () => {
        const res = await getEventRefData();
        if (res.success) setRefData({ trainers: res.trainers, classes: res.classes });
    };

    const handleNext = () => {
        if (step === 'type') setStep('details');
        else if (step === 'details') setStep('time');
        else if (step === 'time') setStep('review');
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
            // Keep original title when editing if no class was selected (avoids 'تدريب جديد' overwrite)
            const title = (initialEvent && generated === 'تدريب جديد')
                ? (initialEvent.title_ar || initialEvent.title_he || generated)
                : generated;

            // Preserve existing notes fields (like schedule_id) when editing
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

    const getName = (item: any) => locale === 'he' ? (item.name_he || item.name_ar) : (item.name_ar || item.name_he);
    const getCategory = (item: any) => item.categories ? (locale === 'he' ? (item.categories.name_he || item.categories.name_ar) : (item.categories.name_ar || item.categories.name_he)) : null;

    // Searchable vertical list picker — large touch targets, filter-as-you-type
    const SearchPicker = ({ items, selectedId, onSelect, placeholder, showCategory = false, showAvailability = false }: any) => {
        const [query, setQuery] = useState('');
        const filtered = query.trim()
            ? items.filter((item: any) => {
                const name = getName(item)?.toLowerCase() || '';
                const cat = showCategory ? (getCategory(item)?.toLowerCase() || '') : '';
                return name.includes(query.toLowerCase()) || cat.includes(query.toLowerCase());
            })
            : items;

        // Avatar color by index
        const avatarColors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];

        return (
            <div className="flex flex-col gap-2">
                {/* Search input */}
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={placeholder || 'بحث...'}
                        className="w-full bg-gray-100 rounded-xl pr-10 pl-4 py-3 text-sm text-royal outline-none focus:ring-2 focus:ring-electric/40 transition-all"
                        dir="rtl"
                    />
                </div>

                {/* List */}
                <div className="max-h-[220px] overflow-y-auto rounded-2xl border border-gray-100 divide-y divide-gray-50 bg-white shadow-soft">
                    {filtered.length === 0 && (
                        <div className="py-6 text-center text-sm text-gray-400">لا توجد نتائج</div>
                    )}
                    {filtered.map((item: any, idx: number) => {
                        const isSelected = selectedId === item.id;
                        const label = getName(item);
                        const category = showCategory ? getCategory(item) : null;
                        const initials = label?.trim().split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase() || '?';
                        const avatarColor = avatarColors[idx % avatarColors.length];
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => onSelect(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-right transition-colors active:scale-[0.99] touch-manipulation ${
                                    isSelected ? 'bg-electric/8' : 'hover:bg-gray-50'
                                }`}
                            >
                                {/* Avatar */}
                                <div className={`w-9 h-9 rounded-full ${avatarColor}/20 border ${avatarColor.replace('bg-', 'border-')}/30 flex items-center justify-center shrink-0 text-xs font-bold ${avatarColor.replace('bg-', 'text-').replace('-500', '-700')}`}>
                                    {initials}
                                </div>

                                {/* Name + subtitle */}
                                <div className="flex-1 min-w-0 text-right">
                                    <p className={`font-bold text-sm leading-tight ${isSelected ? 'text-electric' : 'text-royal'}`}>{label}</p>
                                    {category && (
                                        <span className="inline-block mt-0.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                            {category}
                                        </span>
                                    )}
                                    {showAvailability && item.availability?.length > 0 && (
                                        <div className="flex gap-1 mt-0.5 flex-row-reverse">
                                            {item.availability.slice(0, 3).map((day: string) => (
                                                <span key={day} className="text-[9px] uppercase font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                                    {day.slice(0, 2)}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Checkmark */}
                                {isSelected && <Check className="w-4 h-4 text-electric shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    const slideVariants: any = {
        hidden: { opacity: 0, x: 50 },
        visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
        exit: { opacity: 0, x: -50, transition: { duration: 0.2 } }
    };

    if (typeof window === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex flex-col justify-end sm:justify-center sm:items-center sm:p-6" dir={locale === 'he' ? 'rtl' : 'rtl'}>
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
                        exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        onClick={onClose}
                        className="absolute inset-0 bg-royal/60"
                    />

                    {/* Immersive Drawer Content */}
                    <motion.div 
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%', transition: { type: 'spring', bounce: 0, duration: 0.4 } }}
                        transition={{ type: 'spring', bounce: 0.1, duration: 0.5 }}
                        className="relative w-full max-w-lg bg-gray-50 rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:h-[700px] shadow-float mt-auto"
                    >
                        {/* Header Area */}
                        <div className="bg-royal p-8 text-white relative flex-shrink-0">
                            {/* Decorative background gradients */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-electric/20 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-neon/20 rounded-full blur-[50px] translate-y-1/2 -translate-x-1/2" />
                            
                            <div className="relative z-10 flex justify-between items-center mb-6">
                                <h2 className="text-3xl font-syncopate font-bold tracking-tight">
                                    {step === 'delete-confirm' ? 'حذف' : initialEvent ? 'تعديل' : 'إضافة'}
                                </h2>
                                <button onClick={onClose} aria-label="Close" className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors active:scale-95">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modern Tab Progress Indicator */}
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
                                                    className={`h-full ${type === 'game' ? 'bg-neon' : 'bg-electric'}`}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Scrollable Content Area */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative min-h-0">
                            <AnimatePresence mode="wait">
                                {/* STEP 1: TYPE SELECTION */}
                                {step === 'type' && (
                                    <motion.div key="type" variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-6">
                                        <h3 className="text-xl font-bold text-royal mb-2">{locale === 'he' ? 'בחר סוג פעילות' : 'اختر نوع الفعالية'}</h3>
                                        
                                        <motion.button 
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => setType('training')}
                                            className={`relative w-full h-32 rounded-[2rem] overflow-hidden p-5 flex flex-col justify-end transition-shadow ${type === 'training' ? 'ring-4 ring-electric shadow-lg shadow-electric/20' : 'shadow-soft hover:shadow-card'}`}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-white to-blue-50/50" />
                                            <TrainingSVG className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" />
                                            <div className="relative z-10">
                                                <h4 className="text-3xl font-syncopate font-bold text-royal">تدريب</h4>
                                                <p className="text-royal/60 font-outfit font-medium">حصة تدريبية اعتيادية</p>
                                            </div>
                                        </motion.button>

                                        <motion.button 
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => setType('game')}
                                            className={`relative w-full h-32 rounded-[2rem] overflow-hidden p-5 flex flex-col justify-end transition-shadow ${type === 'game' ? 'ring-4 ring-neon shadow-lg shadow-neon/20' : 'shadow-soft hover:shadow-card'}`}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-white to-orange-50/50" />
                                            <GameSVG className="absolute inset-0 w-full h-full opacity-50 pointer-events-none scale-150 -translate-y-10" />
                                            <div className="relative z-10">
                                                <h4 className="text-3xl font-syncopate font-bold text-royal">مباراة</h4>
                                                <p className="text-royal/60 font-outfit font-medium">مباراة تنافسية</p>
                                            </div>
                                        </motion.button>
                                    </motion.div>
                                )}

                                {/* STEP 2: DETAILS */}
                                {step === 'details' && (
                                    <motion.div key="details" variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-6 pb-10">
                                        {type === 'training' ? (
                                            <>
                                                <div>
                                                    <h3 className="text-base font-bold text-royal mb-3 flex items-center gap-2">
                                                        <span className="w-7 h-7 rounded-full bg-electric/10 text-electric text-sm flex items-center justify-center font-bold">1</span>
                                                        المدرب المسؤول
                                                    </h3>
                                                    <SearchPicker
                                                        items={refData.trainers}
                                                        selectedId={selectedTrainer}
                                                        onSelect={setSelectedTrainer}
                                                        placeholder="ابحث عن مدرب..."
                                                        showAvailability
                                                    />
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-bold text-royal mb-3 flex items-center gap-2">
                                                        <span className="w-7 h-7 rounded-full bg-electric/10 text-electric text-sm flex items-center justify-center font-bold">2</span>
                                                        الفريق المستهدف
                                                    </h3>
                                                    <SearchPicker
                                                        items={refData.classes}
                                                        selectedId={selectedClass}
                                                        onSelect={setSelectedClass}
                                                        placeholder="ابحث عن فريق..."
                                                        showCategory
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div>
                                                    <h3 className="text-base font-bold text-royal mb-3">الفريق المضيف</h3>
                                                    <SearchPicker
                                                        items={refData.classes}
                                                        selectedId={homeTeam}
                                                        onSelect={setHomeTeam}
                                                        placeholder="ابحث عن الفريق المضيف..."
                                                        showCategory
                                                    />
                                                </div>

                                                <div className="flex justify-center">
                                                    <div className="bg-neon/10 text-neon font-syncopate font-black text-2xl px-6 py-2 rounded-full border border-neon/20">VS</div>
                                                </div>

                                                <div>
                                                    <h3 className="text-base font-bold text-royal mb-3">الفريق الضيف</h3>
                                                    <input
                                                        value={awayTeamName}
                                                        onChange={(e) => setAwayTeamName(e.target.value)}
                                                        placeholder="أدخل اسم الفريق"
                                                        className="w-full bg-white border-none shadow-soft rounded-2xl p-5 font-outfit text-lg outline-none focus:ring-2 focus:ring-neon transition-all"
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                )}

                                {/* STEP 3: TIME */}
                                {step === 'time' && (
                                    <motion.div key="time" variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-6 pb-10">
                                        <ScrollTimePicker
                                            value={startTime}
                                            onChange={setStartTime}
                                            label="وقت البدء"
                                        />
                                        <ScrollTimePicker
                                            value={endTime}
                                            onChange={setEndTime}
                                            label="وقت الانتهاء"
                                        />
                                    </motion.div>
                                )}

                                {/* STEP 4: REVIEW */}
                                {step === 'review' && (
                                    <motion.div key="review" variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col items-center justify-center h-full text-center gap-6">
                                        <div className="relative">
                                            <div className={`absolute inset-0 rounded-full blur-xl ${type === 'game' ? 'bg-neon/40' : 'bg-electric/40'}`} />
                                            <div className={`relative w-28 h-28 rounded-full flex items-center justify-center border-4 border-white shadow-xl ${type === 'game' ? 'bg-gradient-to-br from-orange-400 to-neon' : 'bg-gradient-to-br from-blue-400 to-electric'}`}>
                                                <CheckCircle2 className="w-12 h-12 text-white" />
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <h3 className="text-3xl font-syncopate font-black text-royal mb-2">{generateTitle()}</h3>
                                            <div className="inline-flex items-center gap-2 bg-royal/5 px-4 py-2 rounded-full font-space text-royal/70 font-bold">
                                                <Calendar className="w-4 h-4" /> {initialDate ? format(initialDate, 'dd/MM/yyyy') : ''}
                                                <span className="mx-2 opacity-30">|</span>
                                                <Clock className="w-4 h-4" /> {startTime} - {endTime}
                                            </div>
                                        </div>

                                        {onDelete && initialEvent && (
                                            <motion.button 
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setStep('delete-confirm')}
                                                className="mt-8 flex items-center gap-2 text-red-500 font-bold bg-red-50 px-6 py-3 rounded-xl hover:bg-red-100 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" /> حذف الفعالية
                                            </motion.button>
                                        )}
                                    </motion.div>
                                )}

                                {/* DELETE CONFIRM */}
                                {step === 'delete-confirm' && (
                                    <motion.div key="delete" variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col items-center justify-center h-full text-center gap-8">
                                        <div className="w-32 h-32 rounded-full bg-red-100 flex items-center justify-center text-red-500 animate-pulse">
                                            <Trash2 className="w-16 h-16" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-royal mb-4">هل أنت متأكد؟</h3>
                                            <p className="text-royal/60">هذا الإجراء لا يمكن التراجع عنه. سيتم حذف الفعالية وكل ما يرتبط بها.</p>
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
                                            <button onClick={() => setStep('review')} className="py-4 font-bold text-royal/60 hover:bg-royal/5 rounded-2xl">
                                                تراجع
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Sticky Footer Actions */}
                        <div className="p-5 pb-8 sm:p-6 bg-white border-t border-gray-100 shrink-0 flex items-center justify-between z-20">
                            {step !== 'type' && step !== 'delete-confirm' && step !== 'review' ? (
                                <motion.button whileTap={{ scale: 0.95 }} onClick={handleBack} className="flex hidden items-center justify-center w-14 h-14 rounded-2xl border-2 border-gray-100 text-royal hover:bg-gray-50 sm:flex shrink-0">
                                    <ArrowRight className="w-6 h-6" />
                                </motion.button>
                            ) : <div className="w-14" />}

                            {step !== 'delete-confirm' && (
                                <motion.button 
                                    whileTap={{ scale: 0.96 }}
                                    onClick={step === 'review' ? handleSave : handleNext}
                                    disabled={loading}
                                    className={`flex-1 ml-4 sm:ml-0 h-14 rounded-2xl font-bold text-lg text-white shadow-lg flex items-center justify-center gap-2 transition-all ${
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
