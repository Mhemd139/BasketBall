import { redirect } from 'next/navigation'
import { getSession, getTrainers } from '@/app/actions'
import TrainerManager from '@/components/admin/TrainerManager'
import { ShieldCheck, ArrowRight, FileSpreadsheet, Download } from 'lucide-react'
import Link from 'next/link'
import { ExportButton } from '@/components/import/ExportButton'

export default async function HeadCoachPage({ params }: { params: { locale: string } }) {
  const session = await getSession()
  const { locale } = await params

  // 1. Strict Role Check
  // Note: We also check this in 'getTrainers' but doing it here prevents rendering empty UI
  if (!session || session.role !== 'headcoach') {
      redirect(`/${locale}/login`) // Or 404/403
  }

  // 2. Fetch Data
  const { trainers, success, error } = await getTrainers()

  if (!success) {
      return <div className="p-10 text-center text-red-500">Error: {error}</div>
  }

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden" dir="rtl">
        {/* Abstract Backgrounds */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-400/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
            {/* Header */}
            <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-bold mb-4 shadow-sm border border-amber-200">
                        <ShieldCheck className="w-4 h-4" />
                        <span>لوحة التحكم الرئيسية</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                        إدارة <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">الفريق</span>
                    </h1>
                    <p className="text-lg text-slate-500 mt-4 max-w-2xl">
                        مرحباً بك، أيها القائد. قم بإدارة وتوجيه طاقم التدريب الخاص بك من هنا.
                    </p>
                </div>
                
                {/* Stats Card (Optional / Placeholder) */}
                <div className="flex gap-4">
                    <div className="bg-white/60 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/50 shadow-lg">
                        <div className="text-sm text-slate-500 font-medium">عدد المدربين</div>
                        <div className="text-3xl font-black text-slate-800">{trainers?.length || 0}</div>
                    </div>
                    <Link 
                        href={`/${locale}`}
                        className="flex items-center gap-2 bg-white/60 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/50 shadow-lg text-slate-600 hover:text-amber-600 hover:bg-white transition-all group"
                    >
                        <span className="font-bold">العودة</span>
                        <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                </div>
            </header>

            {/* Import / Export Section */}
            <section className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <Link
                    href={`/${locale}/head-coach/import`}
                    className="flex items-center gap-3 sm:gap-4 bg-white/70 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-white/50 shadow-lg hover:shadow-xl hover:bg-white active:scale-[0.98] transition-all group"
                >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-amber-700 transition-transform group-hover:scale-110 shrink-0">
                        <FileSpreadsheet className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-base sm:text-lg">استيراد بيانات</h3>
                        <p className="text-xs sm:text-sm text-slate-500">استيراد من ملف Excel أو CSV</p>
                    </div>
                </Link>

                <div className="bg-white/70 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-white/50 shadow-lg">
                    <div className="flex items-center gap-3 sm:gap-4 mb-3">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center text-green-700 shrink-0">
                            <Download className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>
                        <h3 className="font-bold text-slate-900 text-base sm:text-lg">تصدير بيانات</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <ExportButton table="trainees" filename="trainees-export" label="اللاعبين" />
                        <ExportButton table="trainers" filename="trainers-export" label="المدربين" />
                        <ExportButton table="classes" filename="teams-export" label="الفرق" />
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <main>
                <TrainerManager initialTrainers={trainers || []} locale={locale} />
            </main>
        </div>
    </div>
  )
}
