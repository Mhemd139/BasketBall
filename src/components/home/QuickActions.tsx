'use client'

import { useState } from 'react'
import { Plus, Users, UserPlus, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { CreateTeamModal } from '@/components/teams/CreateTeamModal'
import { CreatePlayerModal } from '@/components/players/CreatePlayerModal'
import Link from 'next/link'

interface QuickActionsProps {
    locale: string
    canManage: boolean
}

export function QuickActions({ locale, canManage }: QuickActionsProps) {
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false)
    const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false)

    if (!canManage) return null

    return (
        <section className="mt-8">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-1">
                {locale === 'ar' ? 'إجراءات سريعة' : locale === 'he' ? 'פעולות מהירות' : 'Quick Actions'}
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => setIsTeamModalOpen(true)}
                    className="group relative overflow-hidden"
                >
                    <Card interactive className="p-4 border-dashed border-2 border-indigo-100 bg-indigo-50/30 hover:bg-slate-50 hover:border-indigo-300 transition-all flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
                            <Users className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-indigo-900 text-sm">
                            {locale === 'ar' ? 'إضافة فريق' : locale === 'he' ? 'הוסף קבוצה' : 'Add Team'}
                        </span>
                    </Card>
                </button>

                <button 
                    onClick={() => setIsPlayerModalOpen(true)}
                    className="group relative overflow-hidden"
                >
                    <Card interactive className="p-4 border-dashed border-2 border-emerald-100 bg-emerald-50/30 hover:bg-slate-50 hover:border-emerald-300 transition-all flex flex-col items-center justify-center gap-3 h-full">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                            <UserPlus className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-emerald-900 text-sm">
                            {locale === 'ar' ? 'إضافة لاعب' : locale === 'he' ? 'הוסף שחקן' : 'Add Player'}
                        </span>
                    </Card>
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
