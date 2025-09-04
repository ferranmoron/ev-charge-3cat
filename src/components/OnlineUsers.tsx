import { User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Zap, Clock } from 'lucide-react';

interface OnlineUsersProps {
  users: User[];
}

export const OnlineUsers = ({ users }: OnlineUsersProps) => {
  const onlineUsers = users.filter(user => user.isOnline);
  const usersCharging = onlineUsers.filter(user => user.currentPointId);

  const getTimeSinceLastSeen = (lastSeen: Date) => {
    const now = new Date();
    const diff = now.getTime() - lastSeen.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'ara mateix';
    if (minutes < 60) return `fa ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `fa ${hours}h ${minutes % 60}m`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Usuaris Connectats
          <Badge variant="secondary">{onlineUsers.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {onlineUsers.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Cap usuari connectat actualment
          </p>
        ) : (
          <div className="space-y-3">
            {onlineUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{user.name}</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full" title="En línia" />
                    {user.currentPointId && (
                      <Badge className="bg-blue-600 hover:bg-blue-700">
                        <Zap className="h-3 w-3 mr-1" />
                        Punt #{user.currentPointId}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Última activitat: {getTimeSinceLastSeen(user.lastSeen)}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {usersCharging.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-700 mb-1">
                  Usuaris carregant actualment: {usersCharging.length}
                </p>
                <div className="text-xs text-blue-600">
                  {usersCharging.map(user => (
                    <span key={user.id} className="mr-3">
                      {user.name.split(' ')[0]} (Punt #{user.currentPointId})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};