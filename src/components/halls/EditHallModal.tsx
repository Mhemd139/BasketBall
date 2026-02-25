'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Loader2, Building2, CheckCircle2, X } from 'lucide-react';
import { updateHall } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { motion } from 'framer-motion';

interface EditHallModalProps {
    isOpen: boolean;
    onClose: () => void;
    hall: any;
    locale: string;
}

export function EditHallModal({ isOpen, onClose, hall, locale }: EditHallModalProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const [nameAr, setNameAr] = useState(hall?.name_ar || '');
    const [nameHe, setNameHe] = useState(hall?.name_he || '');

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await updateHall(hall.id, nameAr, nameAr, nameHe);
            if (res.success) {
                toast(locale === 'he' ? 'האולם עודכן בהצלחה' : 'تم تحديث القاعة بنجاح', 'success');
                router.refresh();
                onClose();
            } else {
                toast(locale === 'he' ? 'עדכון האולם נכשל' : 'فشل تحديث القاعة', 'error');
            }
        } catch {
            toast(locale === 'he' ? 'עדכון האולם נכשל' : 'فشل تحديث القاعة', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-white rounded-3xl overflow-hidden p-0 border-0 flex flex-col shadow-2xl">
                <div className="bg-gradient-to-br from-orange-500 to-red-600 p-8 text-white relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/3"></div>

                    <DialogTitle className="relative z-10 text-2xl font-outfit font-bold flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md shadow-inner">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        {locale === 'he' ? 'עריכת אולם' : 'تعديل القاعة'}
                    </DialogTitle>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="إغلاق"
                        className="absolute top-4 left-4 text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 p-8 bg-gray-50/50 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 text-right block">
                                {locale === 'he' ? 'שם (ערבית)' : 'الاسم (عربي)'}
                            </label>
                            <div className="relative group">
                                <input
                                    value={nameAr}
                                    onChange={(e) => setNameAr(e.target.value)}
                                    className="w-full p-4 rounded-xl border-2 border-gray-100 bg-white text-navy-900 font-bold outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all shadow-sm text-right group-hover:border-gray-200"
                                    placeholder="مثال: القاعة الكبرى"
                                    dir="rtl"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 text-right block">
                                {locale === 'he' ? 'שם (עברית)' : 'الاسم (عبري)'}
                            </label>
                            <div className="relative group">
                                <input
                                    value={nameHe}
                                    onChange={(e) => setNameHe(e.target.value)}
                                    className="w-full p-4 rounded-xl border-2 border-gray-100 bg-white text-navy-900 font-bold outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all shadow-sm text-right group-hover:border-gray-200"
                                    placeholder="לדוגמה: האולם הגדול"
                                    dir="rtl"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-white border-t border-gray-100 flex justify-end shrink-0 gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl text-gray-400 font-bold text-sm hover:text-navy-900 hover:bg-gray-50 transition-all"
                    >
                        {locale === 'he' ? 'ביטול' : 'إلغاء'}
                    </button>
                    <motion.button
                        whileHover={{ scale: 1.02, boxShadow: "0 10px 20px -5px rgba(249, 115, 22, 0.3)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white rounded-xl px-8 py-3 font-outfit font-bold text-lg shadow-lg shadow-orange-200 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                           <>
                               {locale === 'he' ? 'שמור שינויים' : 'حفظ التغييرات'}
                               <CheckCircle2 className="w-5 h-5" />
                           </>
                        )}
                    </motion.button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
