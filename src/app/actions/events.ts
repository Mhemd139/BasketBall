'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getTodayISO, getNowInIsrael } from '@/lib/utils'
import { getSession } from './auth'

interface EventData {
  id?: string
  hall_id: string
  trainer_id?: string | null
  class_id?: string | null
  schedule_id?: string | null
  type?: string
  title_ar?: string
  title_he?: string
  title_en?: string
  event_date: string
  start_time: string
  end_time: string
  notes_en?: string | null
}

export async function upsertEvent(eventData: EventData) {
  try {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }
    const supabase = await createServerSupabaseClient()

    if (!eventData.hall_id || !eventData.start_time || !eventData.end_time || !eventData.event_date) {
        return { success: false, error: 'Missing required fields' }
    }

    const todayStr = getTodayISO()
    if (eventData.event_date < todayStr && !eventData.id) {
        return { success: false, error: 'Cannot add events to past dates' }
    }

    const payload = {
        ...eventData,
        trainer_id: eventData.trainer_id || session?.id || null
    }

    const { data, error } = await (supabase as any).rpc('upsert_event', { p_data: payload })

    if (error) {
        console.error('upsertEvent failed:', error)
        return { success: false, error: 'فشل حفظ الحدث' }
    }

    revalidatePath('/[locale]/halls/[id]', 'page')
    return { success: true, event: data }
  } catch (e: any) {
    console.error('upsertEvent:', e)
    return { success: false, error: 'فشل حفظ الحدث' }
  }
}

export async function deleteEvent(id: string) {
    const session = await getSession()
    if (!session) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createServerSupabaseClient()
    const { error } = await (supabase as any).rpc('delete_event', { p_id: id })

    if (error) {
        return { success: false, error: 'Failed to delete event' }
    }

    revalidatePath('/[locale]/schedule', 'page')
    revalidatePath('/[locale]/halls/[id]', 'page')
    revalidatePath('/[locale]', 'page')
    return { success: true }
}

export async function updateEventTime(eventId: string, startTime: string, endTime: string) {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    try {
        const supabase = await createServerSupabaseClient()
        const { error, data } = await (supabase as any).rpc('update_event_time', {
            p_event_id: eventId,
            p_start_time: startTime,
            p_end_time: endTime,
        })

        if (error) {
            console.error('updateEventTime failed:', error)
            return { success: false, error: 'فشل تحديث الوقت' }
        }

        revalidatePath('/[locale]/attendance/[eventId]', 'page')
        revalidatePath('/[locale]/schedule', 'page')
        revalidatePath('/[locale]/halls/[id]', 'page')
        revalidatePath('/[locale]', 'page')
        return { success: true }
    } catch (e: any) {
        console.error('updateEventTime:', e)
        return { success: false, error: 'فشل تحديث الوقت' }
    }
}

export async function getEventRefData() {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    const supabase = await createServerSupabaseClient()

    const [
      { data: trainers, error: trainersError },
      { data: classes, error: classesError },
      { data: halls, error: hallsError }
    ] = await Promise.all([
      (supabase as any).from('trainers').select('id, name_en, name_ar, name_he, availability').order('name_ar').limit(100),
      (supabase as any).from('classes').select('id, name_en, name_ar, name_he, categories(name_he, name_ar, name_en)').order('name_ar').limit(100),
      (supabase as any).from('halls').select('id, name_en, name_ar, name_he').order('name_ar').limit(50),
    ])

    if (trainersError || classesError || hallsError) {
      return { success: false, error: 'Failed to fetch reference data' }
    }

    return { success: true, trainers, classes, halls }
}

export async function fetchTodaySchedules() {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized', schedules: [] }

    const supabase = await createServerSupabaseClient()
    const today = getNowInIsrael()
    const todayDow = today.getDay()
    const todayDate = getTodayISO()

    let { data, error } = await (supabase as any).rpc('ensure_events_for_schedules', {
        p_day_of_week: todayDow,
        p_date: todayDate,
    })

    // Race condition: concurrent calls may both try to insert the same event.
    // On duplicate key (23505), retry — the second call finds events already exist.
    if (error?.code === '23505') {
        const retry = await (supabase as any).rpc('ensure_events_for_schedules', {
            p_day_of_week: todayDow,
            p_date: todayDate,
        })
        data = retry.data
        error = retry.error
    }

    if (error) {
        console.error('fetchTodaySchedules failed:', JSON.stringify(error))
        return { success: false, error: 'حدث خطأ، حاول مرة أخرى', schedules: [] }
    }

    const schedules = (data || []).map((r: any) => ({
        event_id: r.r_event_id,
        schedule_id: r.r_schedule_id,
        class_id: r.r_class_id,
        hall_id: r.r_hall_id,
        trainer_id: r.r_trainer_id,
        start_time: r.r_start_time,
        end_time: r.r_end_time,
        title_ar: r.r_title_ar,
        title_he: r.r_title_he,
        title_en: r.r_title_en,
        hall_name_ar: r.r_hall_name_ar,
        hall_name_he: r.r_hall_name_he,
        hall_name_en: r.r_hall_name_en,
        trainer_name_ar: r.r_trainer_name_ar,
        trainer_name_he: r.r_trainer_name_he,
        trainer_name_en: r.r_trainer_name_en,
        category_name_ar: r.r_category_name_ar,
        category_name_he: r.r_category_name_he,
        category_name_en: r.r_category_name_en,
        type: r.r_event_type,
    }))

    return { success: true, schedules }
}

export async function getOrCreateEventForSchedule(scheduleId: string, date: string) {
    const session = await getSession()
    if (!session) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createServerSupabaseClient()

    const [{ data: schedule, error: schedError }, { data: existing }] = await Promise.all([
        (supabase as any)
            .from('class_schedules')
            .select('*, classes(id, name_he, name_ar, name_en, trainer_id), halls(id, name_he, name_ar, name_en)')
            .eq('id', scheduleId)
            .single(),
        (supabase as any)
            .from('events')
            .select('id')
            .eq('schedule_id', scheduleId)
            .eq('event_date', date)
            .limit(1),
    ])

    if (schedError || !schedule) {
        return { success: false, error: 'Schedule not found' }
    }

    if (existing && existing.length > 0) {
        return { success: true, eventId: existing[0].id }
    }

    const teamName = schedule.classes?.name_he || schedule.classes?.name_ar || 'تدريب'

    const { data: newEvent, error: createError } = await (supabase as any).rpc('upsert_event', {
        p_data: {
            hall_id: schedule.hall_id,
            trainer_id: schedule.classes?.trainer_id,
            type: 'training',
            title_he: teamName,
            title_ar: teamName,
            title_en: teamName,
            event_date: date,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            schedule_id: scheduleId,
            class_id: schedule.class_id,
        }
    })

    if (createError) {
        console.error('getOrCreateEventForSchedule failed:', createError)
        return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
    }

    revalidatePath('/[locale]/halls/[id]', 'page')
    return { success: true, eventId: newEvent?.id }
}
