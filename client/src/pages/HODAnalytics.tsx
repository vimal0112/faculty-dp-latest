import { useState, useEffect } from 'react';
import { TrendingUp, Award, Users, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { hodAPI } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const HODAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [records, setRecords] = useState<{
    fdpAttended: any[];
    fdpOrganized: any[];
    seminars: any[];
    abl: any[];
    jointTeaching: any[];
    adjunct: any[];
  }>({
    fdpAttended: [],
    fdpOrganized: [],
    seminars: [],
    abl: [],
    jointTeaching: [],
    adjunct: [],
  });
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsData, recordsData, facultyData] = await Promise.all([
        hodAPI.getAnalytics(),
        hodAPI.getRecords(),
        hodAPI.getFaculty(),
      ]);
      setAnalytics(analyticsData);
      setRecords(recordsData);
      setFaculty(facultyData || []);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const allFDPs = [...records.fdpAttended, ...records.fdpOrganized];

  // FDP Status Distribution
  const fdpStatusData = [
    { name: 'Approved', value: allFDPs.filter((f: any) => f.status === 'approved').length },
    { name: 'Pending', value: allFDPs.filter((f: any) => f.status === 'pending').length },
    { name: 'Rejected', value: allFDPs.filter((f: any) => f.status === 'rejected').length },
  ];

  // Faculty Activity Chart (simplified)
  const facultyActivityData = faculty.slice(0, 10).map((fac: any) => ({
    name: fac.name?.split(' ')[0] || 'Faculty',
    FDPs: 0, // Would need to count from records
    Seminars: 0,
    Workshops: 0,
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics & Reports</h1>
        <p className="text-muted-foreground">
          Department performance metrics and insights
        </p>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="text-center py-8">Loading analytics...</div>
      ) : analytics ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Faculty</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview?.totalFaculty || faculty.length}</div>
              <p className="text-xs text-muted-foreground">Active members</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total FDPs</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(analytics.overview?.totalFDPAttended || 0) + (analytics.overview?.totalFDPOrganized || 0)}
              </div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Seminars</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview?.totalSeminars || records.seminars.length}</div>
              <p className="text-xs text-muted-foreground">This year</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Activity</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {faculty.length > 0
                  ? Math.round(
                    (allFDPs.length + records.seminars.length) / faculty.length
                  )
                  : 0}
              </div>
              <p className="text-xs text-muted-foreground">Per faculty member</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Expanded Stats Grid */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium">ABL Activities</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-2xl font-bold">{records.abl?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium">Joint Teaching</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-2xl font-bold">{records.jointTeaching?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium">Adjunct Faculty</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-2xl font-bold">{records.adjunct?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium">FDP Organized</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-2xl font-bold">{records.fdpOrganized?.length || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      {loading ? (
        <div className="text-center py-8">Loading charts...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>FDP Status Distribution</CardTitle>
              <CardDescription>Breakdown of FDP approval status</CardDescription>
            </CardHeader>
            <CardContent>
              {fdpStatusData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={fdpStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {fdpStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">No FDP data available</div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Top Performing Faculty</CardTitle>
                <CardDescription>Based on total FDP participation (Attended & Organized)</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadAnalytics} disabled={loading}>
                <TrendingUp className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </CardHeader>
            <CardContent>
              {analytics?.topFaculty && analytics.topFaculty.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={analytics.topFaculty.map((fac: any) => ({
                      name: fac.faculty?.[0]?.name || 'Unknown Faculty',
                      count: fac.count || 0,
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      interval={0}
                      height={80}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis label={{ value: 'FDP Participation Count', angle: -90, position: 'insideLeft', offset: 0 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--primary))' }}
                    />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                      barSize={60}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">No activity data available</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Department Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Department Statistics</CardTitle>
          <CardDescription>Key metrics for {user?.department} department</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading statistics...</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Average FDPs per Faculty</p>
                <p className="text-2xl font-bold">
                  {faculty.length > 0 ? (allFDPs.length / faculty.length).toFixed(1) : '0.0'}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Average Seminars per Faculty</p>
                <p className="text-2xl font-bold">
                  {faculty.length > 0 ? (records.seminars.length / faculty.length).toFixed(1) : '0.0'}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Approval Rate</p>
                <p className="text-2xl font-bold">
                  {allFDPs.length > 0
                    ? ((allFDPs.filter((f: any) => f.status === 'approved').length / allFDPs.length) * 100).toFixed(0)
                    : 0}%
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HODAnalytics;

