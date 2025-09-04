import { useState } from 'react';
import { AppSettings } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Clock, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsPanelProps {
  settings: AppSettings;
  onUpdateMaxHours: (hours: number) => boolean;
  onToggleEmailNotifications: () => void;
}

export const SettingsPanel = ({ 
  settings, 
  onUpdateMaxHours, 
  onToggleEmailNotifications 
}: SettingsPanelProps) => {
  const [maxHours, setMaxHours] = useState(settings.maxChargingHours.toString());

  const handleUpdateMaxHours = () => {
    const hours = parseInt(maxHours);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      toast.error('Please enter a valid number between 1 and 24');
      return;
    }

    const success = onUpdateMaxHours(hours);
    if (success) {
      toast.success(`Maximum charging time updated to ${hours} hours`);
    } else {
      toast.error('Failed to update maximum charging time');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Maximum Charging Hours */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <Label htmlFor="maxHours">Maximum Charging Hours</Label>
            </div>
            <div className="flex gap-2">
              <Input
                id="maxHours"
                type="number"
                min="1"
                max="24"
                value={maxHours}
                onChange={(e) => setMaxHours(e.target.value)}
                className="w-24"
              />
              <Button onClick={handleUpdateMaxHours} variant="outline">
                Update
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Current: {settings.maxChargingHours} hours per session
            </p>
          </div>

          {/* Email Notifications */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <Label htmlFor="emailNotifications">Email Notifications</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="emailNotifications"
                checked={settings.emailNotifications}
                onCheckedChange={onToggleEmailNotifications}
              />
              <Label htmlFor="emailNotifications" className="text-sm">
                Send email notifications when charging sessions end
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Status: {settings.emailNotifications ? 'Enabled' : 'Disabled'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Email Notification Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notification System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p>
              <strong>Automatic Notifications:</strong> Users receive email alerts when their charging session ends.
            </p>
            <p>
              <strong>Notification Content:</strong> Includes charging point number, session duration, and reminder to remove vehicle.
            </p>
            <p className="text-muted-foreground">
              Note: This is a demo system. In production, integrate with an email service like SendGrid, AWS SES, or similar.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};