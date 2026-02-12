'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, FileSpreadsheet } from 'lucide-react'
import Link from 'next/link'

import { FileUploadStep } from './FileUploadStep'
import { SheetSelectStep } from './SheetSelectStep'
import { ColumnMappingStep } from './ColumnMappingStep'
import { DataPreviewStep } from './DataPreviewStep'
import { ResolveTrainersStep } from './ResolveTrainersStep'
import type { UnresolvedTrainer } from './ResolveTrainersStep'
import { ImportProgressStep } from './ImportProgressStep'

import { transformAllRows, getImportableRecords } from '@/lib/excel/transformer'
import { bulkImportRecords, createTrainersForImport } from '@/app/actions'
import { useToast } from '@/components/ui/Toast'
import { BATCH_SIZE } from '@/lib/excel/constants'

import type { ParsedWorkbook, ParsedSheet, ColumnMapping, ImportableTable, ImportResult, PreviewRow, RefData } from '@/lib/excel/types'

type WizardStep = 'upload' | 'sheet' | 'mapping' | 'preview' | 'resolve' | 'import'

interface ImportWizardProps {
  locale: string
  refData: RefData
}

export function ImportWizard({ locale, refData }: ImportWizardProps) {
  const router = useRouter()
  const { toast } = useToast()

  // Wizard state
  const [step, setStep] = useState<WizardStep>('upload')
  const [workbook, setWorkbook] = useState<ParsedWorkbook | null>(null)
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0)
  const [targetTable, setTargetTable] = useState<ImportableTable | null>(null)
  const [mappings, setMappings] = useState<ColumnMapping[]>([])
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([])

  // Import state
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const selectedSheet: ParsedSheet | null = workbook?.sheets[selectedSheetIndex] ?? null

  // Extract unresolved trainer names from preview rows
  const unresolvedTrainers = useMemo((): UnresolvedTrainer[] => {
    const nameCount = new Map<string, number>()
    for (const row of previewRows) {
      const unresolvedName = row.transformed._unresolved_trainer_id
      if (unresolvedName && typeof unresolvedName === 'string') {
        nameCount.set(unresolvedName, (nameCount.get(unresolvedName) || 0) + 1)
      }
    }
    return Array.from(nameCount.entries()).map(([name, count]) => ({
      name,
      phone: '',
      usedByRows: count,
    }))
  }, [previewRows])

  // Step 1: File parsed
  const handleFileParsed = useCallback((wb: ParsedWorkbook) => {
    setWorkbook(wb)
    if (wb.sheets.length === 1) {
      setSelectedSheetIndex(0)
      setStep('mapping')
    } else {
      setStep('sheet')
    }
  }, [])

  // Step 2: Sheet selected
  const handleSheetSelect = useCallback((index: number) => {
    setSelectedSheetIndex(index)
    setStep('mapping')
  }, [])

  // Step 3: Mapping confirmed
  const handleMappingConfirm = useCallback((table: ImportableTable, columnMappings: ColumnMapping[]) => {
    setTargetTable(table)
    setMappings(columnMappings)

    const sheet = workbook?.sheets[selectedSheetIndex]
    if (sheet) {
      const rows = transformAllRows(sheet.rows, columnMappings, table, refData)
      setPreviewRows(rows)
    }
    setStep('preview')
  }, [workbook, selectedSheetIndex, refData])

  // Step 4: Preview confirmed → check if we need to resolve trainers
  const handlePreviewConfirm = useCallback(() => {
    if (unresolvedTrainers.length > 0 && targetTable === 'classes') {
      setStep('resolve')
    } else {
      startImport()
    }
  }, [unresolvedTrainers, targetTable])

  // Step 4b: Trainers resolved → create them then import
  const handleTrainersResolved = useCallback(async (resolvedTrainers: UnresolvedTrainer[]) => {
    setStep('import')
    setIsImporting(true)
    setProgress(0)

    // Phase 1: Create new trainers
    const toCreate = resolvedTrainers.filter((t) => t.phone.trim().length >= 9)
    if (toCreate.length > 0) {
      const res = await createTrainersForImport(
        toCreate.map((t) => ({ name: t.name, phone: t.phone }))
      )

      if (res.errors.length > 0) {
        toast(`أخطاء في إنشاء المدربين: ${res.errors.join(', ')}`, 'error')
      }

      // Phase 2: Patch preview rows with newly created trainer IDs
      if (Object.keys(res.nameToId).length > 0) {
        setPreviewRows((prev) =>
          prev.map((row) => {
            const unresolvedName = row.transformed._unresolved_trainer_id
            if (unresolvedName && typeof unresolvedName === 'string' && res.nameToId[unresolvedName]) {
              return {
                ...row,
                transformed: {
                  ...row.transformed,
                  trainer_id: res.nameToId[unresolvedName],
                  _display_trainer_id: unresolvedName,
                },
                // Upgrade from warning to valid if no other issues
                status: row.messages.length <= 1 ? 'valid' : row.status,
                messages: row.messages.filter((m) => !m.includes(unresolvedName)),
              }
            }
            return row
          })
        )
      }

      const createdCount = Object.keys(res.nameToId).length
      if (createdCount > 0) {
        toast(`تم إنشاء ${createdCount} مدرب جديد`, 'success')
      }
    }

    setProgress(10) // 10% for trainer creation phase

    // Phase 3: Now import the actual records (use latest previewRows via callback)
    await doImport()
  }, [toast])

  // The actual import logic, extracted so both paths can use it
  const doImport = useCallback(async () => {
    if (!targetTable) return

    // Need to get latest previewRows inside the callback
    // Use a ref-like approach by reading from state updater
    let currentRows: PreviewRow[] = []
    setPreviewRows((prev) => {
      currentRows = prev
      return prev
    })

    const records = getImportableRecords(currentRows, true)
    const total = records.length

    if (total === 0) {
      toast('لا توجد سجلات صالحة للاستيراد', 'warning')
      setIsImporting(false)
      return
    }

    const allErrors: ImportResult['errors'] = []
    let inserted = 0
    const baseProgress = 10 // account for trainer creation phase

    for (let i = 0; i < total; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE)
      const res = await bulkImportRecords(targetTable, batch)

      if (res.results) {
        inserted += res.results.inserted
        allErrors.push(...res.results.errors.map((e) => ({
          row: e.row + i,
          status: 'error' as const,
          error: e.error,
        })))
      }

      setProgress(Math.min(baseProgress + ((i + batch.length) / total) * (100 - baseProgress), 100))
    }

    const result: ImportResult = {
      inserted,
      skipped: total - inserted - allErrors.length,
      errors: allErrors,
      total,
    }

    setImportResult(result)
    setIsImporting(false)
    setProgress(100)

    if (allErrors.length === 0) {
      toast(`تم استيراد ${inserted} سجل بنجاح!`, 'success')
    } else {
      toast(`تم استيراد ${inserted} سجل مع ${allErrors.length} أخطاء`, 'warning')
    }
  }, [targetTable, toast])

  // Direct import (no trainer resolution needed)
  const startImport = useCallback(async () => {
    setStep('import')
    setIsImporting(true)
    setProgress(10)
    await doImport()
  }, [doImport])

  // Reset wizard
  const handleReset = useCallback(() => {
    setStep('upload')
    setWorkbook(null)
    setSelectedSheetIndex(0)
    setTargetTable(null)
    setMappings([])
    setPreviewRows([])
    setImportResult(null)
    setProgress(0)
  }, [])

  // Step indicators — resolve step only shown when needed
  const stepsList = useMemo(() => {
    const base: { key: WizardStep; label: string }[] = [
      { key: 'upload', label: 'رفع' },
      { key: 'sheet', label: 'ورقة' },
      { key: 'mapping', label: 'تعيين' },
      { key: 'preview', label: 'معاينة' },
    ]
    if (unresolvedTrainers.length > 0 && targetTable === 'classes') {
      base.push({ key: 'resolve', label: 'مدربون' })
    }
    base.push({ key: 'import', label: 'استيراد' })
    return base
  }, [unresolvedTrainers, targetTable])

  const currentStepIndex = stepsList.findIndex((s) => s.key === step)

  return (
    <div>
      {/* Header — compact on mobile */}
      <header className="mb-6 sm:mb-8 flex items-start sm:items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-xs sm:text-sm font-bold mb-3 shadow-sm border border-amber-200">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>استيراد البيانات</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            استيراد من <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">Excel</span>
          </h1>
          {workbook && (
            <p className="text-sm text-slate-500 mt-1 truncate">{workbook.fileName}</p>
          )}
        </div>
        <Link
          href={`/${locale}/head-coach`}
          className="flex items-center gap-2 bg-white/60 backdrop-blur-md px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-white/50 shadow-lg text-slate-600 hover:text-amber-600 hover:bg-white transition-all group shrink-0"
        >
          <span className="font-bold text-sm sm:text-base hidden sm:inline">العودة</span>
          <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        </Link>
      </header>

      {/* Progress Steps — smaller on mobile */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-6 sm:mb-10">
        {stepsList.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1 sm:gap-2">
            <div className={`
              w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all
              ${i <= currentStepIndex
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-400'
              }
            `}>
              {i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:inline ${
              i <= currentStepIndex ? 'text-amber-700' : 'text-gray-400'
            }`}>
              {s.label}
            </span>
            {i < stepsList.length - 1 && (
              <div className={`w-4 sm:w-8 h-0.5 rounded-full ${
                i < currentStepIndex ? 'bg-amber-400' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25 }}
        >
          {step === 'upload' && (
            <FileUploadStep onParsed={handleFileParsed} />
          )}

          {step === 'sheet' && workbook && (
            <SheetSelectStep
              sheets={workbook.sheets}
              onSelect={handleSheetSelect}
            />
          )}

          {step === 'mapping' && selectedSheet && (
            <ColumnMappingStep
              sheet={selectedSheet}
              refData={refData}
              onConfirm={handleMappingConfirm}
              onBack={() => {
                if (workbook && workbook.sheets.length > 1) {
                  setStep('sheet')
                } else {
                  setStep('upload')
                }
              }}
            />
          )}

          {step === 'preview' && targetTable && (
            <DataPreviewStep
              previewRows={previewRows}
              targetTable={targetTable}
              onConfirmImport={handlePreviewConfirm}
              onBack={() => setStep('mapping')}
            />
          )}

          {step === 'resolve' && (
            <ResolveTrainersStep
              unresolvedTrainers={unresolvedTrainers}
              onConfirm={handleTrainersResolved}
              onBack={() => setStep('preview')}
            />
          )}

          {step === 'import' && (
            <ImportProgressStep
              result={importResult}
              isImporting={isImporting}
              progress={progress}
              onDone={() => router.push(`/${locale}/head-coach`)}
              onReset={handleReset}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
