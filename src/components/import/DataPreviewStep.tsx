'use client'

import { useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import type { PreviewRow, ImportableTable } from '@/lib/excel/types'
import { getTableSchema } from '@/lib/excel/constants'

interface DataPreviewStepProps {
  previewRows: PreviewRow[]
  targetTable: ImportableTable
  onConfirmImport: () => void
  onBack: () => void
}

type FilterMode = 'all' | 'valid' | 'warning' | 'error'

export function DataPreviewStep({ previewRows, targetTable, onConfirmImport, onBack }: DataPreviewStepProps) {
  const [filter, setFilter] = useState<FilterMode>('all')

  const schema = getTableSchema(targetTable)
  const mappedFields = useMemo(() => {
    if (!schema) return []
    return schema.fields.filter((field) =>
      previewRows.some((row) => row.transformed[field.key] != null)
    )
  }, [schema, previewRows])

  // Helper: show display name for FK fields, raw value otherwise
  const getCellDisplay = (row: PreviewRow, fieldKey: string): string | null => {
    const displayVal = row.transformed[`_display_${fieldKey}`]
    if (displayVal != null) return String(displayVal)
    const val = row.transformed[fieldKey]
    if (val != null) return String(val)
    return null
  }

  const stats = useMemo(() => ({
    valid: previewRows.filter((r) => r.status === 'valid').length,
    warning: previewRows.filter((r) => r.status === 'warning').length,
    error: previewRows.filter((r) => r.status === 'error').length,
    total: previewRows.length,
  }), [previewRows])

  const filteredRows = useMemo(() => {
    if (filter === 'all') return previewRows
    return previewRows.filter((r) => r.status === filter)
  }, [previewRows, filter])

  const importableCount = stats.valid + stats.warning

  const StatusIcon = ({ status }: { status: PreviewRow['status'] }) => {
    if (status === 'valid') return <CheckCircle2 className="w-4 h-4 text-green-500" />
    if (status === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-500" />
    return <XCircle className="w-4 h-4 text-red-500" />
  }

  return (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">معاينة البيانات</h2>
        <p className="text-sm text-slate-500 mt-1">تحقق من البيانات قبل الاستيراد</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <button
          onClick={() => setFilter(filter === 'valid' ? 'all' : 'valid')}
          className={`p-3 sm:p-4 rounded-2xl border transition-all text-center active:scale-[0.97] ${
            filter === 'valid' ? 'border-green-300 bg-green-50' : 'border-gray-100 bg-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mx-auto mb-1" />
          <div className="text-xl sm:text-2xl font-black text-green-600">{stats.valid}</div>
          <div className="text-[10px] sm:text-xs text-slate-500">جاهز</div>
        </button>
        <button
          onClick={() => setFilter(filter === 'warning' ? 'all' : 'warning')}
          className={`p-3 sm:p-4 rounded-2xl border transition-all text-center active:scale-[0.97] ${
            filter === 'warning' ? 'border-amber-300 bg-amber-50' : 'border-gray-100 bg-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 mx-auto mb-1" />
          <div className="text-xl sm:text-2xl font-black text-amber-600">{stats.warning}</div>
          <div className="text-[10px] sm:text-xs text-slate-500">تحذيرات</div>
        </button>
        <button
          onClick={() => setFilter(filter === 'error' ? 'all' : 'error')}
          className={`p-3 sm:p-4 rounded-2xl border transition-all text-center active:scale-[0.97] ${
            filter === 'error' ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-white'
          }`}
        >
          <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mx-auto mb-1" />
          <div className="text-xl sm:text-2xl font-black text-red-600">{stats.error}</div>
          <div className="text-[10px] sm:text-xs text-slate-500">أخطاء</div>
        </button>
      </div>

      {/* Mobile: Card view / Desktop: Table view */}
      {/* Mobile card list */}
      <div className="space-y-2 sm:hidden">
        {filteredRows.slice(0, 30).map((row) => (
          <div
            key={row.index}
            className={`rounded-2xl border p-3 ${
              row.status === 'error' ? 'border-red-200 bg-red-50/50' :
              row.status === 'warning' ? 'border-amber-200 bg-amber-50/30' :
              'border-gray-100 bg-white'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <StatusIcon status={row.status} />
              <span className="text-xs text-slate-400 font-mono">#{row.index + 1}</span>
            </div>
            <div className="space-y-1.5">
              {mappedFields.slice(0, 4).map((field) => {
                const display = getCellDisplay(row, field.key)
                return (
                  <div key={field.key} className="flex items-baseline gap-2">
                    <span className="text-[10px] text-slate-400 font-medium shrink-0 w-20 truncate">{field.label}</span>
                    <span className="text-sm text-slate-700 truncate" dir="auto">
                      {display ?? '—'}
                    </span>
                  </div>
                )
              })}
              {mappedFields.length > 4 && (
                <p className="text-[10px] text-slate-400">+{mappedFields.length - 4} حقول أخرى</p>
              )}
            </div>
            {row.messages.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                {row.messages.map((msg, i) => (
                  <p key={i} className={`text-[11px] ${row.status === 'error' ? 'text-red-600' : 'text-amber-600'}`}>
                    {msg}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
        {filteredRows.length > 30 && (
          <p className="text-center text-xs text-slate-400 py-2">
            عرض 30 من {filteredRows.length} سجل
          </p>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100">
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase w-12">#</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase w-12">حالة</th>
                {mappedFields.map((field) => (
                  <th key={field.key} className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase whitespace-nowrap">
                    {field.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRows.slice(0, 50).map((row) => (
                <tr key={row.index} className={`
                  ${row.status === 'error' ? 'bg-red-50/50' : ''}
                  ${row.status === 'warning' ? 'bg-amber-50/30' : ''}
                  hover:bg-slate-50/50 transition-colors
                `}>
                  <td className="px-4 py-3 text-slate-400 text-xs font-mono">{row.index + 1}</td>
                  <td className="px-4 py-3"><StatusIcon status={row.status} /></td>
                  {mappedFields.map((field) => {
                    const display = getCellDisplay(row, field.key)
                    return (
                      <td key={field.key} className="px-4 py-3 text-slate-700 max-w-[200px] truncate" dir="auto">
                        {display ?? <span className="text-slate-300">—</span>}
                      </td>
                    )
                  })}
                  <td className="px-4 py-3">
                    {row.messages.length > 0 && (
                      <div className="space-y-0.5">
                        {row.messages.map((msg, i) => (
                          <p key={i} className={`text-xs ${row.status === 'error' ? 'text-red-600' : 'text-amber-600'}`}>
                            {msg}
                          </p>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredRows.length > 50 && (
          <div className="px-4 py-3 bg-slate-50 text-center text-xs text-slate-500 border-t">
            يتم عرض أول 50 صف من أصل {filteredRows.length}
          </div>
        )}
      </div>

      {/* Bottom actions — sticky on mobile */}
      <div className="flex items-center justify-between pt-4 pb-2 sticky bottom-0 bg-slate-50/95 backdrop-blur-sm -mx-4 px-4 sm:static sm:bg-transparent sm:backdrop-blur-none sm:mx-0 sm:px-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          تعديل التعيين
        </button>

        <button
          onClick={onConfirmImport}
          disabled={importableCount === 0}
          className="px-5 sm:px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-amber-200 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          استيراد {importableCount} سجل
        </button>
      </div>
    </div>
  )
}
