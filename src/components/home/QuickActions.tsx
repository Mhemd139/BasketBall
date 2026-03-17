'use client'

import { useState } from 'react'
import { Users, UserPlus, Trash2 } from 'lucide-react'
import { CreateTeamModal } from '@/components/teams/CreateTeamModal'
import { InteractivePlayerModal } from '@/components/players/InteractivePlayerModal'
import { DeletePlayerModal } from '@/components/players/DeletePlayerModal'

interface QuickActionsProps {
    locale: string
    canManage: boolean
}

export function QuickActions({ locale, canManage }: QuickActionsProps) {
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false)
    const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

    if (!canManage) return null

    return (
        <section>
            <h2 className="text-[10px] font-black text-indigo-200/50 uppercase tracking-widest mb-2 px-1">
                {'إجراءات سريعة'}
            </h2>
            
            <div className="grid grid-cols-3 gap-2">
                <button
                    onClick={() => setIsTeamModalOpen(true)}
                    className="flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl text-indigo-300 text-xs font-bold hover:bg-white/10 active:scale-95 transition-all"
                >
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    {'إضافة فريق'}
                </button>

                <button
                    onClick={() => setIsPlayerModalOpen(true)}
                    className="flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl text-emerald-300 text-xs font-bold hover:bg-white/10 active:scale-95 transition-all"
                >
                    <UserPlus className="w-3.5 h-3.5 shrink-0" />
                    {'إضافة لاعب'}
                </button>

                <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl bg-white/5 backdrop-blur-md border border-red-500/20 shadow-xl text-red-300 text-xs font-bold hover:bg-red-500/10 active:scale-95 transition-all"
                >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    {'حذف لاعب'}
                </button>
            </div>

            <CreateTeamModal 
                isOpen={isTeamModalOpen}
                onClose={() => setIsTeamModalOpen(false)}
                locale={locale}
            />
            <InteractivePlayerModal
                isOpen={isPlayerModalOpen}
                onClose={() => setIsPlayerModalOpen(false)}
                locale={locale}
            />
            <DeletePlayerModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
            />
        </section>
    )
}
