'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getNowInIsrael } from '@/lib/utils'
import { getSession } from './auth'

type AttendanceStatus = 'present' | 'absent' | 'late'

export async function saveAttendance(traineeId: string, eventId: string, status: AttendanceStatus, absenceReason?: string) {
  const session = await getSession()
  if (!session) return { success: false, error: 'Unauthorized' }

  const supabase = await createServerSupabaseClient()

  const { error } = await (supabase as any).rpc('upsert_attendance', {
      p_trainee_id: traineeId,
      p_event_id: eventId,
      p_status: status,
      p_absence_reason: (status === 'absent' || status === 'late') ? (absenceReason ?? null) : null
  })

  if (error) {
    console.error('saveAttendance failed:', error)
    return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
  }

  return { success: true }
}

export async function bulkSaveAttendance(
  records: { trainee_id: string; event_id: string; status: AttendanceStatus }[]
) {
  const session = await getSession()
  if (!session) return { success: false, error: 'Unauthorized' }

  const supabase = await createServerSupabaseClient()

  const { error } = await (supabase as any).rpc('bulk_upsert_attendance', {
      p_records: records
  })

  if (error) {
    console.error('bulkSaveAttendance failed:', error)
    return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
  }

  return { success: true }
}

export async function updateAttendance(eventId: string, traineeId: string, status: AttendanceStatus) {
  const session = await getSession()
  if (!session) return { success: false, error: 'Unauthorized' }

  const supabase = await createServerSupabaseClient()

  const { error } = await (supabase as any).rpc('upsert_attendance', {
      p_trainee_id: traineeId,
      p_event_id: eventId,
      p_status: status,
      p_marked_by: session.id
  })

  if (error) {
    console.error('updateAttendance failed:', error)
    return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
  }

  revalidatePath('/[locale]/halls/[id]', 'page')
  return { success: true }
}

export async function getEventAttendance(eventId: string, classId?: string | null) {
  const session = await getSession()
  if (!session) return { success: false, error: 'Unauthorized' }

  const supabase = await createServerSupabaseClient()

  let traineeQuery = (supabase as any).from('trainees').select('id, name_ar, name_he, name_en, phone, jersey_number, class_id, gender')
  if (classId) {
    traineeQuery = traineeQuery.eq('class_id', classId)
  }

  const [
    { data: trainees, error: traineesError },
    { data: attendance, error: attendanceError }
  ] = await Promise.all([
    traineeQuery.order('name_ar', { ascending: true }).limit(200),
    (supabase as any).from('attendance').select('id, trainee_id, event_id, status, marked_by, created_at, absence_reason').eq('event_id', eventId).limit(1000),
  ])

  if (traineesError) {
    console.error('getEventAttendance trainees failed:', traineesError)
    return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
  }
  if (attendanceError) {
    console.error('getEventAttendance attendance failed:', attendanceError)
    return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
  }

  return { success: true, trainees, attendance }
}

export async function getTraineeAttendanceStats(traineeId: string) {
  const session = await getSession()
  if (!session) return { success: false, error: 'Unauthorized' }

  const supabase = await createServerSupabaseClient()

  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data, error } = await (supabase as any)
    .from('attendance')
    .select('status')
    .eq('trainee_id', traineeId)
    .gte('created_at', sixMonthsAgo)
    .limit(2000)

  if (error) {
    console.error('getTraineeAttendanceStats failed:', error)
    return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
  }

  const total = data.length
  const present = data.filter((r: any) => r.status === 'present').length
  const late = data.filter((r: any) => r.status === 'late').length
  const absent = data.filter((r: any) => r.status === 'absent').length

  return { success: true, stats: { total, present, late, absent } }
}

