import { useState, useEffect } from 'react';
import { Users, FileText, Award, Bell, TrendingUp, DollarSign, Trophy, Briefcase } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { adminAPI } from '@/lib/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalFaculty: 0,
    totalFDPs: 0,
    totalSeminars: 0,
    pendingApprovals: 0,
    totalABL: 0,
    totalReimbursements: 0,
    totalAchievements: 0,
    totalInternships: 0,
  });
  const [facultyProfiles, setFacultyProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [faculty, fdps, seminars, abl, reimbursements, achievements, internships] = await Promise.all([
        adminAPI.getFaculty(),
        adminAPI.getFDPAttended(),
        adminAPI.getSeminars(),
        adminAPI.getABL(),
        adminAPI.getReimbursements(),
        adminAPI.getAchievements(),
        adminAPI.getInternships(),
      ]);

      setStats({
        totalFaculty: faculty.length,
        totalFDPs: fdps.length,
        totalSeminars: seminars.length,
        pendingApprovals: fdps.filter((fdp: any) => fdp.status === 'pending').length,
        totalABL: abl.length,
        totalReimbursements: reimbursements.length,
        totalAchievements: achievements.length,
        totalInternships: internships.length,
      });
      setFacultyProfiles(faculty);
    } catch (error) {
      console.error('Failed to load stats:', error);
      toast({ title: 'Failed to load dashboard stats', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const totalFDPs = stats.totalFDPs;
  const totalSeminars = stats.totalSeminars;
  const pendingApprovals = stats.pendingApprovals;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage faculty portfolios and records</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        <StatCard
          title="Total Faculty"
          value={stats.totalFaculty}
          icon={Users}
          description="Active members"
        />
        <StatCard
          title="Total FDPs"
          value={totalFDPs}
          icon={Award}
          description="All departments"
        />
        <StatCard
          title="Total Seminars"
          value={totalSeminars}
          icon={FileText}
          description="This year"
        />
        <StatCard
          title="Pending Approvals"
          value={pendingApprovals}
          icon={Bell}
          description="Requires attention"
          trend={pendingApprovals > 0 ? '!' : undefined}
        />
      </div>

      {/* Gap for visual separation */}
      <div className="h-4"></div>

      {/* Second Row Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        <StatCard
          title="Total ABL Reports"
          value={stats.totalABL}
          icon={TrendingUp}
          description="Activity based learning"
        />
        <StatCard
          title="Total Reimbursements"
          value={stats.totalReimbursements}
          icon={DollarSign}
          description="Payment requests"
        />
        <StatCard
          title="Total Achievements"
          value={stats.totalAchievements}
          icon={Trophy}
          description="Faculty accomplishments"
        />
        <StatCard
          title="Total Internships"
          value={stats.totalInternships}
          icon={Briefcase}
          description="Faculty interns"
        />
      </div>


    </div>
  );
};


export default AdminDashboard;
