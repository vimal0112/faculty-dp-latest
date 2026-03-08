import { useState, useEffect } from 'react';
import { Settings, User, Bell, Shield, Database, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { adminAPI } from '@/lib/api';

const AdminSettings = () => {
  const { user, login } = useAuth();
  const [settings, setSettings] = useState({
    autoApproveAll: false,
    dataRetentionDays: 365,
    maxFileUploadSize: 10,
  });

  const [profile, setProfile] = useState({
    name: user?.name || 'Admin User',
    email: user?.email || 'admin@university.edu',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await adminAPI.getSettings();
        if (data) {
          setSettings({
            autoApproveAll: data.autoApproveAll ?? false,
            dataRetentionDays: data.dataRetentionDays ?? 365,
            maxFileUploadSize: data.maxFileUploadSize ?? 10,
          });
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast.error('Failed to load system settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    try {
      await adminAPI.updateSettings(settings);
      toast.success('Settings saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    }
  };

  const handleSaveProfile = async () => {
    try {
      const updatedUser = await adminAPI.updateProfile(profile);
      // Update local storage / context with new user data if needed
      if (updatedUser) {
        localStorage.setItem('user', JSON.stringify({ ...user, ...updatedUser }));
        // Optional: if your auth context supports updating user directly, do that here.
        // login(updatedUser.token, updatedUser); // If token is returned
      }
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage system settings and preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Profile Settings</CardTitle>
            </div>
            <CardDescription>Update your admin profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                readOnly
                className="bg-muted cursor-not-allowed"
              />
            </div>
            <Button onClick={handleSaveProfile} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Profile
            </Button>
          </CardContent>
        </Card>

        {/* Approval Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Approval Settings</CardTitle>
            </div>
            <CardDescription>Configure approval workflows</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto approval for all activities</Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, all user activities are approved automatically without pending admin review
                </p>
              </div>
              <Switch
                checked={settings.autoApproveAll}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, autoApproveAll: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>System Settings</CardTitle>
            </div>
            <CardDescription>Manage system configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="retention">Data Retention (Days)</Label>
              <Input
                id="retention"
                type="number"
                value={settings.dataRetentionDays}
                onChange={(e) =>
                  setSettings({ ...settings, dataRetentionDays: parseInt(e.target.value) || 365 })
                }
              />
              <p className="text-sm text-muted-foreground">
                How long to keep records before archiving
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="uploadSize">Max File Upload Size (MB)</Label>
              <Input
                id="uploadSize"
                type="number"
                value={settings.maxFileUploadSize}
                onChange={(e) =>
                  setSettings({ ...settings, maxFileUploadSize: parseInt(e.target.value) || 10 })
                }
              />
              <p className="text-sm text-muted-foreground">
                Maximum file size allowed for uploads
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save All Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} size="lg">
          <Save className="h-4 w-4 mr-2" />
          Save All Settings
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;

