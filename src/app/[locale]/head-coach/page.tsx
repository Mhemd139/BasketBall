import { redirect } from 'next/navigation'
import { getSession, getTrainers } from '@/app/actions'
import TrainerManager from '@/components/admin/TrainerManager'
import { ShieldCheck, ArrowRight } from 'lucide-react'
import Link from 'next/link'

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

            {/* Main Content */}
            <main>
                <TrainerManager initialTrainers={trainers || []} />
            </main>
        </div>
    </div>
  )
}
