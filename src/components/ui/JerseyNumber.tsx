import * as React from 'react';
import { cn } from '@/lib/utils';

const jerseyStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '3rem',
  height: '3rem',
  borderRadius: '9999px',
  backgroundColor: '#1e40af', // Blue 800
  border: '2px solid #facc15', // Yellow 400
  color: '#facc15', // Yellow 400
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  fontWeight: 700,
  fontSize: '1.125rem',
}

interface JerseyNumberProps {
  number: number;
  className?: string;
}

export function JerseyNumber({ number, className }: JerseyNumberProps) {
  return (
    <div className={cn(className)} style={jerseyStyles}>
      {number}
    </div>
  );
}
