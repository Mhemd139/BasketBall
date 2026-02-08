'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { CreateTeamModal } from './CreateTeamModal'

export function CreateTeamButton({ locale, canCreate }: { locale: string, canCreate: boolean }) {
    const [isOpen, setIsOpen] = useState(false)

    if (!canCreate) return null

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="w-full mb-6 p-4 rounded-3xl bg-white border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
            >
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Plus className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">
                    {locale === 'ar' ? 'إضافة فريق جديد' : locale === 'he' ? 'הוסף קבוצה חדשה' : 'Add New Team'}
                </span>
            </button>

            <CreateTeamModal 
                isOpen={isOpen} 
                onClose={() => setIsOpen(false)} 
                locale={locale} 
            />
        </>
    )
}
