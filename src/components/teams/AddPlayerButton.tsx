'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { InteractivePlayerModal } from '@/components/players/InteractivePlayerModal'

interface AddPlayerButtonProps {
    classId: string
    locale: string
}

export function AddPlayerButton({ classId, locale }: AddPlayerButtonProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded-full text-xs font-bold hover:bg-indigo-500 transition-colors shadow-sm border border-indigo-500/50 active:scale-95"
            >
                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                {'إضافة'}
            </button>
            <InteractivePlayerModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                locale={locale}
                classId={classId}
            />
        </>
    )
}
