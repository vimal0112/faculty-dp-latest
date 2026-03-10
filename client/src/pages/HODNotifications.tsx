import { useState, useEffect } from 'react';
import { Bell, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { hodAPI } from '@/lib/api';

const HODNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await hodAPI.getNotifications();
      setNotifications(data.map((item: any) => ({
        id: item._id || item.id,
        type: item.type || 'info',
        title: item.sender || 'Notification',
        message: item.message,
        timestamp: item.timestamp || new Date().toISOString(),
        read: item.read || false,
        recipient: item.recipientId?.name || 'N/A',
      })));
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await hodAPI.markNotificationRead(id);
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await hodAPI.markAllNotificationsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with department activities</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {unreadCount} unread
              </Badge>
              <Button onClick={handleMarkAllAsRead} variant="outline" size="sm" className="gap-2 border-primary/20 hover:bg-primary/5 text-primary">
                <CheckCircle2 className="h-4 w-4" />
                Mark All as Read
              </Button>
            </>
          )}
        </div>
      </div>

      <Card className="border-none shadow-xl bg-gradient-to-br from-white to-muted/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-2xl font-bold text-primary">
            <Bell className="h-6 w-6 text-primary animate-bounce-subtle" />
            Recent Updates
          </CardTitle>
          <CardDescription className="text-sm font-medium">
            You have {notifications.length} total messages from administration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 pt-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-muted-foreground font-medium animate-pulse">Fetching your notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
                <Bell className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-semibold italic">No notifications yet</p>
                <p className="text-sm">We'll alert you when there's an update from the admin.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group relative flex items-start gap-5 p-5 border rounded-2xl transition-all duration-300 transform hover:scale-[1.01] hover:shadow-md ${!notification.read
                    ? 'bg-primary/5 border-primary/20 shadow-sm'
                    : 'bg-white border-transparent hover:border-muted-foreground/10'
                    }`}
                >
                  <div className={`mt-1 p-2 rounded-full ${notification.type === 'success' ? 'bg-green-100' :
                    notification.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                    }`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest leading-none">
                            {notification.title}
                          </p>
                          {notification.recipient && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-medium border-primary/20 text-primary bg-primary/5 uppercase tracking-tighter">
                              To: {notification.recipient}
                            </Badge>
                          )}
                        </div>
                        <p className={`text-base font-semibold ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.message}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {!notification.read && (
                          <Badge className="bg-primary text-white hover:bg-primary/90 animate-pulse shadow-sm">
                            New
                          </Badge>
                        )}
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-green-100 text-green-600"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-primary/10"
                    >
                      <Info className="h-4 w-4 text-primary" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HODNotifications;

