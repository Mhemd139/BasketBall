'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { sign, verify } from '@/lib/session'
import { getTodayISO, getNowInIsrael } from '@/lib/utils'

type AttendanceStatus = 'present' | 'absent' | 'late'

// --- Authentication Actions ---

// Optional: Use Twilio client if keys are present
const getTwilioClient = () => {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (sid && token) {
    try {
      const twilio = require('twilio')
      return twilio(sid, token)
    } catch {
      return null
    }
  }
  return null
}

// Optional: Use Vonage client if keys are present
const getVonageClient = () => {
  const key = process.env.VONAGE_API_KEY
  const secret = process.env.VONAGE_API_SECRET
  if (key && secret) {
    try {
      const { Vonage } = require('@vonage/server-sdk')
      const { Auth } = require('@vonage/auth')
      
      const credentials = new Auth({ apiKey: key, apiSecret: secret })
      return new Vonage(credentials)
    } catch {
      return null
    }
  }
  return null
}

const crypto = require('crypto')

// --- Event Actions ---

export async function upsertEvent(eventData: any) {
  try {
    const session = await getSession()

    const supabase = await createServerSupabaseClient()

    // Basic validation
    if (!eventData.hall_id || !eventData.start_time || !eventData.end_time || !eventData.event_date) {
        return { success: false, error: 'Missing required fields' }
    }

    // Prevent creating events in the past
    const todayStr = getTodayISO()
    if (eventData.event_date < todayStr && !eventData.id) {
        return { success: false, error: 'Cannot add events to past dates' }
    }

    // trainer_id: prefer explicit value from event data, fallback to logged-in trainer
    // (session.id is always a trainer UUID in our auth system)
    const payload = {
        ...eventData,
        trainer_id: eventData.trainer_id || session?.id || null
    }

    const { data, error } = await (supabase as any).rpc('upsert_event', { p_data: payload })

    if (error) {
        return { success: false, error: error.message || 'فشل حفظ الحدث' }
    }

    revalidatePath('/[locale]/halls/[id]', 'page')
    return { success: true, event: data }
  } catch (e: any) {
    return { success: false, error: 'فشل حفظ الحدث' }
  }
}

export async function sendOTP(phone: string) {
  // 1. Try Twilio
  const twilio = getTwilioClient()
  const twilioService = process.env.TWILIO_VERIFY_SERVICE_SID
  if (twilio && twilioService) {
      // ... existing Twilio logic ...
      try {
        await twilio.verify.v2.services(twilioService)
          .verifications.create({ to: phone, channel: 'sms' })
        return { success: true }
      } catch (e: any) { return { success: false, error: e.message } }
  }

  // 2. Try Vonage Verify API (handles sender ID / routing automatically)
  const vonageKey = process.env.VONAGE_API_KEY
  const vonageSecret = process.env.VONAGE_API_SECRET
  if (vonageKey && vonageSecret) {
    try {
        const resp = await fetch('https://api.nexmo.com/verify/json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: vonageKey,
                api_secret: vonageSecret,
                number: phone,
                brand: 'Basketball',
                code_length: '4',
                pin_expiry: 300,
                workflow_id: 6,
            }),
        })
        const data = await resp.json()

        if (data.status === '0') {
            // Success — return request_id for verification step
            return { success: true, requestId: data.request_id }
        } else if (data.status === '10' && data.request_id) {
            // Concurrent request — cancel the old one and retry once
            await fetch('https://api.nexmo.com/verify/control/json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_key: vonageKey,
                    api_secret: vonageSecret,
                    request_id: data.request_id,
                    cmd: 'cancel',
                }),
            })
            // Retry
            const retry = await fetch('https://api.nexmo.com/verify/json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_key: vonageKey,
                    api_secret: vonageSecret,
                    number: phone,
                    brand: 'Basketball',
                    code_length: '4',
                    pin_expiry: 300,
                    workflow_id: 6,
                }),
            })
            const retryData = await retry.json()
            if (retryData.status === '0') {
                return { success: true, requestId: retryData.request_id }
            }
            return { success: false, error: retryData.error_text || 'SMS failed' }
        } else {
            return { success: false, error: data.error_text || 'SMS failed' }
        }
    } catch (e: any) {
        return { success: false, error: e.message || 'Vonage Failed' }
    }
  }

  // Fallback to Mock
  return { success: true } 
}

