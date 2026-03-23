'use client'

import { Card } from '@/components/ui/Card'
import { getLocalizedField } from '@/lib/utils'
import Link from 'next/link'

interface TeamCardProps {
    cls: any
    locale: string
    isEditable: boolean
}

export function TeamCard({ cls, locale, isEditable }: TeamCardProps) {
    const traineeCount = cls.trainees?.[0]?.count ?? 0
    const categoryName = cls.categories ? getLocalizedField(cls.categories, 'name', locale) : ''
    const isFemale = categoryName.includes('بنات') || categoryName.includes('נערות') || categoryName.includes('ילדות') || categoryName.includes('בוגרות')
    const accentColor = isFemale ? 'pink' : 'indigo'

    return (
        <>
            <div className="relative group">
                <Link href={`/${locale}/teams/${cls.id}`}>
                    <Card
                        interactive
                        className={`bg-white/5 backdrop-blur-2xl border border-white/10 shadow-xl overflow-hidden relative transition-all hover:-translate-y-1 hover:bg-white/10 border-r-2 ${isFemale ? 'border-r-pink-400' : 'border-r-indigo-400'}`}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${isFemale ? 'from-pink-500/5' : 'from-indigo-500/5'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                        <div className="flex flex-col items-center gap-1.5 relative z-10 py-4 px-5">
                            <h3 className="text-base font-bold text-white truncate drop-shadow-md max-w-full">
                                {getLocalizedField(cls, 'name', locale)}
                            </h3>
                            <div className="flex items-center gap-2">
                                {cls.categories && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isFemale ? 'text-pink-300 bg-pink-500/15 border border-pink-500/20' : 'text-indigo-300 bg-indigo-500/15 border border-indigo-500/20'}`}>
                                        {categoryName}
                                    </span>
                                )}
                                <span className="text-xs text-white/40">{traineeCount} {'لاعب'}</span>
                            </div>
                        </div>
                    </Card>
                </Link>
            </div>
        </>
    )
}
