'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

type Status = 'present' | 'absent' | 'late';

interface StatusToggleProps {
  initialStatus?: Status;
  onChange?: (status: Status) => void;
  className?: string;
}

const baseToggleStyles: React.CSSProperties = {
  width: '3rem',
  height: '3rem',
  borderRadius: '0.5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.5rem',
  fontWeight: 700,
  transition: 'all 200ms',
  cursor: 'pointer',
  userSelect: 'none',
}

const statusStyles = {
  present: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: '2px solid #10b981',
  },
  absent: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
    border: '2px solid #ef4444',
  },
  late: {
    backgroundColor: '#f59e0b',
    color: '#0a1628',
    border: '2px solid #f59e0b',
  },
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
      className={cn(className)}
      style={{ ...baseToggleStyles, ...statusStyles[status] }}
      onClick={handleToggle}
      aria-label={`Status: ${status}`}
      type="button"
    >
      {statusConfig[status].icon}
    </button>
  );
}

