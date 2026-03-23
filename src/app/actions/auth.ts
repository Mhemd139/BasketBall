'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { sign, verify } from '@/lib/session'
import { normalizePhone } from '@/lib/utils'

const getSeedHeadcoachNumbers = () =>
  (process.env.SEED_HEADCOACH_PHONES || '').split(',').map(s => normalizePhone(s.trim())).filter(Boolean)

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

export async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')
  if (!session) return null
  return await verify(session.value)
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_session')
  return { success: true }
}

export async function sendOTP(phone: string) {
  phone = normalizePhone(phone)

  if (process.env.NODE_ENV === 'test' && process.env.E2E_MOCK_OTP === 'true') {
    return { success: true }
  }

  // Check if this phone number is registered before sending SMS
  const seedNumbers = getSeedHeadcoachNumbers()
  if (!seedNumbers.includes(phone)) {
    const supabase = await createServerSupabaseClient()
    const { count, error: lookupError } = await (supabase as any)
      .from('trainers')
      .select('id', { count: 'exact', head: true })
      .eq('phone', phone)
    if (lookupError) {
      console.error('sendOTP trainer lookup failed:', lookupError)
      return { success: false, error: 'تعذر التحقق من رقم الهاتف. حاول مرة أخرى.' }
    }
    if (!count) {
      return { success: false, error: 'رقم الهاتف غير مسجّل. تواصل مع المدرب الرئيسي لإضافتك.' }
    }
  }

  const twilio = getTwilioClient()
  const twilioService = process.env.TWILIO_VERIFY_SERVICE_SID
  if (twilio && twilioService) {
      try {
        await twilio.verify.v2.services(twilioService)
          .verifications.create({ to: phone, channel: 'sms' })
        return { success: true }
      } catch (e: any) {
        console.error('sendOTP twilio failed:', e)
        return { success: false, error: 'فشل إرسال الرمز. حاول مرة أخرى.' }
      }
  }

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
            return { success: true, requestId: data.request_id }
        } else if (data.status === '10' && data.request_id) {
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
            return { success: false, error: 'فشل إرسال الرمز. حاول مرة أخرى.' }
        } else {
            return { success: false, error: 'فشل إرسال الرمز. حاول مرة أخرى.' }
        }
    } catch (e: any) {
        console.error('sendOTP vonage failed:', e)
        return { success: false, error: 'فشل إرسال الرمز' }
    }
  }

  return { success: true }
}

export async function verifyOTP(phone: string, otp: string, context?: string) {
  const supabase = await createServerSupabaseClient()
  const cleanPhone = normalizePhone(phone)

  if (process.env.NODE_ENV === 'test' && process.env.E2E_MOCK_OTP === 'true') {
    if (otp !== '1111' && otp !== '1234') return { success: false, error: 'الرمز غير صحيح.' }
  } else {
  const twilio = getTwilioClient()
  if (twilio && process.env.TWILIO_VERIFY_SERVICE_SID) {
      try {
        const check = await twilio.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
          .verificationChecks.create({ to: cleanPhone, code: otp })
        if (check.status !== 'approved') return { success: false, error: 'الرمز غير صحيح. حاول مرة أخرى.' }
      } catch (e: any) {
        console.error('verifyOTP twilio failed:', e)
        return { success: false, error: 'فشل التحقق من الرمز' }
      }
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
              console.error('Vonage verify failed:', data.status, data.error_text)
              return { success: false, error: 'الرمز غير صحيح أو منتهي الصلاحية' }
          }
      }
  }
  else {
    if (otp !== '1111' && otp !== '1234') return { success: false, error: 'الرمز غير صحيح.' }
  }
  }

  let { data: trainer, error } = await (supabase as any)
    .from('trainers')
    .select('id, name_ar, name_en, role')
    .eq('phone', cleanPhone)
    .single()

  const isSeedHeadCoach = getSeedHeadcoachNumbers().includes(cleanPhone)

  if (!trainer) {
      if (isSeedHeadCoach) {
          const { data: newTrainer, error: createError } = await (supabase as any).rpc('create_trainer', {
              p_phone: cleanPhone,
              p_name: '',
          })
          if (createError) {
              console.error('verifyOTP create trainer failed:', createError)
          return { success: false, error: 'فشل إنشاء الحساب' }
          }
          const created = Array.isArray(newTrainer) ? newTrainer[0] : newTrainer
          if (created?.id) {
              await (supabase as any).rpc('update_trainer_rpc', {
                  p_id: created.id,
                  p_data: { role: 'headcoach' }
              })
          }
          trainer = { ...created, role: 'headcoach' }
      } else {
          return { success: false, error: 'رقم الهاتف غير مسجّل. تواصل مع المدرب الرئيسي لإضافتك.' }
      }
  }

  const role = trainer.role === 'headcoach' ? 'headcoach' : 'trainer'

  const cookieStore = await cookies()
  const sessionToken = await sign({
    id: trainer.id,
    name: trainer.name_ar || trainer.name_en || 'مدرب',
    role
  })

  cookieStore.set('admin_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  const hasName = !!(trainer.name_ar || trainer.name_en)
  return { success: true, isNew: !hasName }
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
      console.error('updateProfile failed:', error)
      return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
  }

  const cookieStore = await cookies()
  const sessionToken = await sign({
    ...session,
    name: name,
    gender: gender
  })

  cookieStore.set('admin_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  revalidatePath('/[locale]/more', 'page')
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
        console.error('deleteAccount failed:', error)
        return { success: false, error: 'حدث خطأ، حاول مرة أخرى' }
    }

    await logout()
    return { success: true }
}
