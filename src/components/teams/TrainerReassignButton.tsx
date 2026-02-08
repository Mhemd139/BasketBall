'use client'

import { useState } from 'react'
import { Edit2 } from 'lucide-react'
import { TrainerReassignModal } from './TrainerReassignModal'

interface TrainerReassignButtonProps {
    classId: string
    currentTrainerId?: string | null
    locale: string
    isAdmin: boolean
}

export function TrainerReassignButton({ classId, currentTrainerId, locale, isAdmin }: TrainerReassignButtonProps) {
    const [showModal, setShowModal] = useState(false)

    if (!isAdmin) return null

    return (
        <>
            <button 
                onClick={() => setShowModal(true)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                title="Change Trainer"
            >
                <Edit2 className="w-4 h-4" />
            </button>

            {showModal && (
                <TrainerReassignModal 
                    classId={classId}
                    currentTrainerId={currentTrainerId}
                    locale={locale}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    )
}
