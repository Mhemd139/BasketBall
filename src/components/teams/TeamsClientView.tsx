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
    currentTrainerId?: string | null
}

export function TeamsClientView({ classes, locale, canCreate, currentTrainerId }: TeamsClientViewProps) {
    const [activeCategory, setActiveCategory] = useState<string | null>(null)
    const [myTeamsOnly, setMyTeamsOnly] = useState(false)

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
        let result = classes
        if (myTeamsOnly && currentTrainerId) {
            result = result.filter(cls => cls.trainer_id === currentTrainerId)
        }
        if (activeCategory) {
            result = result.filter(cls => {
                if (!cls.categories) return false
                const id = cls.category_id || cls.categories.name_ar
                return id === activeCategory
            })
        }
        return result
    }, [classes, activeCategory, myTeamsOnly, currentTrainerId])

    const myTeamsCount = useMemo(() => currentTrainerId ? classes.filter(cls => cls.trainer_id === currentTrainerId).length : 0, [classes, currentTrainerId])

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {}
        classes.forEach(cls => {
            const id = cls.category_id || cls.categories?.name_ar
            if (id) counts[id] = (counts[id] || 0) + 1
        })
        return counts
    }, [classes])

    const showChips = categories.length > 1 || !!currentTrainerId

    return (
        <>
            {/* Create button */}
            <CreateTeamButton locale={locale} canCreate={canCreate} />

            {/* Filter chips */}
            {showChips && (
                <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide" dir="rtl">
                    {/* My Teams chip — only when logged in */}
                    {currentTrainerId && (
                        <button
                            type="button"
                            onClick={() => setMyTeamsOnly(v => !v)}
                            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                myTeamsOnly
                                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                                    : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/15'
                            }`}
                        >
                            {'فرقي'} <span className="opacity-60 ms-1">{myTeamsCount}</span>
                        </button>
                    )}

                    {categories.length > 1 && (
                        <>
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
                            {categories.map(cat => (
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
                                    {cat.label} <span className="opacity-60 ms-1">{categoryCounts[cat.id] || 0}</span>
                                </button>
                            ))}
                        </>
                    )}
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
                            {myTeamsOnly ? 'لا توجد فرق مسندة إليك' : activeCategory ? 'لا توجد فرق في هذه الفئة' : 'لا توجد فرق بعد'}
                        </h3>
                        {!activeCategory && !myTeamsOnly && (
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
