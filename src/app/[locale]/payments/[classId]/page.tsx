
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { Locale } from '@/lib/i18n/config'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import ClassPaymentsClient from '../../../../components/payments/ClassPaymentsClient'

export default async function ClassPaymentsPage({
  params,
}: {
  params: Promise<{ locale: Locale, classId: string }>
}) {
  const { locale, classId } = await params
  const dict = await getDictionary(locale)
  const supabase = await createServerSupabaseClient()

  const [{ data: classData }, { data: trainees, error }] = await Promise.all([
    supabase.from('classes').select('*, trainers (name_en, name_ar, name_he)').eq('id', classId).single(),
    supabase.from('trainees').select('*, classes (name_en, name_ar, name_he)').eq('class_id', classId).order('name_ar'),
  ])

  return (
    <ClassPaymentsClient 
        trainees={trainees || []} 
        classData={classData} 
        locale={locale} 
        dict={dict} 
    />
  )
}
