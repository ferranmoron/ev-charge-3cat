import { ChargingPoint as ChargingPointType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Clock, User, Wrench } from 'lucide-react';

interface ChargingPointProps {
  point: ChargingPointType;
  onEndSession: (pointId: number) => void;
  onToggleMaintenance: (pointId: number, maintenance: boolean) => void;
}

export const ChargingPoint = ({ point, onEndSession, onToggleMaintenance }: ChargingPointProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'in-use': return 'bg-blue-500';
      case 'maintenance': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'in-use': return 'In Use';
      case 'maintenance': return 'Maintenance';
      default: return 'Unknown';
    }
  };

  const getRemainingTime = () => {
    if (!point.endTime) return null;
    const now = new Date();
    const remaining = point.endTime.getTime() - now.getTime();
    if (remaining <= 0) return 'Expired';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Point {point.id}
          </CardTitle>
          <Badge className={getStatusColor(point.status)}>
            {getStatusText(point.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {point.status === 'in-use' && point.currentUser && (
          <>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span>{point.currentUser.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>Remaining: {getRemainingTime()}</span>
            </div>
            <Button 
              onClick={() => onEndSession(point.id)}
              variant="outline" 
              size="sm"
              className="w-full"
            >
              End Session
            </Button>
          </>
        )}
        
        <div className="flex gap-2">
          <Button
            onClick={() => onToggleMaintenance(point.id, point.status !== 'maintenance')}
            variant={point.status === 'maintenance' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
          >
            <Wrench className="h-4 w-4 mr-1" />
            {point.status === 'maintenance' ? 'End Maintenance' : 'Maintenance'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};