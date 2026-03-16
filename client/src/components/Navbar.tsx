import { useState, useEffect } from 'react';
import { Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user || user.role === 'admin') return;
      try {
        let data = [];
        if (user.role === 'faculty') {
          const { facultyAPI } = await import('@/lib/api');
          data = await facultyAPI.getNotifications();
        } else if (user.role === 'hod') {
          const { hodAPI } = await import('@/lib/api');
          data = await hodAPI.getNotifications();
        }

        if (data && Array.isArray(data)) {
          const unread = data.filter((n: any) => !n.read).length;
          setUnreadCount(unread);
        }
      } catch (error) {
        console.error('Failed to fetch notifications for badge:', error);
      }
    };

    if (user?.role && user.role !== 'admin') {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNotificationsClick = () => {
    const role = user?.role;
    if (role === 'faculty') {
      navigate('/faculty/notifications');
    } else if (role === 'admin') {
      navigate('/admin/notifications');
    } else if (role === 'hod') {
      navigate('/hod/notifications');
    }
  };

  const getRoleBadgeColor = () => {
    switch (user?.role) {
      case 'admin':
        return 'bg-primary text-primary-foreground';
      case 'hod':
        return 'bg-accent text-accent-foreground';
      case 'faculty':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="flex h-16 items-center px-4 gap-4">
        <SidebarTrigger className="-ml-1" />

        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-hero flex items-center justify-center">
            <span className="text-white font-bold text-sm">FM</span>
          </div>
          <div className="hidden md:block">
            <h1 className="text-lg font-semibold text-foreground">FPMS</h1>
            <p className="text-xs text-muted-foreground">Faculty Portfolio Management</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <Badge className={getRoleBadgeColor()}>
            {user?.role?.toUpperCase()}
          </Badge>

          <Button variant="ghost" size="icon" className="relative" onClick={handleNotificationsClick}>
            <Bell className="h-5 w-5" />
            {user?.role !== 'admin' && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
