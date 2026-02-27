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
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-indigo-400 transition-colors"
                title={'تغيير المدرب'}
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
