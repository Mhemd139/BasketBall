'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react'

interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning'
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType>({ confirm: () => Promise.resolve(false) })

export function useConfirm() {
  return useContext(ConfirmContext)
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [loading, setLoading] = useState(false)
  const resolveRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts)
    return new Promise<boolean>(resolve => {
      resolveRef.current = resolve
    })
  }, [])

  const handleConfirm = () => {
    resolveRef.current?.(true)
    setOptions(null)
  }

  const handleCancel = () => {
    resolveRef.current?.(false)
    setOptions(null)
  }

  const isDanger = options?.variant === 'danger'

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {options && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancel}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-sm h-fit p-4 z-[90]"
            >
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden relative">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${
                  isDanger ? 'from-red-400 to-red-600' : 'from-amber-400 to-orange-600'
                }`} />
                <div className="p-8 text-center">
                  <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                    isDanger ? 'bg-red-50' : 'bg-amber-50'
                  }`}>
                    <AlertTriangle className={`w-7 h-7 ${isDanger ? 'text-red-500' : 'text-amber-500'}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{options.title}</h3>
                  <p className="text-gray-500 text-sm mb-6">{options.message}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCancel}
                      className="flex-1 py-3 font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      {options.cancelText || 'إلغاء'}
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={loading}
                      className={`flex-1 py-3 font-bold text-white rounded-xl transition-all flex justify-center items-center gap-2 ${
                        isDanger
                          ? 'bg-gradient-to-r from-red-500 to-red-600 hover:shadow-lg hover:shadow-red-500/30'
                          : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-lg hover:shadow-amber-500/30'
                      }`}
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>{isDanger && <Trash2 className="w-5 h-5" />} {options.confirmText || 'تأكيد'}</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  )
}
