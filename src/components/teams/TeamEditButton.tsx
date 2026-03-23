'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { CreateTeamModal } from './CreateTeamModal'

interface TeamEditButtonProps {
    classId: string
    name_ar: string
    name_he: string
    name_en: string
    trainer_id: string | null
    hall_id: string | null
    locale: string
    isAdmin: boolean
}

export function TeamEditButton({ classId, name_ar, name_he, name_en, trainer_id, hall_id, locale, isAdmin }: TeamEditButtonProps) {
    const [open, setOpen] = useState(false)

    if (!isAdmin) return null

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all"
                aria-label="تعديل الفريق"
                title="تعديل اسم الفريق"
            >
                <Pencil className="w-4 h-4" />
            </button>

            <CreateTeamModal
                isOpen={open}
                onClose={() => setOpen(false)}
                locale={locale}
                isEdit
                initialData={{ id: classId, name_en, name_ar, name_he, trainer_id, hall_id }}
            />
        </>
    )
}
