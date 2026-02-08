'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Loader2, Check, X, Clock, Search, User, UserPlus, Save, ArrowLeft, Hash } from 'lucide-react';
import { getEventAttendance, updateAttendance, quickRegisterAndAssign, assignTraineeToTeam } from '@/app/actions';
import { JerseyNumber } from '@/components/ui/JerseyNumber';
import { motion, AnimatePresence } from 'framer-motion';

interface AttendanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: any;
    locale: string;
}

type AttendanceStatus = 'present' | 'absent' | 'late';

interface Trainee {
    id: string;
    name_ar: string;
    name_he: string;
    name_en: string;
    phone?: string | null;
    jersey_number?: number | null;
    class_id?: string | null;
    gender?: 'male' | 'female';
}

interface AttendanceRecord {
    trainee_id: string;
    status: AttendanceStatus;
}

export function AttendanceModal({ isOpen, onClose, event, locale }: AttendanceModalProps) {
    const [loading, setLoading] = useState(true);
    const [trainees, setTrainees] = useState<Trainee[]>([]);
    const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({ present: 0, absent: 0, late: 0 });

    // Registration Flow
    const [isRegistering, setIsRegistering] = useState(false);
    const [saving, setSaving] = useState(false);
    const [regForm, setRegForm] = useState({
        name_en: '',
        name_ar: '',
        name_he: '',
        phone: '',
        jersey_number: '',
        gender: 'male' as 'male' | 'female'
    });

    // Extract target class from event
    const targetClassId = useMemo(() => {
        if (!event?.notes_en) return null;
        try {
            const notes = JSON.parse(event.notes_en);
            return notes.class_id || null;
        } catch { return null; }
    }, [event]);

    useEffect(() => {
        if (isOpen && event) {
            fetchData();
        } else {
            setIsRegistering(false);
            setSearchQuery('');
        }
    }, [isOpen, event]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getEventAttendance(event.id, targetClassId);
            if (res.success && res.trainees) {
                setTrainees(res.trainees);
                
                const map: Record<string, AttendanceStatus> = {};
                let p = 0, a = 0, l = 0;

                if (res.attendance) {
                    res.attendance.forEach((record: AttendanceRecord) => {
                        map[record.trainee_id] = record.status;
                        if (record.status === 'present') p++;
                        else if (record.status === 'absent') a++;
                        else if (record.status === 'late') l++;
                    });
                }
                setAttendanceMap(map);
                setStats({ present: p, absent: a, late: l });
            }
        } catch (error) {
            console.error("Failed to fetch attendance", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (traineeId: string, status: AttendanceStatus) => {
        const oldStatus = attendanceMap[traineeId];
        if (oldStatus === status) return;

        setAttendanceMap(prev => ({ ...prev, [traineeId]: status }));
        setStats(prev => {
            const newStats = { ...prev };
            if (oldStatus) newStats[oldStatus]--;
            newStats[status]++;
            return newStats;
        });

        const res = await updateAttendance(event.id, traineeId, status);
        if (!res.success) {
            setAttendanceMap(prev => ({ ...prev, [traineeId]: oldStatus! }));
        }
    };

    const handleAssignAndMark = async (traineeId: string) => {
        if (!targetClassId) return;
        setLoading(true);
        const res = await assignTraineeToTeam(traineeId, targetClassId);
        if (res.success) {
            // Update local state
            setTrainees(prev => prev.map(t => t.id === traineeId ? { ...t, class_id: targetClassId } : t));
            handleStatusUpdate(traineeId, 'present');
        } else {
            alert(res.error || 'Failed to assign player');
        }
        setLoading(false);
    };

    const handleQuickRegister = async () => {
        if (!regForm.name_en || !targetClassId) return;
        setSaving(true);
        const res = await quickRegisterAndAssign({
            ...regForm,
            jersey_number: regForm.jersey_number ? parseInt(regForm.jersey_number) : null
        }, targetClassId);

        if (res.success && res.trainee) {
            const newTrainee = res.trainee as Trainee;
            setTrainees(prev => [...prev, newTrainee]);
            handleStatusUpdate(newTrainee.id, 'present');
            setIsRegistering(false);
            setRegForm({ name_en: '', name_ar: '', name_he: '', phone: '', jersey_number: '', gender: 'male' });
            setSearchQuery('');
        } else {
            alert(res.error || 'Registration failed');
        }
        setSaving(false);
    };

    const sortedAndFilteredTrainees = useMemo(() => {
        const query = searchQuery.toLowerCase();
        
        // Split into roster and others
        const roster: Trainee[] = [];
        const others: Trainee[] = [];

        trainees.forEach(t => {
            const name = (locale === 'ar' ? t.name_ar : locale === 'he' ? t.name_he : t.name_en) || '';
            const phone = t.phone || '';
            if (name.toLowerCase().includes(query) || phone.includes(query)) {
                if (t.class_id === targetClassId) roster.push(t);
                else others.push(t);
            }
        });

        return { roster, others };
    }, [trainees, searchQuery, locale, targetClassId]);

    const getTraineeName = (t: Trainee) => {
        if (!t) return '';
        return locale === 'ar' ? t.name_ar || t.name_en : locale === 'he' ? t.name_he || t.name_en : t.name_en;
    };

    const renderTraineeCard = (trainee: Trainee, isRoster: boolean) => {
        const status = attendanceMap[trainee.id];
        return (
            <div key={trainee.id} className={`flex items-center justify-between p-3 bg-white border rounded-xl hover:shadow-sm transition-all group ${
                isRoster ? 'border-gray-100' : 'border-dashed border-gray-200 bg-gray-50/30'
            }`}>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        {trainee.jersey_number ? (
                            <JerseyNumber number={trainee.jersey_number} className="w-10 h-10 text-xs" />
                        ) : (
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                                trainee.gender === 'female' ? 'bg-pink-100 text-pink-600' : 'bg-navy-100 text-navy-600'
                            }`}>
                                <User className="w-5 h-5" />
                            </div>
                        )}
                    </div>
                    <div>
                        <h4 className="font-bold text-navy-900 text-sm flex items-center gap-2">
                            {getTraineeName(trainee)}
                            {!isRoster && targetClassId && (
                                <button 
                                    onClick={() => handleAssignAndMark(trainee.id)}
                                    className="p-1 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors"
                                    title="Move to Team"
                                >
                                    <UserPlus className="w-3 h-3" />
                                </button>
                            )}
                        </h4>
                        <p className="text-[10px] text-gray-400 font-medium">
                            {trainee.phone || (locale === 'ar' ? 'بدون رقم' : 'No phone')}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg shrink-0">
                    <button 
                        onClick={() => handleStatusUpdate(trainee.id, 'present')}
                        className={`w-8 h-8 flex items-center justify-center rounded-md transition-all ${
                            status === 'present' 
                            ? 'bg-green-500 text-white shadow-sm scale-110' 
                            : 'text-gray-400 hover:bg-white hover:text-green-600'
                        }`}
                    >
                        <Check className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => handleStatusUpdate(trainee.id, 'late')}
                        className={`w-8 h-8 flex items-center justify-center rounded-md transition-all ${
                            status === 'late' 
                            ? 'bg-yellow-500 text-white shadow-sm scale-110' 
                            : 'text-gray-400 hover:bg-white hover:text-yellow-600'
                        }`}
                    >
                        <Clock className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => handleStatusUpdate(trainee.id, 'absent')}
                        className={`w-8 h-8 flex items-center justify-center rounded-md transition-all ${
                            status === 'absent' 
                            ? 'bg-red-500 text-white shadow-sm scale-110' 
                            : 'text-gray-400 hover:bg-white hover:text-red-600'
                        }`}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] h-[85vh] flex flex-col p-0 overflow-hidden bg-white/95 backdrop-blur-xl border-white/20">
                
                <DialogHeader className="p-6 pb-2 border-b border-gray-100 flex-shrink-0">
                    <DialogTitle className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold font-outfit text-navy-900 uppercase tracking-tight">
                                {locale === 'ar' ? 'تسجيل الحضور' : locale === 'he' ? 'מעקב נוכחות' : 'Attendance Tracking'}
                            </h2>
                            <p className="text-sm text-gray-500 font-normal mt-1 flex items-center gap-2">
                                <span className="font-bold text-indigo-600">
                                    {locale === 'ar' ? event?.title_ar : locale === 'he' ? event?.title_he : event?.title_en}
                                </span>
                                <span>•</span>
                                <span className="text-xs">{event?.event_date}</span>
                            </p>
                        </div>
                        <div className="flex gap-2 text-[10px] font-black">
                            <div className="px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-100">P: {stats.present}</div>
                            <div className="px-2.5 py-1.5 rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-100">L: {stats.late}</div>
                            <div className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-100">A: {stats.absent}</div>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 flex flex-col min-h-0 relative">
                    <AnimatePresence mode="wait">
                        {!isRegistering ? (
                            <motion.div 
                                key="list"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex-1 flex flex-col min-h-0"
                            >
                                <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 shrink-0">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input 
                                            placeholder={locale === 'ar' ? 'بحث عن لاعب...' : locale === 'he' ? 'חפש שחקן...' : 'Search for player/phone...'}
                                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
                                            <Loader2 className="w-8 h-8 animate-spin" />
                                            <span className="text-xs font-bold uppercase tracking-widest">Fetching Roster...</span>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Roster Section */}
                                            {sortedAndFilteredTrainees.roster.length > 0 && (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center px-1">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Team Roster</span>
                                                        <span className="text-[10px] font-bold text-slate-300">{sortedAndFilteredTrainees.roster.length} Players</span>
                                                    </div>
                                                    {sortedAndFilteredTrainees.roster.map(t => renderTraineeCard(t, true))}
                                                </div>
                                            )}

                                            {/* Others Section */}
                                            {sortedAndFilteredTrainees.others.length > 0 && (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center px-1">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Global Search / Guests</span>
                                                        <span className="text-[10px] font-bold text-slate-300">{sortedAndFilteredTrainees.others.length} Found</span>
                                                    </div>
                                                    {sortedAndFilteredTrainees.others.map(t => renderTraineeCard(t, false))}
                                                </div>
                                            )}

                                            {/* Empty State / Quick Reg */}
                                            {sortedAndFilteredTrainees.roster.length === 0 && sortedAndFilteredTrainees.others.length === 0 && (
                                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                                                        <Search className="w-8 h-8" />
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-900">No results found</p>
                                                    <p className="text-xs text-slate-500 mb-6">Can't find the player? Add them quickly.</p>
                                                    <Button 
                                                        onClick={() => setIsRegistering(true)}
                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-6"
                                                    >
                                                        <UserPlus className="w-4 h-4 mr-2" />
                                                        Register New Player
                                                    </Button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="reg"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <button onClick={() => setIsRegistering(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <h3 className="text-lg font-bold text-navy-900">New Player Onboarding</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Name (Required)</label>
                                        <input 
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all"
                                            placeholder="Full Name"
                                            value={regForm.name_en}
                                            onChange={e => setRegForm(p => ({ ...p, name_en: e.target.value, name_ar: e.target.value, name_he: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Phone</label>
                                        <input 
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all"
                                            placeholder="Phone Number"
                                            dir="ltr"
                                            value={regForm.phone}
                                            onChange={e => setRegForm(p => ({ ...p, phone: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Jersey Number</label>
                                        <div className="relative">
                                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input 
                                                type="number"
                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all"
                                                placeholder="7"
                                                value={regForm.jersey_number}
                                                onChange={e => setRegForm(p => ({ ...p, jersey_number: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Gender</label>
                                        <div className="flex bg-slate-100 p-1 rounded-xl">
                                            <button 
                                                onClick={() => setRegForm(p => ({ ...p, gender: 'male' }))}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${regForm.gender === 'male' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                                            >
                                                Male
                                            </button>
                                            <button 
                                                onClick={() => setRegForm(p => ({ ...p, gender: 'female' }))}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${regForm.gender === 'female' ? 'bg-white shadow-sm text-pink-600' : 'text-slate-500'}`}
                                            >
                                                Female
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                    <p className="text-xs text-indigo-800 font-medium">
                                        💡 Registration will automatically assign the player to this team and mark them as <b>Present</b> for this event.
                                    </p>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <Button 
                                        onClick={() => setIsRegistering(false)}
                                        variant="secondary"
                                        className="flex-1 rounded-xl py-6 font-bold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        disabled={saving || !regForm.name_en}
                                        onClick={handleQuickRegister}
                                        className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-6 font-bold shadow-lg shadow-indigo-200"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                                        Save & Mark Present
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <DialogFooter className="p-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
                    <Button onClick={onClose} className="w-full bg-navy-600 hover:bg-navy-700 text-white font-bold h-12 rounded-xl">
                        {locale === 'ar' ? 'إغلاق' : locale === 'he' ? 'סגור' : 'Done'}
                    </Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}
