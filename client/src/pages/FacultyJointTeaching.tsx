import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FileText, Clock, Eye, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { JointTeaching } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { facultyAPI } from '@/lib/api';

const FacultyJointTeaching = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<JointTeaching[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<JointTeaching | null>(null);
  const API_BASE_URL = (import.meta.env?.VITE_API_URL as string) || 'http://localhost:3001/api';

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
      })));
    } catch (error) {
      console.error('Failed to load records:', error);
      toast({ title: 'Failed to load records', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (fromStr: string, toStr: string) => {
    if (!fromStr || !toStr) return '';
    const from = new Date(fromStr);
    const to = new Date(toStr);
    const diffTime = to.getTime() - from.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays <= 0) return '';

    if (diffDays > 6) {
      const weeks = Math.round(diffDays / 7);
      return `${weeks} week${weeks !== 1 ? 's' : ''}`;
    }
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  };

  const calculatedDurationDisplay = fromDate && toDate && new Date(toDate) >= new Date(fromDate)
    ? calculateDuration(fromDate, toDate)
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

    const calculatedDuration = calculateDuration(fromDate, toDate);

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

      // Reset form and close dialog
      await loadRecords();
      setIsDialogOpen(false);
      setEditingRecord(null);
      setFromDate('');
      setToDate('');

      // Reset form fields by clearing the form
      e.currentTarget.reset();

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
      </div>

      {/* Dialog for Add/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRecord ? 'Edit' : 'Add'} Joint Teaching</DialogTitle>
            <DialogDescription>Fill in the joint teaching course details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <Button type="submit" className="w-full">
              {editingRecord ? 'Update' : 'Add joint teaching'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No joint teaching records found</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {records.map((jt) => (
            <Card key={jt.id}>
              <CardHeader>
                <CardTitle>{jt.courseName}</CardTitle>
                <CardDescription>{jt.courseCode}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Faculty (Within College): </span>
                    <span className="font-medium">{jt.facultyWithinCollege || jt.facultyInvolved}</span>
                  </div>
                  {jt.facultyOutsideCollege && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Faculty (Outside College): </span>
                      <span className="font-medium">{jt.facultyOutsideCollege}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{jt.hours} hours</span>
                  </div>
                  {jt.fromDate && jt.toDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{jt.fromDate.split('T')[0]} - {jt.toDate.split('T')[0]}</span>
                    </div>
                  )}
                  {jt.calculatedDuration && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{jt.calculatedDuration}</span>
                    </div>
                  )}
                  {jt.toBePaid !== undefined && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">To be Paid: </span>
                      <span className="font-medium">₹{jt.toBePaid}</span>
                    </div>
                  )}
                  {jt.syllabusDoc && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      Syllabus Available
                    </div>
                  )}
                  {jt.certificate && (
                    <div className="pt-2">
                      <a
                        href={`${API_BASE_URL.replace('/api', '')}${jt.certificate}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <Eye className="h-4 w-4" />
                        View Certificate
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <span className={`text-sm font-medium px-2 py-1 rounded ${jt.status === 'approved' ? 'bg-green-100 text-green-800' :
                      jt.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                      {jt.status || 'pending'}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingRecord(jt);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(jt.id)}
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

      {/* Move Add Button to the Bottom */}
      <div className="flex justify-end pt-6">
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

    </div>
  );
};

export default FacultyJointTeaching;
