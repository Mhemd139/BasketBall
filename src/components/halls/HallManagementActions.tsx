'use client';

import { useState } from 'react';
import { EditHallModal } from './EditHallModal';
import { Pencil } from 'lucide-react';

interface HallManagementActionsProps {
    hall: any;
    locale: string;
}

export function HallManagementActions({ hall, locale }: HallManagementActionsProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all backdrop-blur-sm"
                title={locale === 'ar' ? 'تعديل القاعة' : 'Edit Hall'}
            >
                <Pencil className="w-5 h-5" />
            </button>

            <EditHallModal 
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                hall={hall}
                locale={locale}
            />
        </>
    );
}
