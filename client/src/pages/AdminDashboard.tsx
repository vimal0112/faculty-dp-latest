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
    totalFDPsAttended: 0,
    totalFDPsOrganized: 0,
    totalSeminars: 0,
    pendingApprovals: 0,
    totalABL: 0,
    totalJointTeaching: 0,
    totalAdjunctFaculty: 0,
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
      const [faculty, fdpAttended, fdpOrganized, seminars, abl, jointTeaching, adjunct, reimbursements, achievements, internships] = await Promise.all([
        adminAPI.getFaculty(),
        adminAPI.getFDPAttended(),
        adminAPI.getFDPOrganized(),
        adminAPI.getSeminars(),
        adminAPI.getABL(),
        adminAPI.getJointTeaching(),
        adminAPI.getAdjunctFaculty(),
        adminAPI.getReimbursements(),
        adminAPI.getAchievements(),
        adminAPI.getInternships(),
      ]);

      setStats({
        totalFaculty: faculty.length,
        totalFDPsAttended: fdpAttended.length,
        totalFDPsOrganized: fdpOrganized.length,
        totalSeminars: seminars.length,
        pendingApprovals: fdpAttended.filter((fdp: any) => fdp.status === 'pending').length,
        totalABL: abl.length,
        totalJointTeaching: jointTeaching.length,
        totalAdjunctFaculty: adjunct.length,
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


  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage faculty portfolios and records</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          title="Total Faculty"
          value={stats.totalFaculty}
          icon={Users}
          description="Active members"
        />
        <StatCard
          title="FDP Attended"
          value={stats.totalFDPsAttended}
          icon={Award}
          description="Participation"
        />
        <StatCard
          title="FDP Organized"
          value={stats.totalFDPsOrganized}
          icon={TrendingUp}
          description="Events conducted"
        />
        <StatCard
          title="Adjunct Faculty"
          value={stats.totalAdjunctFaculty}
          icon={Users}
          description="Guest lectures"
        />
      </div>

      <div className="h-4"></div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          title="Joint Teaching"
          value={stats.totalJointTeaching}
          icon={FileText}
          description="Collaborative"
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          icon={Bell}
          trend={stats.pendingApprovals > 0 ? '!' : undefined}
        />
        <StatCard
          title="Seminars"
          value={stats.totalSeminars}
          icon={FileText}
          description="Academic"
        />
        <StatCard
          title="ABL Reports"
          value={stats.totalABL}
          icon={TrendingUp}
          description="Activity based"
        />
      </div>

      <div className="h-4"></div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          title="Reimbursements"
          value={stats.totalReimbursements}
          icon={DollarSign}
          description="Payments"
        />
        <StatCard
          title="Achievements"
          value={stats.totalAchievements}
          icon={Trophy}
          description="Faculty awards"
        />
        <StatCard
          title="Internships"
          value={stats.totalInternships}
          icon={Briefcase}
          description="Guided"
        />
      </div>


    </div>
  );
};


export default AdminDashboard;
