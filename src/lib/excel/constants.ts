import type { TableSchema, ImportableTable } from './types'

export const TABLE_SCHEMAS: TableSchema[] = [
  {
    key: 'classes',
    label: 'الفرق',
    icon: 'Users',
    fields: [
      { key: 'name_ar', label: 'اسم الفريق', type: 'text', required: true },
      { key: 'name_he', label: 'اسم الفريق (عبري)', type: 'text', required: false },
      { key: 'name_en', label: 'اسم الفريق (إنجليزي)', type: 'text', required: false },
      { key: 'trainer_id', label: 'المدرب', type: 'fk', required: false, fkTable: 'trainers', fkDisplayField: 'name_ar' },
      { key: 'hall_id', label: 'القاعة', type: 'fk', required: false, fkTable: 'halls', fkDisplayField: 'name_ar' },
      { key: 'schedule_info', label: 'الجدول', type: 'text', required: false },
    ],
  },
  {
    key: 'trainers',
    label: 'المدربين',
    icon: 'Dumbbell',
    fields: [
      { key: 'name_ar', label: 'الاسم', type: 'text', required: true },
      { key: 'name_he', label: 'الاسم (عبري)', type: 'text', required: false },
      { key: 'name_en', label: 'الاسم (إنجليزي)', type: 'text', required: false },
      { key: 'phone', label: 'الهاتف', type: 'text', required: false },
      { key: 'gender', label: 'الجنس', type: 'text', required: false },
    ],
  },
  {
    key: 'trainees',
    label: 'اللاعبين',
    icon: 'User',
    fields: [
      { key: 'name_ar', label: 'الاسم', type: 'text', required: true },
      { key: 'name_he', label: 'الاسم (عبري)', type: 'text', required: false },
      { key: 'name_en', label: 'الاسم (إنجليزي)', type: 'text', required: false },
      { key: 'phone', label: 'الهاتف', type: 'text', required: false },
      { key: 'jersey_number', label: 'رقم القميص', type: 'number', required: false },
      { key: 'class_id', label: 'الفريق', type: 'fk', required: false, fkTable: 'classes', fkDisplayField: 'name_ar' },
      { key: 'gender', label: 'الجنس', type: 'text', required: false },
      { key: 'amount_paid', label: 'المبلغ المدفوع', type: 'number', required: false },
    ],
  },
  {
    key: 'halls',
    label: 'القاعات',
    icon: 'Building2',
    fields: [
      { key: 'name_ar', label: 'اسم القاعة', type: 'text', required: true },
      { key: 'name_he', label: 'اسم القاعة (عبري)', type: 'text', required: false },
      { key: 'name_en', label: 'اسم القاعة (إنجليزي)', type: 'text', required: false },
    ],
  },
]

export function getTableSchema(table: ImportableTable): TableSchema | undefined {
  return TABLE_SCHEMAS.find(t => t.key === table)
}

// Keyword hints for auto-mapping Excel column headers to DB fields
// Keys are DB field names, values are arrays of keywords in AR/HE/EN
export const MAPPING_HINTS: Record<string, Record<string, string[]>> = {
  classes: {
    name_ar: ['קבוצה', 'فريق', 'team', 'اسم الفريق', 'שם', 'group', 'class'],
    name_he: ['קבוצה', 'team', 'שם'],
    name_en: ['team', 'group', 'class', 'name'],
    trainer_id: ['מאמן', 'مدرب', 'trainer', 'coach', 'مدرّب'],
    hall_id: ['אולם', 'قاعة', 'hall', 'venue', 'ملعب'],
    schedule_info: ['יומן', 'لوز', 'schedule', 'جدول', 'مواعيد', 'توقيت', 'أوقات'],
  },
  trainers: {
    name_ar: ['שם', 'اسم', 'name', 'מאמן', 'مدرب', 'trainer'],
    name_he: ['שם', 'name'],
    name_en: ['name', 'trainer'],
    phone: ['טלפון', 'هاتف', 'phone', 'رقم', 'tel', 'mobile', 'جوال'],
    gender: ['מין', 'جنس', 'gender', 'sex'],
  },
  trainees: {
    name_ar: ['שם', 'اسم', 'name', 'لاعب', 'שחקן', 'player', 'trainee'],
    name_he: ['שם', 'name', 'שחקן'],
    name_en: ['name', 'player', 'trainee'],
    phone: ['טלפון', 'هاتف', 'phone', 'رقم', 'tel', 'mobile', 'جوال'],
    jersey_number: ['מספר', 'رقم القميص', 'jersey', '#', 'number', 'מספר חולצה'],
    class_id: ['קבוצה', 'فريق', 'team', 'class', 'group'],
    gender: ['מין', 'جنس', 'gender', 'sex'],
    amount_paid: ['תשלום', 'مبلغ', 'payment', 'amount', 'paid', 'دفع'],
  },
  halls: {
    name_ar: ['שם', 'اسم', 'name', 'אולם', 'قاعة', 'hall'],
    name_he: ['שם', 'name', 'אולם'],
    name_en: ['name', 'hall', 'venue'],
  },
}

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const ACCEPTED_FILE_TYPES = ['.xlsx', '.xls', '.csv']
export const BATCH_SIZE = 10
