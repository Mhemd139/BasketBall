import { redirect } from 'next/navigation'
import { getSession, getImportRefData } from '@/app/actions'
import { ImportWizard } from '@/components/import/ImportWizard'

export default async function ImportPage({ params }: { params: { locale: string } }) {
  const session = await getSession()
  const { locale } = await params

  if (!session || session.role !== 'headcoach') {
    redirect(`/${locale}/login`)
  }

  const refData = await getImportRefData()

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden" dir="rtl">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-400/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 pb-8 relative z-10">
        <ImportWizard locale={locale} refData={refData} />
      </div>
    </div>
  )
}
