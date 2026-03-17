'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { normalizePhone } from '@/lib/utils'
import { getSession } from './auth'

export async function getImportRefData() {
  const session = await getSession()
  if (!session || session.role !== 'headcoach') {
    return { trainers: [], halls: [], classes: [] }
  }

  const supabase = await createServerSupabaseClient()

  const [trainersRes, hallsRes, classesRes] = await Promise.all([
    (supabase as any).from('trainers').select('id, name_ar, name_he, name_en, phone').limit(200),
    (supabase as any).from('halls').select('id, name_ar, name_he, name_en').limit(100),
    (supabase as any).from('classes').select('id, name_ar, name_he, name_en').limit(200),
  ])

  return {
    trainers: trainersRes.data || [],
    halls: hallsRes.data || [],
    classes: classesRes.data || [],
  }
}

export async function createTrainersForImport(
  trainers: { name: string; phone: string }[]
): Promise<{ success: boolean; nameToId: Record<string, string>; errors: string[] }> {
  const session = await getSession()
  if (!session || session.role !== 'headcoach') {
    return { success: false, nameToId: {}, errors: ['Unauthorized'] }
  }

  const supabase = await createServerSupabaseClient()
  const nameToId: Record<string, string> = {}
  const errors: string[] = []

  const BATCH = 10
  for (let i = 0; i < trainers.length; i += BATCH) {
    const batch = trainers.slice(i, i + BATCH)
    const results = await Promise.allSettled(
      batch.map(trainer => {
        const cleanPhone = normalizePhone(trainer.phone)
        return (supabase as any).rpc('create_trainer', {
          p_phone: cleanPhone,
          p_name: trainer.name,
        })
      })
    )
    results.forEach((result, idx) => {
      const trainer = batch[idx]
      if (result.status === 'fulfilled') {
        const { data, error } = result.value
        if (error) {
          errors.push(`${trainer.name}: ${error.message}`)
        } else {
          const created = Array.isArray(data) ? data[0] : data
          if (created?.id) nameToId[trainer.name] = created.id
        }
      } else {
        errors.push(`${trainer.name}: ${result.reason?.message || 'Unknown error'}`)
      }
    })
  }

  return { success: errors.length === 0, nameToId, errors }
}

export async function bulkImportRecords(
  table: 'classes' | 'trainers' | 'trainees' | 'halls',
  records: Record<string, unknown>[]
) {
  const session = await getSession()
  if (!session || session.role !== 'headcoach') {
    return { success: false, error: 'Unauthorized', results: null }
  }

  const supabase = await createServerSupabaseClient()
  const results = { inserted: 0, skipped: 0, errors: [] as { row: number; error: string }[] }

  const makeRpcCall = (record: Record<string, unknown>) => {
    switch (table) {
      case 'trainees':
        return (supabase as any).rpc('insert_trainee', {
          p_data: {
            name_ar: record.name_ar || '', name_he: record.name_he || '', name_en: record.name_en || '',
            phone: record.phone || null, jersey_number: record.jersey_number || null,
            class_id: record.class_id || null, is_paid: record.is_paid || false,
            gender: record.gender || 'male', amount_paid: record.amount_paid || 0,
          },
        })
      case 'trainers':
        return (supabase as any).rpc('create_trainer', {
          p_phone: String(record.phone || '0500000000'), p_name: String(record.name_ar || ''),
        })
      case 'classes':
        return (supabase as any).rpc('insert_class', {
          p_data: {
            name_ar: record.name_ar || '', name_he: record.name_he || '', name_en: record.name_en || '',
            trainer_id: record.trainer_id || null, hall_id: record.hall_id || null,
            schedule_info: record.schedule_info || null,
          },
        })
      case 'halls':
        return (supabase as any).rpc('insert_hall', {
          p_data: { name_ar: record.name_ar || '', name_he: record.name_he || '', name_en: record.name_en || '' },
        })
    }
  }

  const BATCH = 10
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH)
    const batchResults = await Promise.allSettled(batch.map(makeRpcCall))
    batchResults.forEach((result, idx) => {
      const rowIndex = i + idx
      if (result.status === 'fulfilled') {
        const { error: rpcError } = result.value
        if (rpcError) {
          results.errors.push({ row: rowIndex, error: rpcError.message })
        } else {
          results.inserted++
        }
      } else {
        results.errors.push({ row: rowIndex, error: result.reason?.message || 'Unknown error' })
      }
    })
  }

  revalidatePath('/[locale]/teams', 'page')
  revalidatePath('/[locale]/trainers', 'page')
  revalidatePath('/[locale]/halls', 'page')
  revalidatePath('/[locale]/head-coach', 'page')

  return { success: true, results }
}

export async function exportTableData(
  table: 'classes' | 'trainers' | 'trainees' | 'halls',
  filters?: Record<string, string>
) {
  const session = await getSession()
  if (!session || session.role !== 'headcoach') {
    return { success: false, error: 'Unauthorized', data: null }
  }

  const supabase = await createServerSupabaseClient()
  const columnMap: Record<string, string> = {
    classes: 'id, name_ar, name_he, name_en, trainer_id, hall_id, created_at',
    trainers: 'id, name_ar, name_he, name_en, phone, gender, role, created_at',
    trainees: 'id, name_ar, name_he, name_en, phone, jersey_number, gender, class_id, is_paid, amount_paid, created_at',
    halls: 'id, name_ar, name_he, name_en, created_at',
  }
  let query = (supabase as any).from(table).select(columnMap[table]).limit(500)

  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value)
    }
  }

  const { data, error } = await query
  if (error) return { success: false, error: error.message, data: null }
  return { success: true, data }
}
