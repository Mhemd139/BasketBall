import { Locale } from '@/lib/i18n/config'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { getTrainerProfile, getSession } from '@/app/actions'
import { getLocalizedField } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { User, Phone, Trophy, MapPin, Calendar, Clock, Shield, CheckCircle2, Building2 } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { TrainerProfileActions } from '@/components/trainers/TrainerProfileActions'
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

    const { trainer, teams } = res

    const daysMap: Record<string, string> = {
        'Sunday': 'الأحد',
        'Monday': 'الإثنين',
        'Tuesday': 'الثلاثاء',
        'Wednesday': 'الأربعاء',
        'Thursday': 'الخميس',
        'Friday': 'الجمعة',
        'Saturday': 'السبت',
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

                <main className="flex-1 pt-20 pb-nav md:pb-8 px-3 md:px-5">
                    <div className="max-w-4xl mx-auto space-y-8">
                        
                        {/* Profile Header */}
                        <section className="flex flex-col md:flex-row gap-8 items-start relative">
                            {/* Edit Button (Top Right of Section) */}
                            <div className="absolute top-0 end-0">
                                <TrainerProfileActions trainer={trainer} locale={locale} />
                            </div>

                            <div className="flex flex-col gap-6 md:w-64 md:shrink-0 items-center md:items-start">
                                <div className="w-32 h-32 rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-xl rotate-3 shrink-0">
                                    <User className="w-16 h-16" strokeWidth={1.5} />
                                </div>

                                {/* Availability Section */}
                                {(trainer as any).availability_schedule?.length > 0 ? (
                                    <div className="w-full bg-white/70 backdrop-blur-xl p-4 rounded-xl border border-white/40 shadow-sm space-y-2">
                                        <h3 className="text-sm font-black text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            {'ساعات التدريب المتاحة'}
                                        </h3>
                                        <div className="space-y-1.5">
                                            {(trainer as any).availability_schedule.map((slot: any) => (
                                                <div key={slot.day} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100">
                                                    <span className="font-bold text-sm text-indigo-700">{daysMap[slot.day] || slot.day}</span>
                                                    <span className="text-xs font-bold text-indigo-500 tabular-nums" dir="ltr">{slot.start} – {slot.end}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : trainer.availability && trainer.availability.length > 0 ? (
                                    <div className="w-full bg-white/70 backdrop-blur-xl p-4 rounded-xl border border-white/40 shadow-sm space-y-2">
                                        <h3 className="text-sm font-black text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            {'أيام التدريب المتاحة'}
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {trainer.availability.map((day: string) => (
                                                <span key={day} className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-sm border border-indigo-100">
                                                    {daysMap[day] || day}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full bg-white/70 backdrop-blur-xl p-4 rounded-xl border border-white/40 shadow-sm space-y-2 opacity-60">
                                        <h3 className="text-sm font-black text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            {'ساعات التدريب المتاحة'}
                                        </h3>
                                        <p className="text-sm text-gray-400 italic">{'غير محدد'}</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex-1 space-y-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-1">
                                        {getLocalizedField(trainer, 'name', locale)}
                                    </h1>
                                    <div className="flex items-center gap-2 text-indigo-600 font-medium">
                                        <Shield className="w-4 h-4" />
                                        {trainer.role === 'admin' 
                                            ? 'رئيس المدربين'
                                            : 'مدرب'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 font-bold text-gray-600 bg-white/70 backdrop-blur-md p-3 rounded-xl border border-white/40 shadow-sm">
                                        <div className="w-8 h-8 rounded-lg bg-green-50/50 flex items-center justify-center text-green-600 border border-green-100">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <span dir="ltr">{trainer.phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 font-bold text-gray-600 bg-white/70 backdrop-blur-md p-3 rounded-xl border border-white/40 shadow-sm">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50/50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                                            <Trophy className="w-4 h-4" />
                                        </div>
                                        <span>{teams.length} {'فرق'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 font-bold text-gray-600 bg-white/70 backdrop-blur-md p-3 rounded-xl border border-white/40 shadow-sm">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${trainer.gender === 'female' ? 'bg-pink-50/50 text-pink-500 border-pink-100' : 'bg-blue-50/50 text-blue-500 border-blue-100'}`}>
                                            <User className="w-4 h-4" />
                                        </div>
                                        <span>
                                            {trainer.gender === 'female' 
                                                ? 'أنثى'
                                                : 'ذكر'}
                                        </span>
                                    </div>
                                </div>

                                </div>

                        </section>

                        {/* Teams Section */}
                        <section className="space-y-4">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-gold-500" />
                                {'الفرق المسؤولة عنها'}
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {teams.map((team: any) => {
                                    const schedules = team.class_schedules || []
                                    // Get unique hall names from schedules
                                    const hallNames = [...new Set(
                                        schedules
                                            .filter((s: any) => s.halls)
                                            .map((s: any) => getLocalizedField(s.halls, 'name', locale))
                                    )] as string[]
                                    const categoryName = team.categories ? getLocalizedField(team.categories, 'name', locale) : null

                                    return (
                                        <Link key={team.id} href={`/${locale}/teams/${team.id}`}>
                                            <Card className="p-5 hover:border-indigo-500 transition-all border-2 border-white/40 bg-white/70 backdrop-blur-lg group">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100/50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-50 transition-colors border border-indigo-100/50">
                                                        <Trophy className="w-6 h-6" />
                                                    </div>
                                                    {categoryName && (
                                                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                                                            {categoryName}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="font-bold text-gray-900 text-lg mb-2">
                                                    {categoryName
                                                        ? `${getLocalizedField(team, 'name', locale)} - ${categoryName}`
                                                        : getLocalizedField(team, 'name', locale)}
                                                </h3>
                                                <div className="space-y-2 text-sm text-gray-500">
                                                    {/* Halls */}
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="w-4 h-4 shrink-0" />
                                                        <span>{hallNames.length > 0 ? hallNames.join(' / ') : 'غير محدد'}</span>
                                                    </div>
                                                    {/* Schedule summary */}
                                                    {schedules.length > 0 ? (
                                                        <div className="space-y-1">
                                                            {schedules
                                                                .filter((s: any) => s.start_time !== '00:00:00')
                                                                .sort((a: any, b: any) => a.day_of_week - b.day_of_week)
                                                                .map((s: any) => (
                                                                <div key={s.id} className="flex items-center gap-2 text-xs">
                                                                    <Clock className="w-3 h-3 shrink-0 text-gray-400" />
                                                                    <span className="font-medium text-gray-600">{dayNumMap[s.day_of_week]}</span>
                                                                    <span dir="ltr">{s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}</span>
                                                                    {s.halls && (
                                                                        <span className="text-gray-400">• {getLocalizedField(s.halls, 'name', locale)}</span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                                            <Calendar className="w-3 h-3 shrink-0" />
                                                            <span>{'جدول غير محدد'}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </Card>
                                        </Link>
                                    )
                                })}

                                {teams.length === 0 && (
                                    <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-2xl border-2 border-dashed border-slate-100">
                                        {'لا توجد فرق مخصصة حالياً'}
                                    </div>
                                )}
                            </div>
                        </section>

                    </div>
                </main>

                <div className="relative z-50">
                    <BottomNav locale={locale} role={session?.role} />
                </div>
            </div>
        </AnimatedMeshBackground>
    )
}
