'use client'

import { useMemo } from 'react'
import {
  Users,
  Dumbbell,
  User,
  Building2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  ArrowLeft,
  Package,
  Plus,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import type { SmartAnalysisResult } from '@/lib/excel/analyzer'
import type { ImportableTable } from '@/lib/excel/types'

interface SmartReviewStepProps {
  analysis: SmartAnalysisResult
  onConfirmImport: () => void
  onBack: () => void
}

const TABLE_ICONS: Record<ImportableTable, typeof Users> = {
  classes: Users,
  trainers: Dumbbell,
  trainees: User,
  halls: Building2,
}

const TABLE_LABELS: Record<ImportableTable, string> = {
  classes: 'الفرق',
  trainers: 'المدربين',
  trainees: 'اللاعبين',
  halls: 'القاعات',
}

export function SmartReviewStep({ analysis, onConfirmImport, onBack }: SmartReviewStepProps) {
  const {
    primaryTable,
    primaryAnalysis,
    newTrainers,
    newHalls,
    extractedTrainers,
    extractedHalls,
  } = analysis

  const PrimaryIcon = TABLE_ICONS[primaryTable]

  // Summary cards data
  const summaryCards = useMemo(() => {
    const cards: {
      icon: typeof Users
      label: string
      count: number
      newCount: number
      names: string[]
      gradient: string
      bgColor: string
    }[] = []

    // New halls to create
    if (extractedHalls.length > 0) {
      cards.push({
        icon: Building2,
        label: 'القاعات',
        count: extractedHalls.length,
        newCount: newHalls.length,
        names: extractedHalls.map((e) => e.name),
        gradient: 'from-emerald-500 to-teal-600',
        bgColor: 'bg-emerald-50',
      })
    }

    // New trainers to create
    if (extractedTrainers.length > 0) {
      cards.push({
        icon: Dumbbell,
        label: 'المدربين',
        count: extractedTrainers.length,
        newCount: newTrainers.length,
        names: extractedTrainers.map((e) => e.name),
        gradient: 'from-blue-500 to-indigo-600',
        bgColor: 'bg-blue-50',
      })
    }

    // Primary table records
    cards.push({
      icon: PrimaryIcon,
      label: TABLE_LABELS[primaryTable],
      count: primaryAnalysis.importableCount,
      newCount: primaryAnalysis.importableCount,
      names: primaryAnalysis.previewRows
        .slice(0, 8)
        .map((r) => {
          const name = r.transformed.name_ar || r.transformed.name_he || r.transformed.name_en
          return name ? String(name) : `سجل #${r.index + 1}`
        }),
      gradient: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-50',
    })

    return cards
  }, [analysis])

  const totalRecords = analysis.totalNewRecords

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full mb-4">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-bold text-amber-800">تحليل تلقائي</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">مراجعة البيانات</h2>
        <p className="text-sm text-slate-500 mt-1">
          تم تحليل الملف تلقائياً — تحقق من البيانات قبل الاستيراد
        </p>
      </div>

      {/* Status summary bar */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 py-3 px-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span className="text-sm font-bold text-green-700">{primaryAnalysis.validCount}</span>
          <span className="text-xs text-slate-400">جاهز</span>
        </div>
        {primaryAnalysis.warningCount > 0 && (
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-bold text-amber-700">{primaryAnalysis.warningCount}</span>
            <span className="text-xs text-slate-400">تحذيرات</span>
          </div>
        )}
        {primaryAnalysis.errorCount > 0 && (
          <div className="flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-bold text-red-700">{primaryAnalysis.errorCount}</span>
            <span className="text-xs text-slate-400">أخطاء</span>
          </div>
        )}
      </div>

      {/* Entity cards */}
      <div className="space-y-3">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} className="p-4 sm:p-5 overflow-hidden">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-lg shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900">{card.label}</h3>
                    <span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
                      {card.count}
                    </span>
                    {card.newCount > 0 && card.newCount !== card.count && (
                      <span className="flex items-center gap-0.5 px-2 py-0.5 bg-green-100 rounded-full text-xs font-bold text-green-700">
                        <Plus className="w-3 h-3" />
                        {card.newCount} جديد
                      </span>
                    )}
                  </div>

                  {/* Names list */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {card.names.slice(0, 6).map((name, i) => (
                      <span
                        key={i}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium ${card.bgColor} text-slate-700`}
                        dir="auto"
                      >
                        {name}
                      </span>
                    ))}
                    {card.names.length > 6 && (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-500">
                        +{card.names.length - 6} أخرى
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}

        {/* Errors Detail Card */}
        {primaryAnalysis.errorCount > 0 && (
          <Card className="p-4 sm:p-5 overflow-hidden border-red-100 bg-red-50/50">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="w-5 h-5 text-red-500" />
              <h3 className="font-bold text-red-900">تفاصيل الأخطاء</h3>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {primaryAnalysis.previewRows
                .filter((r) => r.status === 'error')
                .slice(0, 10)
                .map((row) => (
                  <div key={row.index} className="text-sm bg-white border border-red-100 rounded-lg p-3">
                    <div className="font-semibold text-red-800 mb-1">
                      سجل #{row.index + 1}
                    </div>
                    <ul className="list-disc list-inside text-red-600 text-xs space-y-1">
                      {row.messages.map((msg, i) => (
                        <li key={i}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              {primaryAnalysis.errorCount > 10 && (
                <div className="text-center text-xs text-red-500 font-medium pt-2">
                  + {primaryAnalysis.errorCount - 10} أخطاء أخرى
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Import order note */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-600">ترتيب الاستيراد</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          سيتم إنشاء القاعات والمدربين أولاً، ثم الفرق مع ربطها تلقائياً بالمدربين والقاعات.
        </p>
      </div>

      {/* Import action — big inline button */}
      <button
        onClick={onConfirmImport}
        disabled={totalRecords === 0}
        className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-amber-200/50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg flex items-center justify-center gap-2"
      >
        <Sparkles className="w-5 h-5" />
        استيراد {totalRecords} سجل
      </button>

      <button
        onClick={onBack}
        className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors py-3"
      >
        <ArrowLeft className="w-4 h-4" />
        رجوع
      </button>
    </div>
  )
}
