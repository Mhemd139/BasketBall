'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { normalizePhone } from '@/lib/utils'
import { getSession } from './auth'

export async function getTrainers() {
    const session = await getSession()
    if (!session || session.role !== 'headcoach') {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createServerSupabaseClient()
    const { data: trainers, error } = await (supabase as any)
        .from('trainers')
        .select('id, name_ar, name_he, name_en, phone, gender, role, created_at')
        .order('created_at', { ascending: false })
        .limit(200)

    if (error) {
        console.error('getTrainers failed:', error)
        return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
    }
    return { success: true, trainers }
}

export async function upsertTrainer(phone: string, name: string, role: 'headcoach' | 'trainer' = 'trainer') {
    const session = await getSession()
    if (!session || session.role !== 'headcoach') {
        return { success: false, error: 'Unauthorized' }
    }

    const cleanPhone = normalizePhone(phone)

    const supabase = await createServerSupabaseClient()

    const { data: existing } = await (supabase as any)
        .from('trainers')
        .select('id')
        .eq('phone', cleanPhone)
        .single()

    const trainerData = { name_en: name, name_ar: name, name_he: name, role }

    if (existing) {
        const { error } = await (supabase as any).rpc('update_trainer_rpc', {
            p_id: existing.id,
            p_data: trainerData
        })
        if (error) {
            console.error('upsertTrainer update failed:', error)
            return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
        }
    } else {
        const { data: newTrainer, error: createError } = await (supabase as any).rpc('create_trainer', {
            p_phone: cleanPhone,
            p_name: name,
        })
        if (createError) {
            console.error('upsertTrainer create failed:', createError)
            return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
        }

        const created = Array.isArray(newTrainer) ? newTrainer[0] : newTrainer
        if (created?.id && role !== 'trainer') {
            const { error: updateError } = await (supabase as any).rpc('update_trainer_rpc', {
                p_id: created.id,
                p_data: { role }
            })
            if (updateError) {
                console.error('upsertTrainer role update failed:', updateError)
                return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
            }
        }
    }

    revalidatePath('/[locale]/head-coach', 'page')
    return { success: true }
}

export async function deleteTrainer(id: string) {
    const session = await getSession()
    if (!session || session.role !== 'headcoach') {
        return { success: false, error: 'Unauthorized' }
    }

    if (id === session.id) {
         return { success: false, error: 'Cannot delete yourself' }
    }

    const supabase = await createServerSupabaseClient()
    const { error } = await (supabase as any).rpc('delete_trainer_rpc', { p_id: id })

    if (error) {
        console.error('deleteTrainer failed:', error)
        return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
    }

    revalidatePath('/[locale]/head-coach', 'page')
    return { success: true }
}

export async function getTrainerProfile(trainerId: string) {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    const supabase = await createServerSupabaseClient()

    const [{ data: trainer, error: trainerError }, { data: teams, error: teamsError }, { data: gymTeams, error: gymTeamsError }] = await Promise.all([
        (supabase as any).from('trainers').select('id, name_ar, name_he, name_en, phone, gender, role, availability, availability_schedule').eq('id', trainerId).single(),
        (supabase as any).from('classes')
            .select('id, name_ar, name_he, name_en, categories(name_he, name_ar, name_en), class_schedules(id, day_of_week, start_time, end_time, session_type, halls(id, name_he, name_ar, name_en))')
            .eq('trainer_id', trainerId)
            .limit(50),
        (supabase as any).from('classes')
            .select('id, name_ar, name_he, name_en, categories(name_he, name_ar, name_en), class_schedules(id, day_of_week, start_time, end_time, session_type, halls(id, name_he, name_ar, name_en))')
            .eq('gym_trainer_id', trainerId)
            .limit(50),
    ])

    if (trainerError) {
        console.error('getTrainerProfile failed:', trainerError)
        return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
    }
    if (teamsError) {
        console.error('getTrainerProfile teams failed:', teamsError)
        return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
    }
    if (gymTeamsError) {
        console.error('getTrainerProfile gymTeams failed:', gymTeamsError)
    }

    return { success: true, trainer, teams, gymTeams: gymTeams || [] }
}

export async function getTrainerProfileServer() {
    const session = await getSession()
    if (!session) return null

    const supabase = await createServerSupabaseClient()
    const { data: trainer } = await (supabase as any)
        .from('trainers')
        .select('id, name_ar, name_he, name_en, phone, gender, role, availability, availability_schedule')
        .eq('id', session.id)
        .single()

    return trainer
}

interface TrainerUpdateData {
  name_ar?: string
  name_he?: string
  name_en?: string
  phone?: string
  gender?: 'male' | 'female'
  role?: 'headcoach' | 'trainer'
  availability?: string[]
  availability_schedule?: { day: string; start: string; end: string }[]
}

export async function updateTrainerDetails(id: string, data: TrainerUpdateData) {
    const session = await getSession()
    if (!session) {
        return { success: false, error: 'Unauthorized' }
    }
    if (id !== session.id && session.role !== 'headcoach') {
        return { success: false, error: 'Unauthorized' }
    }

    if (data.phone) {
        data.phone = normalizePhone(data.phone)
    }

    const supabase = await createServerSupabaseClient()
    const { error } = await (supabase as any).rpc('update_trainer_rpc', {
        p_id: id,
        p_data: data
    })

    if (error) {
        console.error('updateTrainerDetails failed:', error)
        return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
    }

    revalidatePath('/[locale]/trainers', 'page')
    revalidatePath('/[locale]/trainers/[id]', 'page')
    return { success: true }
}

export async function getTrainerWorkingHours(trainerId: string, startDate: string, endDate: string) {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    const supabase = await createServerSupabaseClient()

    const { data: events, error } = await (supabase as any)
        .from('events')
        .select('start_time, end_time')
        .eq('trainer_id', trainerId)
        .gte('event_date', startDate)
        .lte('event_date', endDate)
        .limit(500)

    if (error) {
        console.error('getTrainerWorkingHours error:', error)
        return { success: false, error: 'فشل تحميل ساعات العمل' }
    }

    let totalMinutes = 0
    for (const event of events || []) {
        if (!event.start_time || !event.end_time) continue
        const [sh, sm] = event.start_time.split(':').map(Number)
        const [eh, em] = event.end_time.split(':').map(Number)
        const diff = (eh * 60 + em) - (sh * 60 + sm)
        if (diff > 0) totalMinutes += diff
    }

    return {
        success: true,
        hours: Math.floor(totalMinutes / 60),
        minutes: totalMinutes % 60,
        totalEvents: (events || []).length,
    }
}

export async function getTrainerWorkingHoursDetailed(trainerId: string, startDate: string, endDate: string) {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    const supabase = await createServerSupabaseClient()

    const { data: events, error } = await (supabase as any)
        .from('events')
        .select('id, event_date, start_time, end_time, type, title_ar, title_he, title_en, class_id, classes(name_ar, name_he, name_en)')
        .eq('trainer_id', trainerId)
        .gte('event_date', startDate)
        .lte('event_date', endDate)
        .order('event_date', { ascending: false })
        .limit(500)

    if (error) {
        console.error('getTrainerWorkingHoursDetailed error:', error)
        return { success: false, error: 'فشل تحميل ساعات العمل' }
    }

    let totalMinutes = 0
    const detailedEvents = []

    for (const event of events || []) {
        let duration = 0
        if (event.start_time && event.end_time) {
            const [sh, sm] = event.start_time.split(':').map(Number)
            const [eh, em] = event.end_time.split(':').map(Number)
            const diff = (eh * 60 + em) - (sh * 60 + sm)
            if (diff > 0) {
                duration = diff
                totalMinutes += diff
            }
        }

        detailedEvents.push({
            id: event.id,
            eventDate: event.event_date,
            startTime: event.start_time,
            endTime: event.end_time,
            type: event.type || 'training',
            titleAr: event.title_ar,
            titleHe: event.title_he,
            titleEn: event.title_en,
            teamNameAr: event.classes?.name_ar || '',
            teamNameHe: event.classes?.name_he || '',
            teamNameEn: event.classes?.name_en || '',
            duration,
        })
    }

    return {
        success: true,
        hours: Math.floor(totalMinutes / 60),
        minutes: totalMinutes % 60,
        totalEvents: detailedEvents.length,
        events: detailedEvents,
    }
}
