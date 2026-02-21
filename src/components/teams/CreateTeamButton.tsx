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
                className="w-full mb-6 p-4 rounded-3xl bg-white/5 backdrop-blur-2xl border-2 border-dashed border-white/20 hover:border-indigo-400/50 hover:bg-white/10 transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
            >
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/50 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-all">
                    <Plus className="w-5 h-5" />
                </div>
                <span className="font-bold text-white/50 group-hover:text-indigo-300 transition-colors">
                    {'إضافة فريق جديد'}
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
