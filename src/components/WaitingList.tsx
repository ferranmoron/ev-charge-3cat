import { WaitingListEntry } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, X } from 'lucide-react';

interface WaitingListProps {
  waitingList: WaitingListEntry[];
  onRemoveFromList: (id: string) => void;
  currentUserEmail?: string;
  isAdmin: boolean;
}

export const WaitingList = ({ waitingList, onRemoveFromList, currentUserEmail, isAdmin }: WaitingListProps) => {
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

  const canRemoveEntry = (entry: WaitingListEntry) => {
    return isAdmin || (currentUserEmail && entry.email.toLowerCase() === currentUserEmail.toLowerCase());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Waiting List
          <Badge variant="secondary">{waitingList.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {waitingList.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No one in queue</p>
        ) : (
          <div className="space-y-3">
            {waitingList.map((entry, index) => (
              <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <span className="font-medium">{entry.userName}</span>
                    {currentUserEmail && entry.email.toLowerCase() === currentUserEmail.toLowerCase() && (
                      <Badge variant="secondary">You</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    <span>Waiting: {getWaitTime(entry.joinTime)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{entry.email}</p>
                </div>
                {canRemoveEntry(entry) && (
                  <Button
                    onClick={() => onRemoveFromList(entry.id)}
                    variant="ghost"
                    size="sm"
                    title={isAdmin ? "Remove from queue (Admin)" : "Remove yourself from queue"}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};