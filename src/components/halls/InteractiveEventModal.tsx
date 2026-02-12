'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Loader2, Calendar as CalendarIcon, Clock, Users, Trophy, User, ArrowRight, ArrowLeft, CheckCircle2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { getEventRefData } from '@/app/actions';
import { motion, AnimatePresence } from 'framer-motion';

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
        if (initialEvent?.notes_en) {
            try {
                const notes = JSON.parse(initialEvent.notes_en);
                return notes.class_id || '';
            } catch { return ''; }
        }
        return '';
    });

    // Game Specific
    const [gameType, setGameType] = useState<'internal' | 'external'>(() => {
        if (initialEvent?.notes_en) {
            try {
                const notes = JSON.parse(initialEvent.notes_en);
                return notes.gameType || 'internal';
            } catch { return 'internal'; }
        }
        return 'internal';
    });
    const [homeTeam, setHomeTeam] = useState<string>(() => {
        if (initialEvent?.notes_en) {
            try {
                const notes = JSON.parse(initialEvent.notes_en);
                return notes.homeBtn || '';
            } catch { return ''; }
        }
        return '';
    });
    const [awayTeamId, setAwayTeamId] = useState<string>(() => {
        if (initialEvent?.notes_en) {
            try {
                const notes = JSON.parse(initialEvent.notes_en);
                return notes.awayBtn || '';
            } catch { return ''; }
        }
        return '';
    });
    const [awayTeamName, setAwayTeamName] = useState<string>(() => {
        if (initialEvent?.notes_en) {
            try {
                const notes = JSON.parse(initialEvent.notes_en);
                return notes.awayName || '';
            } catch { return ''; }
        }
        return '';
    });

    // Common
    const [startTime, setStartTime] = useState(initialEvent?.start_time || '16:00');
    const [endTime, setEndTime] = useState(initialEvent?.end_time || '18:00');

    useEffect(() => {
        if (isOpen) {
            // Reset or Load Initial
            setStep(initialStep);
            loadRefData();
        }
    }, [isOpen, initialStep]);

    const loadRefData = async () => {
        const res = await getEventRefData();
        if (res.success) {
            setRefData({ trainers: res.trainers, classes: res.classes });
        }
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
    };

    const generateTitle = () => {
        if (type === 'training') {
            const trainer = refData.trainers.find(t => t.id === selectedTrainer);
            const trainerName = trainer ? trainer.name_ar : '';
            
            const cls = refData.classes.find(c => c.id === selectedClass);
            const className = cls ? cls.name_ar : '';

            let base = 'تدريب';
            
            if (className) base += ` - ${className}`;
            if (trainerName) base += ` (${trainerName})`;

            return base;
        } else {
            const home = refData.classes.find(c => c.id === homeTeam);
            const homeName = home ? home.name_ar : 'Home';
            
            let awayName = 'Away';
            if (gameType === 'internal') {
                const away = refData.classes.find(c => c.id === awayTeamId);
                awayName = away ? away.name_ar : 'Away';
            } else {
                awayName = awayTeamName || 'External Team';
            }

            return `${homeName} vs ${awayName}`;
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const title = generateTitle();
            const notes = {
                class_id: type === 'training' ? selectedClass : homeTeam, // Home team acts as target team for games
                gameType,
                homeBtn: homeTeam,
                awayBtn: awayTeamId,
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
                trainer_id: selectedTrainer || null,
                notes_en: JSON.stringify(notes),
            });
            onClose();
        } catch (error) {
            console.error("Failed to save event", error);
        } finally {
            setLoading(false);
        }
    };

    const getName = (item: any) => locale === 'he' ? (item.name_he || item.name_ar) : (item.name_ar || item.name_he);

    const handleDelete = async () => {
        if (!onDelete || !initialEvent) return;
        setLoading(true);
        try {
            await onDelete(initialEvent.id);
            onClose();
        } catch (error) {
            console.error("Failed to delete event", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-white rounded-3xl overflow-hidden p-0 border-0 h-[500px] flex flex-col">
                <div className="bg-navy-900 p-6 pt-8 text-white relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <DialogTitle className="relative z-10 text-2xl font-outfit font-bold flex items-center gap-2">
                        {step === 'type' && <><CalendarIcon className="w-6 h-6 text-gold-400" /> {'نوع الحدث'}</>}
                        {step === 'details' && <><Users className="w-6 h-6 text-gold-400" /> {'التفاصيل'}</>}
                        {step === 'time' && <><Clock className="w-6 h-6 text-gold-400" /> {'التوقيت'}</>}
                        {step === 'review' && <><CheckCircle2 className="w-6 h-6 text-gold-400" /> {'مراجعة'}</>}
                    </DialogTitle>
                    {/* Progress Bar (Hide on Delete Confirm) */}
                    {step !== 'delete-confirm' && (
                        <div className="flex gap-2 mt-4">
                            {['type', 'details', 'time', 'review'].map((s, i) => (
                                <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                                    ['type', 'details', 'time', 'review'].indexOf(step) >= i ? 'bg-gold-500' : 'bg-white/20'
                                }`} />
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="h-full flex flex-col"
                        >
                            {step === 'type' && (
                                <div className="grid grid-cols-2 gap-4 h-full">
                                    <motion.button 
                                        whileHover={{ scale: 1.02, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setType('training')}
                                        className={`flex flex-col items-center justify-center gap-4 rounded-3xl border-2 transition-all p-6 ${
                                            type === 'training' 
                                            ? 'border-navy-600 bg-navy-50 text-navy-900 ring-2 ring-navy-600 ring-offset-2' 
                                            : 'border-white bg-white/50 text-gray-400 hover:border-navy-200 hover:bg-white'
                                        }`}
                                    >
                                        <div className={`p-5 rounded-2xl transition-colors ${type === 'training' ? 'bg-navy-600 text-white shadow-lg shadow-navy-200' : 'bg-gray-100 group-hover:bg-navy-50'}`}>
                                            <User className="w-8 h-8" />
                                        </div>
                                        <span className="font-outfit font-bold text-lg">{'تدريب'}</span>
                                    </motion.button>
                                    
                                    <motion.button 
                                        whileHover={{ scale: 1.02, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setType('game')}
                                        className={`flex flex-col items-center justify-center gap-4 rounded-3xl border-2 transition-all p-6 ${
                                            type === 'game' 
                                            ? 'border-gold-500 bg-gold-50 text-orange-900 ring-2 ring-gold-500 ring-offset-2' 
                                            : 'border-white bg-white/50 text-gray-400 hover:border-gold-200 hover:bg-white'
                                        }`}
                                    >
                                        <div className={`p-5 rounded-2xl transition-colors ${type === 'game' ? 'bg-gold-500 text-white shadow-lg shadow-gold-200' : 'bg-gray-100 group-hover:bg-gold-50'}`}>
                                            <Trophy className="w-8 h-8" />
                                        </div>
                                        <span className="font-outfit font-bold text-lg">{'مباراة'}</span>
                                    </motion.button>
                                </div>
                            )}

                            {step === 'details' && (
                                <div className="space-y-6">
                                    {type === 'training' ? (
                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <label className="text-sm font-bold text-navy-900">
                                                    {'المدرب المسؤول'}
                                                </label>
                                                <select 
                                                    value={selectedTrainer}
                                                    onChange={(e) => setSelectedTrainer(e.target.value)}
                                                    className="w-full p-4 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-navy-600 outline-none transition-all text-sm"
                                                >
                                                    <option value="">{'اختر مدرب...'}</option>
                                                    {refData.trainers.map(t => (
                                                        <option key={t.id} value={t.id}>{getName(t)}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-sm font-bold text-navy-900">
                                                    {'الفريق المستهدف (للحضور)'}
                                                </label>
                                                <select 
                                                    value={selectedClass}
                                                    onChange={(e) => setSelectedClass(e.target.value)}
                                                    className="w-full p-4 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-navy-600 outline-none transition-all text-sm"
                                                >
                                                    <option value="">{'اختر فريق...'}</option>
                                                    {refData.classes.map(c => (
                                                        <option key={c.id} value={c.id}>{getName(c)}</option>
                                                    ))}
                                                </select>
                                                <p className="text-[10px] text-gray-400 font-medium">
                                                    {'هذا سيقوم بتجهيز قائمة الحضور بهذا الفريق'}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        // Game Logic
                                        <div className="space-y-6">
                                            {/* Game Type Toggle */}
                                            <div className="flex bg-gray-200 p-1 rounded-xl">
                                                <button 
                                                    onClick={() => setGameType('internal')}
                                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${gameType === 'internal' ? 'bg-white shadow-sm text-navy-900' : 'text-gray-500'}`}
                                                >
                                                    {'داخلي'}
                                                </button>
                                                <button 
                                                    onClick={() => setGameType('external')}
                                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${gameType === 'external' ? 'bg-white shadow-sm text-navy-900' : 'text-gray-500'}`}
                                                >
                                                    {'خارجي'}
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-sm font-bold text-navy-900">{locale === 'he' ? 'קבוצת בית' : 'الفريق المضيف'}</label>
                                                <select
                                                    value={homeTeam}
                                                    onChange={(e) => setHomeTeam(e.target.value)}
                                                    className="w-full p-3 rounded-xl border border-gray-200 bg-white"
                                                >
                                                    <option value="">{locale === 'he' ? 'בחר קבוצה...' : 'اختر فريق...'}</option>
                                                    {refData.classes.map(c => (
                                                        <option key={c.id} value={c.id}>{getName(c)}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="flex items-center justify-center font-bold text-lg text-gold-500">VS</div>

                                            <div className="space-y-3">
                                                <label className="text-sm font-bold text-navy-900">{locale === 'he' ? 'קבוצת חוץ' : 'الفريق الضيف'}</label>
                                                {gameType === 'internal' ? (
                                                     <select
                                                        value={awayTeamId}
                                                        onChange={(e) => setAwayTeamId(e.target.value)}
                                                        className="w-full p-3 rounded-xl border border-gray-200 bg-white"
                                                    >
                                                        <option value="">{locale === 'he' ? 'בחר קבוצה...' : 'اختر فريق...'}</option>
                                                        {refData.classes.filter(c => c.id !== homeTeam).map(c => (
                                                            <option key={c.id} value={c.id}>{getName(c)}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input 
                                                        value={awayTeamName}
                                                        onChange={(e) => setAwayTeamName(e.target.value)}
                                                        placeholder={locale === 'he' ? 'הזן שם קבוצת חוץ' : 'أدخل اسم الفريق الضيف'}
                                                        className="w-full p-3 rounded-xl border border-gray-200 bg-white"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {step === 'time' && (
                                <div className="space-y-6 pt-4">
                                     <div className="space-y-2">
                                        <label className="text-sm font-bold text-navy-900 flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gold-500" /> {locale === 'he' ? 'שעת התחלה' : 'وقت البدء'}
                                        </label>
                                        <input 
                                            type="time" 
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className="w-full p-4 rounded-xl border border-gray-200 text-lg font-mono bg-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-navy-900 flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-400" /> {locale === 'he' ? 'שעת סיום' : 'وقت الانتهاء'}
                                        </label>
                                         <input 
                                            type="time" 
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            className="w-full p-4 rounded-xl border border-gray-200 text-lg font-mono bg-white"
                                        />
                                    </div>
                                </div>
                            )}

                             {step === 'review' && (
                                <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
                                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-2 ${
                                        type === 'game' ? 'bg-orange-100 text-orange-600' : 'bg-navy-100 text-navy-600'
                                    }`}>
                                        {type === 'game' ? <Trophy className="w-10 h-10" /> : <User className="w-10 h-10" />}
                                    </div>
                                    
                                    <h3 className="text-xl font-bold text-navy-900">{generateTitle()}</h3>
                                    
                                    <div className="bg-white p-4 rounded-xl border border-gray-100 w-full shadow-sm text-sm text-gray-600 space-y-2">
                                        <div className="flex justify-between border-b pb-2">
                                            <span>{locale === 'he' ? 'תאריך:' : 'التاريخ:'}</span>
                                            <span className="font-bold text-navy-900">{initialDate ? format(initialDate, 'dd/MM/yyyy') : ''}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>{locale === 'he' ? 'שעה:' : 'الوقت:'}</span>
                                            <span className="font-bold text-navy-900">{startTime} - {endTime}</span>
                                        </div>
                                    </div>
                                    
                                    {onDelete && initialEvent && (
                                        <button 
                                            onClick={() => setStep('delete-confirm')}
                                            className="text-red-500 text-xs font-bold hover:text-red-600 underline"
                                        >
                                            {'حذف هذا الحدث'}
                                        </button>
                                    )}
                                </div>
                            )}

                            {step === 'delete-confirm' && (
                                <div className="flex flex-col items-center justify-center h-full space-y-6 text-center animate-in fade-in zoom-in duration-300 bg-gradient-to-b from-white to-red-50/50">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-red-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
                                        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center relative z-10 shadow-sm border border-red-100">
                                            <Trash2 className="w-10 h-10" />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3 z-10">
                                        <h3 className="text-3xl font-black text-navy-900 tracking-tight">
                                            {'هل أنت متأكد؟'}
                                        </h3>
                                        <p className="text-gray-500 text-sm max-w-[80%] mx-auto leading-relaxed">
                                                'سيتم حذف هذا الحدث نهائياً ولا يمكن استرجاعه. هل ترغب حقاً في المتابعة؟'
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-3 w-full px-8 z-10">
                                        <Button 
                                            onClick={handleDelete} 
                                            disabled={loading} 
                                            className="w-full bg-red-500 hover:bg-red-600 text-white rounded-2xl py-7 font-bold text-lg shadow-lg shadow-red-200 ring-4 ring-red-50 transition-all active:scale-[0.98]"
                                        >
                                            {loading ? <Loader2 className="animate-spin w-6 h-6" /> : 'نعم، احذف الحدث'}
                                        </Button>
                                        <button 
                                            onClick={() => setStep('review')}
                                            className="text-gray-400 font-bold text-sm hover:text-navy-900 hover:bg-gray-100 px-6 py-3 rounded-xl transition-all"
                                        >
                                            {'لا، تراجع'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <DialogFooter className="mr-0 p-6 bg-white border-t border-gray-100 flex justify-between items-center shrink-0">
                    {step !== 'type' && step !== 'delete-confirm' ? (
                        <button 
                            onClick={handleBack} 
                            className="text-gray-400 hover:text-navy-600 font-bold font-outfit flex items-center gap-2 transition-all hover:-translate-x-1 px-4 py-2 rounded-xl hover:bg-gray-50"
                        >
                            <ArrowRight className="w-5 h-5" /> {'رجوع'}
                        </button>
                    ) : <div></div>}

                    {step === 'review' ? (
                         <Button 
                            onClick={handleSave} 
                            disabled={loading} 
                            className="bg-gradient-to-r from-navy-800 to-navy-600 hover:from-navy-700 hover:to-navy-500 text-white rounded-2xl px-10 py-7 font-outfit font-bold text-lg shadow-lg shadow-navy-900/20 hover:shadow-navy-900/40 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ring-1 ring-white/10"
                         >
                             {loading ? <Loader2 className="animate-spin w-6 h-6" /> : (
                                <span className="flex items-center gap-3">
                                    {'تأكيد الحدث'} <CheckCircle2 className="w-5 h-5" />
                                </span>
                             )}
                         </Button>
                    ) : step === 'delete-confirm' ? (
                        null
                    ) : (
                        <Button 
                            onClick={handleNext} 
                            className="bg-gradient-to-r from-gold-400 to-gold-600 hover:from-gold-300 hover:to-gold-500 text-navy-950 rounded-2xl px-8 py-7 font-outfit font-bold text-lg shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                        >
                            <span className="flex items-center gap-2">
                                {'التالي'} <ArrowLeft className="w-5 h-5" />
                            </span>
                        </Button>
                    )}
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}
