import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FileText, Download, Eye } from 'lucide-react';
import { handleFileDownload } from '@/lib/downloadUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FDPAttended } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { facultyAPI } from '@/lib/api';
import { formatDurationGlobal } from '@/lib/utils';


const FacultyFDPAttended = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<FDPAttended[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FDPAttended | null>(null);
  const [mode, setMode] = useState<'online' | 'offline' | 'hybrid'>('online');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const calculatedDuration = fromDate && toDate && new Date(toDate) >= new Date(fromDate)
    ? formatDurationGlobal(fromDate, toDate)
    : '';

  useEffect(() => {
    loadRecords();
  }, []);

  const cleanBaseUrl = API_BASE_URL.replace('/api', '').replace(/\/$/, '');

  useEffect(() => {
    if (isDialogOpen) {
      setFromDate(editingRecord?.fromDate || '');
      setToDate(editingRecord?.toDate || '');
    }
  }, [isDialogOpen, editingRecord]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await facultyAPI.getFDPAttended();
      setRecords(data.map((item: any) => {
        const fromDate = item.fromDate ? new Date(item.fromDate).toISOString().split('T')[0] : undefined;
        const toDate = item.toDate ? new Date(item.toDate).toISOString().split('T')[0] : undefined;
        const duration = (fromDate && toDate) ? formatDurationGlobal(fromDate, toDate) : (item.duration || '-');
        return {
          id: item._id || item.id,
          facultyId: item.facultyId?._id || item.facultyId || user?.id || '',
          title: item.title,
          mode: item.mode,
          fromDate,
          toDate,
          duration,
          venue: item.venue,
          reportUpload: item.reportUpload,
          proofDoc: item.proofDoc,
          certificate: item.certificate,
          status: item.status || 'pending',
        };
      }));
    } catch (error) {
      console.error('Failed to load FDP records:', error);
      toast({ title: 'Failed to load FDP records', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const certificateFile = formData.get('certificate') as File;
    const fromDateVal = formData.get('fromDate') as string;
    const toDateVal = formData.get('toDate') as string;

    const isNew = !editingRecord;
    if (isNew && (!certificateFile || certificateFile.size === 0)) {
      toast({ title: 'Certificate is mandatory. Please upload a PDF, JPG, PNG, or DOCX file.', variant: 'destructive' });
      return;
    }
    if (!fromDateVal || !toDateVal) {
      toast({ title: 'From date and To date are required.', variant: 'destructive' });
      return;
    }
    if (new Date(toDateVal) < new Date(fromDateVal)) {
      toast({ title: 'To date must be on or after From date.', variant: 'destructive' });
      return;
    }

    const fdpData: any = {
      title: formData.get('title') as string,
      mode,
      fromDate: fromDateVal,
      toDate: toDateVal,
      venue: formData.get('venue') as string,
    };
    if (certificateFile && certificateFile.size > 0) {
      fdpData.certificate = certificateFile;
    }

    try {
      if (editingRecord) {
        await facultyAPI.updateFDPAttended(editingRecord.id, fdpData);
        toast({ title: 'FDP updated successfully' });
      } else {
        await facultyAPI.createFDPAttended(fdpData);
        toast({ title: 'FDP added successfully' });
      }
      await loadRecords();
      setIsDialogOpen(false);
      setEditingRecord(null);
      setMode('online');
      setFromDate('');
      setToDate('');
    } catch (error: any) {
      console.error('Failed to save FDP:', error);
      toast({ title: error.message || 'Failed to save FDP', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FDP record?')) return;

    try {
      await facultyAPI.deleteFDPAttended(id);
      toast({ title: 'FDP deleted successfully', variant: 'destructive' });
      await loadRecords();
    } catch (error) {
      console.error('Failed to delete FDP:', error);
      toast({ title: 'Failed to delete FDP', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Attended FDPs</h1>
          <p className="text-muted-foreground">Manage your attended Faculty Development Programs</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingRecord(null);
              setMode('online');
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add FDP
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRecord ? 'Edit' : 'Add'} Attended FDP</DialogTitle>
              <DialogDescription>Fill in the details of the FDP you attended</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">FDP Title</Label>
                <Input id="title" name="title" defaultValue={editingRecord?.title} required />
              </div>
              <div>
                <Label htmlFor="mode">Mode</Label>
                <Select value={editingRecord?.mode || mode} onValueChange={(value) => setMode(value as 'online' | 'offline' | 'hybrid')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fromDate">From Date</Label>
                  <Input
                    id="fromDate"
                    name="fromDate"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="toDate">To Date</Label>
                  <Input
                    id="toDate"
                    name="toDate"
                    type="date"
                    value={toDate}
                    min={fromDate} // Enforce toDate >= fromDate
                    onChange={(e) => setToDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="rounded-lg border bg-muted/50 px-4 py-3">
                <Label className="text-xs text-muted-foreground">Duration (auto-calculated)</Label>
                <p className="mt-1 font-medium">
                  {calculatedDuration || (
                    <span className="text-muted-foreground">Select From and To dates</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {calculatedDuration ? '>6 days shown in weeks, otherwise in days' : 'Select dates to see duration'}
                </p>
              </div>
              <div>
                <Label htmlFor="venue">Venue</Label>
                <Input id="venue" name="venue" defaultValue={editingRecord?.venue} required />
              </div>
              <div>
                <Label htmlFor="certificate">Certificate (PDF, JPG, PNG, DOCX - Max 10MB) *</Label>
                <Input
                  id="certificate"
                  name="certificate"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.docx"
                  className="cursor-pointer"
                  required={!editingRecord?.certificate}
                />
                {editingRecord?.certificate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Current: {editingRecord.certificate.split('/').pop()} — upload new to replace
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full">
                {editingRecord ? 'Update' : 'Add'} FDP
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No FDP records found</div>
      ) : (
        <div className="grid gap-4">
          {records.map((fdp) => (
            <Card key={fdp.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{fdp.title}</CardTitle>
                    <CardDescription>
                      {fdp.venue} • {fdp.duration}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={fdp.status === 'approved' ? 'default' : 'secondary'}>
                      {fdp.status}
                    </Badge>
                    <Badge variant="outline">{fdp.mode}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {fdp.reportUpload && (
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        Report
                      </div>
                    )}
                    {fdp.proofDoc && (
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        Proof Doc
                      </div>
                    )}
                    {fdp.certificate && (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-7 text-primary hover:text-primary/80 px-2" asChild>
                          <a
                            href={`${cleanBaseUrl}${fdp.certificate}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-primary hover:text-primary/80 px-2 flex items-center gap-1"
                          onClick={() => handleFileDownload(fdp.certificate, `FDP_Certificate_${fdp.title.replace(/\s+/g, '_')}`)}
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingRecord(fdp);
                        setMode(fdp.mode as 'online' | 'offline' | 'hybrid');
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(fdp.id)}
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

export default FacultyFDPAttended;
