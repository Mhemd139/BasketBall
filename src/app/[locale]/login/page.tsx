'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { sendOTP, verifyOTP, updateProfile } from '@/app/actions'
import { Phone, ArrowRight, AlertCircle, Loader2, KeyRound, ArrowLeft, User } from 'lucide-react'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

export default function LoginPage() {
  const [step, setStep] = useState<'phone' | 'otp' | 'name'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [otpContext, setOtpContext] = useState('') // For Vonage Hash or RequestID
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  // Helper to convert Arabic/Persian digits to English and ensure International format (IL)
  const normalizePhone = (str: string) => {
    let cleaned = str
      .replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => ((d.charCodeAt(0) - 1632) as unknown as string))
      .replace(/[۰۱۲۳۴۵۶۷۸۹]/g, d => ((d.charCodeAt(0) - 1776) as unknown as string))
      .replace(/[^\d+]/g, '')
    
    // Israel specific fix: 05X -> 9725X
    if (cleaned.startsWith('05')) {
        cleaned = '972' + cleaned.substring(1)
    }
    // If just 5X (user forgot 0)
    else if (cleaned.startsWith('5') && cleaned.length === 9) {
        cleaned = '972' + cleaned
    }
    
    return cleaned
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const cleanPhone = normalizePhone(phone)
      
      if (!cleanPhone || cleanPhone.length < 8) {
        const debugSuffix = ` (${phone})`
        const msg = locale === 'ar' ? 'الرجاء إدخال رقم الهاتف صحيح' : locale === 'he' ? 'אנא הזן מספר טלפון תקין' : 'Please enter valid phone number'
        throw new Error(msg + debugSuffix)
      }
      
      const res = await sendOTP(cleanPhone)
      if (res.success) {
        if ((res as any).hash) {
            setOtpContext((res as any).hash)
        } else if ((res as any).requestId) {
            setOtpContext((res as any).requestId)
        }
        setStep('otp')
      } else {
        setError((res as any).error || 'Failed to send OTP')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Normalize phone again just in case
      const cleanPhone = normalizePhone(phone)
      const result = await verifyOTP(cleanPhone, otp, otpContext) // Pass hash/context

      if (result.success) {
        if ((result as any).isNew) {
          setStep('name')
        } else {
          router.push(`/${locale}/teams`)
          router.refresh()
        }
      } else {
        setError(result.error || 'Verification failed')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
       if (!name.trim()) throw new Error('Name is required')
       
       const result = await updateProfile(name)
       if (result.success) {
          router.push(`/${locale}/teams`)
          router.refresh()
       } else {
          setError(result.error || 'Failed to save name')
       }
    } catch (err: any) {
       setError(err.message)
    } finally {
       setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50 relative" dir={locale === 'ar' || locale === 'he' ? 'rtl' : 'ltr'}>
      <button 
        onClick={() => step === 'phone' ? router.back() : setStep(step === 'name' ? 'otp' : 'phone')}
        className="absolute top-6 start-6 p-2 rounded-full bg-white/80 hover:bg-white shadow-sm hover:shadow-md transition-all text-gray-600"
        aria-label="Back"
      >
        <ArrowLeft className={`w-6 h-6 ${locale === 'ar' || locale === 'he' ? 'rotate-180' : ''}`} />
      </button>

      <Card className="w-full max-w-md p-8 shadow-xl border-t-4 border-indigo-600">
        <LanguageSwitcher currentLocale={locale} />
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
            {step === 'phone' ? <Phone className="w-8 h-8" /> : step === 'otp' ? <KeyRound className="w-8 h-8" /> : <User className="w-8 h-8" />}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {locale === 'ar' ? 'تسجيل دخول المدرب' : locale === 'he' ? 'כניסת מאמן' : 'Trainer Login'}
          </h1>
          <p className="text-gray-500 text-sm">
            {step === 'phone' 
              ? (locale === 'ar' ? 'أدخل رقم هاتفك' : locale === 'he' ? 'הזן טלפון' : 'Enter phone number')
              : step === 'otp'
              ? (locale === 'ar' ? `تم إرسال الرمز إلى ${phone}` : locale === 'he' ? `קוד נשלח ל-${phone}` : `Code sent to ${phone}`)
              : (locale === 'ar' ? 'مرحباً! ما اسمك؟' : locale === 'he' ? 'ברוך הבא! מה שמך?' : 'Welcome! What is your name?')}
          </p>
        </div>

        {step === 'phone' && (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div className="space-y-2">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-lg text-center tracking-widest"
                placeholder="050..."
                dir="ltr"
                autoFocus
              />
            </div>
            
            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}

            <button type="submit" disabled={loading} className="w-full btn btn-primary py-3.5 text-base flex justify-center items-center gap-2">
               {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
               {locale === 'ar' ? 'متابعة' : locale === 'he' ? 'המשך' : 'Continue'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-2">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-2xl text-center tracking-[1em]"
                placeholder="••••"
                maxLength={4}
                dir="ltr"
                autoFocus
              />
            </div>

            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}

            <button type="submit" disabled={loading} className="w-full btn btn-primary py-3.5 text-base flex justify-center items-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (locale === 'ar' ? 'تحقق' : locale === 'he' ? 'אמת' : 'Verify')}
            </button>
          </form>
        )}

        {step === 'name' && (
          <form onSubmit={handleNameSubmit} className="space-y-6">
            <div className="space-y-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-lg text-center"
                placeholder={locale === 'ar' ? 'الاسم الكامل' : locale === 'he' ? 'שם מלא' : 'Full Name'}
                autoFocus
              />
            </div>

            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}

            <button type="submit" disabled={loading} className="w-full btn btn-primary py-3.5 text-base flex justify-center items-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (locale === 'ar' ? 'ابدأ' : locale === 'he' ? 'התחל' : 'Get Started')}
            </button>
          </form>
        )}
      </Card>
    </div>
  )
}
