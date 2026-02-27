'use client'

import { useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { sendOTP, verifyOTP, updateProfile } from '@/app/actions'
import { normalizePhone } from '@/lib/utils'
import { Phone, ArrowRight, AlertCircle, Loader2, KeyRound, ArrowLeft, User } from 'lucide-react'

export default function LoginPage() {
  const [step, setStep] = useState<'phone' | 'otp' | 'profile-setup'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [availability, setAvailability] = useState<string[]>([])
  const [otpContext, setOtpContext] = useState('') // For Vonage Hash or RequestID
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const verifyingRef = useRef(false)
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const cleanPhone = normalizePhone(phone)
      
      if (!cleanPhone || cleanPhone.length < 8) {
        const debugSuffix = ` (${phone})`
        const msg = 'الرجاء إدخال رقم الهاتف صحيح'
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

  const doVerify = async (code: string, context: string) => {
    if (verifyingRef.current) return
    verifyingRef.current = true
    setError('')
    setLoading(true)

    try {
      const cleanPhone = normalizePhone(phone)
      const result = await verifyOTP(cleanPhone, code, context)

      if (result.success) {
        if ((result as any).isNew) {
          setStep('profile-setup')
        } else {
          router.push(`/${locale}`)
          router.refresh()
        }
      } else {
        setError(result.error || 'Verification failed')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
      verifyingRef.current = false
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    doVerify(otp, otpContext)
  }

  const handleOtpChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4)
    setOtp(digits)
    if (digits.length === 4) {
      doVerify(digits, otpContext)
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
       if (!name.trim()) throw new Error('Name is required')
       
       const result = await updateProfile(name, gender, availability)
       if (result.success) {
          router.push(`/${locale}`)
          router.refresh()
       } else {
          setError(result.error || 'Failed to save profile')
       }
    } catch (err: any) {
       setError(err.message)
    } finally {
       setLoading(false)
    }
  }

  const toggleDay = (day: string) => {
    if (availability.includes(day)) {
      setAvailability(availability.filter(d => d !== day))
    } else {
      setAvailability([...availability, day])
    }
  }

  const days = [
    { id: 'Sunday', label: 'الأحد' },
    { id: 'Monday', label: 'الإثنين' },
    { id: 'Tuesday', label: 'الثلاثاء' },
    { id: 'Wednesday', label: 'الأربعاء' },
    { id: 'Thursday', label: 'الخميس' },
    { id: 'Friday', label: 'الجمعة' },
    { id: 'Saturday', label: 'السبت' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-100 via-purple-50 to-blue-100 relative overflow-hidden" dir="rtl">
       {/* Background decorative elements */}
       <div className="absolute top-[-10%] start-[-10%] w-[40%] h-[40%] bg-indigo-200/30 rounded-full blur-3xl animate-pulse" />
       <div className="absolute bottom-[-10%] end-[-10%] w-[40%] h-[40%] bg-purple-200/30 rounded-full blur-3xl animate-pulse delay-1000" />

      <button 
        onClick={() => step === 'phone' ? router.back() : setStep(step === 'profile-setup' ? 'otp' : 'phone')}
        className="absolute top-6 start-6 p-2 rounded-full bg-white/80 hover:bg-white shadow-sm hover:shadow-md transition-all text-gray-600 z-10"
        aria-label="Back"
      >
        <ArrowLeft className="w-6 h-6 rotate-180" />
      </button>

      <div className="w-full max-w-md animate-fade-in-up">
        {step === 'profile-setup' ? (
             <Card className="w-full p-8 shadow-2xl border-0 bg-white/90 backdrop-blur-xl rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-red-500 to-orange-400" />
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {'إعداد الملف الشخصي'}
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {'أكمل معلوماتك للبدء'}
                    </p>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                    {/* Name */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                            {'الاسم الكامل'}
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-medium bg-gray-50/50 focus:bg-white"
                            placeholder="الاسم الكامل"
                            autoFocus
                        />
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                            {'الجنس'}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setGender('male')}
                                className={`p-3 rounded-xl border-2 transition-all font-bold ${gender === 'male' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'}`}
                            >
                                {'ذكر'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setGender('female')}
                                className={`p-3 rounded-xl border-2 transition-all font-bold ${gender === 'female' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'}`}
                            >
                                {'أنثى'}
                            </button>
                        </div>
                    </div>

                    {/* Availability */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                             {'أيام التدريب المتاحة'}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {days.map(day => (
                                <button
                                    key={day.id}
                                    type="button"
                                    onClick={() => toggleDay(day.id)}
                                    className={`px-3 py-2 rounded-lg text-sm font-bold border transition-all ${
                                        availability.includes(day.id) 
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' 
                                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2 animate-shake"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}

                    <button type="submit" disabled={loading} className="w-full btn btn-primary py-4 text-lg font-bold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all active:scale-[0.98] flex justify-center items-center gap-2">
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'إكمال'}
                    </button>
                </form>
             </Card>
        ) : (
            <Card className="w-full p-8 shadow-2xl border-0 bg-white/90 backdrop-blur-xl rounded-3xl relative overflow-hidden">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
    
            
            <div className="text-center mb-8 relative">
              <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600 shadow-sm transform transition-transform hover:scale-105 duration-300">
                {step === 'phone' ? <Phone className="w-10 h-10" /> : <KeyRound className="w-10 h-10" />}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
                {'تسجيل دخول المدرب'}
              </h1>
              <p className="text-gray-500 text-base">
                  {step === 'phone' 
                  ? 'أدخل رقم هاتفك للمتابعة'
                  : `تم إرسال الرمز إلى ${phone}`}
              </p>
            </div>
    
            {step === 'phone' && (
              <form onSubmit={handleSendOTP} className="space-y-6 animate-fade-in">
                <div className="space-y-2">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-xl text-center tracking-widest font-medium bg-gray-50/50 focus:bg-white"
                    placeholder="050..."
                    dir="ltr"
                    autoFocus
                  />
                </div>
                
                {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2 animate-shake"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
    
                <button type="submit" disabled={loading} className="w-full btn btn-primary py-4 text-lg font-bold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all active:scale-[0.98] flex justify-center items-center gap-2">
                   {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
                   {'متابعة'}
                </button>
              </form>
            )}
    
            {step === 'otp' && (
              <form onSubmit={handleVerify} className="space-y-6 animate-fade-in">
                <div className="space-y-2">
                  <input
                    type="text"
                    name="one-time-code"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => handleOtpChange(e.target.value)}
                    className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-3xl text-center tracking-[1em] font-bold bg-gray-50/50 focus:bg-white"
                    placeholder="••••"
                    maxLength={4}
                    dir="ltr"
                    autoFocus
                  />
                </div>
    
                {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2 animate-shake"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
    
                <button type="submit" disabled={loading} className="w-full btn btn-primary py-4 text-lg font-bold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all active:scale-[0.98] flex justify-center items-center gap-2">
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'تحقق'}
                </button>
                
                <button 
                    type="button" 
                    onClick={() => setStep('phone')}
                    className="w-full text-center text-sm text-gray-400 hover:text-indigo-600 transition-colors"
                >
                    {'تغيير الرقم؟'}
                </button>
              </form>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
