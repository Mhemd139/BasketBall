'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { sign, verify } from '@/lib/session'

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
  const session = await getSession()
  if (!session) {
      return { success: false, error: 'Unauthorized' }
  }

  const supabase = await createServerSupabaseClient()
  
  // Basic validation (can be expanded)
  if (!eventData.hall_id || !eventData.start_time || !eventData.end_time || !eventData.event_date) {
      return { success: false, error: 'Missing required fields' }
  }

  // Prevent creating events in the past
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const eventDate = new Date(eventData.event_date)
  if (eventDate < today && !eventData.id) {
      return { success: false, error: 'Cannot add events to past dates' }
  }

  // Inject trainer_id if creating or updating
  const payload = {
      ...eventData,
      trainer_id: eventData.trainer_id || session.id
  }

  const { data, error } = await (supabase as any).rpc('upsert_event', { p_data: payload })

  if (error) {
      return { success: false, error: error.message }
  }

  revalidatePath('/[locale]/halls/[id]', 'page')
  return { success: true, event: data }
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
  }
  
  // 2. Vonage Verify Check (Context is request_id)
  else if (context && context.length > 10) {
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
    const endDate = new Date()
    const startDate = new Date()
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
  
  // 1. Get trainees
  // If classId is provided, we fetch the roster + some others
  // If not, we fetch all (limited for performance)
  let query = (supabase as any).from('trainees').select('*')
  
  if (classId) {
    // Prioritize roster, then others
    query = query.order('class_id', { ascending: false }) // This is a bit weak for priority, but we'll filter in UI anyway
  }
  
  const { data: trainees, error: traineesError } = await query
    .order('name_ar', { ascending: true })
    .limit(classId ? 200 : 100) // Safety limit

  if (traineesError) {
    return { success: false, error: traineesError.message }
  }

  // 2. Get existing attendance for this event
  const { data: attendance, error: attendanceError } = await (supabase as any)
    .from('attendance')
    .select('*')
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
        .select('*')
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
    
    const { data: trainer, error: trainerError } = await (supabase as any)
        .from('trainers')
        .select('*')
        .eq('id', trainerId)
        .single()

    if (trainerError) return { success: false, error: trainerError.message }

    const { data: teams, error: teamsError } = await (supabase as any)
        .from('classes')
        .select('*, halls(name_en, name_ar, name_he)')
        .eq('trainer_id', trainerId)

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
