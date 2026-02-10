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
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all active:scale-95 font-bold"
            >
                <Pencil className="w-4 h-4" />
                {'تعديل'}
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
