'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { InteractiveEventModal } from '@/components/halls/InteractiveEventModal'

interface ScheduleActionsProps {
  locale: string
}

export function ScheduleActions({ locale }: ScheduleActionsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        aria-label="Add event"
        className="fixed bottom-[88px] md:bottom-8 right-4 md:right-8 w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-[0_8px_30px_rgba(79,70,229,0.3)] flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-50 border border-indigo-400/30"
      >
        <Plus className="w-6 h-6 drop-shadow-md" strokeWidth={2.5} />
      </button>

      <InteractiveEventModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={async (data) => {
          setIsModalOpen(false)
        }}
        locale={locale}
      />
    </>
  )
}
