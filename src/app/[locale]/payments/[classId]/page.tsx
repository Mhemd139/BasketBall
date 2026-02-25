
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
  const supabase = await createServerSupabaseClient()

  const [dict, { data: classData }, { data: trainees }] = await Promise.all([
    getDictionary(locale),
    supabase.from('classes').select('id, name_en, name_ar, name_he, trainers(name_en, name_ar, name_he)').eq('id', classId).single(),
    supabase.from('trainees').select('*').eq('class_id', classId).order('name_ar').limit(200),
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
