'use client'

import { useState } from 'react'
import { Users, UserPlus } from 'lucide-react'
import { CreateTeamModal } from '@/components/teams/CreateTeamModal'
import { CreatePlayerModal } from '@/components/players/CreatePlayerModal'

interface QuickActionsProps {
    locale: string
    canManage: boolean
}

export function QuickActions({ locale, canManage }: QuickActionsProps) {
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false)
    const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false)

    if (!canManage) return null

    return (
        <section>
            <h2 className="text-[10px] font-black text-indigo-200/50 uppercase tracking-widest mb-2 px-1">
                {'إجراءات سريعة'}
            </h2>
            
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
                <button 
                    onClick={() => setIsTeamModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl text-indigo-300 text-sm font-bold whitespace-nowrap hover:bg-white/10 hover:-translate-y-0.5 active:scale-95 transition-all flex-shrink-0"
                >
                    <Users className="w-4 h-4" />
                    {'إضافة فريق'}
                </button>

                <button 
                    onClick={() => setIsPlayerModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl text-emerald-300 text-sm font-bold whitespace-nowrap hover:bg-white/10 hover:-translate-y-0.5 active:scale-95 transition-all flex-shrink-0"
                >
                    <UserPlus className="w-4 h-4" />
                    {'إضافة لاعب'}
                </button>
            </div>

            <CreateTeamModal 
                isOpen={isTeamModalOpen}
                onClose={() => setIsTeamModalOpen(false)}
                locale={locale}
            />
            <CreatePlayerModal 
                isOpen={isPlayerModalOpen}
                onClose={() => setIsPlayerModalOpen(false)}
                locale={locale}
            />
        </section>
    )
}
