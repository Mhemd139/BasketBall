import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface EventCardProps {
  hall: string;
  type: 'training' | 'game';
  time: string;
  trainer: string;
  team: string;
  onMarkAttendance?: () => void;
  onViewDetails?: () => void;
}

export function EventCard({
  hall,
  type,
  time,
  trainer,
  team,
  onMarkAttendance,
  onViewDetails
}: EventCardProps) {
  const isGame = type === 'game';
  
  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏟️</span>
          <div>
            <h3 className="font-semibold text-white">{hall}</h3>
            <p className={`text-sm font-medium ${isGame ? 'text-orange-500' : 'text-gold-400'}`}>
              {type === 'training' ? 'تدريب' : 'مباراة'} - {time}
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-1 text-sm">
        <p className="text-white">
          <span className="text-gray-400">المدرب:</span> {trainer}
        </p>
        <p className="text-white">
          <span className="text-gray-400">الفريق:</span> {team}
        </p>
      </div>
      
      <div className="flex gap-2">
        {onMarkAttendance && (
          <Button 
            variant="primary" 
            size="sm"
            onClick={onMarkAttendance}
            className="flex-1"
          >
            ✓ تسجيل الحضور
          </Button>
        )}
        {onViewDetails && (
          <Button 
            variant="secondary" 
            size="sm"
            onClick={onViewDetails}
          >
            عرض التفاصيل
          </Button>
        )}
      </div>
    </Card>
  );
}