// verifyOTP accepts 'otpHash' (if using stateless SMS) OR 'requestId' (legacy/verify API) 
export async function verifyOTP(phone: string, otp: string, context?: string) {
  const supabase = await createServerSupabaseClient()
  const cleanPhone = phone.trim()
  
  // 1. Twilio Check
  const twilio = getTwilioClient()
  if (twilio && process.env.TWILIO_VERIFY_SERVICE_SID) {
      try {
        const check = await twilio.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
          .verificationChecks.create({ to: cleanPhone, code: otp })
        if (check.status !== 'approved') return { success: false, error: 'Invalid Code' }
      } catch (e: any) { return { success: false, error: e.message } }
  } else if (context && context.length > 10) {
      const vonageKey = process.env.VONAGE_API_KEY
      const vonageSecret = process.env.VONAGE_API_SECRET
      if (vonageKey && vonageSecret) {
          const resp = await fetch('https://api.nexmo.com/verify/check/json', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  api_key: vonageKey,
                  api_secret: vonageSecret,
                  request_id: context,
                  code: otp,
              }),
          })
          const data = await resp.json()
          if (data.status !== '0') {
              return { success: false, error: data.error_text || 'Invalid Code' }
          }
      }
  }
  
  // 3. Mock
  else {
    if (otp !== '1111' && otp !== '1234') return { success: false, error: 'Invalid OTP' }
  }

  // ... rest of logic (Create User, Session) ...
  // ...


  // 1. Try to find existing trainer
  let { data: trainer, error } = await (supabase as any)
    .from('trainers')
    .select('id, name_ar, name_en, role')
    .eq('phone', cleanPhone)
    .single()

  // --- RESTRICTED ACCESS LOGIC ---
  // Seed phone numbers — these auto-create as headcoach if not in DB yet
  const SEED_HEADCOACH_NUMBERS = ['972543299106', '972587131002']
  const isSeedHeadCoach = SEED_HEADCOACH_NUMBERS.includes(cleanPhone)

  if (!trainer) {
      if (isSeedHeadCoach) {
          // Auto-create seed head coach
          const { data: newTrainer, error: createError } = await (supabase as any).rpc('create_trainer', {
              p_phone: cleanPhone,
              p_name: '',
          })
          if (createError) {
              return { success: false, error: `Signup failed: ${createError.message}` }
          }
          // Set role to headcoach
          const created = Array.isArray(newTrainer) ? newTrainer[0] : newTrainer
          if (created?.id) {
              await (supabase as any).rpc('update_trainer_rpc', {
                  p_id: created.id,
                  p_data: { role: 'headcoach' }
              })
          }
          trainer = { ...created, role: 'headcoach' }
      } else {
          return { success: false, error: 'Access Denied: You must be added by the Head Coach.' }
      }
  }

  // Read role from DB (seed headcoaches also get their role from DB after first login)
  const role = trainer.role === 'headcoach' ? 'headcoach' : 'trainer'

  // 3. Create Session
  const cookieStore = await cookies()

  const sessionToken = await sign({
    id: trainer.id,
    name: trainer.name_ar || trainer.name_en || 'مدرب',
    role
  })

  cookieStore.set('admin_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  })

  // If trainer was pre-named by head coach, skip profile setup
  const hasName = !!(trainer.name_ar || trainer.name_en)
  return { success: true, isNew: !hasName }
}

// --- Head Coach Actions ---

export async function getTrainers() {
    const session = await getSession()
    if (!session || session.role !== 'headcoach') {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createServerSupabaseClient()
    const { data: trainers, error } = await (supabase as any)
        .from('trainers')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, trainers }
}

