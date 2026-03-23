'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { EditTrainerProfileModal } from './EditTrainerProfileModal'

interface TrainerProfileActionsProps {
    trainer: any
    locale: string
}

export function TrainerProfileActions({ trainer, locale }: TrainerProfileActionsProps) {
    const [isEditOpen, setIsEditOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsEditOpen(true)}
                className="p-2 rounded-xl bg-white/10 border border-white/10 text-white/50 hover:text-white hover:bg-white/15 transition-all active:scale-95"
                aria-label="تعديل"
            >
                <Pencil className="w-4 h-4" />
            </button>

            <EditTrainerProfileModal 
                isOpen={isEditOpen} 
                onClose={() => setIsEditOpen(false)} 
                trainer={trainer} 
                locale={locale} 
            />
        </>
    )
}
