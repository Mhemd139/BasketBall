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
                className="p-2 rounded-xl bg-white/10 border border-white/10 text-white/50 hover:text-white hover:bg-white/15 transition-all active:scale-95"
                title={'تعديل القاعة'}
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
