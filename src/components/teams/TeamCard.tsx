'use client'

import { useState } from 'react'
import { Users, User, Settings2, Shield } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { getLocalizedField } from '@/lib/utils'
import Link from 'next/link'
import { CreateTeamModal } from './CreateTeamModal'

interface TeamCardProps {
    cls: any
    locale: string
    isEditable: boolean
}

export function TeamCard({ cls, locale, isEditable }: TeamCardProps) {
    const [isEditOpen, setIsEditOpen] = useState(false)
    const traineeCount = cls.trainees?.[0]?.count ?? 0

    return (
        <>
            <div className="relative group">
                <Link href={`/${locale}/teams/${cls.id}`}>
                    <Card
                        interactive
                        className="bg-white/5 backdrop-blur-2xl border border-white/10 shadow-xl overflow-hidden relative transition-all hover:-translate-y-1 hover:bg-white/10"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                                <Users className="w-5 h-5 text-purple-300" strokeWidth={2.5} />
                            </div>

                            <div className="flex-1 min-w-0 flex justify-between items-center">
                                <div>
                                    <h3 className="text-sm font-bold text-white mb-0.5 truncate drop-shadow-md">
                                        {cls.name_ar}
                                    </h3>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <div className="flex items-center gap-1 text-xs text-indigo-100/70 font-medium tracking-wide">
                                            <User className="w-3 h-3" />
                                            <span>{traineeCount} {'لاعب'}</span>
                                        </div>
                                        {cls.categories && (
                                            <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded-md border border-indigo-500/20">
                                                {getLocalizedField(cls.categories, 'name', locale)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {isEditable && (
                                        <button 
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                setIsEditOpen(true)
                                            }}
                                            className="p-1.5 rounded-full text-indigo-200 hover:text-white hover:bg-white/10 transition-all opacity-100"
                                            title="Edit Team"
                                        >
                                            <Settings2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                </Link>
            </div>

            <CreateTeamModal 
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                locale={locale}
                isEdit={true}
                initialData={{
                    id: cls.id,
                    name_en: cls.name_en,
                    name_ar: cls.name_ar,
                    name_he: cls.name_he,
                    trainer_id: cls.trainer_id,
                    hall_id: cls.hall_id
                }}
            />
        </>
    )
}
