'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, FileSpreadsheet, AlertCircle, X } from 'lucide-react'
import { parseExcelFile } from '@/lib/excel/parser'
import { MAX_FILE_SIZE, ACCEPTED_FILE_TYPES } from '@/lib/excel/constants'
import type { ParsedWorkbook } from '@/lib/excel/types'

interface FileUploadStepProps {
  onParsed: (workbook: ParsedWorkbook) => void
}

export function FileUploadStep({ onParsed }: FileUploadStepProps) {
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [parsing, setParsing] = useState(false)
  const [fileName, setFileName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `الملف كبير جداً (${(file.size / 1024 / 1024).toFixed(1)}MB). الحد الأقصى 5MB`
    }
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ACCEPTED_FILE_TYPES.includes(ext)) {
      return `نوع الملف غير مدعوم. الأنواع المقبولة: ${ACCEPTED_FILE_TYPES.join(', ')}`
    }
    return null
  }, [])

  const handleFile = useCallback(async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setParsing(true)
    setFileName(file.name)

    try {
      const workbook = await parseExcelFile(file)
      onParsed(workbook)
    } catch (err: any) {
      setError(`فشل في قراءة الملف: ${err.message}`)
      setParsing(false)
    }
  }, [validateFile, onParsed])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
  }, [])

  return (
    <div className="space-y-5">
      <div className="text-center mb-4 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">رفع ملف Excel</h2>
        <p className="text-sm text-slate-500 mt-1.5">اسحب الملف هنا أو اضغط لاختيار ملف</p>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center cursor-pointer
          transition-all duration-300 min-h-[200px] flex items-center justify-center
          ${dragging
            ? 'border-amber-500 bg-amber-50/50 scale-[1.02]'
            : 'border-gray-200 hover:border-amber-400 hover:bg-amber-50/30 active:bg-amber-50/50'
          }
          ${parsing ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          aria-label="اختر ملف Excel أو CSV"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />

        {parsing ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-amber-100 rounded-2xl flex items-center justify-center animate-pulse">
              <FileSpreadsheet className="w-8 h-8 text-amber-600" />
            </div>
            <p className="text-lg font-semibold text-slate-700">جاري قراءة {fileName}...</p>
            <div className="w-48 h-1.5 bg-gray-200 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full animate-[progress_1.5s_ease-in-out_infinite] w-[60%]" />
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <div className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl flex items-center justify-center transition-all ${
              dragging ? 'bg-amber-200 scale-110' : 'bg-slate-100'
            }`}>
              <Upload className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors ${dragging ? 'text-amber-600' : 'text-slate-400'}`} />
            </div>
            <div>
              <p className="text-base sm:text-lg font-semibold text-slate-700">
                {dragging ? 'أفلت الملف هنا' : 'اضغط لاختيار ملف'}
              </p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                أو <span className="text-amber-600 font-medium">اسحب الملف هنا</span>
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-400">
              <span className="px-2 py-1 bg-slate-100 rounded-md">.xlsx</span>
              <span className="px-2 py-1 bg-slate-100 rounded-md">.xls</span>
              <span className="px-2 py-1 bg-slate-100 rounded-md">.csv</span>
              <span>حد 5MB</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-sm">{error}</p>
          </div>
          <button onClick={() => setError('')} aria-label="إغلاق" className="mr-auto">
            <X className="w-4 h-4 text-red-400 hover:text-red-600" />
          </button>
        </div>
      )}
    </div>
  )
}
