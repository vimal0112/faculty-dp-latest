import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FileText, Calendar, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FDP } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { facultyAPI } from '@/lib/api';
import { formatDurationGlobal } from '@/lib/utils';
import fdpPlaceholder from '@/assets/fdp-placeholder.jpg';

const FacultyFDPs = () => {
  const { user } = useAuth();
  const [fdps, setFdps] = useState<FDP[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFdp, setEditingFdp] = useState<FDP | null>(null);

  useEffect(() => {
    loadFDPs();
  }, []);

  const loadFDPs = async () => {
    try {
      setLoading(true);
      const [attended, organized] = await Promise.all([
        facultyAPI.getFDPAttended(),
        facultyAPI.getFDPOrganized(),
      ]);

      // Combine both types into a unified FDP list
      const combined: FDP[] = [
        ...attended.map((item: any) => {
          const fromDate = item.fromDate ? new Date(item.fromDate).toISOString().split('T')[0] : '';
          const toDate = item.toDate ? new Date(item.toDate).toISOString().split('T')[0] : '';
          const duration = (fromDate && toDate) ? formatDurationGlobal(fromDate, toDate) : (item.duration || '');
          return {
            id: item._id || item.id,
            facultyId: item.facultyId?._id || item.facultyId || user?.id || '',
            title: item.title,
            organizer: item.venue,
            startDate: fromDate,
            endDate: toDate,
            duration,
            certificate: item.certificate || item.proofDoc,
            status: item.status || 'pending',
          };
        }),
        ...organized.map((item: any) => {
          const fromDate = item.fromDate ? new Date(item.fromDate).toISOString().split('T')[0] : '';
          const toDate = item.toDate ? new Date(item.toDate).toISOString().split('T')[0] : '';
          const duration = (fromDate && toDate) ? formatDurationGlobal(fromDate, toDate) : (item.duration || '');
          return {
            id: item._id || item.id,
            facultyId: item.facultyId?._id || item.facultyId || user?.id || '',
            title: item.title,
            organizer: item.venue,
            startDate: fromDate,
            endDate: toDate,
            duration,
            certificate: item.certificate || item.proofDoc,
            status: item.status || 'pending',
          };
        }),
      ];

      setFdps(combined);
    } catch (error) {
      console.error('Failed to load FDPs:', error);
      toast.error('Failed to load FDPs');
    } finally {
      setLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    title: '',
    organizer: '',
    startDate: '',
    endDate: '',
    mode: 'offline' as 'online' | 'offline' | 'hybrid',
    certificate: null as File | null,
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate) {
      toast.error('Start date and End date are required');
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error('End date must be on or after Start date');
      return;
    }
    const form = e.currentTarget as HTMLFormElement;
    const certFile = (form.querySelector('input[type="file"]') as HTMLInputElement)?.files?.[0];
    if (!editingFdp && (!certFile || certFile.size === 0)) {
      toast.error('Certificate is mandatory. Please upload a PDF, JPG, PNG, or DOCX file.');
      return;
    }
    try {
      const data: any = {
        title: formData.title,
        venue: formData.organizer,
        mode: formData.mode,
        fromDate: formData.startDate,
        toDate: formData.endDate,
      };
      if (certFile && certFile.size > 0) data.certificate = certFile;

      if (editingFdp) {
        await facultyAPI.updateFDPAttended(editingFdp.id, data);
        toast.success('FDP updated successfully!');
      } else {
        await facultyAPI.createFDPAttended(data);
        toast.success('FDP added successfully!');
      }
      await loadFDPs();
      setIsAddModalOpen(false);
      setEditingFdp(null);
      setFormData({ title: '', organizer: '', startDate: '', endDate: '', mode: 'offline', certificate: null });
    } catch (error) {
      console.error('Failed to save FDP:', error);
      toast.error('Failed to save FDP');
    }
  };

  const handleEdit = (fdp: FDP) => {
    setEditingFdp(fdp);
    setFormData({
      title: fdp.title,
      organizer: fdp.organizer,
      startDate: fdp.startDate,
      endDate: fdp.endDate,
      mode: 'offline',
      certificate: null,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FDP?')) return;
    try {
      await facultyAPI.deleteFDPAttended(id);
      toast.success('FDP deleted successfully!');
      await loadFDPs();
    } catch (error) {
      console.error('Failed to delete FDP:', error);
      toast.error('Failed to delete FDP');
    }
  };

  const FDPForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">FDP Title *</Label>
        <Input
          id="title"
          placeholder="e.g., Machine Learning Fundamentals"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="organizer">Organizer *</Label>
        <Input
          id="organizer"
          placeholder="e.g., IIT Bombay"
          value={formData.organizer}
          onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date *</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date *</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            min={formData.startDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            required
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Duration is auto-calculated (days or weeks if &gt;6 days)</p>

      <div className="space-y-2">
        <Label htmlFor="mode">Mode</Label>
        <select
          id="mode"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={formData.mode}
          onChange={(e) => setFormData({ ...formData, mode: e.target.value as 'online' | 'offline' | 'hybrid' })}
        >
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="certificate">Certificate (PDF, JPG, PNG, DOCX) *</Label>
        <Input
          id="certificate"
          name="certificate"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.docx"
        />
        <p className="text-xs text-muted-foreground">Required for new FDP. PDF, JPG, PNG, or DOCX (max 10MB)</p>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsAddModalOpen(false);
            setEditingFdp(null);
            setFormData({ title: '', organizer: '', startDate: '', endDate: '', mode: 'offline', certificate: null });
          }}
        >
          Cancel
        </Button>
        <Button type="submit">
          {editingFdp ? 'Update FDP' : 'Add FDP'}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My FDPs</h1>
          <p className="text-muted-foreground">Manage your Faculty Development Programs</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add FDP
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New FDP</DialogTitle>
              <DialogDescription>
                Fill in the details of your Faculty Development Program
              </DialogDescription>
            </DialogHeader>
            <FDPForm />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {fdps.map((fdp) => (
            <Card key={fdp.id} className="overflow-hidden hover:shadow-hover transition-all">
              <div className="h-40 overflow-hidden bg-gradient-hero">
                <img
                  src={fdpPlaceholder}
                  alt={fdp.title}
                  className="w-full h-full object-cover opacity-80"
                />
              </div>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-2">{fdp.title}</CardTitle>
                  <Badge variant={fdp.status === 'approved' ? 'default' : fdp.status === 'pending' ? 'secondary' : 'destructive'}>
                    {fdp.status}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  {fdp.organizer}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{fdp.startDate} to {fdp.endDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{fdp.duration}</span>
                  </div>
                </div>

                {fdp.certificate && (
                  <div className="pt-2 border-t">
                    <Button variant="outline" size="sm" className="w-full">
                      <FileText className="h-3 w-3 mr-2" />
                      View Certificate
                    </Button>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Dialog open={editingFdp?.id === fdp.id} onOpenChange={(open) => !open && setEditingFdp(null)}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEdit(fdp)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit FDP</DialogTitle>
                        <DialogDescription>
                          Update your FDP details
                        </DialogDescription>
                      </DialogHeader>
                      <FDPForm />
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(fdp.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && fdps.length === 0 && (
        <Card className="p-12 text-center">
          <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No FDPs Added Yet</h3>
          <p className="text-muted-foreground mb-4">
            Start building your portfolio by adding your first FDP
          </p>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First FDP
          </Button>
        </Card>
      )}
    </div>
  );
};

export default FacultyFDPs;
