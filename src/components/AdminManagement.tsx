import { useState } from 'react';
import { Administrator } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Trash2, Shield, Crown } from 'lucide-react';
import { toast } from 'sonner';

interface AdminManagementProps {
  administrators: Administrator[];
  currentUser: string;
  onAddAdmin: (email: string, name: string) => boolean;
  onRemoveAdmin: (email: string) => boolean;
}

export const AdminManagement = ({ 
  administrators, 
  currentUser, 
  onAddAdmin, 
  onRemoveAdmin 
}: AdminManagementProps) => {
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAdminEmail.trim() || !newAdminName.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!newAdminEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    const success = onAddAdmin(newAdminEmail.trim(), newAdminName.trim());
    if (success) {
      toast.success('Administrator added successfully');
      setNewAdminEmail('');
      setNewAdminName('');
    } else {
      toast.error('Administrator already exists');
    }
  };

  const handleRemoveAdmin = (email: string) => {
    if (email === 'fmoron.h@3cat.cat') {
      toast.error('Cannot remove default administrator');
      return;
    }

    const success = onRemoveAdmin(email);
    if (success) {
      toast.success('Administrator removed successfully');
    } else {
      toast.error('Failed to remove administrator');
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Administrator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New Administrator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddAdmin} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Email Address</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  placeholder="admin@example.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminName">Full Name</Label>
                <Input
                  id="adminName"
                  type="text"
                  placeholder="Administrator Name"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Administrator
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Current Administrators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Current Administrators
            <Badge variant="secondary">{administrators.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {administrators.map((admin) => (
              <div key={admin.email} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{admin.name}</span>
                    {admin.email === 'fmoron.h@3cat.cat' && (
                      <Badge className="bg-yellow-500 hover:bg-yellow-600">
                        <Crown className="h-3 w-3 mr-1" />
                        Default Admin
                      </Badge>
                    )}
                    {admin.email === currentUser && (
                      <Badge variant="outline">You</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{admin.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Added by {admin.addedBy} on {admin.addedAt.toLocaleDateString()}
                  </p>
                </div>
                {admin.email !== 'fmoron.h@3cat.cat' && (
                  <Button
                    onClick={() => handleRemoveAdmin(admin.email)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};