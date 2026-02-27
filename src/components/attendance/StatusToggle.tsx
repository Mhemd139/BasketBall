'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

type Status = 'present' | 'absent' | 'late';

interface StatusToggleProps {
  initialStatus?: Status;
  onChange?: (status: Status) => void;
  className?: string;
}

const statusClasses = {
  present: 'bg-emerald-500 text-white border-2 border-emerald-500',
  absent: 'bg-red-500 text-white border-2 border-red-500',
  late: 'bg-amber-500 text-[#0a1628] border-2 border-amber-500',
}

export function StatusToggle({ 
  initialStatus = 'absent', 
  onChange,
  className 
}: StatusToggleProps) {
  const [status, setStatus] = useState<Status>(initialStatus);
  
  const statusConfig = {
    present: { icon: '✓', next: 'absent' as Status },
    absent: { icon: '✗', next: 'late' as Status },
    late: { icon: '⏰', next: 'present' as Status },
  };
  
  const handleToggle = () => {
    const nextStatus = statusConfig[status].next;
    setStatus(nextStatus);
    onChange?.(nextStatus);
  };
  
  return (
    <button
      className={cn('w-12 h-12 rounded-lg flex items-center justify-center text-2xl font-bold transition-all duration-200 cursor-pointer select-none', statusClasses[status], className)}
      onClick={handleToggle}
      aria-label={`Status: ${status}`}
      type="button"
    >
      {statusConfig[status].icon}
    </button>
  );
}

