'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { searchTrainees, deleteTrainee } from '@/app/actions'
import { useConfirm } from '@/components/ui/ConfirmModal'
import { useToast } from '@/components/ui/Toast'
import { useRouter } from 'next/navigation'
import { Search, Loader2, User, Phone, Users, Trash2 } from 'lucide-react'

interface DeletePlayerModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DeletePlayerModal({ isOpen, onClose }: DeletePlayerModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { confirm } = useConfirm()
  const { toast } = useToast()
  const router = useRouter()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setResults([])
      return
    }
  }, [isOpen])

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const res = await searchTrainees(query)
      if (res.success) {
        setResults(res.trainees || [])
      }
      setSearching(false)
    }, 300)

    return () => clearTimeout(debounceRef.current)
  }, [query])

  const handleDelete = async (trainee: any) => {
    const confirmed = await confirm({
      title: 'حذف اللاعب',
      message: `هل أنت متأكد من حذف ${trainee.name_ar}؟`,
      confirmText: 'حذف',
      cancelText: 'إلغاء',
      variant: 'danger',
    })
    if (!confirmed) return

    setDeletingId(trainee.id)
    const res = await deleteTrainee(trainee.id)
    setDeletingId(null)

    if (res.success) {
      toast('تم حذف اللاعب بنجاح', 'success')
      setResults(prev => prev.filter(t => t.id !== trainee.id))
      router.refresh()
    } else {
      toast(res.error || 'فشل الحذف', 'error')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-white rounded-3xl border-0 shadow-2xl">
        <div className="bg-navy-900 p-6 pt-8 text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <DialogTitle className="relative z-10 text-2xl font-outfit font-bold flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-red-400" />
            {'حذف لاعب'}
          </DialogTitle>
          <p className="text-white/50 text-sm mt-1 relative z-10">{'ابحث عن اللاعب لحذفه'}</p>
        </div>

        <div className="p-5">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              autoFocus
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-red-400 outline-none transition-all text-sm font-bold"
              placeholder="ابحث بالاسم أو رقم الهاتف..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-red-400" />}
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {results.map(trainee => (
              <div
                key={trainee.id}
                className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${trainee.gender === 'female' ? 'bg-pink-50 text-pink-400' : 'bg-slate-100 text-slate-400'}`}>
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 truncate">{trainee.name_ar}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      {trainee.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span dir="ltr">{trainee.phone}</span>
                        </span>
                      )}
                      {trainee.classes && (
                        <span className="flex items-center gap-1 bg-slate-200/60 px-1.5 py-0.5 rounded truncate">
                          <Users className="w-3 h-3" />
                          {trainee.classes.name_ar}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(trainee)}
                  disabled={deletingId === trainee.id}
                  className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors flex-shrink-0 disabled:opacity-40"
                  aria-label={`حذف ${trainee.name_ar}`}
                >
                  {deletingId === trainee.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            ))}

            {query.length >= 2 && !searching && results.length === 0 && (
              <div className="text-center py-10">
                <Search className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-400">لم يتم العثور على لاعبين</p>
              </div>
            )}

            {query.length < 2 && (
              <div className="text-center py-10">
                <Search className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">اكتب حرفين على الأقل للبحث</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
