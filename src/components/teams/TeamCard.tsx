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
                        className="transition-all hover:border-purple-200 group-hover:shadow-md"
                    >
                        <div className="flex items-center gap-4 p-1">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center flex-shrink-0 text-purple-600">
                                <Users className="w-6 h-6" strokeWidth={2.5} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold text-gray-900 mb-1 truncate">
                                    {cls.name_ar}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <User className="w-3.5 h-3.5" />
                                    <span>
                                        {traineeCount} {'لاعب'}
                                    </span>
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
                                        className="p-2 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all opacity-100"
                                        title="Edit Team"
                                    >
                                        <Settings2 className="w-5 h-5" />
                                    </button>
                                )}
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-purple-50 group-hover:text-purple-500 transition-colors">
                                     <span className="text-lg leading-none pb-1">←</span>
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
