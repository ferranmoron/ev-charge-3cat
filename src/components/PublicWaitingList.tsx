import { WaitingListEntry } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock } from 'lucide-react';

interface PublicWaitingListProps {
  waitingList: WaitingListEntry[];
}

export const PublicWaitingList = ({ waitingList }: PublicWaitingListProps) => {
  const getWaitTime = (joinTime: Date) => {
    const now = new Date();
    const diff = now.getTime() - joinTime.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const getEstimatedWaitTime = (position: number) => {
    // Estimate based on average 2-hour sessions and current usage
    const estimatedMinutes = position * 120; // 2 hours per person ahead
    const hours = Math.floor(estimatedMinutes / 60);
    const mins = estimatedMinutes % 60;
    
    if (hours > 0) {
      return `~${hours}h ${mins}m`;
    }
    return `~${mins}m`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Current Queue
          <Badge variant="secondary">{waitingList.length} waiting</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {waitingList.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No one in queue</p>
            <p className="text-sm text-muted-foreground">Perfect time to start charging!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground mb-4">
              Queue positions and estimated wait times:
            </div>
            {waitingList.map((entry, index) => (
              <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="bg-white">
                      #{index + 1}
                    </Badge>
                    <span className="font-medium">{entry.userName}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Waiting: {getWaitTime(entry.joinTime)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Est. wait: {getEstimatedWaitTime(index + 1)}</span>
                    </div>
                  </div>
                </div>
                {index === 0 && (
                  <Badge className="bg-green-500 hover:bg-green-600">
                    Next Up
                  </Badge>
                )}
              </div>
            ))}
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Queue Info:</strong> Wait times are estimates based on 2-hour average sessions. 
                You'll be automatically assigned when a point becomes available.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};