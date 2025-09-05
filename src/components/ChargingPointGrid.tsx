import { ChargingPoint as ChargingPointType } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Clock, User, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChargingPointGridProps {
  points: ChargingPointType[];
  onSelectPoint?: (pointId: number) => void;
  onEndSession: (pointId: number) => void;
  onToggleMaintenance: (pointId: number, maintenance: boolean) => void;
  selectedPointId?: number;
  isUserView?: boolean;
  isAdmin: boolean;
  currentUserEmail?: string;  // Afegim aquesta prop
}

export const ChargingPointGrid = ({ 
  points, 
  onSelectPoint, 
  onEndSession, 
  onToggleMaintenance,
  selectedPointId,
  isUserView = false,
  isAdmin,
  currentUserEmail
}: ChargingPointGridProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500 hover:bg-green-600';
      case 'in-use': return 'bg-blue-500';
      case 'maintenance': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const canEndSession = (point: ChargingPointType) => {
        return isAdmin || (point.currentUser?.email === currentUserEmail);
    };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'in-use': return 'Ocupat';
      case 'maintenance': return 'Manteniment';
      default: return 'Unknown';
    }
  };

  const getRemainingTime = (point: ChargingPointType) => {
    if (!point.endTime) return null;
    const now = new Date();
    const remaining = point.endTime.getTime() - now.getTime();
    if (remaining <= 0) return 'Expired';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handlePointClick = (point: ChargingPointType) => {
    if (isUserView && point.status === 'available' && onSelectPoint) {
      onSelectPoint(point.id);
    }
  };

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-3">
      {points.map(point => (
        <Card 
          key={point.id} 
          className={cn(
            "relative transition-all duration-200",
            isUserView && point.status === 'available' && "cursor-pointer hover:shadow-lg hover:scale-105",
            selectedPointId === point.id && "ring-2 ring-blue-500 ring-offset-2"
          )}
          onClick={() => handlePointClick(point)}
        >
          <CardContent className="p-3 text-center">
            {/* Point Number */}
            <div className="text-lg font-bold mb-2">#{point.id}</div>
            
            {/* Status Indicator */}
            <div className={cn(
              "w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center",
              getStatusColor(point.status)
            )}>
              {point.status === 'available' && <Zap className="h-4 w-4 text-white" />}
              {point.status === 'in-use' && <Clock className="h-4 w-4 text-white" />}
              {point.status === 'maintenance' && <Wrench className="h-4 w-4 text-white" />}
            </div>
            
            {/* Status Text */}
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs mb-2",
                point.status === 'available' && "border-green-500 text-green-700",
                point.status === 'in-use' && "border-blue-500 text-blue-700",
                point.status === 'maintenance' && "border-red-500 text-red-700"
              )}
            >
              {getStatusText(point.status)}
            </Badge>

            {/* User Info for In-Use Points */}
            {point.status === 'in-use' && point.currentUser && (
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1 text-xs">
                  <User className="h-3 w-3" />
                  <span className="truncate">{point.currentUser.name.split(' ')[0]}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {getRemainingTime(point)}
                </div>
                {canEndSession && (
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEndSession(point.id);
                    }}
                    variant="outline" 
                    size="sm"
                    className="text-xs h-6 px-2 mt-1"
                  >
                    End
                  </Button>
                )}
              </div>
            )}

            {/* Admin-Only Maintenance Controls */}
            {isAdmin && (
              <div className="mt-2">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleMaintenance(point.id, point.status !== 'maintenance');
                  }}
                  variant={point.status === 'maintenance' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs h-6 px-2"
                  title="Admin only: Toggle maintenance mode"
                >
                  <Wrench className="h-3 w-3" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};