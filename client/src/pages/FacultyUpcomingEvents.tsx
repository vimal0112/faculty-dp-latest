import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { facultyAPI } from '@/lib/api';

const FacultyUpcomingEvents = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState('');
  const [durationUnit, setDurationUnit] = useState('days');
  const [calculatedDuration, setCalculatedDuration] = useState('');
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    // Request notification permission on component mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    // Check for events that need 24-hour notifications
    const checkNotifications = () => {
      const now = new Date();
      records.forEach((event) => {
        if (!event.notificationSent) {
          const eventStart = new Date(event.startDate);
          const timeUntilEvent = eventStart.getTime() - now.getTime();
          const hoursUntilEvent = timeUntilEvent / (1000 * 60 * 60);

          // Send notification if event is within 24 hours
          if (hoursUntilEvent <= 24 && hoursUntilEvent > 0) {
            sendEventNotification(event);
          }
        }
      });
    };

    const interval = setInterval(checkNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [records]);

  const sendEventNotification = (event: any) => {
    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Event Reminder', {
        body: `${event.eventName} is starting in less than 24 hours at ${event.venue}`,
        icon: '/favicon.ico'
      });
    }

    // Show in-app notification
    toast({
      title: 'Event Reminder',
      description: `${event.eventName} is starting in less than 24 hours at ${event.venue}`,
      variant: 'default',
    });

    // Mark notification as sent
    markNotificationSent(event.id);
  };

  const markNotificationSent = async (eventId: string) => {
    try {
      await facultyAPI.updateUpcomingEventNotification(eventId);
      setRecords(prev => prev.map(event =>
        event.id === eventId ? { ...event, notificationSent: true } : event
      ));
    } catch (error) {
      console.error('Failed to mark notification as sent:', error);
    }
  };

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return '';

    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 6) {
      const weeks = Math.round(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''}`;
    } else {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    }
  };

  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    if (endDate && duration) {
      setCalculatedDuration(calculateDuration(date, endDate));
    }
  };

  const handleEndDateChange = (date: string) => {
    setEndDate(date);
    if (startDate && duration) {
      setCalculatedDuration(calculateDuration(startDate, date));
    }
  };

  const handleDurationChange = (value: string) => {
    setDuration(value);
    if (startDate && endDate) {
      const calcDuration = calculateDuration(startDate, endDate);
      setCalculatedDuration(calcDuration);
      // Auto-set duration unit based on calculated duration
      if (calcDuration.includes('week')) {
        setDurationUnit('weeks');
      } else {
        setDurationUnit('days');
      }
    }
  };

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await facultyAPI.getUpcomingEvents();
      setRecords(data.map((item: any) => ({
        id: item._id || item.id,
        facultyId: item.facultyId?._id || item.facultyId || user?.id || '',
        eventName: item.eventName,
        venue: item.venue,
        startDate: item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '',
        endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '',
        duration: item.duration,
        durationUnit: item.durationUnit,
        description: item.description,
        status: item.status || 'upcoming',
        notificationSent: item.notificationSent || false,
      })));
    } catch (error) {
      console.error('Failed to load upcoming events:', error);
      toast({ title: 'Failed to load events', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user?.id) {
      toast({ title: 'Authentication required', description: 'Please log in to add events', variant: 'destructive' });
      return;
    }

    const formData = new FormData(e.currentTarget);

    const eventData: any = {
      eventName: formData.get('eventName') as string,
      venue: formData.get('venue') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      duration: duration || parseInt(formData.get('duration') as string) || 0,
      durationUnit: durationUnit || (calculatedDuration.includes('week') ? 'weeks' : 'days'),
      description: formData.get('description') as string,
    };

    try {
      if (editingRecord) {
        await facultyAPI.updateUpcomingEvent(editingRecord.id, eventData);
        toast({ title: 'Event updated successfully' });
      } else {
        await facultyAPI.createUpcomingEvent(eventData);
        toast({ title: 'Event added successfully' });
      }
      await loadRecords();
      setIsDialogOpen(false);
      setEditingRecord(null);
      setStartDate('');
      setEndDate('');
      setDuration('');
      setDurationUnit('days');
      setCalculatedDuration('');
    } catch (error: any) {
      console.error('Failed to save event:', error);
      toast({ title: error.message || 'Failed to save event', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await facultyAPI.deleteUpcomingEvent(id);
      toast({ title: 'Event deleted successfully', variant: 'destructive' });
      await loadRecords();
    } catch (error) {
      console.error('Failed to delete event:', error);
      toast({ title: 'Failed to delete event', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      upcoming: { variant: 'secondary', label: 'Upcoming' },
      ongoing: { variant: 'default', label: 'Ongoing' },
      completed: { variant: 'outline', label: 'Completed' },
    };
    const config = variants[status] || variants.upcoming;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const isEventSoon = (startDate: string) => {
    const now = new Date();
    const eventStart = new Date(startDate);
    const timeUntilEvent = eventStart.getTime() - now.getTime();
    const hoursUntilEvent = timeUntilEvent / (1000 * 60 * 60);
    return hoursUntilEvent <= 24 && hoursUntilEvent > 0;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Upcoming Events</h1>
          <p className="text-muted-foreground">Manage your academic events and activities</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingRecord(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add events
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">

            <DialogHeader>
              <DialogTitle>{editingRecord ? 'Edit' : 'Add New'} Event</DialogTitle>
              <DialogDescription>Schedule your academic events and activities</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="eventName">Event Name *</Label>
                <Input
                  id="eventName"
                  name="eventName"
                  defaultValue={editingRecord?.eventName}
                  required
                  placeholder="Enter event name"
                />
              </div>

              <div>
                <Label htmlFor="venue">Venue (Optional)</Label>
                <Input
                  id="venue"
                  name="venue"
                  defaultValue={editingRecord?.venue}
                  placeholder="Enter venue location"
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={startDate || editingRecord?.startDate || ''}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={endDate || editingRecord?.endDate || ''}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (Optional)</Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    value={duration || editingRecord?.duration || ''}
                    onChange={(e) => handleDurationChange(e.target.value)}
                    placeholder="Enter duration"
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="calculatedDuration">Calculated Duration</Label>
                  <div className="h-10 px-3 py-2 rounded-md border border-input bg-blue-50 text-blue-700 font-semibold flex items-center justify-center text-sm">
                    {calculatedDuration || "---"}
                  </div>
                  <input type="hidden" name="calculatedDuration" value={calculatedDuration} />
                </div>
              </div>


              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingRecord?.description}
                  rows={3}
                  placeholder="Describe the event..."
                />
              </div>

              <Button type="submit" className="w-full">
                {editingRecord ? 'Update Event' : 'Save Events'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No upcoming events found</div>
      ) : (
        <div className="grid gap-4">
          {records.map((event) => (
            <Card key={event.id} className={isEventSoon(event.startDate) ? 'border-orange-200 bg-orange-50/50' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      {event.eventName}
                      {isEventSoon(event.startDate) && (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {event.venue}
                    </CardDescription>
                  </div>
                  {getStatusBadge(event.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Period: </span>
                      <span className="font-medium">
                        {event.startDate ? new Date(event.startDate).toLocaleDateString() : 'N/A'} - {' '}
                        {event.endDate ? new Date(event.endDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration: </span>
                      <span className="font-medium">{event.duration || 'N/A'} {event.durationUnit || 'days'}</span>
                    </div>
                  </div>

                  {event.description && (
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  )}

                  {isEventSoon(event.startDate) && (
                    <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-100 p-2 rounded-md">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Event starting in less than 24 hours!</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingRecord(event);
                        setStartDate(event.startDate);
                        setEndDate(event.endDate);
                        setDuration(event.duration?.toString() || '');
                        setDurationUnit(event.durationUnit || 'days');
                        setCalculatedDuration(`${event.duration} ${event.durationUnit}`);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(event.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FacultyUpcomingEvents;
