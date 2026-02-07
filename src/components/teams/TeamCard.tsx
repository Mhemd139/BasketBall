import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface TeamCardProps {
  name: string;
  nameEn: string;
  trainer: string;
  playerCount: number;
  paidCount: number;
  onViewRoster?: () => void;
}

export function TeamCard({
  name,
  nameEn,
  trainer,
  playerCount,
  paidCount,
  onViewRoster
}: TeamCardProps) {
  const allPaid = paidCount === playerCount;
  const paymentPercentage = (paidCount / playerCount) * 100;
  
  return (
    <Card className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-navy-700 rounded-lg flex items-center justify-center">
          <span className="text-2xl">👥</span>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg text-white">{name}</h3>
          <p className="text-sm text-gray-300">{nameEn}</p>
        </div>
      </div>
      
      <div className="space-y-2 text-sm">
        <p className="text-white flex items-center gap-2">
          <span>👤</span> 
          <span className="text-gray-400">المدرب:</span> {trainer}
        </p>
        <p className="text-gold-400 flex items-center gap-2">
          <span>👥</span> {playerCount} لاعب
        </p>
        <p className={`flex items-center gap-2 ${allPaid ? 'text-success' : 'text-white'}`}>
          <span>💰</span> {paidCount}/{playerCount} مدفوع {allPaid && '✓'}
        </p>
      </div>
      
      {/* Payment Progress Bar */}
      <div className="w-full bg-navy-700 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all ${allPaid ? 'bg-success' : 'bg-gold-400'}`}
          style={{ width: `${paymentPercentage}%` }}
        />
      </div>
      
      {onViewRoster && (
        <Button 
          variant="primary" 
          size="sm"
          onClick={onViewRoster}
          className="w-full"
        >
          عرض القائمة →
        </Button>
      )}
    </Card>
  );
}