export async function getClassAttendanceStats(classId: string) {
  const session = await getSession()
  if (!session) return {}

  const supabase = await createServerSupabaseClient()

  const { data: trainees } = await (supabase as any)
    .from('trainees')
    .select('id')
    .eq('class_id', classId)

  if (!trainees || trainees.length === 0) return {}

  const traineeIds = trainees.map((t: any) => t.id)

  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data, error } = await (supabase as any)
    .from('attendance')
    .select('trainee_id, status')
    .in('trainee_id', traineeIds)
    .gte('created_at', sixMonthsAgo)
    .limit(5000)

  if (error || !data) return {}

  const statsMap: Record<string, { total: number; present: number; late: number; absent: number }> = {}
  for (const row of data) {
    if (!statsMap[row.trainee_id]) statsMap[row.trainee_id] = { total: 0, present: 0, late: 0, absent: 0 }
    statsMap[row.trainee_id].total++
    if (row.status === 'present') statsMap[row.trainee_id].present++
    else if (row.status === 'late') statsMap[row.trainee_id].late++
    else if (row.status === 'absent') statsMap[row.trainee_id].absent++
  }
  return statsMap
}

export async function getTeamAttendanceHistory(classId: string, eventType?: 'basketball' | 'gym') {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    const supabase = await createServerSupabaseClient()

    const endDate = getNowInIsrael()
    const startDate = getNowInIsrael()
    startDate.setDate(startDate.getDate() - 30)

    const [{ data: team }, { data: trainees }] = await Promise.all([
        (supabase as any)
            .from('classes')
            .select('trainer_id, gym_trainer_id')
            .eq('id', classId)
            .single(),
        (supabase as any)
            .from('trainees')
            .select('id, name_ar, name_en')
            .eq('class_id', classId)
            .order('name_ar'),
    ])

    if (!team) return { success: false, error: 'Team not found' }

    const targetTrainerId = eventType === 'gym' ? team.gym_trainer_id : team.trainer_id
    if (!targetTrainerId) return { success: true, data: { trainees: trainees || [], events: [], attendanceMap: {}, reasonMap: {} } }

    let eventsQuery = (supabase as any)
        .from('events')
        .select('id, event_date, type, title_ar, title_en, title_he, start_time')
        .eq('trainer_id', targetTrainerId)
        .gte('event_date', startDate.toISOString())
        .lte('event_date', endDate.toISOString())
        .order('event_date', { ascending: false })
        .order('start_time', { ascending: false })
        .limit(60)

    if (eventType === 'gym') {
        eventsQuery = eventsQuery.eq('type', 'gym')
    } else if (eventType === 'basketball') {
        eventsQuery = eventsQuery.in('type', ['training', 'game'])
    }

    const { data: candidateEvents } = await eventsQuery

    if (!trainees || trainees.length === 0) return { success: true, data: { trainees: [], events: [], attendanceMap: {}, reasonMap: {} } }

    const traineeIds = trainees.map((t: any) => t.id)

    if (!candidateEvents || candidateEvents.length === 0) return { success: true, data: { trainees, events: [], attendanceMap: {}, reasonMap: {} } }

    const candidateEventIds = candidateEvents.map((e: any) => e.id)

    const { data: attendance } = await (supabase as any)
        .from('attendance')
        .select('event_id, trainee_id, status, absence_reason')
        .in('event_id', candidateEventIds)
        .in('trainee_id', traineeIds)
        .limit(5000)

    const relevantEventIds = new Set(attendance?.map((a: any) => a.event_id))
    const relevantEvents = candidateEvents.filter((e: any) => relevantEventIds.has(e.id))

    const attendanceMap: Record<string, string> = {}
    const reasonMap: Record<string, string> = {}
    attendance?.forEach((record: any) => {
        const key = `${record.event_id}_${record.trainee_id}`
        attendanceMap[key] = record.status
        if (record.absence_reason) reasonMap[key] = record.absence_reason
    })

    return {
        success: true,
        data: {
            trainees,
            events: relevantEvents,
            attendanceMap,
            reasonMap
        }
    }
}
