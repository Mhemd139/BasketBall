'use client'

import { FileSpreadsheet, Table } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import type { ParsedSheet } from '@/lib/excel/types'

interface SheetSelectStepProps {
  sheets: ParsedSheet[]
  onSelect: (sheetIndex: number) => void
}

export function SheetSelectStep({ sheets, onSelect }: SheetSelectStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900">اختر الورقة</h2>
        <p className="text-slate-500 mt-2">الملف يحتوي على {sheets.length} أوراق</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sheets.map((sheet, index) => (
          <Card
            key={index}
            interactive
            onClick={() => onSelect(index)}
            className="p-6 flex items-center gap-4 group cursor-pointer hover:bg-amber-50/50 transition-all"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-110">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 truncate">{sheet.name}</h3>
              <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                <Table className="w-3.5 h-3.5" />
                <span>{sheet.rowCount} صف</span>
                <span className="text-slate-300">|</span>
                <span>{sheet.headers.length} عمود</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
