import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface UserFormProps {
  onAddToWaitingList: (userName: string, email: string) => void;
  onAssignToPoint: (pointId: number, userName: string, email: string) => void;
  availablePoints: number;
  selectedPointId?: number;
  onClearSelection: () => void;
  onSetCurrentUser: (email: string) => void;
}

export const UserForm = ({ 
  onAddToWaitingList, 
  onAssignToPoint,
  availablePoints, 
  selectedPointId,
  onClearSelection,
  onSetCurrentUser
}: UserFormProps) => {
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userName.trim() || !email.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Set current user for queue management
    onSetCurrentUser(email.trim());

    if (selectedPointId) {
      // Assign to specific selected point
      onAssignToPoint(selectedPointId, userName.trim(), email.trim());
      toast.success(`Assigned to Charging Point #${selectedPointId}!`);
      onClearSelection();
    } else if (availablePoints > 0) {
      // Add to waiting list and auto-assign to first available
      onAddToWaitingList(userName.trim(), email.trim());
      toast.success('You have been assigned to an available charging point!');
    } else {
      // Add to waiting list
      onAddToWaitingList(userName.trim(), email.trim());
      toast.success('Added to waiting list successfully!');
    }

    setUserName('');
    setEmail('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          {selectedPointId ? `Reserve Point #${selectedPointId}` : 'Join Charging Queue'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {selectedPointId && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700">
              <Zap className="h-4 w-4" />
              <span className="font-medium">Selected: Charging Point #{selectedPointId}</span>
            </div>
            <Button 
              onClick={onClearSelection}
              variant="ghost" 
              size="sm" 
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Change Selection
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userName">Full Name</Label>
            <Input
              id="userName"
              type="text"
              placeholder="Enter your full name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
            <p className="font-medium">Charging Rules:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Maximum 3 hours per session</li>
              <li>Sessions end automatically after time limit</li>
              <li>Available points: <span className="font-medium">{availablePoints}</span></li>
              {selectedPointId && <li>You will be assigned to Point #{selectedPointId}</li>}
              <li>You can remove yourself from the waiting list</li>
            </ul>
          </div>

          <Button type="submit" className="w-full">
            {selectedPointId 
              ? `Start Charging at Point #${selectedPointId}` 
              : availablePoints > 0 
                ? 'Start Charging' 
                : 'Join Waiting List'
            }
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};