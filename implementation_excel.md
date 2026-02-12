# Excel Import/Export — Implementation Doc

## Overview
Generic Excel import/export feature for the Basketball Manager app. Head coach can upload any `.xlsx`/`.xls`/`.csv` file, map columns to any database table, preview data, and bulk-import.

## Library
**SheetJS (`xlsx`)** — client-side parsing, zero deps, handles merged cells + Hebrew/Arabic.

## Architecture

```
Excel File (browser)
  → SheetJS parse client-side
  → Auto-map columns (keyword scoring)
  → User confirms mapping
  → Transform data (multi-lang, phone, FK resolution)
  → Preview with validation
  → Send batches to server action
  → Server calls RPC functions
  → revalidatePath
```

## Route
`/[locale]/head-coach/import` — 5-step wizard (Upload → Sheet Select → Column Mapping → Preview → Import)

## File Structure

### Core Library — `src/lib/excel/`
| File | Purpose |
|------|---------|
| `types.ts` | TypeScript interfaces |
| `constants.ts` | Table schemas, mapping hints (AR/HE/EN keywords) |
| `parser.ts` | Parse Excel, resolve merges, forward-fill, detect headers |
| `mapper.ts` | Auto-map columns to DB fields with confidence scoring |
| `transformer.ts` | Multi-lang normalization, phone formatting, type coercion |
| `exporter.ts` | Create + download Excel from DB data |

### Wizard Components — `src/components/import/`
| File | Purpose |
|------|---------|
| `ImportWizard.tsx` | Main state machine, step transitions |
| `FileUploadStep.tsx` | Drag-and-drop upload zone |
| `SheetSelectStep.tsx` | Sheet picker cards |
| `ColumnMappingStep.tsx` | Table selector + column mapping dropdowns |
| `DataPreviewStep.tsx` | Preview table with row validation |
| `ImportProgressStep.tsx` | Progress bar + results |
| `ExportButton.tsx` | Reusable export-to-Excel button |

### Server Actions — `src/app/actions.ts`
- `bulkImportRecords(table, records[])` — batch insert via RPCs
- `exportTableData(table, filters?)` — fetch for export
- `getImportRefData()` — trainers + halls + classes for FK resolution

## Target Tables
- `classes` (teams)
- `trainers`
- `trainees` (players)
- `halls`

## Access
Head coach only (`session.role === 'headcoach'`).
