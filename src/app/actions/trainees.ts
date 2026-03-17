'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getSession } from './auth'

export async function addTrainee({
  classId,
  name,
  phone,
  jerseyNumber,
  gender
}: {
  classId: string
  name: string
  phone?: string
  jerseyNumber?: number | null
  gender?: 'male' | 'female'
}) {
  const supabase = await createServerSupabaseClient()

  const session = await getSession()
  if (!session) {
    return { success: false, error: 'Unauthorized' }
  }

  const { data, error } = await (supabase as any).rpc('insert_trainee', {
      p_data: {
        class_id: classId,
        name_en: name,
        name_ar: name,
        name_he: name,
        phone: phone || null,
        jersey_number: jerseyNumber,
        is_paid: false,
        gender: gender || 'male'
      }
  })

  if (error) {
    console.error('addTrainee failed:', error)
    return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
  }

  revalidatePath('/[locale]/teams/[classId]', 'page')
  return { success: true, trainee: data }
}

export async function searchTrainees(query: string) {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    const escaped = query.replace(/[%_\\]/g, c => `\\${c}`)
    const supabase = await createServerSupabaseClient()

    const { data: trainees, error } = await (supabase as any)
        .from('trainees')
        .select('id, name_ar, name_he, name_en, phone, jersey_number, gender, class_id, classes(name_en, name_ar, name_he)')
        .or(`name_en.ilike.%${escaped}%,name_ar.ilike.%${escaped}%,name_he.ilike.%${escaped}%,phone.ilike.%${escaped}%`)
        .limit(10)

    if (error) {
        console.error('searchTrainees failed:', error)
        return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
    }
    return { success: true, trainees }
}

export async function transferTrainee(traineeId: string, classId: string) {
    const session = await getSession()
    if (!session) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createServerSupabaseClient()
    const { error } = await (supabase as any).rpc('update_trainee_rpc', {
        p_id: traineeId,
        p_data: { class_id: classId }
    })

    if (error) {
        console.error('transferTrainee failed:', error)
        return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
    }

    revalidatePath('/[locale]/teams/[classId]', 'page')
    return { success: true }
}

interface TraineeUpdateData {
  name_ar?: string
  name_he?: string
  name_en?: string
  phone?: string | null
  jersey_number?: number | null
  gender?: 'male' | 'female'
  class_id?: string
  is_paid?: boolean
  amount_paid?: number
  date_of_birth?: string | null
  school_class?: string | null
}

export async function updateTrainee(traineeId: string, updateData: TraineeUpdateData) {
    const session = await getSession()
    if (!session) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createServerSupabaseClient()
    const { error } = await (supabase as any).rpc('update_trainee_rpc', {
        p_id: traineeId,
        p_data: updateData
    })

    if (error) {
        console.error('updateTrainee failed:', error)
        return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
    }

    revalidatePath('/[locale]/teams/[classId]', 'page')
    return { success: true }
}

export async function deleteTrainee(traineeId: string) {
  const session = await getSession()
  if (!session) return { success: false, error: 'Unauthorized' }

  const supabase = await createServerSupabaseClient()
  const { error } = await (supabase as any).rpc('delete_trainee', { p_id: traineeId })

  if (error) {
    console.error('deleteTrainee failed:', error)
    return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
  }

  revalidatePath('/[locale]/teams/[classId]', 'page')
  return { success: true }
}

interface QuickRegisterData {
  name_ar: string
  name_he: string
  name_en: string
  phone?: string | null
  jersey_number?: number | null
  gender?: 'male' | 'female'
  is_paid?: boolean
}

export async function quickRegisterAndAssign(traineeData: QuickRegisterData, classId: string) {
    const session = await getSession()
    if (!session) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createServerSupabaseClient()
    const { data: trainee, error: traineeError } = await (supabase as any).rpc('insert_trainee', {
        p_data: {
            ...traineeData,
            class_id: classId
        }
    })

    if (traineeError) {
        console.error('quickRegisterAndAssign failed:', traineeError)
        return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
    }

    revalidatePath('/[locale]/halls/[id]', 'page')
    return { success: true, trainee }
}

export async function assignTraineeToTeam(traineeId: string, classId: string) {
    const session = await getSession()
    if (!session) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createServerSupabaseClient()
    const { error } = await (supabase as any).rpc('update_trainee_rpc', {
        p_id: traineeId,
        p_data: { class_id: classId }
    })

    if (error) {
        console.error('assignTraineeToTeam failed:', error)
        return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
    }

    revalidatePath('/[locale]/halls/[id]', 'page')
    return { success: true }
}
