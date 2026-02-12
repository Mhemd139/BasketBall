'use client'

import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, CheckCircle2, AlertCircle, MinusCircle, Columns3, Database, ChevronDown } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { TABLE_SCHEMAS } from '@/lib/excel/constants'
import { autoMapColumns } from '@/lib/excel/mapper'
import type { ImportableTable, ColumnMapping, ParsedSheet, RefData } from '@/lib/excel/types'

interface ColumnMappingStepProps {
  sheet: ParsedSheet
  refData: RefData
  onConfirm: (table: ImportableTable, mappings: ColumnMapping[]) => void
  onBack: () => void
}

export function ColumnMappingStep({ sheet, refData, onConfirm, onBack }: ColumnMappingStepProps) {
  const [selectedTable, setSelectedTable] = useState<ImportableTable | null>(null)
  const [mappings, setMappings] = useState<ColumnMapping[]>([])

  useEffect(() => {
    if (selectedTable) {
      const autoMapped = autoMapColumns(sheet.headers, selectedTable)
      setMappings(autoMapped)
    }
  }, [selectedTable, sheet.headers])

  const tableSchema = useMemo(
    () => TABLE_SCHEMAS.find((t) => t.key === selectedTable),
    [selectedTable]
  )

  const sampleValues = useMemo(() => {
    const samples: Record<string, string> = {}
    for (const header of sheet.headers) {
      const firstNonEmpty = sheet.rows.find((row) => {
        const val = row[header]
        return val != null && String(val).trim() !== ''
      })
      samples[header] = firstNonEmpty ? String(firstNonEmpty[header]).slice(0, 40) : '—'
    }
    return samples
  }, [sheet])

  const handleMappingChange = (excelColumn: string, dbField: string | null) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.excelColumn === excelColumn
          ? { ...m, dbField, confidence: dbField ? 100 : 0 }
          : m
      )
    )
  }

  const mappedCount = mappings.filter((m) => m.dbField).length

  // Table selection view
  if (!selectedTable) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">اختر الجدول الهدف</h2>
          <p className="text-sm text-slate-500 mt-2">أين تريد استيراد البيانات؟</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {TABLE_SCHEMAS.map((schema) => (
            <Card
              key={schema.key}
              interactive
              onClick={() => setSelectedTable(schema.key)}
              className="p-4 sm:p-6 flex flex-col items-center text-center gap-2 sm:gap-3 group cursor-pointer hover:bg-amber-50/50 active:scale-[0.97] transition-all"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-amber-700 transition-transform group-hover:scale-110">
                <Database className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">{schema.label}</h3>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">{schema.fields.length} حقول</p>
              </div>
            </Card>
          ))}
        </div>

        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          رجوع
        </button>
      </div>
    )
  }

  // Column mapping view
  return (
    <div className="space-y-5">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-2xl font-bold text-slate-900">تعيين الأعمدة</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {mappedCount}/{sheet.headers.length} معيّنة → <span className="font-medium text-amber-600">{tableSchema?.label}</span>
          </p>
        </div>
        <button
          onClick={() => setSelectedTable(null)}
          className="text-xs sm:text-sm text-slate-500 hover:text-slate-700 font-medium shrink-0 py-1 px-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          تغيير الجدول
        </button>
      </div>

      <div className="space-y-3">
        {mappings.map((mapping) => (
          <div
            key={mapping.excelColumn}
            className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 shadow-sm"
          >
            {/* Mobile: stacked layout, Desktop: horizontal */}
            <div className="flex items-center gap-3 mb-2 sm:mb-0">
              {/* Confidence indicator */}
              <div className="shrink-0">
                {mapping.dbField ? (
                  mapping.confidence >= 70 ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  )
                ) : (
                  <MinusCircle className="w-5 h-5 text-gray-300" />
                )}
              </div>

              {/* Excel column info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Columns3 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="font-semibold text-slate-800 text-sm truncate">{mapping.excelColumn}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate" dir="auto">
                  {sampleValues[mapping.excelColumn]}
                </p>
              </div>
            </div>

            {/* DB field dropdown — full width on mobile */}
            <div className="relative mt-2">
              <select
                value={mapping.dbField || ''}
                onChange={(e) => handleMappingChange(mapping.excelColumn, e.target.value || null)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium bg-slate-50 focus:ring-2 focus:ring-amber-500 focus:bg-white outline-none appearance-none transition-colors"
              >
                <option value="">⊘ تخطي هذا العمود</option>
                {tableSchema?.fields.map((field) => (
                  <option key={field.key} value={field.key}>
                    {field.label} {field.required ? '*' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom actions — sticky on mobile */}
      <div className="flex items-center justify-between pt-4 pb-2 sticky bottom-0 bg-slate-50/95 backdrop-blur-sm -mx-4 px-4 sm:static sm:bg-transparent sm:backdrop-blur-none sm:mx-0 sm:px-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          رجوع
        </button>

        <button
          onClick={() => onConfirm(selectedTable, mappings)}
          disabled={mappedCount === 0}
          className="px-5 sm:px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-amber-200 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          معاينة البيانات
        </button>
      </div>
    </div>
  )
}
