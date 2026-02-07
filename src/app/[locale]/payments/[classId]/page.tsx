
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { Locale } from '@/lib/i18n/config'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import ClassPaymentsClient from '../../../../components/payments/ClassPaymentsClient'

export const dynamic = 'force-dynamic'

export default async function ClassPaymentsPage({
  params,
}: {
  params: Promise<{ locale: Locale, classId: string }>
}) {
  const { locale, classId } = await params
  const dict = await getDictionary(locale)
  const supabase = await createServerSupabaseClient()

  // Fetch class details
  const { data: classData } = await supabase
    .from('classes')
    .select(`
        *,
        trainers (name_en, name_ar, name_he)
    `)
    .eq('id', classId)
    .single()

  // Fetch trainees in this class
  const { data: trainees, error } = await supabase
    .from('trainees')
    .select(`
      *,
      classes (
        name_en,
        name_ar,
        name_he
      )
    `)
    .eq('class_id', classId)
    .order('name_en')

  if (error) {
    console.error('Error fetching trainees:', error)
  }

  return (
    <ClassPaymentsClient 
        trainees={trainees || []} 
        classData={classData} 
        locale={locale} 
        dict={dict} 
    />
  )
}
