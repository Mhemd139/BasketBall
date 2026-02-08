'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Loader2, Calendar as CalendarIcon, Clock, Users, Trophy, User, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
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
}

type Step = 'type' | 'details' | 'time' | 'review';

export function InteractiveEventModal({ isOpen, onClose, onSave, initialDate, initialEvent, locale }: InteractiveEventModalProps) {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<Step>('type');
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
            setStep('type');
            loadRefData();
        }
    }, [isOpen]);

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
            const trainerName = trainer ? (locale === 'ar' ? trainer.name_ar : locale === 'he' ? trainer.name_he : trainer.name_en) : '';
            
            const cls = refData.classes.find(c => c.id === selectedClass);
            const className = cls ? (locale === 'ar' ? cls.name_ar : locale === 'he' ? cls.name_he : cls.name_en) : '';

            let base = locale === 'ar' ? 'تدريب' : locale === 'he' ? 'אימון' : 'Training';
            
            if (className) base += ` - ${className}`;
            if (trainerName) base += ` (${trainerName})`;

            return base;
        } else {
            const home = refData.classes.find(c => c.id === homeTeam);
            const homeName = home ? (locale === 'ar' ? home.name_ar : locale === 'he' ? home.name_he : home.name_en) : 'Home';
            
            let awayName = 'Away';
            if (gameType === 'internal') {
                const away = refData.classes.find(c => c.id === awayTeamId);
                awayName = away ? (locale === 'ar' ? away.name_ar : locale === 'he' ? away.name_he : away.name_en) : 'Away';
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

    const getName = (item: any) => locale === 'ar' ? item.name_ar : locale === 'he' ? item.name_he : item.name_en;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-white rounded-3xl overflow-hidden p-0 border-0 h-[500px] flex flex-col">
                <div className="bg-navy-900 p-6 pt-8 text-white relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <DialogTitle className="relative z-10 text-2xl font-outfit font-bold flex items-center gap-2">
                        {step === 'type' && <><CalendarIcon className="w-6 h-6 text-gold-400" /> {locale === 'ar' ? 'نوع الحدث' : 'Event Type'}</>}
                        {step === 'details' && <><Users className="w-6 h-6 text-gold-400" /> {locale === 'ar' ? 'التفاصيل' : 'Details'}</>}
                        {step === 'time' && <><Clock className="w-6 h-6 text-gold-400" /> {locale === 'ar' ? 'التوقيت' : 'Timing'}</>}
                        {step === 'review' && <><CheckCircle2 className="w-6 h-6 text-gold-400" /> {locale === 'ar' ? 'مراجعة' : 'Review'}</>}
                    </DialogTitle>
                    {/* Progress Bar */}
                    <div className="flex gap-2 mt-4">
                        {['type', 'details', 'time', 'review'].map((s, i) => (
                            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                                ['type', 'details', 'time', 'review'].indexOf(step) >= i ? 'bg-gold-500' : 'bg-white/20'
                            }`} />
                        ))}
                    </div>
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
                                    <button 
                                        onClick={() => setType('training')}
                                        className={`flex flex-col items-center justify-center gap-4 rounded-2xl border-2 transition-all p-6 ${
                                            type === 'training' 
                                            ? 'border-navy-600 bg-navy-50 text-navy-900 shadow-md ring-1 ring-navy-600' 
                                            : 'border-white bg-white text-gray-400 hover:border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className={`p-4 rounded-full ${type === 'training' ? 'bg-navy-100 text-navy-600' : 'bg-gray-100'}`}>
                                            <User className="w-8 h-8" />
                                        </div>
                                        <span className="font-bold text-lg">{locale === 'ar' ? 'تدريب' : 'Training'}</span>
                                    </button>
                                    
                                    <button 
                                        onClick={() => setType('game')}
                                        className={`flex flex-col items-center justify-center gap-4 rounded-2xl border-2 transition-all p-6 ${
                                            type === 'game' 
                                            ? 'border-gold-500 bg-gold-50 text-orange-900 shadow-md ring-1 ring-gold-500' 
                                            : 'border-white bg-white text-gray-400 hover:border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className={`p-4 rounded-full ${type === 'game' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100'}`}>
                                            <Trophy className="w-8 h-8" />
                                        </div>
                                        <span className="font-bold text-lg">{locale === 'ar' ? 'مباراة' : 'Game'}</span>
                                    </button>
                                </div>
                            )}

                            {step === 'details' && (
                                <div className="space-y-6">
                                    {type === 'training' ? (
                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <label className="text-sm font-bold text-navy-900">
                                                    {locale === 'ar' ? 'المدرب المسؤول' : 'Assign Trainer'}
                                                </label>
                                                <select 
                                                    value={selectedTrainer}
                                                    onChange={(e) => setSelectedTrainer(e.target.value)}
                                                    className="w-full p-4 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-navy-600 outline-none transition-all text-sm"
                                                >
                                                    <option value="">{locale === 'ar' ? 'اختر مدرب...' : 'Select Trainer...'}</option>
                                                    {refData.trainers.map(t => (
                                                        <option key={t.id} value={t.id}>{getName(t)}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-sm font-bold text-navy-900">
                                                    {locale === 'ar' ? 'الفريق المستهدف (للحضور)' : 'Target Team (for Attendance)'}
                                                </label>
                                                <select 
                                                    value={selectedClass}
                                                    onChange={(e) => setSelectedClass(e.target.value)}
                                                    className="w-full p-4 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-navy-600 outline-none transition-all text-sm"
                                                >
                                                    <option value="">{locale === 'ar' ? 'اختر فريق...' : 'Select Team...'}</option>
                                                    {refData.classes.map(c => (
                                                        <option key={c.id} value={c.id}>{getName(c)}</option>
                                                    ))}
                                                </select>
                                                <p className="text-[10px] text-gray-400 font-medium">
                                                    {locale === 'ar' ? 'هذا سيقوم بتجهيز قائمة الحضور بهذا الفريق' : 'This will prioritize this team\'s roster for attendance.'}
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
                                                    {locale === 'ar' ? 'داخلي' : 'Home vs Home'}
                                                </button>
                                                <button 
                                                    onClick={() => setGameType('external')}
                                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${gameType === 'external' ? 'bg-white shadow-sm text-navy-900' : 'text-gray-500'}`}
                                                >
                                                    {locale === 'ar' ? 'خارجي' : 'Home vs Away'}
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-sm font-bold text-navy-900">Home Team</label>
                                                <select 
                                                    value={homeTeam}
                                                    onChange={(e) => setHomeTeam(e.target.value)}
                                                    className="w-full p-3 rounded-xl border border-gray-200 bg-white"
                                                >
                                                    <option value="">Select Team...</option>
                                                    {refData.classes.map(c => (
                                                        <option key={c.id} value={c.id}>{getName(c)}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="flex items-center justify-center font-bold text-lg text-gold-500">VS</div>

                                            <div className="space-y-3">
                                                <label className="text-sm font-bold text-navy-900">Away Team</label>
                                                {gameType === 'internal' ? (
                                                     <select 
                                                        value={awayTeamId}
                                                        onChange={(e) => setAwayTeamId(e.target.value)}
                                                        className="w-full p-3 rounded-xl border border-gray-200 bg-white"
                                                    >
                                                        <option value="">Select Team...</option>
                                                        {refData.classes.filter(c => c.id !== homeTeam).map(c => (
                                                            <option key={c.id} value={c.id}>{getName(c)}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input 
                                                        value={awayTeamName}
                                                        onChange={(e) => setAwayTeamName(e.target.value)}
                                                        placeholder="Enter Away Team Name"
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
                                            <Clock className="w-4 h-4 text-gold-500" /> Start Time
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
                                            <Clock className="w-4 h-4 text-gray-400" /> End Time
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
                                            <span>Date:</span>
                                            <span className="font-bold text-navy-900">{initialDate ? format(initialDate, 'dd/MM/yyyy') : ''}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Time:</span>
                                            <span className="font-bold text-navy-900">{startTime} - {endTime}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <DialogFooter className="mr-0 p-6 bg-white border-t border-gray-100 flex justify-between items-center shrink-0">
                    {step !== 'type' ? (
                        <button onClick={handleBack} className="text-gray-400 hover:text-navy-600 font-medium flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                    ) : <div></div>}

                    {step === 'review' ? (
                         <Button onClick={handleSave} disabled={loading} className="bg-navy-600 hover:bg-navy-700 text-white rounded-xl px-8 py-6 font-bold shadow-lg shadow-navy-200">
                             {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Confirm Event'}
                         </Button>
                    ) : (
                        <Button onClick={handleNext} className="bg-gold-500 hover:bg-gold-600 text-navy-900 rounded-xl px-6 py-6 font-bold flex items-center gap-2">
                            Next <ArrowRight className="w-4 h-4" />
                        </Button>
                    )}
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}
