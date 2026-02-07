'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { addTrainee } from '@/app/actions' // Need to implement this
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { User, Phone, Hash, Save, Loader2, ArrowLeft, ArrowRight, Users } from 'lucide-react'

export default function AddTraineePage() {
  const params = useParams()
  const locale = params.locale as string
  const classId = params.classId as string
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    jersey: '',
    gender: 'male' as 'male' | 'female',
  })

  // Basic translations
  const t = {
    title: locale === 'ar' ? 'إضافة لاعب' : locale === 'he' ? 'הוסף שחקן' : 'Add Player',
    name: locale === 'ar' ? 'الاسم' : locale === 'he' ? 'שם' : 'Name',
    phone: locale === 'ar' ? 'رقم الهاتف' : locale === 'he' ? 'טלפון' : 'Phone',
    jersey: locale === 'ar' ? 'رقم القميص' : locale === 'he' ? 'מספר חולצה' : 'Jersey Number',
    save: locale === 'ar' ? 'حفظ' : locale === 'he' ? 'שמור' : 'Save',
    cancel: locale === 'ar' ? 'إلغاء' : locale === 'he' ? 'ביטול' : 'Cancel',
    success: locale === 'ar' ? 'تمت الإضافة بنجاح' : locale === 'he' ? 'נוסף בהצלחה' : 'Added successfully',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await addTrainee({
        classId,
        name: formData.name,
        phone: formData.phone,
        jerseyNumber: formData.jersey ? parseInt(formData.jersey) : null,
        gender: formData.gender
      })

      if (result.success) {
        router.push(`/${locale}/teams/${classId}`)
        router.refresh()
      } else {
        setError(result.error || 'Failed to add trainee')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex" dir={locale === 'ar' || locale === 'he' ? 'rtl' : 'ltr'}>
      <Sidebar locale={locale} />
      
      <div className="flex-1 flex flex-col md:ml-[240px]">
        <Header 
          locale={locale} 
          title={t.title} 
          showBack 
          backHref={`/${locale}/teams/${classId}`} 
        />

        <main className="flex-1 pt-24 px-4 pb-12">
          <div className="max-w-2xl mx-auto">
            <Card className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    {t.name}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    placeholder={locale === 'ar' ? 'اسم اللاعب' : 'Player Name'}
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-green-600" />
                    {t.phone}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    placeholder="050..."
                    dir="ltr" 
                  />
                </div>

                {/* Jersey */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-orange-600" />
                    {t.jersey}
                  </label>
                  <input
                    type="number"
                    value={formData.jersey}
                    onChange={(e) => setFormData(prev => ({ ...prev, jersey: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    placeholder="23"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Gender */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    {locale === 'ar' ? 'الجنس' : locale === 'he' ? 'מין' : 'Gender'}
                  </label>
                  <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, gender: 'male' }))}
                        className={`flex-1 py-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                            formData.gender === 'male' 
                            ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold shadow-sm' 
                            : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        <User className="w-5 h-5" />
                        {locale === 'ar' ? 'ذكر' : locale === 'he' ? 'זכר' : 'Male'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, gender: 'female' }))}
                        className={`flex-1 py-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                            formData.gender === 'female' 
                            ? 'border-pink-500 bg-pink-50 text-pink-700 font-bold shadow-sm' 
                            : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        <User className="w-5 h-5" />
                        {locale === 'ar' ? 'أنثى' : locale === 'he' ? 'נקבה' : 'Female'}
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn btn-primary py-3.5 flex justify-center items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {t.save}
                  </button>
                </div>

              </form>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
