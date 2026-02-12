'use client'

import { CheckCircle2, XCircle, FileSpreadsheet, ArrowLeft, RotateCcw } from 'lucide-react'
import type { ImportResult } from '@/lib/excel/types'

interface ImportProgressStepProps {
  result: ImportResult | null
  isImporting: boolean
  progress: number
  onDone: () => void
  onReset: () => void
}

export function ImportProgressStep({ result, isImporting, progress, onDone, onReset }: ImportProgressStepProps) {
  if (isImporting) {
    return (
      <div className="space-y-6 sm:space-y-8 text-center py-8 sm:py-12">
        <div className="w-20 h-20 mx-auto bg-amber-100 rounded-2xl flex items-center justify-center animate-pulse">
          <FileSpreadsheet className="w-10 h-10 text-amber-600" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900">جاري الاستيراد...</h2>
          <p className="text-slate-500 mt-2">يرجى الانتظار</p>
        </div>

        {/* Progress bar */}
        <div className="max-w-md mx-auto">
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-slate-500 mt-2 font-mono">{Math.round(progress)}%</p>
        </div>
      </div>
    )
  }

  if (!result) return null

  const hasErrors = result.errors.length > 0

  return (
    <div className="space-y-6 sm:space-y-8 text-center py-6 sm:py-8">
      {/* Result Icon */}
      <div className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl flex items-center justify-center ${
        hasErrors ? 'bg-amber-100' : 'bg-green-100'
      }`}>
        {hasErrors ? (
          <XCircle className="w-10 h-10 text-amber-600" />
        ) : (
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          {hasErrors ? 'تم الاستيراد مع تحذيرات' : 'تم الاستيراد بنجاح!'}
        </h2>
        <p className="text-slate-500 mt-2">
          تمت معالجة {result.total} سجل
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-md mx-auto">
        <div className="bg-green-50 rounded-2xl p-3 sm:p-4">
          <div className="text-2xl sm:text-3xl font-black text-green-600">{result.inserted}</div>
          <div className="text-[10px] sm:text-xs text-green-700 font-medium">تم إدراجه</div>
        </div>
        <div className="bg-slate-50 rounded-2xl p-3 sm:p-4">
          <div className="text-2xl sm:text-3xl font-black text-slate-600">{result.skipped}</div>
          <div className="text-[10px] sm:text-xs text-slate-500 font-medium">تم تخطيه</div>
        </div>
        <div className="bg-red-50 rounded-2xl p-3 sm:p-4">
          <div className="text-2xl sm:text-3xl font-black text-red-600">{result.errors.length}</div>
          <div className="text-[10px] sm:text-xs text-red-700 font-medium">فشل</div>
        </div>
      </div>

      {/* Error details */}
      {result.errors.length > 0 && (
        <div className="max-w-lg mx-auto bg-red-50 rounded-2xl p-4 border border-red-100 text-right">
          <h3 className="font-bold text-red-700 text-sm mb-2">تفاصيل الأخطاء:</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {result.errors.map((err, i) => (
              <p key={i} className="text-xs text-red-600">
                صف {err.row + 1}: {err.error}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 text-slate-700 font-bold rounded-xl hover:bg-gray-50 active:scale-[0.97] transition-all w-full sm:w-auto justify-center text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          استيراد ملف آخر
        </button>
        <button
          onClick={onDone}
          className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-amber-200 active:scale-[0.97] transition-all w-full sm:w-auto text-sm"
        >
          تم
        </button>
      </div>
    </div>
  )
}
