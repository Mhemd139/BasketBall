import { cn } from '@/lib/utils';

interface JerseyNumberProps {
  number: number | null | undefined;
  gender?: string | null;
  className?: string;
}

export function JerseyNumber({ number, gender, className }: JerseyNumberProps) {
  const isFemale = gender === 'female'

  return (
    <div className={cn(
      'flex items-center justify-center rounded-full font-mono font-black border-2 select-none',
      isFemale
        ? 'bg-pink-500/30 border-pink-400 text-pink-300'
        : 'bg-indigo-500/30 border-indigo-400 text-indigo-200',
      className
    )}>
      {number != null ? number : <span className="text-white/20 text-xs font-bold">#</span>}
    </div>
  );
}
