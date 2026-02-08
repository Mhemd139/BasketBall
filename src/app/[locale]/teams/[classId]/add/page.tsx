'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { addTrainee, searchTrainees, transferTrainee } from '@/app/actions'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { User, Phone, Hash, Save, Loader2, Users, Search, UserPlus, RefreshCw, Check, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { JerseyNumber } from '@/components/ui/JerseyNumber'

export default function AddTraineePage() {
  const params = useParams()
  const locale = params.locale as string
  const classId = params.classId as string
  const router = useRouter()
  
  const [mode, setMode] = useState<'choice' | 'existing' | 'new'>('choice')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    jersey: '',
    gender: 'male' as 'male' | 'female',
  })

  const t = {
    title: locale === 'ar' ? 'إضافة لاعب' : locale === 'he' ? 'הוסף שחקן' : 'Add Player',
    existingTitle: locale === 'ar' ? 'لاعب مسجل مسبقاً' : locale === 'he' ? 'שחקן קיים' : 'Existing Player',
    newTitle: locale === 'ar' ? 'لاعب جديد' : locale === 'he' ? 'שחקן חדש' : 'New Player',
    name: locale === 'ar' ? 'الاسم' : locale === 'he' ? 'שם' : 'Name',
    phone: locale === 'ar' ? 'رقم الهاتف' : locale === 'he' ? 'טלפון' : 'Phone',
    jersey: locale === 'ar' ? 'رقم القميص' : locale === 'he' ? 'מספר חולצה' : 'Jersey Number',
    searchPlaceholder: locale === 'ar' ? 'ابحث بالاسم أو رقم الهاتف...' : locale === 'he' ? 'חפש לפי שם או טלפון...' : 'Search by name or phone...',
    transfer: locale === 'ar' ? 'نقل للفريق' : locale === 'he' ? 'העבר לקבוצה' : 'Transfer',
    save: locale === 'ar' ? 'حفظ' : locale === 'he' ? 'שמור' : 'Save',
    cancel: locale === 'ar' ? 'إلغاء' : locale === 'he' ? 'ביטول' : 'Cancel',
  }

  useEffect(() => {
    if (mode === 'existing' && searchQuery.length > 2) {
      const delayDebounceFn = setTimeout(async () => {
        setSearching(true)
        const res = await searchTrainees(searchQuery)
        if (res.success) {
          setSearchResults(res.trainees || [])
        }
        setSearching(false)
      }, 500)
      return () => clearTimeout(delayDebounceFn)
    } else {
      setSearchResults([])
    }
  }, [searchQuery, mode])

  const handleTransfer = async (trainee: any) => {
    if (!confirm(locale === 'ar' ? `هل أنت متأكد من نقل ${trainee.name_en}؟` : locale === 'he' ? `האם אתה בטוח שברצונך להעביר את ${trainee.name_he}?` : `Transfer ${trainee.name_en}?`)) return
    
    setLoading(true)
    const res = await transferTrainee(trainee.id, classId)
    if (res.success) {
      router.push(`/${locale}/teams/${classId}`)
      router.refresh()
    } else {
      setError(res.error || 'Transfer failed')
      setLoading(false)
    }
  }

  const handleSubmitNew = async (e: React.FormEvent) => {
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
          backHref={mode === 'choice' ? `/${locale}/teams/${classId}` : undefined}
          onBack={mode !== 'choice' ? () => setMode('choice') : undefined}
        />

        <main className="flex-1 pt-20 pb-24 md:pb-8 px-3 md:px-5">
          <div className="max-w-2xl mx-auto">
            
            <AnimatePresence mode="wait">
              {mode === 'choice' && (
                <motion.div 
                  key="choice"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <Card 
                    interactive 
                    onClick={() => setMode('existing')}
                    className="p-8 flex flex-col items-center text-center gap-4 group"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-110">
                      <RefreshCw className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{t.existingTitle}</h3>
                      <p className="text-sm text-gray-500 mt-2">
                        {locale === 'ar' ? 'نقل لاعب مسجل في فريق آخر أو في النظام' : locale === 'he' ? 'העברת שחקן מקבוצה אחרת או מהמערכת' : 'Transfer a player registered in another team'}
                      </p>
                    </div>
                  </Card>

                  <Card 
                    interactive 
                    onClick={() => setMode('new')}
                    className="p-8 flex flex-col items-center text-center gap-4 group"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 transition-transform group-hover:scale-110">
                      <UserPlus className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{t.newTitle}</h3>
                      <p className="text-sm text-gray-500 mt-2">
                        {locale === 'ar' ? 'إنشاء سجل جديد للاعب جديد تماماً' : locale === 'he' ? 'יצירת רשומה חדשה לשחקן חדש לגמרי' : 'Create a fresh record for a brand new player'}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              )}

              {mode === 'existing' && (
                <motion.div 
                  key="existing"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      autoFocus
                      type="text"
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-lg bg-white shadow-sm"
                      placeholder={t.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-indigo-500" />}
                  </div>

                  <div className="space-y-3">
                    {searchResults.map((trainee) => (
                      <Card key={trainee.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="shrink-0">
                            {trainee.jersey_number ? (
                                <JerseyNumber number={trainee.jersey_number} className="w-12 h-12" />
                            ) : (
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-gray-400 ${
                                    trainee.gender === 'female' ? 'bg-pink-50' : 'bg-slate-100'
                                }`}>
                                   <User className={`w-6 h-6 ${trainee.gender === 'female' ? 'text-pink-400' : ''}`} />
                                </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-gray-900 truncate">
                                {locale === 'ar' ? trainee.name_ar : locale === 'he' ? trainee.name_he : trainee.name_en}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                <span className="flex items-center gap-1 shrink-0">
                                    <Phone className="w-3 h-3" /> {trainee.phone || 'N/A'}
                                </span>
                                {trainee.classes && (
                                    <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded truncate max-w-[120px]">
                                        <Users className="w-3 h-3" /> 
                                        {locale === 'ar' ? trainee.classes.name_ar : locale === 'he' ? trainee.classes.name_he : trainee.classes.name_en}
                                    </span>
                                )}
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleTransfer(trainee)}
                          disabled={loading || trainee.class_id === classId}
                          className={`btn text-xs px-6 py-2.5 whitespace-nowrap ${
                              trainee.class_id === classId 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                              : 'btn-primary'
                          }`}
                        >
                          {trainee.class_id === classId ? <Check className="w-4 h-4" /> : t.transfer}
                        </button>
                      </Card>
                    ))}
                    
                    {searchQuery.length > 2 && !searching && searchResults.length === 0 && (
                      <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <Search className="w-8 h-8" />
                        </div>
                        <p className="font-semibold text-gray-900">{locale === 'ar' ? 'لم يتم العثور على لاعبين' : locale === 'he' ? 'לא נמצאו שחקנים' : 'No players found'}</p>
                        <p className="text-sm text-gray-500 mt-1 mb-6">{locale === 'ar' ? 'يمكنك تسجيله كلاعب جديد تماماً' : 'You can register them as a new player'}</p>
                        <button 
                            onClick={() => setMode('new')}
                            className="btn btn-primary"
                        >
                            <Plus className="w-5 h-5" />
                            {locale === 'ar' ? 'تسجيل لاعب جديد' : 'Register New Player'}
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {mode === 'new' && (
                <motion.div 
                  key="new"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="p-8">
                    <form onSubmit={handleSubmitNew} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">{t.name}</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white font-medium"
                          placeholder={locale === 'ar' ? 'اسم اللاعب' : 'Player Name'}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">{t.phone}</label>
                            <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white font-medium"
                            placeholder="050..."
                            dir="ltr" 
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">{t.jersey}</label>
                            <input
                            type="number"
                            value={formData.jersey}
                            onChange={(e) => setFormData(prev => ({ ...prev, jersey: e.target.value }))}
                            className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white font-medium"
                            placeholder="23"
                            />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700">
                          {locale === 'ar' ? 'الجنس' : locale === 'he' ? 'מין' : 'Gender'}
                        </label>
                        <div className="flex gap-4">
                          <button
                              type="button"
                              onClick={() => setFormData(p => ({ ...p, gender: 'male' }))}
                              className={`flex-1 py-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all font-bold ${
                                  formData.gender === 'male' 
                                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                                  : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                              }`}
                          >
                            <User className="w-5 h-5" />
                            {locale === 'ar' ? 'ذكر' : 'Male'}
                          </button>
                          <button
                              type="button"
                              onClick={() => setFormData(p => ({ ...p, gender: 'female' }))}
                              className={`flex-1 py-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all font-bold ${
                                  formData.gender === 'female' 
                                  ? 'border-pink-500 bg-pink-50 text-pink-700' 
                                  : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                              }`}
                          >
                            <User className="w-5 h-5" />
                            {locale === 'ar' ? 'أنثى' : 'Female'}
                          </button>
                        </div>
                      </div>

                      {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">{error}</div>}

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn btn-primary py-4 mt-4"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {t.save}
                      </button>
                    </form>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </main>
      </div>
    </div>
  )
}
