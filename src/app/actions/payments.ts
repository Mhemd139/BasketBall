'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getSession } from './auth'

export async function updateTraineePayment(traineeId: string, amount: number, comment: string) {
  const session = await getSession()
  if (!session) return { success: false, error: 'Unauthorized' }

  const supabase = await createServerSupabaseClient()

  const { error } = await (supabase as any).rpc('record_trainee_payment', {
      p_trainee_id: traineeId,
      p_amount: amount,
      p_note: comment,
      p_season: '2025-2026'
  })

  if (error) {
     console.error('updateTraineePayment failed:', error)
     return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
  }

  revalidatePath('/[locale]/payments', 'page')
  revalidatePath('/[locale]/teams/[classId]', 'page')
  return { success: true }
}

export async function toggleTraineePayment(traineeId: string, isPaid: boolean) {
  const session = await getSession()
  if (!session) return { success: false, error: 'Unauthorized' }

  const supabase = await createServerSupabaseClient()
  const { error } = await (supabase as any).rpc('update_trainee_rpc', {
      p_id: traineeId,
      p_data: { is_paid: isPaid }
  })

  if (error) {
    console.error('toggleTraineePayment failed:', error)
    return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
  }

  revalidatePath('/[locale]/payments', 'page')
  return { success: true }
}
