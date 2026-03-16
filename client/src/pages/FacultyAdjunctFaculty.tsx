import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FileText, Calendar, Upload, Eye, Download } from 'lucide-react';
import { handleFileDownload } from '@/lib/downloadUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdjunctFaculty } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { facultyAPI } from '@/lib/api';
import { formatDurationGlobal } from '@/lib/utils';

const FacultyAdjunctFaculty = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<AdjunctFaculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AdjunctFaculty | null>(null);
  const [durationDisplay, setDurationDisplay] = useState<{ value: number; type: 'days' | 'weeks' } | null>(null);
  const [fromDate, setFromDate] = useState<string>('');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const cleanBaseUrl = API_BASE_URL.replace('/api', '').replace(/\/$/, '');

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    if (editingRecord?.fromDate) {
      setFromDate(new Date(editingRecord.fromDate).toISOString().split('T')[0]);
    } else {
      setFromDate('');
    }
  }, [editingRecord]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await facultyAPI.getAdjunctFaculty();
      setRecords(data.map((item: any) => ({
        id: item._id || item.id,
        facultyId: item.facultyId?._id || item.facultyId || user?.id || '',
        facultyName: item.facultyName,
        department: item.department,
        courseCode: item.courseCode,
        fromDate: item.fromDate,
        toDate: item.toDate,
        duration: item.duration,
        durationType: item.durationType,
        certificate: item.certificate,
        status: item.status,
      })));
    } catch (error) {
      console.error('Failed to load records:', error);
      toast({ title: 'Failed to load records', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (fromDate: string, toDate: string) => {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 6) {
      const weeks = Math.ceil(diffDays / 7);
      return { value: weeks, type: 'weeks' as const };
    } else {
      return { value: diffDays, type: 'days' as const };
    }
  };

  const formatDateForAPI = (dateString: string) => {
    // Convert DD-MM-YYYY to YYYY-MM-DD format for API
    if (dateString.includes('-')) {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        // Check if it's DD-MM-YYYY format
        if (parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
    }
    return dateString;
  };

  const handleDateChange = (fromDate: string, toDate: string) => {
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);

      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
        const diffTime = Math.abs(to.getTime() - from.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let duration, durationType;
        if (diffDays > 6) {
          duration = Math.ceil(diffDays / 7);
          durationType = 'weeks' as const;
        } else {
          duration = diffDays;
          durationType = 'days' as const;
        }

        setDurationDisplay({ value: duration, type: durationType });
      } else {
        setDurationDisplay(null);
      }
    } else {
      setDurationDisplay(null);
    }
  };

  const validateFileFormat = (file: File): boolean => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    return allowedTypes.includes(file.type);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!validateFileFormat(file)) {
        toast({
          title: 'Invalid file format',
          description: 'Please upload jpg, jpeg, png, docx, or pdf files only',
          variant: 'destructive'
        });
        e.target.value = '';
        return;
      }
      setCertificateFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Check if user is authenticated
    if (!user?.id) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to add records',
        variant: 'destructive'
      });
      return;
    }

    const formData = new FormData(e.currentTarget);

    if (!certificateFile && !editingRecord) {
      toast({
        title: 'Certificate required',
        description: 'Please upload a certificate file',
        variant: 'destructive'
      });
      return;
    }

    const fromDate = formData.get('fromDate') as string;
    const toDate = formData.get('toDate') as string;

    if (!fromDate || !toDate) {
      toast({
        title: 'Date range required',
        description: 'Please select both from and to dates',
        variant: 'destructive'
      });
      return;
    }

    // Validate date format and create proper Date objects
    const from = new Date(fromDate);
    const to = new Date(toDate);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      toast({
        title: 'Invalid date format',
        description: 'Please select valid dates',
        variant: 'destructive'
      });
      return;
    }

    if (to < from) {
      toast({
        title: 'Invalid date range',
        description: 'To date must be after from date',
        variant: 'destructive'
      });
      return;
    }

    // Calculate duration
    const diffTime = Math.abs(to.getTime() - from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let duration, durationType;
    if (diffDays > 6) {
      duration = Math.ceil(diffDays / 7);
      durationType = 'weeks' as const;
    } else {
      duration = diffDays;
      durationType = 'days' as const;
    }

    try {
      if (editingRecord) {
        const updateData = {
          facultyName: formData.get('facultyName') as string,
          department: formData.get('department') as string,
          courseCode: formData.get('courseCode') as string,
          fromDate: fromDate,
          toDate: toDate,
          duration,
          durationType,
          certificate: formData.get('existingCertificate') as string,
        };

        if (certificateFile) {
          await facultyAPI.updateAdjunctFaculty(editingRecord.id, { ...updateData, certificate: certificateFile });
        } else {
          await facultyAPI.updateAdjunctFaculty(editingRecord.id, updateData);
        }

        toast({ title: 'Adjunct faculty updated successfully' });
      } else {
        const createData = {
          facultyName: formData.get('facultyName') as string,
          department: formData.get('department') as string,
          courseCode: formData.get('courseCode') as string,
          fromDate,
          toDate,
          duration,
          durationType,
          certificate: certificateFile!,
        };
        console.log('Creating adjunct faculty with data:', createData);
        console.log('User ID:', user.id);
        await facultyAPI.createAdjunctFaculty(createData);
        toast({ title: 'Adjunct faculty added successfully' });
      }
      await loadRecords();
      setIsDialogOpen(false);
      setEditingRecord(null);
      setDurationDisplay(null);
      setCertificateFile(null);
    } catch (error: any) {
      console.error('Failed to save record:', error);
      console.error('Error details:', error.message);
      if (error.response) {
        console.error('Server response:', error.response.data);
      }
      toast({
        title: 'Failed to save record',
        description: error.message || 'Please check your input and try again',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      await facultyAPI.deleteAdjunctFaculty(id);
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
          <h1 className="text-3xl font-bold text-foreground">Adjunct Faculty</h1>
          <p className="text-muted-foreground">Manage adjunct faculty collaborations</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingRecord(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Record
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRecord ? 'Edit' : 'Add'} Adjunct Faculty</DialogTitle>
              <DialogDescription>Fill in the adjunct faculty details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="facultyName">Faculty Name</Label>
                <Input id="facultyName" name="facultyName" defaultValue={editingRecord?.facultyName} required />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Select name="department" defaultValue={editingRecord?.department} required>
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {['AI-DS', 'AI', 'Arch', 'CE (Civil)', 'CSE', 'CSBS', 'DS', 'IT', 'ECE', 'EEE', 'MCA', 'MECH', 'MTE (Mechatronics)'].map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="courseCode">Course Code</Label>
                <Input id="courseCode" name="courseCode" defaultValue={editingRecord?.courseCode} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fromDate">From Date</Label>
                  <Input
                    id="fromDate"
                    name="fromDate"
                    type="date"
                    value={fromDate}
                    required
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      const toDate = (e.currentTarget.form?.elements.namedItem('toDate') as HTMLInputElement)?.value;
                      handleDateChange(e.target.value, toDate);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="toDate">To Date</Label>
                  <Input
                    id="toDate"
                    name="toDate"
                    type="date"
                    min={fromDate}
                    defaultValue={editingRecord?.toDate ? new Date(editingRecord.toDate).toISOString().split('T')[0] : ''}
                    required
                    onChange={(e) => {
                      handleDateChange(fromDate, e.target.value);
                    }}
                  />
                </div>
              </div>
              {durationDisplay && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Duration: {durationDisplay.value} {durationDisplay.type}
                    </span>
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="certificate">Certificate *</Label>
                <Input
                  id="certificate"
                  name="certificate"
                  type="file"
                  accept=".jpg,.jpeg,.png,.docx,.pdf"
                  onChange={handleFileChange}
                  required={!editingRecord}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Supported formats: jpg, jpeg, png, docx, pdf
                </p>
                {editingRecord && (
                  <input type="hidden" name="existingCertificate" value={editingRecord.certificate} />
                )}
              </div>
              <Button type="submit" className="w-full">
                {editingRecord ? 'Update' : 'Add'} Record
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No adjunct faculty records found</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {records.map((adj) => (
            <Card key={adj.id}>
              <CardHeader>
                <CardTitle>{adj.facultyName}</CardTitle>
                <CardDescription>{adj.department}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Course Code: </span>
                    <span className="font-medium">{adj.courseCode}</span>
                  </div>
                  {adj.fromDate && adj.toDate && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Duration: </span>
                      <span className="font-medium">
                        {new Date(adj.fromDate).toLocaleDateString()} - {new Date(adj.toDate).toLocaleDateString()}
                      </span>
                      <div className="text-xs text-blue-600 mt-1">
                        {formatDurationGlobal(adj.fromDate, adj.toDate)}
                      </div>
                    </div>
                  )}
                  {adj.certificate && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        Certificate: {adj.certificate.split('/').pop()}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-primary hover:text-primary/80 px-2"
                        asChild
                      >
                        <a
                          href={`${cleanBaseUrl}${adj.certificate}`}
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
                        onClick={() => handleFileDownload(adj.certificate, `Adjunct_Faculty_Certificate_${adj.facultyName.replace(/\s+/g, '_')}`)}
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full text-xs ${adj.status === 'approved' ? 'bg-green-100 text-green-800' :
                      adj.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                      {adj.status?.toUpperCase() || 'PENDING'}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingRecord(adj);
                        setIsDialogOpen(true);
                        if (adj.fromDate && adj.toDate) {
                          handleDateChange(adj.fromDate, adj.toDate);
                        }
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(adj.id)}
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

export default FacultyAdjunctFaculty;
