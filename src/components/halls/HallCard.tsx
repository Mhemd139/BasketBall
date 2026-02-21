import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface HallCardProps {
  name: string;
  nameEn: string;
  location: string;
  eventsThisWeek: number;
  onViewSchedule?: () => void;
}

export function HallCard({
  name,
  nameEn,
  location,
  eventsThisWeek,
  onViewSchedule
}: HallCardProps) {
  return (
    <Card className="space-y-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30 text-2xl shadow-inner">
           🏀
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg text-white drop-shadow-md">{name}</h3>
          <p className="text-sm text-indigo-200/50 font-medium">{nameEn}</p>
        </div>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-indigo-100/70">
          <span className="opacity-70">📍</span> <span>{location}</span>
        </div>
        <div className="flex items-center gap-2 text-blue-300 font-bold">
          <span className="opacity-70">📅</span> <span>{eventsThisWeek} فعاليات هذا الأسبوع</span>
        </div>
      </div>
      
      {onViewSchedule && (
        <Button 
          variant="primary" 
          size="sm"
          onClick={onViewSchedule}
          className="w-full font-bold bg-white/5 border border-white/10 hover:bg-white/10"
        >
          عرض الجدول
        </Button>
      )}
    </Card>
  );
}
