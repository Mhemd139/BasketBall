'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Loader2, User, Phone, Hash, ChevronLeft, ArrowRight, CheckCircle2, Users } from 'lucide-react'
import { getEventRefData, addTrainee } from '@/app/actions'
import { formatPhoneNumber } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface CreatePlayerModalProps {
  isOpen: boolean
  onClose: () => void
  locale: string
}

type Step = 'details' | 'team' | 'success'

export function CreatePlayerModal({ isOpen, onClose, locale }: CreatePlayerModalProps) {
  const [step, setStep] = useState<Step>('details')
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState<any[]>([])
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    jerseyNumber: '',
    gender: 'male' as 'male' | 'female',
    classId: ''
  })

  // Error State
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setStep('details')
      setError(null)
      fetchTeams()
    }
  }, [isOpen])

  const fetchTeams = async () => {
    const res = await getEventRefData()
    if (res.success && res.classes) {
      setClasses(res.classes)
    }
  }

  const handleNext = () => {
    if (!formData.name) {
      setError('يرجى إدخال اسم اللاعب')
      return
    }
    setError(null)
    setStep('team')
  }

  const handleBack = () => {
    setStep('details')
  }

  const handleSave = async () => {
    if (!formData.classId) {
      setError('يرجى اختيار فريق')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const res = await addTrainee({
        name: formData.name,
        phone: formData.phone,
        jerseyNumber: formData.jerseyNumber ? parseInt(formData.jerseyNumber) : null,
        gender: formData.gender,
        classId: formData.classId
      })

      if (res.success) {
        setStep('success')
      } else {
        setError(res.error || 'Failed to add player')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDone = () => {
    onClose()
    setFormData({ name: '', phone: '', jerseyNumber: '', gender: 'male', classId: '' })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-white rounded-3xl border-0 shadow-2xl">
        {/* Header Section */}
        <div className="bg-navy-900 p-6 pt-8 text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <DialogTitle className="relative z-10 text-2xl font-outfit font-bold flex items-center gap-2">
            {step === 'details' && <><User className="w-6 h-6 text-gold-400" /> {'تفاصيل اللاعب'}</>}
            {step === 'team' && <><Users className="w-6 h-6 text-gold-400" /> {'اختيار الفريق'}</>}
            {step === 'success' && <><CheckCircle2 className="w-6 h-6 text-green-400" /> {'تمت الإضافة!'}</>}
          </DialogTitle>
          
          {/* Progress Indicator */}
          {step !== 'success' && (
            <div className="flex gap-2 mt-4 relative z-10">
              <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${step === 'details' || step === 'team' ? 'bg-gold-500' : 'bg-white/20'}`} />
              <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${step === 'team' ? 'bg-gold-500' : 'bg-white/20'}`} />
            </div>
          )}
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 'details' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      {'اسم اللاعب'}
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all text-sm font-bold"
                        placeholder={'مثال: محمد علي'}
                        value={formData.name}
                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                        {'رقم الهاتف'}
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="tel"
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all text-sm font-bold"
                          placeholder="05..."
                          value={formData.phone}
                          onChange={e => setFormData(p => ({ ...p, phone: formatPhoneNumber(e.target.value) }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                        {'رقم القميص'}
                      </label>
                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="number"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all text-sm font-bold"
                          placeholder="7"
                          value={formData.jerseyNumber}
                          onChange={e => setFormData(p => ({ ...p, jerseyNumber: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      {'الجنس'}
                    </label>
                    <div className="flex bg-slate-100/80 p-1.5 rounded-2xl">
                      <button 
                        onClick={() => setFormData(p => ({ ...p, gender: 'male' }))}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${formData.gender === 'male' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                      >
                        {'ذكر'}
                      </button>
                      <button 
                        onClick={() => setFormData(p => ({ ...p, gender: 'female' }))}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${formData.gender === 'female' ? 'bg-white shadow-sm text-pink-600' : 'text-slate-500'}`}
                      >
                        {'أنثى'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {step === 'team' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      {'اختر الفريق'}
                    </label>
                    <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                      {classes.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setFormData(p => ({ ...p, classId: c.id }))}
                          className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                            formData.classId === c.id 
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-md ring-1 ring-indigo-600' 
                            : 'border-slate-50 bg-slate-50 text-slate-600 hover:border-slate-200 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3 text-start">
                            <div className={`p-2 rounded-lg ${formData.classId === c.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-300 group-hover:bg-slate-100 group-hover:text-slate-500'}`}>
                              <Users className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-sm">
                              {c.name_ar}
                            </span>
                          </div>
                          {formData.classId === c.id && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 'success' && (
                <div className="text-center py-8 space-y-4">
                  <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-navy-900">
                    {'تمت إضافة اللاعب بنجاح!'}
                  </h3>
                  <p className="text-slate-500 text-sm font-medium px-8">
                    {formData.name} {'أصبح الآن عضواً في الفريق.'}
                  </p>
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 animate-pulse">
                  {error}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <DialogFooter className="p-6 pt-0 flex gap-3">
          {step === 'details' && (
            <Button 
              onClick={handleNext} 
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 group"
            >
              {'التالي'}
              <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            </Button>
          )}

          {step === 'team' && (
            <div className="flex gap-3 w-full">
              <Button 
                variant="secondary" 
                onClick={handleBack} 
                className="flex-1 h-14 rounded-2xl font-bold bg-slate-50 text-slate-500 hover:bg-slate-100"
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                {'رجوع'}
              </Button>
              <Button 
                onClick={handleSave} 
                className="flex-[2] h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-100"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'إضافة اللاعب'}
              </Button>
            </div>
          )}

          {step === 'success' && (
            <Button 
              onClick={handleDone} 
              className="w-full h-14 bg-navy-900 hover:bg-navy-800 text-white rounded-2xl font-black shadow-lg"
            >
              {'إغلاق'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
