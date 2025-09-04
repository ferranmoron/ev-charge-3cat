import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Zap, Users, Clock } from 'lucide-react';
import { ChargingPoint, WaitingListEntry } from '@/types';

interface AdminPanelProps {
  chargingPoints: ChargingPoint[];
  waitingList: WaitingListEntry[];
  onClearWaitingList: () => void;
}

export const AdminPanel = ({ chargingPoints, waitingList, onClearWaitingList }: AdminPanelProps) => {
  const availablePoints = chargingPoints.filter(p => p.status === 'available').length;
  const inUsePoints = chargingPoints.filter(p => p.status === 'in-use').length;
  const maintenancePoints = chargingPoints.filter(p => p.status === 'maintenance').length;

  const getActiveSessionsEndingSoon = () => {
    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
    
    return chargingPoints.filter(point => 
      point.status === 'in-use' && 
      point.endTime && 
      point.endTime <= thirtyMinutesFromNow
    );
  };

  const sessionsEndingSoon = getActiveSessionsEndingSoon();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Admin Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">Available</span>
            </div>
            <div className="text-2xl font-bold text-green-700">{availablePoints}</div>
          </div>
          
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">In Use</span>
            </div>
            <div className="text-2xl font-bold text-blue-700">{inUsePoints}</div>
          </div>
          
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Settings className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-600">Maintenance</span>
            </div>
            <div className="text-2xl font-bold text-red-700">{maintenancePoints}</div>
          </div>
          
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-600">Queue</span>
            </div>
            <div className="text-2xl font-bold text-orange-700">{waitingList.length}</div>
          </div>
        </div>

        {/* Sessions Ending Soon Alert */}
        {sessionsEndingSoon.length > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">Sessions Ending Soon (30 min)</h4>
            <div className="space-y-1">
              {sessionsEndingSoon.map(point => (
                <div key={point.id} className="text-sm text-yellow-700">
                  Point {point.id}: {point.currentUser?.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin Actions */}
        <div className="space-y-2">
          <h4 className="font-medium">Quick Actions</h4>
          <div className="flex gap-2">
            <Button
              onClick={onClearWaitingList}
              variant="outline"
              size="sm"
              disabled={waitingList.length === 0}
            >
              Clear Waiting List
            </Button>
          </div>
        </div>

        {/* System Status */}
        <div className="text-xs text-muted-foreground">
          <p>System Status: <Badge variant="outline" className="text-green-600">Online</Badge></p>
          <p>Last Updated: {new Date().toLocaleTimeString()}</p>
        </div>
      </CardContent>
    </Card>
  );
};