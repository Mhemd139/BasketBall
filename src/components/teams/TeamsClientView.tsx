'use client'

import { useState, useMemo } from 'react'
import { TeamCard } from './TeamCard'
import { CreateTeamButton } from './CreateTeamButton'
import { Users } from 'lucide-react'
import { getLocalizedField } from '@/lib/utils'

interface TeamsClientViewProps {
    classes: any[]
    locale: string
    canCreate: boolean
}

export function TeamsClientView({ classes, locale, canCreate }: TeamsClientViewProps) {
    const [activeCategory, setActiveCategory] = useState<string | null>(null)

    // Derive unique categories from the fetched classes
    const categories = useMemo(() => {
        const seen = new Set<string>()
        const result: { id: string; label: string }[] = []
        for (const cls of classes) {
            if (cls.categories) {
                const id = cls.category_id || cls.categories.name_ar
                if (!seen.has(id)) {
                    seen.add(id)
                    result.push({
                        id,
                        label: getLocalizedField(cls.categories, 'name', locale),
                    })
                }
            }
        }
        return result
    }, [classes, locale])

    const filtered = useMemo(() => {
        if (!activeCategory) return classes
        return classes.filter(cls => {
            if (!cls.categories) return false
            const id = cls.category_id || cls.categories.name_ar
            return id === activeCategory
        })
    }, [classes, activeCategory])

    const showChips = categories.length > 1

    return (
        <>
            {/* Create button */}
            <CreateTeamButton locale={locale} canCreate={canCreate} />

            {/* Category filter chips */}
            {showChips && (
                <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide" dir="rtl">
                    <button
                        type="button"
                        onClick={() => setActiveCategory(null)}
                        className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                            activeCategory === null
                                ? 'bg-white text-[#0B132B] border-white shadow-sm'
                                : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/15'
                        }`}
                    >
                        {'الكل'} <span className="opacity-60 ms-1">{classes.length}</span>
                    </button>
                    {categories.map(cat => {
                        const count = classes.filter(cls => {
                            if (!cls.categories) return false
                            const id = cls.category_id || cls.categories.name_ar
                            return id === cat.id
                        }).length
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setActiveCategory(cat.id)}
                                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                    activeCategory === cat.id
                                        ? 'bg-indigo-500 text-white border-indigo-400 shadow-sm'
                                        : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/15'
                                }`}
                            >
                                {cat.label} <span className="opacity-60 ms-1">{count}</span>
                        </button>
                        )
                    })}
                </div>
            )}

            {/* Teams list */}
            <section>
                {filtered.length > 0 ? (
                    <div className="space-y-3">
                        {filtered.map((cls: any) => (
                            <TeamCard
                                key={cls.id}
                                cls={cls}
                                locale={locale}
                                isEditable={canCreate}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl animate-fade-in-up shadow-xl">
                        <div className="bg-purple-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-purple-500/30">
                            <Users className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-lg font-black text-white mb-1 drop-shadow-md">
                            {activeCategory ? 'لا توجد فرق في هذه الفئة' : 'لا توجد فرق بعد'}
                        </h3>
                        {!activeCategory && (
                            <>
                                <p className="text-sm font-bold text-indigo-100/70 mb-6 drop-shadow-sm">
                                    {'ابدأ بإنشاء أول فريق لإدارة اللاعبين والتدريبات'}
                                </p>
                                <div className="max-w-[200px] mx-auto">
                                    <CreateTeamButton locale={locale} canCreate={canCreate} />
                                </div>
                            </>
                        )}
                    </div>
                )}
            </section>
        </>
    )
}
