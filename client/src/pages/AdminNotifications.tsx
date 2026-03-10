import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Info, CheckCircle, AlertTriangle, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Notification } from '@/types';
import { adminAPI } from '@/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const AdminNotifications = () => {
  const [notificationList, setNotificationList] = useState<Notification[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [sendForm, setSendForm] = useState({
    recipientId: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [notificationsData, recipientsData] = await Promise.all([
        adminAPI.getNotifications(),
        adminAPI.getRecipients(),
      ]);

      setNotificationList((notificationsData || []).map((item: any) => ({
        id: item._id || item.id,
        recipientId: item.recipientId?._id || item.recipientId || '',
        sender: item.sender,
        message: item.message,
        timestamp: item.timestamp || new Date().toISOString(),
        read: item.read || false,
        type: item.type || 'info',
      })));

      setFaculty(recipientsData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await adminAPI.markNotificationRead(id);
      setNotificationList(notificationList.map(n =>
        n.id === id ? { ...n, read: true } : n
      ));
      toast.success('Marked as read');
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminAPI.deleteNotification(id);
      setNotificationList(notificationList.filter(n => n.id !== id));
      toast.success('Notification deleted successfully');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await adminAPI.markAllNotificationsRead();
      setNotificationList(notificationList.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleSendNotification = async () => {
    if (!sendForm.recipientId || !sendForm.message) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await adminAPI.createNotification({
        recipientId: sendForm.recipientId,
        message: sendForm.message,
        type: sendForm.type,
      });

      setSendForm({ recipientId: '', message: '', type: 'info' });
      setIsSendDialogOpen(false);
      toast.success('Notification sent successfully');
      await loadData();
    } catch (error) {
      console.error('Failed to send notification:', error);
      toast.error('Failed to send notification');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Info className="h-5 w-5 text-primary" />;
    }
  };

  const unreadCount = notificationList.filter(n => !n.read).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Send className="h-4 w-4 mr-2" />
                Send Notification
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Notification</DialogTitle>
                <DialogDescription>
                  Send a notification to a faculty member
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Recipient</label>
                  <Select value={sendForm.recipientId} onValueChange={(value) => setSendForm({ ...sendForm, recipientId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select faculty member" />
                    </SelectTrigger>
                    <SelectContent>
                      {faculty.map((fac: any) => (
                        <SelectItem key={fac._id || fac.id} value={fac._id || fac.id}>
                          {fac.name} ({fac.role?.toUpperCase()} - {fac.department || 'N/A'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Type</label>
                  <Select value={sendForm.type} onValueChange={(value: 'info' | 'success' | 'warning') => setSendForm({ ...sendForm, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Message</label>
                  <Textarea
                    placeholder="Enter notification message..."
                    value={sendForm.message}
                    onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSendDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendNotification}>
                  Send
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline">
              <Check className="h-4 w-4 mr-2" />
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading notifications...</div>
      ) : notificationList.length > 0 ? (
        <div className="space-y-4">
          {notificationList.map((notification) => {
            const recipient = faculty.find((f: any) => (f._id || f.id) === notification.recipientId);
            return (
              <Card
                key={notification.id}
                className={`transition-all hover:shadow-hover ${!notification.read ? 'border-l-4 border-l-primary bg-primary/5' : ''
                  }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">{getIcon(notification.type)}</div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-foreground">{notification.sender}</p>
                            {!notification.read && (
                              <Badge variant="default" className="text-xs">New</Badge>
                            )}
                            {recipient && (
                              <Badge variant="outline" className="text-xs">
                                To: {recipient.name}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-foreground">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(notification.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
          <p className="text-muted-foreground">
            You're all caught up! Check back later for updates.
          </p>
        </Card>
      )}
    </div>
  );
};

export default AdminNotifications;

