import { useEffect, useState, useMemo } from 'react';
import {
  Award, Calendar, GraduationCap, TrendingUp, UsersRound,
  UserPlus, DollarSign, Trophy, Briefcase, FileText
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { facultyAPI } from '@/lib/api';

const FacultyDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardData, facultyEvents] = await Promise.all([
        facultyAPI.getDashboard(),
        facultyAPI.getUpcomingEvents(),
      ]);

      setStats(dashboardData.stats);
      setUpcomingEvents(facultyEvents || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCardsData = useMemo(() => {
    if (!stats) return [];

    return [
      { id: 'attended', title: 'Attended FDPs', value: stats.fdpAttended || 0, icon: Award, desc: 'Completed programs' },
      { id: 'organized', title: 'Organised FDPs', value: stats.fdpOrganized || 0, icon: Award, desc: 'Hosted programs' },
      { id: 'abl', title: 'ABL Reports', value: stats.abl || 0, icon: FileText, desc: 'Activity Based Learning' },
      { id: 'adjunct', title: 'Adjunct Faculty', value: stats.adjunct || 0, icon: UserPlus, desc: 'Adjunct roles' },
      { id: 'jointTeaching', title: 'Joint Teaching', value: stats.jointTeaching || 0, icon: UsersRound, desc: 'Collaborative courses' },
      { id: 'seminars', title: 'Seminars', value: stats.seminars || 0, icon: GraduationCap, desc: 'Conducted / Attended' },
      { id: 'reimbursements', title: 'Reimbursements', value: stats.reimbursements || 0, icon: DollarSign, desc: 'FDP Claims' },
      { id: 'achievements', title: 'Achievements', value: stats.achievements || 0, icon: Trophy, desc: 'Awards & Honors' },
      { id: 'internships', title: 'Internships', value: stats.internships || 0, icon: Briefcase, desc: 'Industry experience' },
      { id: 'events', title: 'Upcoming Events', value: stats.upcomingEvents || 0, icon: Calendar, desc: 'Scheduled activities' },
    ];
  }, [stats]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Welcome back, {user?.name}</h1>
        <p className="text-muted-foreground">Here's an overview of your portfolio</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading dashboard...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {statCardsData.map((card) => (
              <StatCard
                key={card.id}
                title={card.title}
                value={card.value}
                icon={card.icon}
                description={card.desc}
              />
            ))}
          </div>

          <Card className="mt-8 border-t-4 border-t-primary">
            <CardHeader className="bg-muted/20">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>My Upcoming Events</CardTitle>
                  <CardDescription>Events strictly scheduled for you</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {upcomingEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/10 rounded-lg border border-dashed border-muted mt-2">
                  <Calendar className="h-10 w-10 text-muted-foreground opacity-30 mb-3" />
                  <p className="text-muted-foreground font-medium">No upcoming events scheduled yet</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-2">
                  {upcomingEvents.map((event: any) => (
                    <div
                      key={event.id || event._id}
                      className="p-4 rounded-xl border border-muted/60 bg-gradient-to-br from-card to-muted/20 hover:shadow-lg transition-all hover:border-primary/30"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                          Scheduled
                        </Badge>
                        <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                          {event.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBD'}
                        </span>
                      </div>
                      <h4 className="font-semibold text-foreground mb-1 line-clamp-1">{event.eventName}</h4>
                      <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5 line-clamp-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                        {event.venue || 'TBA'}
                      </p>
                      {event.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 italic border-l-2 pl-2 border-muted">
                          "{event.description}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default FacultyDashboard;
