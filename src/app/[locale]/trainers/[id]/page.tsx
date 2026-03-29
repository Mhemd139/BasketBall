import { Locale } from '@/lib/i18n/config'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { getTrainerProfile, getSession } from '@/app/actions'
import { getLocalizedField, formatPhoneNumber } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Phone, Calendar, Clock, Shield, Building2, Dumbbell } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { TrainerProfileActions } from '@/components/trainers/TrainerProfileActions'
import { TrainerWorkingHours } from '@/components/trainers/TrainerWorkingHours'
import { AnimatedMeshBackground } from '@/components/ui/AnimatedMeshBackground'

export default async function TrainerProfilePage({
    params
}: {
    params: Promise<{ locale: Locale, id: string }>
}) {
    const { locale, id } = await params
    const [session, res] = await Promise.all([
        getSession(),
        getTrainerProfile(id),
    ])

    if (!res.success || !res.trainer) {
        notFound()
    }

    type TrainerWithSchedule = typeof res.trainer & {
        availability_schedule?: { day: string; start: string; end: string }[]
    }
    const trainer = res.trainer as TrainerWithSchedule
    const { teams } = res
    const gymTeams = 'gymTeams' in res ? (res.gymTeams || []) : []
    const isFemale = trainer.gender === 'female'

    const daysMap: Record<string, string> = {
        'Sunday': 'الأحد', 'Monday': 'الإثنين', 'Tuesday': 'الثلاثاء', 'Wednesday': 'الأربعاء',
        'Thursday': 'الخميس', 'Friday': 'الجمعة', 'Saturday': 'السبت',
    }

    const dayNumMap: Record<number, string> = {
        0: 'الأحد', 1: 'الإثنين', 2: 'الثلاثاء', 3: 'الأربعاء',
        4: 'الخميس', 5: 'الجمعة', 6: 'السبت',
    }

    return (
        <AnimatedMeshBackground className="min-h-screen flex text-white" suppressHydrationWarning>
            <Sidebar locale={locale} />

            <div className="flex-1 flex flex-col md:ml-[240px] relative z-10 w-full">
                <div className="bg-[#0B132B]/60 backdrop-blur-3xl border-b border-white/10 sticky top-0 z-40">
                    <Header
                        locale={locale}
                        title={getLocalizedField(trainer, 'name', locale)}
                        showBack
                        backHref={`/${locale}/trainers`}
                    />
                </div>

                <main className="flex-1 pt-[80px] pb-nav md:pb-8 px-3 md:px-5">
                    <div className="max-w-4xl mx-auto space-y-4">

                        {/* Hero Card — Identity + Contact */}
                        <section>
                            <Card className={`bg-white/5 backdrop-blur-2xl border border-white/10 shadow-xl overflow-hidden relative border-r-2 ${isFemale ? 'border-r-pink-400' : 'border-r-indigo-400'}`}>
                                {/* Edit button */}
                                <div className="absolute top-3 left-3 z-10">
                                    <TrainerProfileActions trainer={trainer} locale={locale} />
                                </div>

                                <div className="flex flex-col items-center gap-3 py-6 px-5">
                                    {/* Name */}
                                    <h1 className="text-2xl font-black text-white text-center drop-shadow-sm">
                                        {getLocalizedField(trainer, 'name', locale)}
                                    </h1>

                                    {/* Role badges */}
                                    <div className="flex items-center gap-2 flex-wrap justify-center">
                                        <span className={`text-[11px] font-bold px-3 py-1 rounded-lg border ${isFemale ? 'text-pink-300 bg-pink-500/15 border-pink-500/20' : 'text-indigo-300 bg-indigo-500/15 border-indigo-500/20'}`}>
                                            <Shield className="w-3 h-3 inline-block ml-1.5" />
                                            {trainer.role === 'headcoach' ? 'رئيس المدربين' : 'مدرب'}
                                        </span>
                                        {gymTeams.length > 0 && (
                                            <span className="text-[11px] font-bold px-3 py-1 rounded-lg border text-purple-300 bg-purple-500/15 border-purple-500/20">
                                                <Dumbbell className="w-3 h-3 inline-block ml-1.5" />
                                                مدرب لياقة
                                            </span>
                                        )}
                                        {teams.length > 0 && (
                                            <span className="text-[11px] font-bold px-3 py-1 rounded-lg border text-green-300 bg-green-500/15 border-green-500/20">
                                                مدرب كرة سلة
                                            </span>
                                        )}
                                    </div>

                                    {/* Info pills */}
                                    <div className="flex items-center gap-2 flex-wrap justify-center">
                                        {trainer.phone && (
                                            <span className="flex items-center gap-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/15">
                                                <Phone className="w-3 h-3" />
                                                <span dir="ltr">{formatPhoneNumber(trainer.phone)}</span>
                                            </span>
                                        )}
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${isFemale ? 'text-pink-300 bg-pink-500/10 border-pink-500/15' : 'text-blue-300 bg-blue-500/10 border-blue-500/15'}`}>
                                            {isFemale ? 'أنثى' : 'ذكر'}
                                        </span>
                                        <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/15">
                                            {new Set([...teams, ...gymTeams].map((team: any) => team.id)).size} فرق
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        </section>

                        {/* Availability Schedule */}
                        <section>
                            <div className="bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 overflow-hidden">
                                <div className="px-4 py-3 border-b border-white/8">
                                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                                        ساعات التدريب المتاحة
                                    </h3>
                                </div>

                                <div className="px-4 py-2">
                                    {trainer.availability_schedule && trainer.availability_schedule.length > 0 ? (
                                        <div className="divide-y divide-white/5">
                                            {trainer.availability_schedule.map((slot: { day: string; start: string; end: string }) => (
                                                <div key={slot.day} className="flex items-center justify-between py-2.5">
                                                    <span className="font-bold text-sm text-white/80">{daysMap[slot.day] || slot.day}</span>
                                                    <span className="text-xs font-bold tabular-nums px-2.5 py-1 rounded-lg text-emerald-300 bg-emerald-500/10 border border-emerald-500/15" dir="ltr">{slot.start} – {slot.end}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : trainer.availability && trainer.availability.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 py-2">
                                            {trainer.availability.map((day: string) => (
                                                <span key={day} className="px-3 py-1 rounded-lg font-bold text-sm bg-emerald-500/10 text-emerald-300 border border-emerald-500/15">
                                                    {daysMap[day] || day}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-white/25 py-3 text-center">غير محدد</p>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Working Hours */}
                        <TrainerWorkingHours trainerId={id} locale={locale} />

                        {/* Teams Section */}
                        <section className="space-y-3">
                            <h2 className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-2 px-1">
                                الفرق المسؤولة عنها
                            </h2>

                            <div className="space-y-2">
                                {teams.map((team: any) => {
                                    const schedules = team.class_schedules || []
                                    const hallNames = [...new Set(
                                        schedules
                                            .filter((s: any) => s.halls)
                                            .map((s: any) => getLocalizedField(s.halls, 'name', locale))
                                    )] as string[]
                                    const categoryName = team.categories ? getLocalizedField(team.categories, 'name', locale) : null

                                    return (
                                        <Link key={team.id} href={`/${locale}/teams/${team.id}`} className="block group">
                                            <Card
                                                interactive
                                                className={`bg-white/5 backdrop-blur-2xl border border-white/10 shadow-xl overflow-hidden relative transition-all hover:-translate-y-1 hover:bg-white/10 border-r-2 ${isFemale ? 'border-r-pink-400' : 'border-r-indigo-400'}`}
                                            >
                                                <div className={`absolute inset-0 bg-gradient-to-br ${isFemale ? 'from-pink-500/5' : 'from-indigo-500/5'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                                                <div className="flex flex-col items-center gap-1.5 relative z-10 py-4 px-5">
                                                    <h3 className="text-base font-bold text-white truncate drop-shadow-md max-w-full">
                                                        {getLocalizedField(team, 'name', locale)}
                                                    </h3>
                                                    <div className="flex items-center gap-2 flex-wrap justify-center">
                                                        {categoryName && (
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isFemale ? 'text-pink-300 bg-pink-500/15 border border-pink-500/20' : 'text-indigo-300 bg-indigo-500/15 border border-indigo-500/20'}`}>
                                                                {categoryName}
                                                            </span>
                                                        )}
                                                        {hallNames.length > 0 && (
                                                            <span className="text-[10px] font-bold text-orange-300 bg-orange-500/15 px-2 py-0.5 rounded-md border border-orange-500/20">
                                                                {hallNames.join(' / ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {schedules.length > 0 && (
                                                        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-1">
                                                            {schedules
                                                                .filter((s: any) => s.start_time !== '00:00:00')
                                                                .sort((a: any, b: any) => a.day_of_week - b.day_of_week)
                                                                .map((s: any) => (
                                                                    <span key={s.id} className="text-[11px] text-white/35 flex items-center gap-1">
                                                                        <Clock className="w-3 h-3" />
                                                                        {dayNumMap[s.day_of_week]}
                                                                        <span dir="ltr">{s.start_time?.slice(0, 5)}-{s.end_time?.slice(0, 5)}</span>
                                                                    </span>
                                                                ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </Card>
                                        </Link>
                                    )
                                })}

                                {teams.length === 0 && (
                                    <div className="py-10 text-center text-white/25 bg-white/5 rounded-2xl border border-dashed border-white/10">
                                        لا توجد فرق مخصصة حالياً
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Gym Teams Section */}
                        {gymTeams.length > 0 && (
                            <section className="space-y-3">
                                <h2 className="text-xs font-bold text-purple-300/70 uppercase tracking-wider flex items-center gap-2 px-1">
                                    <Dumbbell className="w-3.5 h-3.5" />
                                    فرق لياقة بدنية
                                </h2>

                                <div className="space-y-2">
                                    {gymTeams.map((team: any) => {
                                        const schedules = (team.class_schedules || []).filter((s: any) => s.session_type === 'gym')
                                        const hallNames = [...new Set(
                                            schedules
                                                .filter((s: any) => s.halls)
                                                .map((s: any) => getLocalizedField(s.halls, 'name', locale))
                                        )] as string[]

                                        return (
                                            <Link key={team.id} href={`/${locale}/teams/${team.id}`} className="block group">
                                                <Card
                                                    interactive
                                                    className="bg-white/5 backdrop-blur-2xl border border-white/10 shadow-xl overflow-hidden relative transition-all hover:-translate-y-1 hover:bg-white/10 border-r-2 border-r-purple-400"
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div className="flex flex-col items-center gap-1.5 relative z-10 py-4 px-5">
                                                        <h3 className="text-base font-bold text-white truncate drop-shadow-md max-w-full">
                                                            {getLocalizedField(team, 'name', locale)}
                                                        </h3>
                                                        <div className="flex items-center gap-2 flex-wrap justify-center">
                                                            <span className="text-[10px] font-bold text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-md border border-purple-500/20">
                                                                لياقة
                                                            </span>
                                                            {hallNames.length > 0 && (
                                                                <span className="text-[10px] font-bold text-orange-300 bg-orange-500/15 px-2 py-0.5 rounded-md border border-orange-500/20">
                                                                    {hallNames.join(' / ')}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {schedules.length > 0 && (
                                                            <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-1">
                                                                {schedules
                                                                    .filter((s: any) => s.start_time !== '00:00:00')
                                                                    .sort((a: any, b: any) => a.day_of_week - b.day_of_week)
                                                                    .map((s: any) => (
                                                                        <span key={s.id} className="text-[11px] text-white/35 flex items-center gap-1">
                                                                            <Clock className="w-3 h-3" />
                                                                            {dayNumMap[s.day_of_week]}
                                                                            <span dir="ltr">{s.start_time?.slice(0, 5)}-{s.end_time?.slice(0, 5)}</span>
                                                                        </span>
                                                                    ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </Card>
                                            </Link>
                                        )
                                    })}
                                </div>
                            </section>
                        )}

                    </div>
                </main>

                <div className="relative z-50">
                    <BottomNav locale={locale} role={session?.role} />
                </div>
            </div>
        </AnimatedMeshBackground>
    )
}