export async function upsertTrainer(phone: string, name: string, role: 'headcoach' | 'trainer' = 'trainer') {
    const session = await getSession()
    if (!session || session.role !== 'headcoach') {
        return { success: false, error: 'Unauthorized' }
    }

    // Basic validation
    let cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.startsWith('05')) {
        cleanPhone = '972' + cleanPhone.substring(1)
    }

    const supabase = await createServerSupabaseClient()

    // Check if exists
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
        if (error) return { success: false, error: error.message }
    } else {
        const { data: newTrainer, error: createError } = await (supabase as any).rpc('create_trainer', {
            p_phone: cleanPhone,
            p_name: name,
        })
        if (createError) return { success: false, error: createError.message }

        // Update role if needed (create_trainer defaults to 'trainer')
        const created = Array.isArray(newTrainer) ? newTrainer[0] : newTrainer
        if (created?.id && role !== 'trainer') {
            const { error: updateError } = await (supabase as any).rpc('update_trainer_rpc', {
                p_id: created.id,
                p_data: { role }
            })
            if (updateError) return { success: false, error: updateError.message }
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
    
    // Self-delete prevention
    if (id === session.id) {
         return { success: false, error: 'Cannot delete yourself' }
    }

    const supabase = await createServerSupabaseClient()
    const { error } = await (supabase as any).rpc('delete_trainer_rpc', { p_id: id })

    if (error) return { success: false, error: error.message }

    revalidatePath('/[locale]/head-coach', 'page')
    return { success: true }
}

export async function updateProfile(name: string, gender?: 'male' | 'female', availability?: string[]) {
  const session = await getSession()
  if (!session) return { success: false, error: 'Unauthorized' }

  const supabase = await createServerSupabaseClient()

  const { error } = await (supabase as any).rpc('update_trainer_rpc', {
      p_id: session.id,
      p_data: {
          name_en: name,
          name_ar: name,
          name_he: name,
          gender: gender,
          ...(availability ? { availability } : {})
      }
  })

  if (error) {
      return { success: false, error: error.message }
  }
  
  // Update session cookie with new name
  const cookieStore = await cookies()
  const sessionToken = await sign({
    ...session,
    name: name,
    gender: gender
  })

  cookieStore.set('admin_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  })

  revalidatePath('/', 'layout') // Clear everything
  revalidatePath('/[locale]/more', 'page')
  revalidatePath('/[locale]/trainers', 'page')

  return { success: true }
}

export async function deleteTrainee(traineeId: string) {
  const session = await getSession()
  if (!session) return { success: false, error: 'Unauthorized' }

  const supabase = await createServerSupabaseClient()
  const { error } = await (supabase as any).rpc('delete_trainee', { p_id: traineeId })

  if (error) return { success: false, error: error.message }

  revalidatePath('/[locale]/teams/[classId]', 'page')
  return { success: true }
}

// Payments
// Payments
export async function updateTraineePayment(traineeId: string, amount: number, comment: string) {
  const session = await getSession()
  if (!session) return { success: false, error: 'Unauthorized' }

  const supabase = await createServerSupabaseClient()
  
  // 1. Insert into Payment Logs
  const { error: logError } = await (supabase as any).rpc('insert_payment_log', {
      p_trainee_id: traineeId,
      p_amount: amount,
      p_note: comment,
      p_season: '2025-2026'
  })

  if (logError) {
     return { success: false, error: logError.message }
  }

  // 2. Update Trainee Total — fetch current, compute new, update via RPC
  const { data: trainee } = await (supabase as any)
    .from('trainees')
    .select('amount_paid')
    .eq('id', traineeId)
    .single()

  const newTotal = (trainee?.amount_paid || 0) + amount

  const { error: updateError } = await (supabase as any).rpc('update_trainee_payment_rpc', {
      p_trainee_id: traineeId,
      p_amount: newTotal,
      p_comment: comment
  })

  if (updateError) {
     return { success: false, error: updateError.message }
  }

  revalidatePath('/[locale]/payments', 'page')
  revalidatePath('/teams/[classId]', 'page') // Refresh list
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

  if (error) return { success: false, error: error.message }

  revalidatePath('/[locale]/teams', 'layout')
  return { success: true }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_session')
  return { success: true }
}

export async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')
  if (!session) return null
  return await verify(session.value)
}

// --- Attendance Actions ---

export async function saveAttendance(
  traineeId: string,
  eventId: string,
  status: AttendanceStatus
) {
  const supabase = await createServerSupabaseClient()

  const { error } = await (supabase as any).rpc('upsert_attendance', {
      p_trainee_id: traineeId,
      p_event_id: eventId,
      p_status: status
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function bulkSaveAttendance(
  records: { trainee_id: string; event_id: string; status: AttendanceStatus }[]
) {
  const supabase = await createServerSupabaseClient()

  const { error } = await (supabase as any).rpc('bulk_upsert_attendance', {
      p_records: records
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

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
  
  // Verify session (optional but recommended)
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
    return { success: false, error: error.message }
  }

  return { success: true, trainee: data }
}


export async function getTraineeAttendanceStats(traineeId: string) {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await (supabase as any)
    .from('attendance')
    .select('status')
    .eq('trainee_id', traineeId)
  
  if (error) return { success: false, error: error.message }
  
  const total = data.length
  const present = data.filter((r: any) => r.status === 'present').length
  const late = data.filter((r: any) => r.status === 'late').length
  const absent = data.filter((r: any) => r.status === 'absent').length
  
  return { success: true, stats: { total, present, late, absent } }
}

// --- Attendance Actions ---

export async function getTeamAttendanceHistory(classId: string) {
    const supabase = await createServerSupabaseClient()
    const session = await getSession()
    
    // 1. Get Class Details
    const { data: team } = await (supabase as any)
        .from('classes')
        .select('trainer_id')
        .eq('id', classId)
        .single()

    if (!team) return { success: false, error: 'Team not found' }

    // 2. Get Date Range (Last 30 Days)
    const endDate = getNowInIsrael()
    const startDate = getNowInIsrael()
    startDate.setDate(startDate.getDate() - 30)

    // 3. Get Trainees for this Class FIRST
    const { data: trainees } = await (supabase as any)
        .from('trainees')
        .select('id, name_ar, name_en')
        .eq('class_id', classId)
        .order('name_ar')

    if (!trainees || trainees.length === 0) return { success: true, data: { trainees: [], events: [], attendanceMap: {} } }

    const traineeIds = trainees.map((t: any) => t.id)

    // 4. Get Events for Trainer in range (Candidates)
    const { data: candidateEvents } = await (supabase as any)
        .from('events')
        .select('id, event_date, type, title_ar, title_en, title_he, start_time')
        .eq('trainer_id', team.trainer_id) 
        .gte('event_date', startDate.toISOString())
        .lte('event_date', endDate.toISOString())
        .order('event_date', { ascending: false })
        .order('start_time', { ascending: false })

    if (!candidateEvents || candidateEvents.length === 0) return { success: true, data: { trainees, events: [], attendanceMap: {} } }
    
    const candidateEventIds = candidateEvents.map((e: any) => e.id)

    // 5. Get Attendance for these events AND these trainees
    const { data: attendance } = await (supabase as any)
        .from('attendance')
        .select('*')
        .in('event_id', candidateEventIds)
        .in('trainee_id', traineeIds)

    // 6. Filter Events: Only keep events that have at least one record (present/absent/late) for this class
    // OR if we want to be generous, maybe events that match the class Hall? 
    // For now, "history" implies things that happened and were tracked.
    const relevantEventIds = new Set(attendance?.map((a: any) => a.event_id))
    const relevantEvents = candidateEvents.filter((e: any) => relevantEventIds.has(e.id))

    // 7. Map Attendance
    const attendanceMap: Record<string, string> = {}
    attendance?.forEach((record: any) => {
        attendanceMap[`${record.event_id}_${record.trainee_id}`] = record.status
    })

    return {
        success: true,
        data: {
            trainees,
            events: relevantEvents,
            attendanceMap
        }
    }
}

// --- Attendance Actions ---

export async function getEventAttendance(eventId: string, classId?: string | null) {
  const supabase = await createServerSupabaseClient()

  // 1. Get trainees — only the class roster when classId is provided
  let query = (supabase as any).from('trainees').select('id, name_ar, name_he, name_en, phone, jersey_number, class_id, gender')

  if (classId) {
    query = query.eq('class_id', classId)
  }

  const { data: trainees, error: traineesError } = await query
    .order('name_ar', { ascending: true })
    .limit(200)

  if (traineesError) {
    return { success: false, error: traineesError.message }
  }

  // 2. Get existing attendance for this event
  const { data: attendance, error: attendanceError } = await (supabase as any)
    .from('attendance')
    .select('id, trainee_id, event_id, status, marked_by, created_at')
    .eq('event_id', eventId)

  if (attendanceError) {
    return { success: false, error: attendanceError.message }
  }

  return { success: true, trainees, attendance }
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
    return { success: false, error: error.message }
  }

  revalidatePath('/[locale]/halls/[id]', 'page')
  return { success: true }
}

export async function getEventRefData() {
    const supabase = await createServerSupabaseClient()
    
    // Fetch Trainers
    const { data: trainers, error: trainersError } = await (supabase as any)
      .from('trainers')
      .select('id, name_en, name_ar, name_he')
      .order('name_ar')
  
    // Fetch Classes (Teams)
    const { data: classes, error: classesError } = await (supabase as any)
      .from('classes')
      .select('id, name_en, name_ar, name_he')
      .order('name_ar')

    // Fetch Halls
    const { data: halls, error: hallsError } = await (supabase as any)
      .from('halls')
      .select('id, name_en, name_ar, name_he')
      .order('name_ar')
  
    if (trainersError || classesError || hallsError) {
      return { success: false, error: 'Failed to fetch reference data' }
    }
  
    return { success: true, trainers, classes, halls }
}

export async function fetchHallEvents(hallId: string, startDate: string, endDate: string) {
    const supabase = await createServerSupabaseClient()
    
    const { data: events, error } = await (supabase as any)
        .from('events')
        .select('*, trainers(name_he, name_ar, name_en)')
        .eq('hall_id', hallId)
        .gte('event_date', startDate)
        .lte('event_date', endDate)
        .order('event_date', { ascending: true })
        .order('start_time', { ascending: true })

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true, events }
}

export async function fetchHallSchedules(hallId: string) {
    const supabase = await createServerSupabaseClient()

    const { data: schedules, error } = await (supabase as any)
        .from('class_schedules')
        .select('*, classes(id, name_he, name_ar, name_en, trainer_id, trainers(name_he, name_ar, name_en))')
        .eq('hall_id', hallId)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true })

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true, schedules }
}

