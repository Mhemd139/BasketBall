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
    <Card className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-navy-700 rounded-lg flex items-center justify-center border-2 border-orange-500">
          <span className="text-2xl">🏀</span>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg text-white">{name}</h3>
          <p className="text-sm text-gray-300">{nameEn}</p>
        </div>
      </div>
      
      <div className="space-y-1 text-sm">
        <p className="text-gray-400 flex items-center gap-2">
          <span>📍</span> {location}
        </p>
        <p className="text-gold-400 flex items-center gap-2">
          <span>📅</span> {eventsThisWeek} فعاليات هذا الأسبوع
        </p>
      </div>
      
      {onViewSchedule && (
        <Button 
          variant="primary" 
          size="sm"
          onClick={onViewSchedule}
          className="w-full"
        >
          عرض الجدول →
        </Button>
      )}
    </Card>
  );
}
