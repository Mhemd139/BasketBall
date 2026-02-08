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
                        className="transition-all hover:border-purple-200"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center flex-shrink-0">
                                <Users className="w-6 h-6 text-purple-600" strokeWidth={2.5} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold text-gray-900 mb-1">
                                    {getLocalizedField(cls, 'name', locale)}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <User className="w-3.5 h-3.5" />
                                    <span>
                                        {traineeCount} {locale === 'ar' ? 'لاعب' : locale === 'he' ? 'שחקנים' : 'players'}
                                    </span>
                                </div>
                            </div>

                            <div className="text-gray-300 text-lg flex-shrink-0">
                                {locale === 'ar' || locale === 'he' ? '←' : '→'}
                            </div>
                        </div>
                    </Card>
                </Link>

                {isEditable && (
                    <button 
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setIsEditOpen(true)
                        }}
                        className="absolute top-1/2 -translate-y-1/2 end-12 p-2 rounded-full bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-md transition-all md:opacity-0 group-hover:opacity-100 z-10"
                        title="Edit Team"
                    >
                        <Settings2 className="w-4 h-4" />
                    </button>
                )}
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
