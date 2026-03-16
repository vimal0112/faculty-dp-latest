import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FileText, Clock, Eye, Calendar, Download } from 'lucide-react';
import { handleFileDownload } from '@/lib/downloadUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { JointTeaching } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { facultyAPI } from '@/lib/api';
import { formatDurationGlobal } from '@/lib/utils';

const FacultyJointTeaching = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<JointTeaching[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<JointTeaching | null>(null);
  const API_BASE_URL = (import.meta.env?.VITE_API_URL as string) || 'http://localhost:3001/api';
  const cleanBaseUrl = API_BASE_URL.replace('/api', '').replace(/\/$/, '');

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await facultyAPI.getJointTeaching();
      setRecords(data.map((item: any) => ({
        id: item._id || item.id,
        facultyId: item.facultyId,
        courseName: item.courseName,
        courseCode: item.courseCode,
        facultyWithinCollege: item.facultyWithinCollege || item.facultyInvolved,
        facultyOutsideCollege: item.facultyOutsideCollege,
        hours: item.hours,
        fromDate: item.fromDate,
        toDate: item.toDate,
        calculatedDuration: item.calculatedDuration,
        toBePaid: item.toBePaid,
        status: item.status,
        certificate: item.certificate,
      })));
    } catch (error) {
      console.error('Failed to load records:', error);
      toast({ title: 'Failed to load records', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const calculatedDurationDisplay = fromDate && toDate && new Date(toDate) >= new Date(fromDate)
    ? formatDurationGlobal(fromDate, toDate)
    : '';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const certificateFile = (formData.get('certificate') as File);

    // Validate mandatory fields
    const courseName = formData.get('courseName') as string;
    const courseCode = formData.get('courseCode') as string;
    const facultyWithinCollege = formData.get('facultyWithinCollege') as string;
    const hours = formData.get('hours') as string;
    const fromDate = formData.get('fromDate') as string;
    const toDate = formData.get('toDate') as string;
    const toBePaid = formData.get('toBePaid') as string;

    // Check mandatory fields
    if (!courseName?.trim()) {
      toast({ title: 'Course Name is required', variant: 'destructive' });
      return;
    }

    if (!courseCode?.trim()) {
      toast({ title: 'Course Code is required', variant: 'destructive' });
      return;
    }

    if (!facultyWithinCollege?.trim()) {
      toast({ title: 'Faculty Within College is required', variant: 'destructive' });
      return;
    }

    if (!hours || parseInt(hours) < 1) {
      toast({ title: 'Hours must be at least 1', variant: 'destructive' });
      return;
    }

    if (!fromDate || !toDate) {
      toast({ title: 'From Date and To Date are required', variant: 'destructive' });
      return;
    }

    if (new Date(toDate) < new Date(fromDate)) {
      toast({ title: 'To Date must be on or after From Date', variant: 'destructive' });
      return;
    }

    if (!toBePaid || parseInt(toBePaid) < 0) {
      toast({ title: 'To be Paid must be a positive number', variant: 'destructive' });
      return;
    }

    // Validate certificate for new records
    if (!editingRecord) {
      if (!certificateFile || certificateFile.size === 0) {
        toast({ title: 'Certificate is required', variant: 'destructive' });
        return;
      }
    }

    if (certificateFile && certificateFile.size > 0) {
      // Check file size
      if (certificateFile.size > 10 * 1024 * 1024) {
        toast({ title: 'File size must be less than 10MB', variant: 'destructive' });
        return;
      }

      // Check file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(certificateFile.type)) {
        toast({ title: 'Only PDF, JPG, and PNG files are allowed', variant: 'destructive' });
        return;
      }
    }

    const calculatedDuration = formatDurationGlobal(fromDate, toDate);

    const data: any = {
      courseName: courseName.trim(),
      courseCode: courseCode.trim(),
      facultyWithinCollege: facultyWithinCollege.trim(),
      facultyOutsideCollege: (formData.get('facultyOutsideCollege') as string)?.trim() || '',
      hours: parseInt(hours),
      fromDate,
      toDate,
      calculatedDuration,
      toBePaid: parseInt(toBePaid),
    };

    if (certificateFile && certificateFile.size > 0) {
      data.certificate = certificateFile;
    }

    try {
      if (editingRecord) {
        await facultyAPI.updateJointTeaching(editingRecord.id, data);
        toast({ title: 'Joint teaching updated successfully' });
      } else {
        await facultyAPI.createJointTeaching(data);
        toast({ title: 'Joint teaching added successfully' });
      }

      // Capture form reference before any async operations
      const formEl = e.currentTarget;

      // Reset form and close dialog
      await loadRecords();
      setIsDialogOpen(false);
      setEditingRecord(null);
      setFromDate('');
      setToDate('');

      // Safe reset — formEl captured before async
      if (formEl) formEl.reset();

    } catch (error: any) {
      console.error('Failed to save record:', error);
      toast({ title: error.message || 'Failed to save record', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      await facultyAPI.deleteJointTeaching(id);
      toast({ title: 'Record deleted successfully', variant: 'destructive' });
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
          <h1 className="text-3xl font-bold text-foreground">Joint Teaching</h1>
          <p className="text-muted-foreground">Manage your joint teaching assignments and credits</p>
        </div>
        <Button
          onClick={() => {
            setEditingRecord(null);
            setFromDate('');
            setToDate('');
            setIsDialogOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Joint Teaching
        </Button>
      </div>

      {/* Dialog for Add/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRecord ? 'Edit Joint Teaching Record' : 'New Joint Teaching Entry'}</DialogTitle>
            <DialogDescription>{editingRecord ? 'Update the details of this joint teaching record.' : 'Fill in all the required details to register a new joint teaching entry.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pb-2">
            <div>
              <Label htmlFor="courseName">Course Name</Label>
              <Input id="courseName" name="courseName" defaultValue={editingRecord?.courseName} required />
            </div>
            <div>
              <Label htmlFor="courseCode">Course Code</Label>
              <Input id="courseCode" name="courseCode" defaultValue={editingRecord?.courseCode} required />
            </div>
            <div>
              <Label htmlFor="facultyWithinCollege">Faculty Involved (Within College)*</Label>
              <Input id="facultyWithinCollege" name="facultyWithinCollege" defaultValue={editingRecord?.facultyWithinCollege} placeholder="e.g., Prof. A, Dr. B" required />
            </div>
            <div>
              <Label htmlFor="facultyOutsideCollege">Faculty Involved (Outside College)</Label>
              <Input id="facultyOutsideCollege" name="facultyOutsideCollege" defaultValue={editingRecord?.facultyOutsideCollege} placeholder="e.g., Prof. X from University Y" />
            </div>
            <div>
              <Label htmlFor="hours">Hours</Label>
              <Input id="hours" name="hours" type="number" min="1" defaultValue={editingRecord?.hours} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fromDate">From Date*</Label>
                <Input
                  id="fromDate"
                  name="fromDate"
                  type="date"
                  value={fromDate || (editingRecord?.fromDate ? new Date(editingRecord.fromDate).toISOString().split('T')[0] : '')}
                  onChange={(e) => setFromDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="toDate">To Date*</Label>
                <Input
                  id="toDate"
                  name="toDate"
                  type="date"
                  min={fromDate}
                  value={toDate || (editingRecord?.toDate ? new Date(editingRecord.toDate).toISOString().split('T')[0] : '')}
                  onChange={(e) => setToDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Duration Box */}
            <div className="rounded-lg border bg-muted/50 px-4 py-3">
              <Label className="text-xs text-muted-foreground">Duration (auto-calculated)</Label>
              <p className="mt-1 font-medium">
                {calculatedDurationDisplay || (
                  <span className="text-muted-foreground">Select From and To dates</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {calculatedDurationDisplay ? '>6 days shown in weeks, otherwise in days' : 'Select dates to see duration'}
              </p>
            </div>
            <div>
              <Label htmlFor="toBePaid">To be Paid (₹)</Label>
              <Input
                id="toBePaid"
                name="toBePaid"
                type="number"
                min="0"
                step="1"
                defaultValue={editingRecord?.toBePaid}
                placeholder="0"
                required
                onKeyPress={(e) => {
                  // Only allow numbers, backspace, delete, tab, escape, enter
                  if (!/[0-9\b\t\s]/.test(e.key) &&
                    !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
            </div>
            <div>
              <Label htmlFor="certificate">Certificate (PDF, JPG, PNG - Max 10MB)*</Label>
              <Input
                id="certificate"
                name="certificate"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="cursor-pointer"
                required={!editingRecord}
              />
              {editingRecord?.certificate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Current certificate: {editingRecord.certificate.split('/').pop()}
                </p>
              )}
            </div>
            <div className="sticky bottom-0 bg-background pt-2 pb-1">
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base py-5 rounded-xl shadow-md transition-all active:scale-95"
              >
                {editingRecord ? (
                  <><Edit className="mr-2 h-4 w-4" /> Update Joint Teaching Record</>
                ) : (
                  <><Plus className="mr-2 h-4 w-4" /> Insert for Joint Teaching</>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No joint teaching records found</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {records.map((jt) => (
            <Card key={jt.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 text-center border-b bg-muted/30">
                <CardTitle className="text-xl text-blue-700">{jt.courseName}</CardTitle>
                <CardDescription className="font-mono text-sm tracking-widest">{jt.courseCode}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow pt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm bg-blue-50/50 p-2 rounded-md border border-blue-100/50">
                      <Label className="text-[10px] uppercase text-blue-600 font-bold mb-1 block">Faculty Involved</Label>
                      <div className="font-medium text-blue-900 line-clamp-2">
                        {jt.facultyWithinCollege || jt.facultyInvolved}
                        {jt.facultyOutsideCollege && (
                          <span className="text-muted-foreground text-xs block mt-1">
                            (Outside: {jt.facultyOutsideCollege})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pb-2 border-b border-dashed">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground font-bold">Hours</Label>
                      <div className="flex items-center gap-1.5 font-semibold text-foreground">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span>{jt.hours} hrs</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground font-bold">To be Paid</Label>
                      <div className="font-semibold text-green-600">
                        ₹{jt.toBePaid}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-muted-foreground font-bold">Period & Duration</Label>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-xs text-foreground bg-muted/40 p-2 rounded border border-muted-foreground/10">
                        <Calendar className="h-3.5 w-3.5 text-blue-500" />
                        <span>{jt.fromDate.split('T')[0]} to {jt.toDate.split('T')[0]}</span>
                      </div>
                      {jt.calculatedDuration && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 pl-2">
                          <Clock className="h-3 w-3" />
                          <span>{jt.calculatedDuration}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-[10px] uppercase text-muted-foreground font-bold">Status:</Label>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm border ${jt.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
                        jt.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                          'bg-yellow-100 text-yellow-700 border-yellow-200'
                        }`}>
                        {jt.status || 'pending'}
                      </span>
                    </div>

                    {jt.certificate && (
                      <div className="flex gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8 text-blue-600" asChild>
                          <a href={`${cleanBaseUrl}${jt.certificate}`} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="outline" size="icon" className="h-8 w-8 text-green-600"
                          onClick={() => handleFileDownload(jt.certificate, `Joint_Teaching_${jt.courseName.replace(/\s+/g, '_')}`)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 mt-auto border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => {
                        setEditingRecord(jt);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-3.5 w-3.5 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleDelete(jt.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Delete
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

export default FacultyJointTeaching;
