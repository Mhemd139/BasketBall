'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

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
    } catch (error) {
      console.error('Twilio package issue:', error)
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
    } catch (error) {
      console.error('Vonage package issue:', error)
      return null
    }
  }
  return null
}

const crypto = require('crypto')

// --- Event Actions ---

export async function upsertEvent(eventData: any) {
  const session = await getSession()
  if (!session || (session.role !== 'coach' && session.role !== 'admin' && session.role !== 'trainer')) {
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
      trainer_id: eventData.trainer_id || session.id // Use provided trainer or fallback to session
  }

  const { data, error } = await (supabase as any)
    .from('events')
    .upsert(payload)
    .select()
    .single()

  if (error) {
      console.error('Upsert Event Error:', error)
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
            }),
        })
        const data = await resp.json()

        if (data.status === '0') {
            // Success — return request_id for verification step
            return { success: true, requestId: data.request_id }
        } else {
            console.error('Vonage Verify Error:', data.error_text)
            return { success: false, error: data.error_text || 'SMS failed' }
        }
    } catch (e: any) {
        console.error('Vonage Verify Error:', e)
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
    .select('id, name_en')
    .eq('phone', cleanPhone)
    .single()

  // 2. If not found, create new one (Sign Up) via SECURITY DEFINER function
  let wasCreated = false
  if (!trainer) {
    const { data: newTrainer, error: createError } = await (supabase as any).rpc('create_trainer', {
      p_phone: cleanPhone,
    })

    if (createError) {
      console.error('Signup Error:', createError)
      return { success: false, error: `Signup failed: ${createError.message}` }
    }
    trainer = newTrainer
    wasCreated = true
  }

  // 3. Create Session
  const cookieStore = await cookies()
  cookieStore.set('admin_session', JSON.stringify({
    id: trainer.id,
    name: trainer.name_en || 'Trainer',
    role: 'trainer'
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  })

  // Return specific status so UI knows if we need to ask for name
  return { success: true, isNew: wasCreated }
}

export async function updateProfile(name: string) {
  const session = await getSession()
  if (!session) return { success: false, error: 'Unauthorized' }

  const supabase = await createServerSupabaseClient()

  // Use SECURITY DEFINER function to bypass RLS
  const { data, error } = await (supabase as any).rpc('update_trainer_profile', {
    trainer_id: session.id,
    new_name_en: name,
    new_name_ar: name,
    new_name_he: name,
  })

  if (error) return { success: false, error: error.message }
  if (data?.error) return { success: false, error: data.error }
  
  // Update session cookie with new name
  const cookieStore = await cookies()
  cookieStore.set('admin_session', JSON.stringify({
    ...session,
    name: name
  }), {
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
  const { error } = await (supabase as any)
    .from('trainees')
    .delete()
    .eq('id', traineeId)
  
  if (error) return { success: false, error: error.message }
  
  revalidatePath('/teams/[classId]')
  return { success: true }
}

// Payments
// Payments
export async function updateTraineePayment(traineeId: string, amount: number, comment: string) {
  const session = await getSession()
  if (!session) return { success: false, error: 'Unauthorized' }

  const supabase = await createServerSupabaseClient()
  
  // 1. Insert into Payment Logs
  const { error: logError } = await (supabase as any)
    .from('payment_logs')
    .insert({
        trainee_id: traineeId,
        amount: amount,
        note: comment,
        season: '2025-2026' // Default for now
    })

  if (logError) {
     console.error('Log Payment Error:', logError)
     return { success: false, error: logError.message }
  }

  // 2. Update Trainee Total (Atomic Increment) - "Materialized View" pattern
  // We first fetch current total to allow incrementing (Supabase doesn't have simple 'inc' via JS client easily without RPC)
  // Better approach: Create an RPC, but for now we'll do read-modify-write which is okay for low volume
  
  const { data: trainee } = await (supabase as any)
    .from('trainees')
    .select('amount_paid')
    .eq('id', traineeId)
    .single()
    
  const newTotal = (trainee?.amount_paid || 0) + amount

  const { error: updateError } = await (supabase as any)
    .from('trainees')
    .update({
      amount_paid: newTotal,
      is_paid: newTotal >= 3000,
      payment_date: new Date().toISOString() // Last payment date
    })
    .eq('id', traineeId)

  if (updateError) {
     console.error('Update Payment Error:', updateError)
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
  const { error } = await (supabase as any)
    .from('trainees')
    .update({ is_paid: isPaid })
    .eq('id', traineeId)

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
  try {
    return JSON.parse(session.value)
  } catch {
    return null
  }
}

// --- Attendance Actions ---

export async function saveAttendance(
  traineeId: string, 
  eventId: string, 
  status: AttendanceStatus
) {
  const supabase = await createServerSupabaseClient()
  
  const { error } = await (supabase as any)
    .from('attendance')
    .upsert(
      { trainee_id: traineeId, event_id: eventId, status },
      { onConflict: 'trainee_id,event_id' }
    )

  if (error) {
    console.error('Error saving attendance:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function bulkSaveAttendance(
  records: { trainee_id: string; event_id: string; status: AttendanceStatus }[]
) {
  const supabase = await createServerSupabaseClient()

  const { error } = await (supabase as any)
    .from('attendance')
    .upsert(records, { onConflict: 'trainee_id,event_id' })

  if (error) {
    console.error('Error bulk saving attendance:', error)
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

  const { data, error } = await (supabase as any)
    .from('trainees')
    .insert([
      { 
        class_id: classId,
        name_en: name, // Defaulting everything to name for now
        name_ar: name,
        name_he: name,
        phone: phone || null,
        jersey_number: jerseyNumber,
        is_paid: false,
        gender: gender || 'male'
      }
    ])
    .select()

  if (error) {
    console.error('Error adding trainee:', error)
    return { success: false, error: error.message }
  }

  return { success: true, trainee: data[0] }
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
    .order('name_en', { ascending: true })
    .limit(classId ? 200 : 100) // Safety limit

  if (traineesError) {
    console.error('Error fetching trainees:', traineesError)
    return { success: false, error: traineesError.message }
  }

  // 2. Get existing attendance for this event
  const { data: attendance, error: attendanceError } = await (supabase as any)
    .from('attendance')
    .select('*')
    .eq('event_id', eventId)

  if (attendanceError) {
    console.error('Error fetching attendance:', attendanceError)
    return { success: false, error: attendanceError.message }
  }

  return { success: true, trainees, attendance }
}

export async function updateAttendance(eventId: string, traineeId: string, status: AttendanceStatus) {
  const session = await getSession()
  if (!session) return { success: false, error: 'Unauthorized' }

  const supabase = await createServerSupabaseClient()

  // Upsert attendance record
  const { data, error } = await (supabase as any)
    .from('attendance')
    .upsert({
      event_id: eventId,
      trainee_id: traineeId,
      status: status,
      marked_by: session.id,
      marked_at: new Date().toISOString()
    }, { onConflict: 'event_id, trainee_id' })
    .select()
    .single()

  if (error) {
    console.error('Error updating attendance:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/[locale]/halls/[id]', 'page')
  return { success: true, data }
}

export async function getEventRefData() {
    const supabase = await createServerSupabaseClient()
    
    // Fetch Trainers
    const { data: trainers, error: trainersError } = await (supabase as any)
      .from('trainers')
      .select('id, name_en, name_ar, name_he')
      .order('name_en')
  
    // Fetch Classes (Teams)
    const { data: classes, error: classesError } = await (supabase as any)
      .from('classes')
      .select('id, name_en, name_ar, name_he')
      .order('name_en')

    // Fetch Halls
    const { data: halls, error: hallsError } = await (supabase as any)
      .from('halls')
      .select('id, name_en, name_ar, name_he')
      .order('name_en')
  
    if (trainersError || classesError || hallsError) {
      console.error('Error fetching ref data:', trainersError || classesError || hallsError)
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
        console.error('Error fetching hall events:', error)
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
    if (!session || (session.role !== 'admin' && session.role !== 'coach')) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createServerSupabaseClient()
    const { error } = await (supabase as any)
        .from('trainees')
        .update({ class_id: classId })
        .eq('id', traineeId)

    if (error) return { success: false, error: error.message }
    
    revalidatePath('/[locale]/teams/[classId]', 'page')
    return { success: true }
}

export async function updateTrainee(traineeId: string, updateData: any) {
    const session = await getSession()
    if (!session || (session.role !== 'admin' && session.role !== 'coach')) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createServerSupabaseClient()
    const { error } = await (supabase as any)
        .from('trainees')
        .update(updateData)
        .eq('id', traineeId)

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
    if (!session || session.role !== 'admin') { // Assuming only admin/head coach can reassign
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createServerSupabaseClient()
    const { error } = await (supabase as any)
        .from('classes')
        .update({ trainer_id: trainerId })
        .eq('id', classId)

    if (error) return { success: false, error: error.message }
    
    revalidatePath('/[locale]/teams/[classId]', 'page')
    return { success: true }
}
export async function quickRegisterAndAssign(traineeData: any, classId: string) {
    const session = await getSession()
    if (!session || (session.role !== 'admin' && session.role !== 'coach')) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createServerSupabaseClient()
    const { data: trainee, error: traineeError } = await (supabase as any)
        .from('trainees')
        .insert({
            ...traineeData,
            class_id: classId
        })
        .select()
        .single()

    if (traineeError) {
        console.error('Error in quick register:', traineeError)
        return { success: false, error: traineeError.message }
    }

    revalidatePath('/[locale]/halls/[id]', 'page')
    return { success: true, trainee }
}

export async function assignTraineeToTeam(traineeId: string, classId: string) {
    const session = await getSession()
    if (!session || (session.role !== 'admin' && session.role !== 'coach')) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createServerSupabaseClient()
    const { error } = await (supabase as any)
        .from('trainees')
        .update({ class_id: classId })
        .eq('id', traineeId)

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
    if (!session || (session.role !== 'admin' && session.role !== 'coach')) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createServerSupabaseClient()
    const { data, error } = await (supabase as any)
        .from('classes')
        .insert(teamData)
        .select()
        .single()

    if (error) {
        console.error('Error creating team:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/[locale]/teams', 'page')
    return { success: true, team: data }
}

export async function updateTeam(id: string, teamData: any) {
    const session = await getSession()
    if (!session || (session.role !== 'admin' && session.role !== 'coach')) {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createServerSupabaseClient()
    const { data, error } = await (supabase as any)
        .from('classes')
        .update(teamData)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating team:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/[locale]/teams', 'page')
    revalidatePath(`/[locale]/teams/${id}`, 'page')
    return { success: true, team: data }
}

export async function deleteTeam(id: string) {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
        return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createServerSupabaseClient()
    const { error } = await (supabase as any)
        .from('classes')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting team:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/[locale]/teams', 'page')
    return { success: true }
}
