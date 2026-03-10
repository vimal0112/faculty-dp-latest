import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
            <Button onClick={() => setEditingRecord(null)} className="shadow-lg hover:shadow-xl transition-all duration-300">
              <Plus className="mr-2 h-5 w-5" />
              Add events
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border-t-4 border-t-primary">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                <Calendar className="h-6 w-6" />
                {editingRecord ? 'Edit' : 'Add New'} Event
              </DialogTitle>
              <DialogDescription>Schedule your upcoming academic events and activities</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="eventName" className="text-sm font-semibold">Event Name *</Label>
                <Input
                  id="eventName"
                  name="eventName"
                  defaultValue={editingRecord?.eventName}
                  required
                  placeholder="e.g., International Research Symposium 2026"
                  className="rounded-lg border-primary/20 focus:border-primary"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="venue" className="text-sm font-semibold">Venue (Optional)</Label>
                <Input
                  id="venue"
                  name="venue"
                  defaultValue={editingRecord?.venue}
                  placeholder="e.g., Main Auditorium, Block A"
                  className="rounded-lg border-primary/20 focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/30 rounded-xl border border-dashed border-primary/30">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate" className="text-xs font-bold uppercase tracking-wider text-muted-foreground italic">Start Date *</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={startDate || editingRecord?.startDate || ''}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      required
                      className="rounded-lg"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endDate" className="text-xs font-bold uppercase tracking-wider text-muted-foreground italic">End Date *</Label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={endDate || editingRecord?.endDate || ''}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                      required
                      className="rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-center items-center space-y-3 bg-white/50 p-4 rounded-lg border border-primary/10 shadow-sm">
                  <Label className="text-sm font-bold text-primary">Calculated Duration</Label>
                  <div className="w-full flex flex-col items-center justify-center gap-1">
                    <div className="text-3xl font-black text-primary animate-pulse-subtle">
                      {calculatedDuration || "---"}
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Auto-calculated from dates</p>
                  </div>
                  <input type="hidden" name="calculatedDuration" value={calculatedDuration} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="duration" className="text-sm font-semibold flex items-center justify-between">
                  Manual Duration Override
                  <span className="text-[10px] font-normal bg-muted px-2 py-0.5 rounded text-muted-foreground uppercase">Optional</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    value={duration || editingRecord?.duration || ''}
                    onChange={(e) => handleDurationChange(e.target.value)}
                    placeholder="Enter number"
                    min="0"
                    className="flex-1 rounded-lg border-primary/20"
                  />
                  <Select value={durationUnit || editingRecord?.durationUnit || 'days'} onValueChange={setDurationUnit}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description" className="text-sm font-semibold italic">Description (Optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingRecord?.description}
                  rows={3}
                  placeholder="Provide brief details about the event..."
                  className="rounded-lg resize-none border-primary/20 focus:border-primary"
                />
              </div>

              <Button type="submit" className="w-full h-12 text-lg font-bold shadow-md hover:shadow-lg transition-all rounded-xl">
                {editingRecord ? 'Update Event' : 'Save Events'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading your academic schedule...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="flex flex-col items-center justify-center p-12 text-center bg-muted/20 border-2 border-dashed border-muted transition-all hover:bg-muted/30 col-span-full min-h-[400px]">
            <div className="bg-primary/10 p-6 rounded-full mb-6">
              <Calendar className="h-16 w-16 text-primary opacity-50" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">No Scheduled Events</h3>
            <p className="text-muted-foreground max-w-md mb-8">
              Your academic calendar is currently empty. Start by adding your upcoming symposia, workshops, or research activities.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} size="lg" className="rounded-full px-8 gap-2">
              <Plus className="h-5 w-5" />
              Schedule Your First Event
            </Button>
          </Card>

          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Automatic Reminders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Stay on top of your schedule! We'll automatically notify you 24 hours before any event begins via browser alerts and in-portal messages.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Quick Duration Calc
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Just enter your dates and we'll calculate the duration for you. Events longer than 6 days are automatically formatted in weeks for better readability.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {records.map((event) => (
            <Card
              key={event.id}
              className={`group flex flex-col transition-all duration-300 hover:shadow-xl hover:translate-y-[-4px] overflow-hidden border-t-4 ${isEventSoon(event.startDate) ? 'border-t-orange-500 bg-orange-50/30' : 'border-t-primary'
                }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between min-h-[60px]">
                  <div className="flex-1 pr-2">
                    <CardTitle className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
                      {event.eventName}
                    </CardTitle>
                  </div>
                  {getStatusBadge(event.status)}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mt-2 bg-muted/50 w-fit px-2 py-1 rounded-md">
                  <MapPin className="h-3 w-3" />
                  {event.venue || 'TBA'}
                </div>
              </CardHeader>
              <CardContent className="flex-1 pb-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/60 border border-muted shadow-sm">
                    <div className="space-y-0.5">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Schedule</p>
                      <p className="text-xs font-semibold">
                        {event.startDate ? new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '---'}
                      </p>
                    </div>
                    <div className="h-8 w-[1px] bg-muted mx-2"></div>
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Duration</p>
                      <Badge variant="outline" className="text-primary border-primary/20 font-bold bg-primary/5">
                        {event.duration} {event.durationUnit}
                      </Badge>
                    </div>
                  </div>

                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3 italic">"{event.description}"</p>
                  )}

                  {isEventSoon(event.startDate) && (
                    <div className="flex items-center gap-2 text-[11px] font-bold text-orange-700 bg-orange-200/50 p-2.5 rounded-lg border border-orange-200 animate-pulse">
                      <AlertTriangle className="h-4 w-4" />
                      <span>STARTS WITHIN 24 HOURS</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 mt-auto border-t border-dashed">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 gap-2 hover:bg-primary/10 hover:text-primary rounded-lg font-bold text-xs h-9"
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
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-2 hover:bg-destructive/10 hover:text-destructive rounded-lg text-xs h-9"
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
