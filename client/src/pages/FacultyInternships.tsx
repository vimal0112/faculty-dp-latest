import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Briefcase, Eye, Calendar, DollarSign, Users, Star, Download } from 'lucide-react';
import { handleFileDownload } from '@/lib/downloadUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { facultyAPI } from '@/lib/api';
import { formatDurationGlobal } from '@/lib/utils';

const FacultyInternships = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [calculatedDuration, setCalculatedDuration] = useState('');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [stipendAmount, setStipendAmount] = useState([0]);
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const cleanBaseUrl = API_BASE_URL.replace('/api', '').replace(/\/$/, '');

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await facultyAPI.getInternships();
      setRecords(data.map((item: any) => ({
        id: item._id || item.id,
        facultyId: item.facultyId?._id || item.facultyId || user?.id || '',
        facultyMemberName: item.studentName,
        regNo: item.regNo,
        companyName: item.companyName,
        companyAddress: item.companyAddress,
        mode: item.mode,
        startDate: item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '',
        endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '',
        duration: item.duration,
        durationUnit: item.durationUnit,
        stipend: item.stipend,
        description: item.description,
        skillsGained: item.skillsGained || [],
        projectTitle: item.projectTitle,
        status: item.status || 'pending',
        certificate: item.certificate,
        report: item.report,
      })));
    } catch (error) {
      console.error('Failed to load internships:', error);
      toast({ title: 'Failed to load internships', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    if (endDate) {
      setCalculatedDuration(formatDurationGlobal(date, endDate));
    }
  };

  const handleEndDateChange = (date: string) => {
    setEndDate(date);
    if (startDate) {
      setCalculatedDuration(formatDurationGlobal(startDate, date));
    }
  };

  const validateNaturalNumber = (value: string): boolean => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 && Number.isInteger(num);
  };

  const validateFileFormat = (file: File, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(file.type);
  };

  const handleCertificateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validateFileFormat(file, allowedTypes)) {
        toast({ title: 'Invalid file format', description: 'Please upload PDF, JPG, PNG, or DOCX files only', variant: 'destructive' });
        e.target.value = '';
        return;
      }
      setCertificateFile(file);
    }
  };

  const handleReportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validateFileFormat(file, allowedTypes)) {
        toast({ title: 'Invalid file format', description: 'Please upload PDF or DOCX files only', variant: 'destructive' });
        e.target.value = '';
        return;
      }
      setReportFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Check if user is authenticated
    if (!user?.id) {
      toast({ title: 'Authentication required', description: 'Please log in to add internship records', variant: 'destructive' });
      return;
    }

    const formData = new FormData(e.currentTarget);
    const certificateFile = formData.get('certificate') as File;
    const reportFile = formData.get('report') as File;

    // Validate mandatory fields
    if (!certificateFile && !editingRecord) {
      toast({ title: 'Certificate required', description: 'Please upload a certificate file', variant: 'destructive' });
      return;
    }

    if (!certificateFile && !editingRecord) {
      toast({ title: 'Certificate required', description: 'Please upload a certificate file', variant: 'destructive' });
      return;
    }

    // Validate file formats
    if (certificateFile && certificateFile.size > 0) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validateFileFormat(certificateFile, allowedTypes)) {
        toast({ title: 'Invalid certificate format', description: 'Please upload PDF, JPG, PNG, or DOCX files only', variant: 'destructive' });
        return;
      }
    }

    if (reportFile && reportFile.size > 0) {
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validateFileFormat(reportFile, allowedTypes)) {
        toast({ title: 'Invalid report format', description: 'Please upload PDF or DOCX files only', variant: 'destructive' });
        return;
      }
    }

    const internshipData: any = {
      studentName: formData.get('studentName') as string, // Faculty Name label in UI
      regNo: formData.get('regNo') as string,
      companyName: formData.get('companyName') as string,
      companyAddress: formData.get('companyAddress') as string,
      mode: formData.get('mode') as string || 'offline',
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      duration: parseInt(calculatedDuration) || 0,
      durationUnit: calculatedDuration.includes('week') ? 'weeks' : 'days',
      stipend: stipendAmount[0] || 0,
      description: formData.get('description') as string,
      skillsGained: (formData.get('skillsGained') as string)?.split(',').map(s => s.trim()).filter(Boolean),
      projectTitle: formData.get('projectTitle') as string,
      status: formData.get('status') === 'completed' ? 'pending' : (formData.get('status') as string || 'pending'),
    };

    if (certificateFile && certificateFile.size > 0) {
      internshipData.certificate = certificateFile;
    }
    if (reportFile && reportFile.size > 0) {
      internshipData.report = reportFile;
    }

    try {
      if (editingRecord) {
        await facultyAPI.updateInternship(editingRecord.id, internshipData);
        toast({ title: 'Internship updated successfully' });
      } else {
        await facultyAPI.createInternship(internshipData);
        toast({ title: 'Internship record added successfully' });
      }
      await loadRecords();
      setIsDialogOpen(false);
      setEditingRecord(null);
      setStartDate('');
      setEndDate('');
      setCalculatedDuration('');
      setCertificateFile(null);
      setReportFile(null);
      setStipendAmount([0]);
    } catch (error: any) {
      console.error('Failed to save internship:', error);
      toast({ title: error.message || 'Failed to save internship', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this internship record?')) return;

    try {
      await facultyAPI.deleteInternship(id);
      toast({ title: 'Internship deleted successfully', variant: 'destructive' });
      await loadRecords();
    } catch (error) {
      console.error('Failed to delete internship:', error);
      toast({ title: 'Failed to delete internship', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      approved: { variant: 'default', label: 'Approved' },
      rejected: { variant: 'destructive', label: 'Rejected' },
      ongoing: { variant: 'default', label: 'Ongoing' },
      completed: { variant: 'default', label: 'Completed' },
    };
    const config = variants[status] || { variant: 'secondary', label: status || 'Pending' };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Internship Activities</h1>
          <p className="text-muted-foreground">Manage student internships supervised by you</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingRecord(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Internship
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRecord ? 'Edit' : 'Add New'} Internship Record</DialogTitle>
              <DialogDescription>Record details of student internships you supervise</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="studentName">Faculty Name *</Label>
                  <Input
                    id="studentName"
                    name="studentName"
                    defaultValue={editingRecord?.facultyMemberName}
                    required
                    placeholder="Enter faculty name"
                  />
                </div>
                <div>
                  <Label htmlFor="regNo">Registration Number *</Label>
                  <Input
                    id="regNo"
                    name="regNo"
                    defaultValue={editingRecord?.regNo}
                    required
                    placeholder="Enter registration number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    defaultValue={editingRecord?.companyName}
                    required
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <Label htmlFor="mode">Mode of Intern *</Label>
                  <Select name="mode" defaultValue={editingRecord?.mode || 'offline'} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="companyAddress">Company Address</Label>
                <Textarea
                  id="companyAddress"
                  name="companyAddress"
                  defaultValue={editingRecord?.companyAddress}
                  rows={2}
                  placeholder="Enter company address"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={startDate || editingRecord?.startDate || ''}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    min={startDate}
                    value={endDate || editingRecord?.endDate || ''}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="text"
                    value={calculatedDuration || editingRecord?.duration || ''}
                    readOnly
                    placeholder="Auto-calculated"
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stipend">Stipend Amount (₹{stipendAmount[0].toLocaleString()})</Label>
                  <div className="space-y-2">
                    <Slider
                      value={stipendAmount}
                      onValueChange={setStipendAmount}
                      max={100000}
                      min={0}
                      step={1000}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>₹0</span>
                      <span>₹50,000</span>
                      <span>₹100,000</span>
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select name="status" defaultValue={editingRecord?.status === 'pending' ? 'completed' : (editingRecord?.status || 'completed')} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="projectTitle">Project Title</Label>
                <Input
                  id="projectTitle"
                  name="projectTitle"
                  defaultValue={editingRecord?.projectTitle}
                  placeholder="Enter project title"
                />
              </div>

              <div>
                <Label htmlFor="skillsGained">Skills Gained (comma-separated)</Label>
                <Input
                  id="skillsGained"
                  name="skillsGained"
                  defaultValue={editingRecord?.skillsGained?.join(', ')}
                  placeholder="e.g., React, Node.js, MongoDB"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingRecord?.description}
                  rows={3}
                  placeholder="Describe the internship..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="certificate">Certificate * (PDF, JPG, PNG, DOCX - Max 10MB)</Label>
                  <Input
                    id="certificate"
                    name="certificate"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.docx"
                    className="cursor-pointer"
                    onChange={handleCertificateChange}
                    required={!editingRecord}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Certificate is mandatory
                  </p>
                  {editingRecord?.certificate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Current: {editingRecord.certificate.split('/').pop()}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="report">Internship Report (PDF, DOCX - Max 10MB)</Label>
                  <Input
                    id="report"
                    name="report"
                    type="file"
                    accept=".pdf,.docx"
                    className="cursor-pointer"
                    onChange={handleReportChange}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional internship report
                  </p>
                  {editingRecord?.report && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Current: {editingRecord.report.split('/').pop()}
                    </p>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full">
                {editingRecord ? 'Update' : 'Add'} Internship
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No internship records found</div>
      ) : (
        <div className="grid gap-4">
          {records.map((internship) => (
            <Card key={internship.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      {internship.facultyMemberName}
                    </CardTitle>
                    <CardDescription>
                      {internship.regNo} • {internship.companyName} • {internship.mode}
                    </CardDescription>
                  </div>
                  {getStatusBadge(internship.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Period: </span>
                      <span className="font-medium">
                        {internship.startDate ? new Date(internship.startDate).toLocaleDateString() : 'N/A'} - {' '}
                        {internship.endDate ? new Date(internship.endDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration: </span>
                      <span className="font-medium">{internship.duration || 'N/A'} {internship.durationUnit || 'weeks'}</span>
                    </div>
                  </div>

                  {internship.projectTitle && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Project: </span>
                      <span className="font-medium">{internship.projectTitle}</span>
                    </div>
                  )}

                  {internship.stipend && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Stipend: </span>
                      <span className="font-medium">₹{internship.stipend.toLocaleString()}</span>
                    </div>
                  )}

                  {internship.skillsGained && internship.skillsGained.length > 0 && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Skills: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {internship.skillsGained.map((skill: string, idx: number) => (
                          <Badge key={idx} variant="outline">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {internship.description && (
                    <p className="text-sm text-muted-foreground">{internship.description}</p>
                  )}

                  <div className="flex items-center gap-4 pt-2">
                    {internship.certificate && (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-7 text-primary hover:text-primary/80 px-2" asChild>
                          <a
                            href={`${cleanBaseUrl}${internship.certificate}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            Certificate
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-primary hover:text-primary/80 px-2 flex items-center gap-1"
                          onClick={() => handleFileDownload(internship.certificate, `Internship_Certificate_${internship.facultyMemberName.replace(/\s+/g, '_')}`)}
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    )}
                    {internship.report && (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-7 text-primary hover:text-primary/80 px-2" asChild>
                          <a
                            href={`${cleanBaseUrl}${internship.report}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            Report
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-primary hover:text-primary/80 px-2 flex items-center gap-1"
                          onClick={() => handleFileDownload(internship.report, `Internship_Report_${internship.facultyMemberName.replace(/\s+/g, '_')}`)}
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingRecord(internship);
                        setStartDate(internship.startDate);
                        setEndDate(internship.endDate);
                        setCalculatedDuration(`${internship.duration} ${internship.durationUnit}`);
                        setStipendAmount([internship.stipend || 0]);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(internship.id)}
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

export default FacultyInternships;