export async function fetchTodaySchedules() {
    const supabase = await createServerSupabaseClient()
    const today = getNowInIsrael()
    const todayDow = today.getDay() // 0=Sunday, 6=Saturday
    const todayDate = getTodayISO()

    const { data, error } = await (supabase as any).rpc('ensure_events_for_schedules', {
        p_day_of_week: todayDow,
        p_date: todayDate,
    })

    if (error) {
        return { success: false, error: error.message, schedules: [] }
    }

    // Map RPC result to a uniform shape for the UI
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

    // 1. Get the schedule with class and hall info
    const { data: schedule, error: schedError } = await (supabase as any)
        .from('class_schedules')
        .select('*, classes(id, name_he, name_ar, name_en, trainer_id), halls(id, name_he, name_ar, name_en)')
        .eq('id', scheduleId)
        .single()

    if (schedError || !schedule) {
        return { success: false, error: 'Schedule not found' }
    }

    // 2. Check if event already exists for this schedule+date (matches unique index)
    const { data: existing } = await (supabase as any)
        .from('events')
        .select('id')
        .eq('schedule_id', scheduleId)
        .eq('event_date', date)
        .limit(1)

    if (existing && existing.length > 0) {
        return { success: true, eventId: existing[0].id }
    }

    // 3. Create a new event from the schedule
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
        return { success: false, error: createError.message }
    }

    revalidatePath('/[locale]/halls/[id]', 'page')
    return { success: true, eventId: newEvent?.id }
}

