'use client';

import { useState, useEffect } from 'react';
import { User, Calendar, Phone, Activity, X, Users, MapPin, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Trainer {
    id: string;
    name_ar: string;
    name_he: string;
    name_en: string;
    phone: string;
    gender?: 'male' | 'female';
    availability?: string[]; // e.g. ["Mon", "Wed"]
    role: 'admin' | 'sub_trainer';
}

interface TrainerProfileModalProps {
    trainerId: string;
    locale: string;
    onClose: () => void;
}

export function TrainerProfileModal({ trainerId, locale, onClose }: TrainerProfileModalProps) {
    const [trainer, setTrainer] = useState<Trainer | null>(null);
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const isRTL = true;

    useEffect(() => {
        const fetchTrainer = async () => {
            const supabase = createClient();
            
            // Fetch Trainer Details
            const { data: trainerData } = await (supabase as any)
                .from('trainers')
                .select('*')
                .eq('id', trainerId)
                .single();
            
            if (trainerData) {
                setTrainer(trainerData);
                
                // Fetch Teams Managed
                const { data: teamsData } = await supabase
                    .from('classes')
                    .select('id, name_ar, name_he, name_en, schedule_info, hall_id')
                    .eq('trainer_id', trainerId);
                
                if (teamsData) setTeams(teamsData);
            }
            setLoading(false);
        };
        fetchTrainer();
    }, [trainerId]);

    const name = trainer ? trainer.name_ar : '';
    const isFemale = trainer?.gender === 'female';
    
    // Theme Colors based on Gender
    const theme = isFemale 
        ? { bg: 'bg-pink-500/20', bgLight: 'bg-white/10 border border-white/20', text: 'text-white' }
        : { bg: 'bg-blue-600/20', bgLight: 'bg-white/10 border border-white/20', text: 'text-white' };

    if (loading) return null; // Or a spinner

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-[#0B132B]/90 backdrop-blur-3xl border border-white/10 ring-1 ring-white/5 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">
                
                {/* Header Background */}
                <div className={`h-32 ${isFemale ? 'bg-gradient-to-br from-[#0B132B] to-pink-900/40 border-b border-white/10' : 'bg-gradient-to-br from-[#0B132B] to-blue-900/40 border-b border-white/10'} relative`}>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white rounded-full transition-colors backdrop-blur-sm"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    
                    {/* Decorative Circles */}
                    <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-x-10 -translate-y-10"></div>
                    <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl translate-x-5 translate-y-5"></div>
                </div>

                {/* Profile Picture & Info */}
                <div className="px-6 pb-6 -mt-12 relative z-10">
                    <div className={`w-24 h-24 rounded-2xl shadow-xl flex items-center justify-center text-white text-3xl mb-4 border-4 border-[#0B132B] bg-white/10 backdrop-blur-xl ${theme.bg}`}>
                        {/* Custom Icons based on requester description */}
                        {isFemale ? (
                            <User className="w-12 h-12" /> // Ideally a female icon, using User for now with Pink color
                        ) : (
                            <User className="w-12 h-12" /> // Blue Coach
                        )}
                    </div>
                    
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-white drop-shadow-md">{name}</h2>
                            <div className="flex items-center gap-1.5 text-indigo-200/70 text-sm font-medium mt-1">
                                <span className={`px-2 py-0.5 rounded-md text-xs uppercase tracking-wider ${isFemale ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>
                                    {trainer?.role === 'admin' ? 'رئيس المدربين' : 'مدرب'}
                                </span>
                                {trainer?.phone && (
                                    <div className="flex items-center gap-1 ml-2 text-indigo-200/50">
                                        <Phone className="w-3 h-3" />
                                        <span dir="ltr">{trainer.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats / Availability Grid */}
                    <div className="grid grid-cols-2 gap-3 mt-6">
                        <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                            <div className="flex items-center gap-2 mb-2 text-indigo-200/70 text-xs font-bold uppercase tracking-wider">
                                <Users className="w-3.5 h-3.5" />
                                <span>{'الفرق'}</span>
                            </div>
                            <div className="text-2xl font-black text-white drop-shadow-md">{teams.length}</div>
                        </div>
                        <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                            <div className="flex items-center gap-2 mb-2 text-indigo-200/70 text-xs font-bold uppercase tracking-wider">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{'التوفر'}</span>
                            </div>
                            <div className="text-sm font-semibold text-white drop-shadow-md">
                                {trainer?.availability && trainer.availability.length > 0 
                                    ? trainer.availability.join(', ') 
                                    : <span className="text-indigo-200/50 text-xs italic">{'غير محدد'}</span>
                                }
                            </div>
                        </div>
                    </div>

                    {/* Teams List */}
                    <div className="mt-6">
                        <h3 className="text-sm font-bold text-white drop-shadow-md mb-3 flex items-center gap-2">
                            <Activity className={`w-4 h-4 ${theme.text}`} />
                            {'الفرق النشطة'}
                        </h3>
                        
                        {teams.length > 0 ? (
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                {teams.map(team => (
                                    <div key={team.id} className="flex items-center p-3 bg-white/5 border border-white/10 rounded-xl shadow-sm hover:bg-white/10 transition-colors">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mr-3 ${theme.bgLight} ${theme.text}`}>
                                            <Users className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-white drop-shadow-md">
                                                {team.name_ar}
                                            </div>
                                            {team.schedule_info && (
                                                <div className="flex items-center gap-1 text-xs text-indigo-200/50 mt-0.5">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{team.schedule_info}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-sm text-indigo-200/50 py-4 bg-white/5 rounded-xl border border-dashed border-white/20">
                                {'لا توجد فرق نشطة معيّنة.'}
                            </p>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
