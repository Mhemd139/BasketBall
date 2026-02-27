'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { exportTableData } from '@/app/actions'
import { createExcelWorkbook, downloadWorkbook } from '@/lib/excel/exporter'
import { useToast } from '@/components/ui/Toast'
import type { ImportableTable } from '@/lib/excel/types'

interface ExportButtonProps {
  table: ImportableTable
  filename: string
  filters?: Record<string, string>
  className?: string
  label?: string
}

export function ExportButton({ table, filename, filters, className, label = 'تصدير Excel' }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleExport = async () => {
    setLoading(true)
    try {
      const res = await exportTableData(table, filters)
      if (res.success && res.data) {
        const wb = await createExcelWorkbook(res.data, table)
        await downloadWorkbook(wb, filename)
        toast('تم تصدير البيانات بنجاح', 'success')
      } else {
        toast(res.error || 'فشل التصدير', 'error')
      }
    } catch {
      toast('حدث خطأ أثناء التصدير', 'error')
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className={className || 'flex items-center gap-1.5 px-3 py-2 bg-white/60 backdrop-blur-md border border-white/50 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:text-green-600 hover:bg-green-50 active:scale-[0.97] shadow-sm transition-all'}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {label}
    </button>
  )
}
