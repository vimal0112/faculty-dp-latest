import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FileText, Calendar, Clock, Eye, Download } from 'lucide-react';
import { handleFileDownload } from '@/lib/downloadUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActivityBasedLearning } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { facultyAPI } from '@/lib/api';
import { formatDurationGlobal } from '@/lib/utils';

const FacultyABL = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<ActivityBasedLearning[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ActivityBasedLearning | null>(null);
  const [fromDate, setFromDate] = useState<string>('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const cleanBaseUrl = API_BASE_URL.replace('/api', '').replace(/\/$/, '');

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    if (editingRecord?.fromDate) {
      setFromDate(editingRecord.fromDate.split('T')[0]);
    } else {
      setFromDate('');
    }
  }, [editingRecord]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await facultyAPI.getABL();
      setRecords(data.map((item: any) => ({
        id: item._id || item.id,
        facultyId: item.facultyId?._id || item.facultyId || user?.id || '',
        subjectName: item.subjectName,
        courseCode: item.courseCode,
        industryConnect: item.industryConnect,
        proofDoc: item.proofDoc,
        fromDate: item.fromDate,
        toDate: item.toDate,
        calculatedDuration: item.calculatedDuration,
        status: item.status,
      })));
    } catch (error) {
      console.error('Failed to load records:', error);
      toast({ title: 'Failed to load records', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };



  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const proofFile = (formData.get('proofDoc') as File);

    const fromDate = formData.get('fromDate') as string;
    const toDate = formData.get('toDate') as string;
    const calculatedDuration = formatDurationGlobal(fromDate, toDate);

    const data: any = {
      subjectName: formData.get('subjectName') as string,
      courseCode: formData.get('courseCode') as string,
      industryConnect: formData.get('industryConnect') as string,
      fromDate,
      toDate,
      calculatedDuration,
    };

    if (proofFile && proofFile.size > 0) {
      if (proofFile.size > 10 * 1024 * 1024) {
        toast({ title: 'File size must be less than 10MB', variant: 'destructive' });
        return;
      }
      data.proofDoc = proofFile;
    }

    try {
      if (editingRecord) {
        await facultyAPI.updateABL(editingRecord.id, data);
        toast({ title: 'ABL report updated successfully' });
      } else {
        await facultyAPI.createABL(data);
        toast({ title: 'ABL report added successfully' });
      }
      await loadRecords();
      setIsDialogOpen(false);
      setEditingRecord(null);
    } catch (error) {
      console.error('Failed to save record:', error);
      toast({ title: 'Failed to save record', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      await facultyAPI.deleteABL(id);
      toast({ title: 'ABL report deleted successfully', variant: 'destructive' });
      await loadRecords();
    } catch (error) {
      console.error('Failed to delete record:', error);
      toast({ title: 'Failed to delete record', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Activity-Based Learning</h1>
          <p className="text-muted-foreground">Manage your ABL reports and industry connections</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingRecord(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add ABL Report
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRecord ? 'Edit' : 'Add'} ABL Report</DialogTitle>
              <DialogDescription>Fill in the activity-based learning details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="subjectName">Subject Name</Label>
                <Input id="subjectName" name="subjectName" defaultValue={editingRecord?.subjectName} required />
              </div>
              <div>
                <Label htmlFor="courseCode">Course Code</Label>
                <Input id="courseCode" name="courseCode" defaultValue={editingRecord?.courseCode} required />
              </div>
              <div>
                <Label htmlFor="industryConnect">Industry Connect</Label>
                <Input id="industryConnect" name="industryConnect" defaultValue={editingRecord?.industryConnect} placeholder="e.g., Tech Corp Partnership" required />
              </div>
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
                  min={fromDate}
                  defaultValue={editingRecord?.toDate?.split('T')[0]}
                  required
                />
              </div>
              <div>
                <Label htmlFor="proofDoc">Proof Document (JPG, PNG, DOCX, PDF - Max 10MB)</Label>
                <Input
                  id="proofDoc"
                  name="proofDoc"
                  type="file"
                  accept=".jpg,.jpeg,.png,.docx,.pdf"
                  className="cursor-pointer"
                  required={!editingRecord}
                />
                {editingRecord?.proofDoc && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Current file: {editingRecord.proofDoc.split('/').pop()}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full">
                {editingRecord ? 'Update' : 'Add'} Report
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No ABL records found</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {records.map((abl) => (
            <Card key={abl.id}>
              <CardHeader>
                <CardTitle>{abl.subjectName}</CardTitle>
                <CardDescription>{abl.courseCode}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Industry Connect: </span>
                    <span className="font-medium">{abl.industryConnect}</span>
                  </div>
                  {abl.fromDate && abl.toDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(abl.fromDate).toLocaleDateString()} - {new Date(abl.toDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {abl.calculatedDuration && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{abl.calculatedDuration}</span>
                    </div>
                  )}
                  {abl.proofDoc && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        Proof Document Available
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-primary hover:text-primary/80 px-2"
                        asChild
                      >
                        <a
                          href={`${cleanBaseUrl}${abl.proofDoc}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-primary hover:text-primary/80 px-2 flex items-center gap-1"
                        onClick={() => handleFileDownload(abl.proofDoc, `ABL_Proof_${abl.subjectName.replace(/\s+/g, '_')}`)}
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <span className={`text-sm font-medium px-2 py-1 rounded ${abl.status === 'approved' ? 'bg-green-100 text-green-800' :
                      abl.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                      {abl.status || 'pending'}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingRecord(abl);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(abl.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
      }
    </div >
  );
};

export default FacultyABL;
