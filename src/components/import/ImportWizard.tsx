'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, FileSpreadsheet } from 'lucide-react'
import Link from 'next/link'

import { FileUploadStep } from './FileUploadStep'
import { SheetSelectStep } from './SheetSelectStep'
import { SmartReviewStep } from './SmartReviewStep'
import { ImportProgressStep } from './ImportProgressStep'

import { analyzeSheet } from '@/lib/excel/analyzer'
import type { SmartAnalysisResult } from '@/lib/excel/analyzer'
import { getImportableRecords } from '@/lib/excel/transformer'
import { bulkImportRecords, createTrainersForImport } from '@/app/actions'
import { useToast } from '@/components/ui/Toast'
import { BATCH_SIZE } from '@/lib/excel/constants'

import type { ParsedWorkbook, ImportableTable, ImportResult, RefData } from '@/lib/excel/types'

type WizardStep = 'upload' | 'sheet' | 'review' | 'import'

/** Dependency order: halls & trainers first, then classes, then trainees */
const IMPORT_ORDER: ImportableTable[] = ['halls', 'trainers', 'classes', 'trainees']

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
  const [analysis, setAnalysis] = useState<SmartAnalysisResult | null>(null)

  // Import state
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  // Step 1: File parsed → auto-analyze
  const handleFileParsed = useCallback((wb: ParsedWorkbook) => {
    setWorkbook(wb)
    if (wb.sheets.length === 1) {
      setSelectedSheetIndex(0)
      // Auto-analyze immediately
      const result = analyzeSheet(wb.sheets[0], refData)
      setAnalysis(result)
      setStep('review')
    } else {
      setStep('sheet')
    }
  }, [refData])

  // Step 2: Sheet selected → auto-analyze
  const handleSheetSelect = useCallback((index: number) => {
    setSelectedSheetIndex(index)
    if (workbook) {
      const result = analyzeSheet(workbook.sheets[index], refData)
      setAnalysis(result)
    }
    setStep('review')
  }, [workbook, refData])

  // Step 3: Smart import → create everything in dependency order
  const handleSmartImport = useCallback(async () => {
    if (!analysis) return

    setStep('import')
    setIsImporting(true)
    setProgress(0)

    const allErrors: ImportResult['errors'] = []
    let totalInserted = 0
    let totalRecords = 0

    // Phase 1: Create new halls (if any)
    const { newHalls, newTrainers, primaryTable, primaryAnalysis } = analysis

    if (newHalls.length > 0) {
      setProgress(5)
      const hallRecords = newHalls.map((h) => ({
        name_ar: h.name,
        name_he: h.name,
        name_en: h.name,
      }))

      for (let i = 0; i < hallRecords.length; i += BATCH_SIZE) {
        const batch = hallRecords.slice(i, i + BATCH_SIZE)
        const res = await bulkImportRecords('halls', batch)
        if (res.results) {
          totalInserted += res.results.inserted
          allErrors.push(
            ...res.results.errors.map((e) => ({
              row: e.row + i,
              status: 'error' as const,
              error: `قاعة: ${e.error}`,
            }))
          )
        }
      }
      totalRecords += hallRecords.length
      toast(`تم إنشاء ${newHalls.length} قاعة`, 'success')
    }

    setProgress(20)

    // Phase 2: Create new trainers (if any)
    if (newTrainers.length > 0) {
      const trainerPayloads = newTrainers.map((t, i) => ({
        name: t.name,
        // Use real phone from Excel, or generate unique placeholder
        phone: t.phone || `050${String(9000 + i).padStart(7, '0')}`,
      }))

      const res = await createTrainersForImport(trainerPayloads)

      if (res.errors.length > 0) {
        toast(`أخطاء في إنشاء المدربين: ${res.errors.join(', ')}`, 'error')
        allErrors.push(
          ...res.errors.map((e, i) => ({
            row: i,
            status: 'error' as const,
            error: e,
          }))
        )
      }

      const createdCount = Object.keys(res.nameToId).length
      totalInserted += createdCount
      totalRecords += trainerPayloads.length

      if (createdCount > 0) {
        toast(`تم إنشاء ${createdCount} مدرب جديد`, 'success')

        // Patch preview rows with newly created trainer IDs
        // so the primary table import can reference them
        for (const row of primaryAnalysis.previewRows) {
          const unresolvedName = row.transformed._unresolved_trainer_id
          if (unresolvedName && typeof unresolvedName === 'string' && res.nameToId[unresolvedName]) {
            row.transformed.trainer_id = res.nameToId[unresolvedName]
            row.transformed._display_trainer_id = unresolvedName
          }
        }
      }
    }

    setProgress(40)

    // Phase 3: Import the primary table records
    const records = getImportableRecords(primaryAnalysis.previewRows, true)
    totalRecords += records.length

    if (records.length > 0) {
      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE)
        const res = await bulkImportRecords(primaryTable, batch)

        if (res.results) {
          totalInserted += res.results.inserted
          allErrors.push(
            ...res.results.errors.map((e) => ({
              row: e.row + i,
              status: 'error' as const,
              error: `${primaryAnalysis.label}: ${e.error}`,
            }))
          )
        }

        setProgress(40 + Math.min(((i + batch.length) / records.length) * 60, 60))
      }
    }

    setProgress(100)

    const result: ImportResult = {
      inserted: totalInserted,
      skipped: totalRecords - totalInserted - allErrors.length,
      errors: allErrors,
      total: totalRecords,
    }

    setImportResult(result)
    setIsImporting(false)

    if (allErrors.length === 0) {
      toast(`تم استيراد ${totalInserted} سجل بنجاح!`, 'success')
    } else {
      toast(`تم استيراد ${totalInserted} سجل مع ${allErrors.length} أخطاء`, 'warning')
    }
  }, [analysis, toast])

  // Reset wizard
  const handleReset = useCallback(() => {
    setStep('upload')
    setWorkbook(null)
    setSelectedSheetIndex(0)
    setAnalysis(null)
    setImportResult(null)
    setProgress(0)
  }, [])

  // Step indicators
  const stepsList = useMemo(() => {
    const base: { key: WizardStep; label: string }[] = [
      { key: 'upload', label: 'رفع' },
      { key: 'sheet', label: 'ورقة' },
      { key: 'review', label: 'مراجعة' },
      { key: 'import', label: 'استيراد' },
    ]
    return base
  }, [])

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

          {step === 'review' && analysis && (
            <SmartReviewStep
              analysis={analysis}
              onConfirmImport={handleSmartImport}
              onBack={() => {
                if (workbook && workbook.sheets.length > 1) {
                  setStep('sheet')
                } else {
                  setStep('upload')
                }
              }}
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