export async function searchTrainees(query: string) {
    const supabase = await createServerSupabaseClient()
    
    const { data: trainees, error } = await (supabase as any)
        .from('trainees')
        .select('*, classes(name_en, name_ar, name_he)')
        .or(`name_en.ilike.%${query}%,name_ar.ilike.%${query}%,name_he.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(10)

    if (error) return { success: false, error: error.message }
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

    if (error) return { success: false, error: error.message }

    revalidatePath('/[locale]/teams/[classId]', 'page')
    return { success: true }
}

export async function updateTrainee(traineeId: string, updateData: any) {
    const session = await getSession()
    if (!session) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createServerSupabaseClient()
    const { error } = await (supabase as any).rpc('update_trainee_rpc', {
        p_id: traineeId,
        p_data: updateData
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/[locale]/teams/[classId]', 'page')
    return { success: true }
}

export async function getTrainerProfile(trainerId: string) {
    const supabase = await createServerSupabaseClient()

    const [{ data: trainer, error: trainerError }, { data: teams, error: teamsError }] = await Promise.all([
        (supabase as any).from('trainers').select('*').eq('id', trainerId).single(),
        (supabase as any).from('classes')
            .select('*, categories(name_he, name_ar, name_en), class_schedules(id, day_of_week, start_time, end_time, notes, halls(id, name_he, name_ar, name_en))')
            .eq('trainer_id', trainerId),
    ])

    if (trainerError) return { success: false, error: trainerError.message }
    if (teamsError) return { success: false, error: teamsError.message }

    return { success: true, trainer, teams }
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

    if (error) return { success: false, error: error.message }

    revalidatePath('/[locale]/teams/[classId]', 'page')
    return { success: true }
}
export async function quickRegisterAndAssign(traineeData: any, classId: string) {
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
        return { success: false, error: traineeError.message }
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

    if (error) return { success: false, error: error.message }

    revalidatePath('/[locale]/halls/[id]', 'page')
    return { success: true }
}

export async function createTeam(teamData: { 
    name_ar: string, 
    name_he: string, 
    name_en: string, 
    trainer_id: string | null, 
    hall_id: string | null 
}) {
    const session = await getSession()
    if (!session) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createServerSupabaseClient()
    const { data, error } = await (supabase as any).rpc('insert_class', { p_data: teamData })

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/[locale]/teams', 'page')
    return { success: true, team: data }
}

export async function updateTeam(id: string, teamData: any) {
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
        return { success: false, error: error.message }
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
        return { success: false, error: error.message }
    }

    revalidatePath('/[locale]/teams', 'page')
    return { success: true }
}

// --- Event Management ---
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
    return { success: true }
}

export async function updateEventTime(eventId: string, startTime: string, endTime: string) {
    try {
        const supabase = await createServerSupabaseClient()
        const { error, data } = await (supabase as any).rpc('update_event_time', {
            p_event_id: eventId,
            p_start_time: startTime,
            p_end_time: endTime,
        })

        if (error) {
            return { success: false, error: error.message || 'فشل تحديث الوقت' }
        }

        revalidatePath('/[locale]/attendance/[eventId]', 'page')
        revalidatePath('/[locale]/schedule', 'page')
        revalidatePath('/[locale]/halls/[id]', 'page')
        return { success: true }
    } catch (e: any) {
        return { success: false, error: 'فشل تحديث الوقت' }
    }
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
        return { success: false, error: error.message }
    }

    revalidatePath('/[locale]/halls/[id]', 'page')
    revalidatePath('/[locale]/halls', 'page')
    return { success: true, hall: data }
}

export async function updateClassSchedule(scheduleId: string, hallId: string, startTime: string, endTime: string) {
    try {
        const supabase = await createServerSupabaseClient()
        const { error, data } = await (supabase as any).rpc('update_class_schedule', {
            p_schedule_id: scheduleId,
            p_hall_id: hallId,
            p_start_time: startTime,
            p_end_time: endTime,
        })

        if (error) {
            return { success: false, error: error.message || 'فشل تحديث الجدول' }
        }

        revalidatePath('/[locale]/teams/[classId]', 'page')
        revalidatePath('/[locale]/schedule', 'page')
        revalidatePath('/[locale]/halls/[id]', 'page')
        return { success: true }
    } catch (e: any) {
        return { success: false, error: 'فشل تحديث الجدول' }
    }
}

export async function updateTrainerDetails(id: string, data: any) {
    const session = await getSession()
    if (!session) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createServerSupabaseClient()
    const { error } = await (supabase as any).rpc('update_trainer_rpc', {
        p_id: id,
        p_data: data
    })

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/', 'layout')
    revalidatePath('/[locale]/trainers', 'page')
    return { success: true }
}

export async function deleteAccount() {
    const session = await getSession()
    if (!session) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createServerSupabaseClient()
    const { error } = await (supabase as any).rpc('delete_trainer_rpc', { p_id: session.id })

    if (error) {
        return { success: false, error: error.message }
    }

    await logout()
    return { success: true }
}

// --- Profile Actions ---
export async function getTrainerProfileServer() {
    const session = await getSession()
    if (!session) return null

    const supabase = await createServerSupabaseClient()
    const { data: trainer } = await (supabase as any)
        .from('trainers')
        .select('*')
        .eq('id', session.id)
        .single()
        
    return trainer
}

// --- Import/Export Actions ---

export async function getImportRefData() {
  const session = await getSession()
  if (!session || session.role !== 'headcoach') {
    return { trainers: [], halls: [], classes: [] }
  }

  const supabase = await createServerSupabaseClient()

  const [trainersRes, hallsRes, classesRes] = await Promise.all([
    (supabase as any).from('trainers').select('id, name_ar, name_he, name_en, phone').limit(200),
    (supabase as any).from('halls').select('id, name_ar, name_he, name_en').limit(100),
    (supabase as any).from('classes').select('id, name_ar, name_he, name_en').limit(200),
  ])

  return {
    trainers: trainersRes.data || [],
    halls: hallsRes.data || [],
    classes: classesRes.data || [],
  }
}

export async function createTrainersForImport(
  trainers: { name: string; phone: string }[]
): Promise<{ success: boolean; nameToId: Record<string, string>; errors: string[] }> {
  const session = await getSession()
  if (!session || session.role !== 'headcoach') {
    return { success: false, nameToId: {}, errors: ['Unauthorized'] }
  }

  const supabase = await createServerSupabaseClient()
  const nameToId: Record<string, string> = {}
  const errors: string[] = []

  for (const trainer of trainers) {
    const cleanPhone = trainer.phone.replace(/\D/g, '')
    const { data, error } = await (supabase as any).rpc('create_trainer', {
      p_phone: cleanPhone.startsWith('0') ? cleanPhone : `0${cleanPhone}`,
      p_name: trainer.name,
    })

    if (error) {
      errors.push(`${trainer.name}: ${error.message}`)
    } else {
      const created = Array.isArray(data) ? data[0] : data
      if (created?.id) {
        nameToId[trainer.name] = created.id
      }
    }
  }

  return { success: errors.length === 0, nameToId, errors }
}

export async function bulkImportRecords(
  table: 'classes' | 'trainers' | 'trainees' | 'halls',
  records: Record<string, unknown>[]
) {
  const session = await getSession()
  if (!session || session.role !== 'headcoach') {
    return { success: false, error: 'Unauthorized', results: null }
  }

  const supabase = await createServerSupabaseClient()
  const results = { inserted: 0, skipped: 0, errors: [] as { row: number; error: string }[] }

  for (let i = 0; i < records.length; i++) {
    try {
      const record = records[i]
      let rpcError: any = null

      switch (table) {
        case 'trainees': {
          const { error } = await (supabase as any).rpc('insert_trainee', {
            p_data: {
              name_ar: record.name_ar || '',
              name_he: record.name_he || '',
              name_en: record.name_en || '',
              phone: record.phone || null,
              jersey_number: record.jersey_number || null,
              class_id: record.class_id || null,
              is_paid: record.is_paid || false,
              gender: record.gender || 'male',
              amount_paid: record.amount_paid || 0,
            },
          })
          rpcError = error
          break
        }
        case 'trainers': {
          const { error } = await (supabase as any).rpc('create_trainer', {
            p_phone: String(record.phone || '0500000000'),
            p_name: String(record.name_ar || ''),
          })
          rpcError = error
          break
        }
        case 'classes': {
          const { error } = await (supabase as any).rpc('insert_class', {
            p_data: {
              name_ar: record.name_ar || '',
              name_he: record.name_he || '',
              name_en: record.name_en || '',
              trainer_id: record.trainer_id || null,
              hall_id: record.hall_id || null,
              schedule_info: record.schedule_info || null,
            },
          })
          rpcError = error
          break
        }
        case 'halls': {
          const { error } = await (supabase as any).rpc('insert_hall', {
            p_data: {
              name_ar: record.name_ar || '',
              name_he: record.name_he || '',
              name_en: record.name_en || '',
            },
          })
          rpcError = error
          break
        }
      }

      if (rpcError) {
        results.errors.push({ row: i, error: rpcError.message })
      } else {
        results.inserted++
      }
    } catch (e: any) {
      results.errors.push({ row: i, error: e.message })
    }
  }

  // Revalidate relevant paths
  revalidatePath('/[locale]/teams', 'page')
  revalidatePath('/[locale]/trainers', 'page')
  revalidatePath('/[locale]/halls', 'page')
  revalidatePath('/[locale]/head-coach', 'page')

  return { success: true, results }
}

export async function exportTableData(
  table: 'classes' | 'trainers' | 'trainees' | 'halls',
  filters?: Record<string, string>
) {
  const session = await getSession()
  if (!session || session.role !== 'headcoach') {
    return { success: false, error: 'Unauthorized', data: null }
  }

  const supabase = await createServerSupabaseClient()
  let query = (supabase as any).from(table).select('*').limit(500)

  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value)
    }
  }

  const { data, error } = await query
  if (error) return { success: false, error: error.message, data: null }
  return { success: true, data }
}
