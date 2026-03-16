import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FileText, Calendar, MapPin, Eye, Upload, CheckCircle, XCircle, Clock, Download } from 'lucide-react';
import { handleFileDownload } from '@/lib/downloadUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Seminar } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { facultyAPI } from '@/lib/api';

const FacultySeminars = () => {
  const { user } = useAuth();
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSeminar, setEditingSeminar] = useState<Seminar | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const cleanBaseUrl = API_BASE_URL.replace('/api', '').replace(/\/$/, '');

  useEffect(() => {
    loadSeminars();
  }, []);

  const loadSeminars = async () => {
    try {
      setLoading(true);
      const data = await facultyAPI.getSeminars();
      setSeminars(data.map((item: any) => ({
        id: item._id || item.id,
        facultyId: item.facultyId?._id || item.facultyId || user?.id || '',
        title: item.title,
        topic: item.topic,
        date: item.date ? new Date(item.date).toISOString().split('T')[0] : '',
        venue: item.venue,
        description: item.description || '',
        attendees: item.attendees || 0,
        certificate: item.certificate,
        status: item.status || 'pending',
      })));
    } catch (error) {
      console.error('Failed to load seminars:', error);
      toast.error('Failed to load seminars');
    } finally {
      setLoading(false);
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
        toast.error('Invalid file format. Please upload jpg, jpeg, png, docx, or pdf files only');
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
      toast.error('Authentication required. Please log in to add records');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const certificateFile = (formData.get('certificate') as File);
    const attendeesCount = parseInt(formData.get('attendees') as string) || 0;

    // Validate attendees count
    if (attendeesCount <= 0) {
      toast.error('Attendees count must be greater than zero');
      return;
    }

    // Validate certificate for new records
    if (!certificateFile && !editingSeminar) {
      toast.error('Certificate is required. Please upload a certificate file');
      return;
    }

    // Validate certificate for new uploads
    if (certificateFile && certificateFile.size > 0 && !validateFileFormat(certificateFile)) {
      toast.error('Invalid file format. Please upload jpg, jpeg, png, docx, or pdf files only');
      return;
    }

    const data: any = {
      title: formData.get('title') as string,
      topic: formData.get('topic') as string,
      date: formData.get('date') as string,
      venue: formData.get('venue') as string,
      description: formData.get('description') as string || '',
      attendees: attendeesCount,
    };

    if (certificateFile && certificateFile.size > 0) {
      data.certificate = certificateFile;
    } else if (editingSeminar) {
      data.certificate = formData.get('existingCertificate') as string;
    }

    try {
      if (editingSeminar) {
        await facultyAPI.updateSeminar(editingSeminar.id, data);
        toast.success('Seminar updated successfully');
      } else {
        await facultyAPI.createSeminar(data);
        toast.success('Seminar added successfully');
      }
      await loadSeminars();
      setIsDialogOpen(false);
      setEditingSeminar(null);
      setCertificateFile(null);
    } catch (error: any) {
      console.error('Failed to save seminar:', error);
      toast.error(error.message || 'Failed to save seminar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this seminar?')) return;
    try {
      await facultyAPI.deleteSeminar(id);
      toast.success('Seminar deleted successfully');
      await loadSeminars();
    } catch (error) {
      console.error('Failed to delete seminar:', error);
      toast.error('Failed to delete seminar');
    }
  };

  const handleEdit = (seminar: Seminar) => {
    setEditingSeminar(seminar);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Seminars</h1>
        <p className="text-muted-foreground">Manage your seminar records</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Seminars</CardTitle>
              <CardDescription>Total: {seminars.length} seminars</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingSeminar(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Seminar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingSeminar ? 'Edit Seminar' : 'Add New Seminar'}</DialogTitle>
                  <DialogDescription>
                    {editingSeminar ? 'Update seminar information' : 'Enter details for the new seminar'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        name="title"
                        defaultValue={editingSeminar?.title}
                        required
                        placeholder="Seminar title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="topic">Topic *</Label>
                      <Input
                        id="topic"
                        name="topic"
                        defaultValue={editingSeminar?.topic}
                        required
                        placeholder="Seminar topic"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        name="date"
                        type="date"
                        defaultValue={editingSeminar?.date}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="attendees">Attendees *</Label>
                      <Input
                        id="attendees"
                        name="attendees"
                        type="number"
                        defaultValue={editingSeminar?.attendees || 0}
                        min="1"
                        required
                        placeholder="Number of attendees"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="venue">Venue *</Label>
                    <Input
                      id="venue"
                      name="venue"
                      defaultValue={editingSeminar?.venue}
                      required
                      placeholder="Seminar venue"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={editingSeminar?.description}
                      placeholder="Seminar description"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="certificate">Certificate * (JPG, JPEG, PNG, DOCX, PDF - Max 10MB)</Label>
                    <Input
                      id="certificate"
                      name="certificate"
                      type="file"
                      accept=".jpg,.jpeg,.png,.docx,.pdf"
                      className="cursor-pointer"
                      onChange={handleFileChange}
                      required={!editingSeminar}
                    />
                    <p className="text-xs text-muted-foreground">
                      Supported formats: jpg, jpeg, png, docx, pdf
                    </p>
                    {editingSeminar?.certificate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Current certificate: {editingSeminar.certificate.split('/').pop()}
                      </p>
                    )}
                    {editingSeminar && (
                      <input type="hidden" name="existingCertificate" value={editingSeminar.certificate} />
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Save</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : seminars.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No seminars found. Add your first seminar to get started.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {seminars.map((seminar) => (
                <Card key={seminar.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{seminar.title}</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(seminar)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(seminar.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      <Badge variant="secondary">{seminar.topic}</Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{seminar.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{seminar.venue}</span>
                    </div>
                    {seminar.attendees > 0 && (
                      <div className="pt-2">
                        <Badge variant="outline">{seminar.attendees} attendees</Badge>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <span className={`text-sm font-medium px-2 py-1 rounded-full text-xs ${seminar.status === 'approved' ? 'bg-green-100 text-green-800' :
                          seminar.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                        {seminar.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </div>
                    {seminar.certificate && (
                      <div className="flex gap-2 pt-2">
                        <Button variant="ghost" size="sm" className="h-7 text-primary hover:text-primary/80 px-2" asChild>
                          <a
                            href={`${cleanBaseUrl}${seminar.certificate}`}
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
                          onClick={() => handleFileDownload(seminar.certificate, `Seminar_Certificate_${seminar.title.replace(/\s+/g, '_')}`)}
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FacultySeminars;

