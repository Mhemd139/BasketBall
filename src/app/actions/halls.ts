'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getSession } from './auth'

export async function fetchHallEvents(hallId: string, startDate: string, endDate: string) {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    const supabase = await createServerSupabaseClient()

    const { data: events, error } = await (supabase as any)
        .from('events')
        .select('id, title_he, title_ar, title_en, start_time, end_time, event_date, type, schedule_id, class_id, trainer_id, hall_id, notes_en, trainers(name_he, name_ar, name_en), classes(name_he, name_ar, name_en, categories(name_he, name_ar, name_en))')
        .eq('hall_id', hallId)
        .gte('event_date', startDate)
        .lte('event_date', endDate)
        .order('event_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(200)

    if (error) {
        console.error('fetchHallEvents failed:', error)
        return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
    }

    return { success: true, events }
}

export async function fetchHallSchedules(hallId: string) {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    const supabase = await createServerSupabaseClient()

    const { data: schedules, error } = await (supabase as any)
        .from('class_schedules')
        .select('id, day_of_week, start_time, end_time, hall_id, class_id, classes(id, name_he, name_ar, name_en, trainer_id, trainers:trainers!classes_trainer_id_fkey(name_he, name_ar, name_en), categories(name_he, name_ar, name_en))')
        .eq('hall_id', hallId)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(100)

    if (error) {
        console.error('fetchHallSchedules failed:', error)
        return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
    }

    return { success: true, schedules }
}

export async function updateHall(id: string, name_en: string, name_ar: string, name_he: string) {
    const session = await getSession()
    if (!session) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createServerSupabaseClient()
    const { data, error } = await (supabase as any).rpc('update_hall_rpc', {
        p_id: id,
        p_name_en: name_en,
        p_name_ar: name_ar,
        p_name_he: name_he
    })

    if (error) {
        console.error('updateHall failed:', error)
        return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
    }

    revalidatePath('/[locale]/halls/[id]', 'page')
    revalidatePath('/[locale]/halls', 'page')
    return { success: true, hall: data }
}

export async function addClassSchedule(classId: string, dayOfWeek: number, hallId: string, startTime: string, endTime: string) {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    try {
        const supabase = await createServerSupabaseClient()
        const { error } = await (supabase as any).rpc('insert_class_schedule', {
            p_data: {
                class_id: classId,
                day_of_week: dayOfWeek,
                hall_id: hallId,
                start_time: startTime,
                end_time: endTime,
            }
        })

        if (error) {
            console.error('addClassSchedule failed:', error)
            return { success: false, error: 'فشل إضافة الجدول' }
        }

        revalidatePath('/[locale]/teams/[classId]', 'page')
        revalidatePath('/[locale]/schedule', 'page')
        revalidatePath('/[locale]/halls/[id]', 'page')
        return { success: true }
    } catch (e: any) {
        console.error('addClassSchedule:', e)
        return { success: false, error: 'فشل إضافة الجدول' }
    }
}

export async function deleteClassSchedule(scheduleId: string) {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    try {
        const supabase = await createServerSupabaseClient()
        const { error } = await (supabase as any).rpc('delete_class_schedule', {
            p_id: scheduleId,
        })

        if (error) {
            console.error('deleteClassSchedule failed:', error)
            return { success: false, error: 'فشل حذف الجدول' }
        }

        revalidatePath('/[locale]/teams/[classId]', 'page')
        revalidatePath('/[locale]/schedule', 'page')
        revalidatePath('/[locale]/halls/[id]', 'page')
        return { success: true }
    } catch (e: any) {
        console.error('deleteClassSchedule:', e)
        return { success: false, error: 'فشل حذف الجدول' }
    }
}

export async function updateClassSchedule(scheduleId: string, hallId: string, startTime: string, endTime: string) {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    try {
        const supabase = await createServerSupabaseClient()
        const { error, data } = await (supabase as any).rpc('update_class_schedule', {
            p_schedule_id: scheduleId,
            p_hall_id: hallId,
            p_start_time: startTime,
            p_end_time: endTime,
        })

        if (error) {
            console.error('updateClassSchedule failed:', error)
            return { success: false, error: 'فشل تحديث الجدول' }
        }

        revalidatePath('/[locale]/teams/[classId]', 'page')
        revalidatePath('/[locale]/schedule', 'page')
        revalidatePath('/[locale]/halls/[id]', 'page')
        return { success: true }
    } catch (e: any) {
        console.error('updateClassSchedule:', e)
        return { success: false, error: 'فشل تحديث الجدول' }
    }
}
