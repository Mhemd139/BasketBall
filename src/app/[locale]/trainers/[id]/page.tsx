import { Locale } from '@/lib/i18n/config'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { getTrainerProfile, getSession } from '@/app/actions'
import { getLocalizedField } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { User, Phone, Trophy, MapPin, Calendar, Mail, Shield, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { TrainerProfileActions } from '@/components/trainers/TrainerProfileActions'

export default async function TrainerProfilePage({
    params
}: {
    params: Promise<{ locale: Locale, id: string }>
}) {
    const { locale, id } = await params
    const session = await getSession()
    const res = await getTrainerProfile(id)

    if (!res.success || !res.trainer) {
        notFound()
    }

    const { trainer, teams } = res

    // Map days to localized labels for display
    const daysMap: Record<string, string> = {
        'Sunday': locale === 'ar' ? 'الأحد' : locale === 'he' ? 'ראשון' : 'Sunday',
        'Monday': locale === 'ar' ? 'الإثنين' : locale === 'he' ? 'שני' : 'Monday',
        'Tuesday': locale === 'ar' ? 'الثلاثاء' : locale === 'he' ? 'שלישי' : 'Tuesday',
        'Wednesday': locale === 'ar' ? 'الأربعاء' : locale === 'he' ? 'רביעי' : 'Wednesday',
        'Thursday': locale === 'ar' ? 'الخميس' : locale === 'he' ? 'חמישי' : 'Thursday',
        'Friday': locale === 'ar' ? 'الجمعة' : locale === 'he' ? 'שישי' : 'Friday',
        'Saturday': locale === 'ar' ? 'السبت' : locale === 'he' ? 'שבת' : 'Saturday',
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar locale={locale} />

            <div className="flex-1 flex flex-col md:ml-[240px]">
                <Header 
                    locale={locale} 
                    title={getLocalizedField(trainer, 'name', locale)} 
                    showBack 
                    backHref={`/${locale}/trainers`} 
                />

                <main className="flex-1 pt-20 pb-24 md:pb-8 px-3 md:px-5">
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
                                {trainer.availability && trainer.availability.length > 0 ? (
                                    <div className="w-full bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-2">
                                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            {locale === 'ar' ? 'أيام التدريب المتاحة' : locale === 'he' ? 'ימי אימון זמינים' : 'Available Days'}
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
                                    <div className="w-full bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-2 opacity-60">
                                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            {locale === 'ar' ? 'أيام التدريب المتاحة' : locale === 'he' ? 'ימי אימון זמינים' : 'Available Days'}
                                        </h3>
                                        <p className="text-sm text-gray-400 italic">
                                            {locale === 'ar' ? 'غير محدد' : locale === 'he' ? 'לא צוין' : 'Not specified'}
                                        </p>
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
                                            ? (locale === 'ar' ? 'رئيس المدربين' : locale === 'he' ? 'מאמן ראשי' : 'Head Coach')
                                            : (locale === 'ar' ? 'مدرب' : locale === 'he' ? 'מאמן' : 'Trainer')}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 text-gray-600 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <span dir="ltr">{trainer.phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-600 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <Trophy className="w-4 h-4" />
                                        </div>
                                        <span>{teams.length} {locale === 'ar' ? 'فرق' : locale === 'he' ? 'קבוצות' : 'Teams'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-600 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${trainer.gender === 'female' ? 'bg-pink-50 text-pink-500' : 'bg-blue-50 text-blue-500'}`}>
                                            <User className="w-4 h-4" />
                                        </div>
                                        <span>
                                            {trainer.gender === 'female' 
                                                ? (locale === 'ar' ? 'أنثى' : locale === 'he' ? 'נקבה' : 'Female')
                                                : (locale === 'ar' ? 'ذكر' : locale === 'he' ? 'זכר' : 'Male')}
                                        </span>
                                    </div>
                                </div>

                                </div>

                        </section>

                        {/* Teams Section */}
                        <section className="space-y-4">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-gold-500" />
                                {locale === 'ar' ? 'الفرق المسؤولة عنها' : locale === 'he' ? 'קבוצות באחריותו' : 'Responsible Teams'}
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {teams.map((team: any) => (
                                    <Link key={team.id} href={`/${locale}/teams/${team.id}`}>
                                        <Card className="p-5 hover:border-indigo-500 transition-all border-2 border-transparent group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                                                    <Trophy className="w-6 h-6" />
                                                </div>
                                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    {team.id.split('-')[0]}
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-gray-900 text-lg mb-2">
                                                {getLocalizedField(team, 'name', locale)}
                                            </h3>
                                            <div className="space-y-2 text-sm text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 shrink-0" />
                                                    {team.halls ? getLocalizedField(team.halls, 'name', locale) : 'N/A'}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 shrink-0" />
                                                    {team.schedule_info || 'N/A'}
                                                </div>
                                            </div>
                                        </Card>
                                    </Link>
                                ))}
                                
                                {teams.length === 0 && (
                                    <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-2xl border-2 border-dashed border-slate-100">
                                        {locale === 'ar' ? 'لا توجد فرق مخصصة حالياً' : locale === 'he' ? 'אין קבוצות מוקצות כרגע' : 'No teams assigned currently'}
                                    </div>
                                )}
                            </div>
                        </section>

                    </div>
                </main>
            </div>
        </div>
    )
}
