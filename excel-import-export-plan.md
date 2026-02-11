# Excel Import/Export Feature Plan

> **Status:** Planning only. Not yet implemented.

## Overview

Allow head coaches to:
1. **Import** trainees from an Excel file into a specific team
2. **Export** team rosters, attendance, and payment data to Excel

---

## Part A: Import Trainees from Excel

### User Flow

1. Head coach navigates to a team page (e.g., `/teams/[classId]`)
2. Clicks an **"Import from Excel"** button
3. A modal opens with:
   - File upload area (drag & drop + click to browse)
   - Preview table showing parsed rows
   - Column mapping (auto-detected or manual)
   - "Import" button
4. On submit, trainees are created in bulk via server action

### Technical Approach

**Library:** `xlsx` (SheetJS) — client-side parsing, no server upload needed.

```
npm install xlsx
```

**Column mapping expected:**

| Excel Column | DB Field | Required |
|-------------|----------|----------|
| الاسم / Name | `name_ar` (+ `name_en`, `name_he`) | Yes |
| الهاتف / Phone | `phone` | No |
| رقم القميص / Jersey | `jersey_number` | No |
| الجنس / Gender | `gender` | No (default: male) |

**Parsing strategy:**
- Read file client-side using `XLSX.read()`
- Auto-detect header row by looking for known column names (Arabic or English)
- Show preview table with first 5 rows
- Validate: skip empty rows, flag duplicates by phone
- Send parsed data array to server action

### Server Action

```ts
export async function bulkImportTrainees(
    classId: string,
    trainees: { name: string; phone?: string; jersey_number?: number; gender?: string }[]
) {
    // 1. Validate session (headcoach only)
    // 2. For each trainee, call insert_trainee RPC
    // 3. Or create a new bulk_insert_trainees RPC for performance
    // 4. Return { success: true, imported: count, skipped: count }
}
```

### New RPC Function (optional, for bulk performance)

```sql
CREATE OR REPLACE FUNCTION bulk_insert_trainees(p_class_id uuid, p_records jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  inserted_count integer := 0;
  rec jsonb;
BEGIN
  FOR rec IN SELECT * FROM jsonb_array_elements(p_records)
  LOOP
    INSERT INTO trainees (class_id, name_en, name_ar, name_he, phone, jersey_number, gender, is_paid)
    VALUES (
      p_class_id,
      rec->>'name',
      rec->>'name',
      rec->>'name',
      NULLIF(rec->>'phone', ''),
      CASE WHEN rec->>'jersey_number' IS NOT NULL THEN (rec->>'jersey_number')::int ELSE NULL END,
      COALESCE(rec->>'gender', 'male'),
      false
    );
    inserted_count := inserted_count + 1;
  END LOOP;
  RETURN inserted_count;
END;
$$;
```

### UI Component

**File:** `src/components/teams/ExcelImportModal.tsx`

- Drag & drop zone with dotted border
- File type restriction: `.xlsx`, `.xls`, `.csv`
- Preview table: show first 5-10 rows with checkboxes to include/exclude
- Error highlighting: red rows for invalid data
- Progress indicator during import
- Success summary: "X trainees imported, Y skipped"

---

## Part B: Export Data to Excel

### Export Types

| What | Source | File Name |
|------|--------|-----------|
| Team Roster | `trainees` WHERE `class_id = X` | `roster-{teamName}.xlsx` |
| Attendance Report | `attendance` + `events` + `trainees` | `attendance-{teamName}-{month}.xlsx` |
| Payment Report | `payment_logs` + `trainees` | `payments-{teamName}-{season}.xlsx` |

### Technical Approach

**Library:** Same `xlsx` (SheetJS) — generate workbooks client-side from data already loaded.

**Client-side export (simpler, no new API):**
```ts
import * as XLSX from 'xlsx'

function exportToExcel(data: any[], fileName: string) {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    XLSX.writeFile(wb, `${fileName}.xlsx`)
}
```

**Export buttons placement:**
- Team page → "Export Roster" button
- Attendance history → "Export Attendance" button
- Payments page → "Export Payments" button

### Column Formatting for Export

**Roster:**
| Column Header | Source |
|---------------|--------|
| الاسم | `name_ar` |
| الهاتف | `phone` |
| رقم القميص | `jersey_number` |
| الجنس | `gender` |
| حالة الدفع | `is_paid` → "مدفوع" / "غير مدفوع" |
| المبلغ المدفوع | `amount_paid` |

**Attendance:**
| Column Header | Source |
|---------------|--------|
| الاسم | trainee `name_ar` |
| {date1} | status (حاضر/غائب/متأخر) |
| {date2} | ... |
| نسبة الحضور | calculated % |

---

## Implementation Order (when ready)

1. Install `xlsx` package
2. Create `ExcelImportModal.tsx` component
3. Create `bulkImportTrainees` server action (or RPC)
4. Add import button to team page
5. Create export utility function
6. Add export buttons to team, attendance, and payments pages
7. Test with real Excel files (Arabic content, various formats)

## Considerations

- **File size limit:** Cap at 500 rows per import (safety)
- **Duplicate handling:** Check phone numbers against existing trainees, offer to skip or update
- **Encoding:** SheetJS handles UTF-8/Arabic properly
- **No server upload:** All parsing happens client-side, only structured data sent to server action
- **Bundle size:** `xlsx` adds ~300KB gzipped — consider dynamic import (`import('xlsx')`) to avoid impacting initial load
