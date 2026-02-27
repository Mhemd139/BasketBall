import type { Locale } from '@/lib/i18n/config'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { AnimatedMeshBackground } from '@/components/ui/AnimatedMeshBackground'
import { getSession, getTeamAttendanceHistory } from '@/app/actions'
import { AttendanceHistoryView } from '@/components/teams/AttendanceHistoryView'

export default async function AttendancePage({
    params,
}: {
    params: Promise<{ locale: Locale; classId: string }>
}) {
    const { locale, classId } = await params
    const [session, attendanceRes] = await Promise.all([
        getSession(),
        getTeamAttendanceHistory(classId),
    ])

    const data = attendanceRes.success && attendanceRes.data ? attendanceRes.data : null

    return (
        <AnimatedMeshBackground className="min-h-screen flex text-white" suppressHydrationWarning>
            <Sidebar locale={locale} />

            <div className="flex-1 flex flex-col md:ml-[240px] relative z-10 w-full">
                <div className="bg-[#0B132B]/60 backdrop-blur-3xl border-b border-white/10 sticky top-0 z-40">
                    <Header
                        locale={locale}
                        title="سجل الحضور"
                        showBack
                        backHref={`/${locale}/teams/${classId}`}
                    />
                </div>

                <main className="flex-1 pt-20 pb-nav md:pb-8 px-3 md:px-5 w-full overflow-x-hidden">
                    <div className="max-w-4xl mx-auto w-full">
                        {data ? (
                            <AttendanceHistoryView data={data} locale={locale} />
                        ) : (
                            <div className="text-center py-16">
                                <p className="text-white/30 font-medium text-sm">لا توجد سجلات حضور في آخر 30 يوم</p>
                            </div>
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
