'use client'

import { useState, useMemo } from 'react'
import { UserPlus, ArrowLeft, Phone, AlertTriangle, CheckCircle2 } from 'lucide-react'

export interface UnresolvedTrainer {
  name: string
  phone: string
  usedByRows: number  // count of rows referencing this trainer
}

interface ResolveTrainersStepProps {
  unresolvedTrainers: UnresolvedTrainer[]
  onConfirm: (trainers: UnresolvedTrainer[]) => void
  onBack: () => void
}

export function ResolveTrainersStep({ unresolvedTrainers, onConfirm, onBack }: ResolveTrainersStepProps) {
  const [trainers, setTrainers] = useState<UnresolvedTrainer[]>(unresolvedTrainers)

  const updatePhone = (index: number, phone: string) => {
    setTrainers((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], phone }
      return next
    })
  }

  const allHavePhones = useMemo(
    () => trainers.every((t) => t.phone.trim().length >= 9),
    [trainers]
  )

  const filledCount = trainers.filter((t) => t.phone.trim().length >= 9).length

  return (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <div className="w-16 h-16 mx-auto bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
          <UserPlus className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">مدربون جدد</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          هؤلاء المدربون موجودون في الملف ولكن ليسوا في النظام. أدخل أرقام هواتفهم لإنشاء حساباتهم تلقائياً.
        </p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 text-sm">
        <span className={`font-bold ${allHavePhones ? 'text-green-600' : 'text-amber-600'}`}>
          {filledCount}/{trainers.length}
        </span>
        <span className="text-slate-400">تم إدخال أرقام الهواتف</span>
      </div>

      {/* Trainer cards */}
      <div className="space-y-3 max-w-lg mx-auto">
        {trainers.map((trainer, i) => {
          const hasPhone = trainer.phone.trim().length >= 9
          return (
            <div
              key={trainer.name}
              className={`rounded-2xl border p-4 transition-all ${
                hasPhone
                  ? 'border-green-200 bg-green-50/50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                {hasPhone ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 text-sm truncate" dir="auto">{trainer.name}</div>
                  <div className="text-[11px] text-slate-400">
                    يستخدم في {trainer.usedByRows} {trainer.usedByRows === 1 ? 'فريق' : 'فرق'}
                  </div>
                </div>
              </div>

              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  dir="ltr"
                  placeholder="05XXXXXXXX"
                  value={trainer.phone}
                  onChange={(e) => updatePhone(i, e.target.value)}
                  className={`w-full pr-10 pl-4 py-2.5 rounded-xl border text-sm font-mono transition-colors focus:outline-none focus:ring-2 ${
                    hasPhone
                      ? 'border-green-300 bg-green-50 focus:ring-green-300'
                      : 'border-gray-200 bg-gray-50 focus:ring-amber-300'
                  }`}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Info note */}
      <div className="max-w-lg mx-auto bg-blue-50 rounded-xl p-3 border border-blue-100">
        <p className="text-xs text-blue-700 text-center">
          سيتم إنشاء حسابات المدربين تلقائياً ويمكنهم تسجيل الدخول باستخدام أرقام هواتفهم
        </p>
      </div>

      {/* Bottom actions — sticky on mobile */}
      <div className="flex items-center justify-between pt-4 pb-2 sticky bottom-0 bg-slate-50/95 backdrop-blur-sm -mx-4 px-4 sm:static sm:bg-transparent sm:backdrop-blur-none sm:mx-0 sm:px-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          العودة للمعاينة
        </button>

        <button
          onClick={() => onConfirm(trainers)}
          disabled={!allHavePhones}
          className="px-5 sm:px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          إنشاء وبدء الاستيراد
        </button>
      </div>
    </div>
  )
}
