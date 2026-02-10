'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Loader2, Calendar as CalendarIcon, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';

interface CoachEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (eventData: any) => Promise<void>;
    initialDate?: Date;
    initialEvent?: any;
    locale: string;
}

export function CoachEventModal({ isOpen, onClose, onSave, initialDate, initialEvent, locale }: CoachEventModalProps) {
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState<'training' | 'game'>(initialEvent?.type || 'training');
    const [titleEn, setTitleEn] = useState(initialEvent?.title_en || '');
    const [titleAr, setTitleAr] = useState(initialEvent?.title_ar || '');
    const [description, setDescription] = useState(initialEvent?.description || '');
    const [startTime, setStartTime] = useState(initialEvent?.start_time || '16:00');
    const [endTime, setEndTime] = useState(initialEvent?.end_time || '18:00');

    const handleSave = async () => {
        setLoading(true);
        try {
            await onSave({
                type,
                title_en: titleEn || (type === 'game' ? 'Game' : 'Training'), // Fallback defaults
                title_ar: titleAr || (type === 'game' ? 'مباراة' : 'تدريب'),
                title_he: titleEn || (type === 'game' ? 'משחק' : 'אימון'), // Reuse EN for HE if empty for now
                start_time: startTime,
                end_time: endTime,
                event_date: initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
                // Map description to notes fields
                notes_en: description,
                notes_ar: description,
                notes_he: description,
            });
            onClose();
        } catch (error) {
            console.error("Failed to save event", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {initialEvent 
                            ? 'تعديل الحدث'
                            : 'إضافة حدث جديد'
                        }
                    </DialogTitle>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                    {/* Event Type Toggle */}
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                        <button
                            onClick={() => setType('training')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                                type === 'training' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {'تدريب'}
                        </button>
                        <button
                            onClick={() => setType('game')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                                type === 'game' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {'مباراة'}
                        </button>
                    </div>

                    {/* Titles */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase">
                            {'العنوان (إنجليزي)'}
                        </label>
                        <input 
                            value={titleEn} onChange={e => setTitleEn(e.target.value)}
                            className="w-full p-2 border rounded-md text-sm"
                            placeholder="e.g. U16 Training"
                        />
                    </div>
                     <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase">
                            {'العنوان (عربي)'}
                        </label>
                        <input 
                            value={titleAr} onChange={e => setTitleAr(e.target.value)}
                            className="w-full p-2 border rounded-md text-sm text-right"
                            placeholder="مثال: تدريب تحت 16"
                            dir="rtl"
                        />
                    </div>

                    {/* Time Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase">
                                {'وقت البدء'}
                            </label>
                            <div className="relative">
                                <Clock className="absolute top-2.5 left-2.5 w-4 h-4 text-gray-400" />
                                <input 
                                    type="time"
                                    value={startTime}
                                    onChange={e => setStartTime(e.target.value)}
                                    className="w-full pl-9 p-2 border rounded-md text-sm"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase">
                                {'وقت الانتهاء'}
                            </label>
                             <div className="relative">
                                <Clock className="absolute top-2.5 left-2.5 w-4 h-4 text-gray-400" />
                                <input 
                                    type="time"
                                    value={endTime}
                                    onChange={e => setEndTime(e.target.value)}
                                    className="w-full pl-9 p-2 border rounded-md text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <div className="flex gap-2 w-full justify-end">
                        <Button variant="secondary" onClick={onClose} disabled={loading}>
                            {'إلغاء'}
                        </Button>
                        <Button onClick={handleSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {'حفظ'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
