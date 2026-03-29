'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getSession } from './auth'

export async function createTeam(teamData: {
    name_ar: string,
    name_he: string,
    name_en: string,
    trainer_id: string | null,
    gym_trainer_id?: string | null,
    hall_id: string | null
}) {
    const session = await getSession()
    if (!session) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createServerSupabaseClient()
    const { data, error } = await (supabase as any).rpc('insert_class', { p_data: teamData })

    if (error) {
        console.error('createTeam failed:', error)
        return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
    }

    revalidatePath('/[locale]/teams', 'page')
    return { success: true, team: data }
}

interface TeamUpdateData {
  name_ar?: string
  name_he?: string
  name_en?: string
  trainer_id?: string | null
  gym_trainer_id?: string | null
  hall_id?: string | null
  category_id?: string | null
}

export async function updateTeam(id: string, teamData: TeamUpdateData) {
    const session = await getSession()
    if (!session) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createServerSupabaseClient()
    const { data, error } = await (supabase as any).rpc('update_class', {
        p_id: id,
        p_data: teamData
    })

    if (error) {
        console.error('updateTeam failed:', error)
        return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
    }

    revalidatePath('/[locale]/teams', 'page')
    revalidatePath(`/[locale]/teams/${id}`, 'page')
    return { success: true, team: data }
}

export async function deleteTeam(id: string) {
    const session = await getSession()
    if (!session) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createServerSupabaseClient()
    const { error } = await (supabase as any).rpc('delete_class', { p_id: id })

    if (error) {
        console.error('deleteTeam failed:', error)
        return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
    }

    revalidatePath('/[locale]/teams', 'page')
    return { success: true }
}

export async function updateTeamTrainer(classId: string, trainerId: string) {
    const session = await getSession()
    if (!session) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createServerSupabaseClient()
    const { error } = await (supabase as any).rpc('update_class', {
        p_id: classId,
        p_data: { trainer_id: trainerId }
    })

    if (error) {
        console.error('updateTeamTrainer failed:', error)
        return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
    }

    revalidatePath('/[locale]/teams/[classId]', 'page')
    return { success: true }
}
