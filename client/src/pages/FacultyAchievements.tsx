import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Award, Eye, CheckCircle, XCircle, Clock, FileText, Download } from 'lucide-react';
import { handleFileDownload } from '@/lib/downloadUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { facultyAPI } from '@/lib/api';

const FacultyAchievements = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [category, setCategory] = useState('');
  const [patentType, setPatentType] = useState('');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [supportingDocFile, setSupportingDocFile] = useState<File | null>(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const cleanBaseUrl = API_BASE_URL.replace('/api', '').replace(/\/$/, '');

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await facultyAPI.getAchievements();
      setRecords(data.map((item: any) => ({
        id: item._id || item.id,
        facultyId: item.facultyId?._id || item.facultyId || user?.id || '',
        title: item.title,
        description: item.description,
        category: item.category,
        issuer: item.issuer,
        date: item.date ? new Date(item.date).toISOString().split('T')[0] : '',
        certificate: item.certificate,
        supportingDocument: item.supportingDocument,
        status: item.status || 'pending',
      })));
    } catch (error) {
      console.error('Failed to load achievements:', error);
      toast({ title: 'Failed to load achievements', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const validateFileFormat = (file: File): boolean => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    return allowedTypes.includes(file.type);
  };

  const handleCertificateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!validateFileFormat(file)) {
        toast({ title: 'Invalid file format', description: 'Please upload PDF, JPG, or PNG files only', variant: 'destructive' });
        e.target.value = '';
        return;
      }
      setCertificateFile(file);
    }
  };

  const handleSupportingDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!validateFileFormat(file)) {
        toast({ title: 'Invalid file format', description: 'Please upload PDF, JPG, or PNG files only', variant: 'destructive' });
        e.target.value = '';
        return;
      }
      setSupportingDocFile(file);
    }
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    if (value !== 'patent') {
      setPatentType('');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Check if user is authenticated
    if (!user?.id) {
      toast({ title: 'Authentication required', description: 'Please log in to add achievements', variant: 'destructive' });
      return;
    }

    const formData = new FormData(e.currentTarget);
    const certificateFile = formData.get('certificate') as File;
    const supportingDocFile = formData.get('supportingDocument') as File;

    // Validate certificate is mandatory
    if (!certificateFile && !editingRecord) {
      toast({ title: 'Certificate required', description: 'Please upload a certificate file', variant: 'destructive' });
      return;
    }

    // Validate patent type if patent is selected
    if (category === 'patent' && !patentType.trim()) {
      toast({ title: 'Patent type required', description: 'Please select a patent type', variant: 'destructive' });
      return;
    }

    // Validate file formats
    if (certificateFile && certificateFile.size > 0 && !validateFileFormat(certificateFile)) {
      toast({ title: 'Invalid certificate format', description: 'Please upload PDF, JPG, or PNG files only', variant: 'destructive' });
      return;
    }

    if (supportingDocFile && supportingDocFile.size > 0 && !validateFileFormat(supportingDocFile)) {
      toast({ title: 'Invalid supporting document format', description: 'Please upload PDF, JPG, or PNG files only', variant: 'destructive' });
      return;
    }

    const achievementData: any = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      category: category,
      issuer: formData.get('issuer') as string,
      date: formData.get('date') as string,
    };

    // Add patent type if applicable
    if (category === 'patent') {
      achievementData.patentType = patentType;
    }

    if (certificateFile && certificateFile.size > 0) {
      achievementData.certificate = certificateFile;
    }
    if (supportingDocFile && supportingDocFile.size > 0) {
      achievementData.supportingDocument = supportingDocFile;
    }

    try {
      if (editingRecord) {
        await facultyAPI.updateAchievement(editingRecord.id, achievementData);
        toast({ title: 'Achievement updated successfully' });
      } else {
        await facultyAPI.createAchievement(achievementData);
        toast({ title: 'Achievement added successfully' });
      }
      await loadRecords();
      setIsDialogOpen(false);
      setEditingRecord(null);
      setCategory('');
      setPatentType('');
      setCertificateFile(null);
      setSupportingDocFile(null);
    } catch (error: any) {
      console.error('Failed to save achievement:', error);
      toast({ title: error.message || 'Failed to save achievement', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this achievement?')) return;

    try {
      await facultyAPI.deleteAchievement(id);
      toast({ title: 'Achievement deleted successfully', variant: 'destructive' });
      await loadRecords();
    } catch (error) {
      console.error('Failed to delete achievement:', error);
      toast({ title: 'Failed to delete achievement', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', icon: Clock },
      verified: { variant: 'default', icon: CheckCircle },
      rejected: { variant: 'destructive', icon: XCircle },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      award: 'bg-yellow-100 text-yellow-800',
      publication: 'bg-blue-100 text-blue-800',
      research: 'bg-purple-100 text-purple-800',
      patent: 'bg-green-100 text-green-800',
      recognition: 'bg-pink-100 text-pink-800',
      certification: 'bg-indigo-100 text-indigo-800',
      conference: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors.other;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Achievements</h1>
          <p className="text-muted-foreground">Manage your professional achievements and recognitions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingRecord(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Achievement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRecord ? 'Edit' : 'Add New'} Achievement</DialogTitle>
              <DialogDescription>Record your professional achievements and recognitions</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={editingRecord?.title}
                  required
                  placeholder="e.g., Best Paper Award"
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  name="category"
                  value={editingRecord?.category || category}
                  onValueChange={handleCategoryChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="award">Award</SelectItem>
                    <SelectItem value="publication">Publication</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="patent">Patent</SelectItem>
                    <SelectItem value="recognition">Recognition</SelectItem>
                    <SelectItem value="certification">Certification</SelectItem>
                    <SelectItem value="conference">Conference</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {category === 'patent' && (
                <div>
                  <Label htmlFor="patentType">Patent Type *</Label>
                  <Select
                    name="patentType"
                    value={patentType}
                    onValueChange={setPatentType}
                    required={category === 'patent'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select patent type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="design">Design Patent</SelectItem>
                      <SelectItem value="utility">Utility Patent</SelectItem>
                      <SelectItem value="provisional">Provisional Patent</SelectItem>
                      <SelectItem value="addition">Patent of Addition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="issuer">Issuer/Organization</Label>
                  <Input
                    id="issuer"
                    name="issuer"
                    defaultValue={editingRecord?.issuer}
                    placeholder="Organization name"
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    defaultValue={editingRecord?.date}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingRecord?.description}
                  required
                  rows={3}
                  placeholder="Describe the achievement..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="certificate">Certificate * (PDF, JPG, PNG - Max 10MB)</Label>
                  <Input
                    id="certificate"
                    name="certificate"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
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
                  <Label htmlFor="supportingDocument">Supporting Document (PDF, JPG, PNG - Max 10MB)</Label>
                  <Input
                    id="supportingDocument"
                    name="supportingDocument"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="cursor-pointer"
                    onChange={handleSupportingDocChange}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional supporting document
                  </p>
                  {editingRecord?.supportingDocument && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Current: {editingRecord.supportingDocument.split('/').pop()}
                    </p>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full">
                {editingRecord ? 'Update' : 'Add'} Achievement
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No achievements found</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {records.map((achievement) => (
            <Card key={achievement.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      {achievement.title}
                    </CardTitle>
                    <CardDescription>
                      <Badge className={getCategoryColor(achievement.category)}>
                        {achievement.category.charAt(0).toUpperCase() + achievement.category.slice(1)}
                      </Badge>
                      {achievement.issuer && ` • ${achievement.issuer}`}
                    </CardDescription>
                  </div>
                  {getStatusBadge(achievement.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Date: </span>
                    <span className="font-medium">
                      {achievement.date ? new Date(achievement.date).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>

                  <p className="text-sm">{achievement.description}</p>

                  <div className="flex items-center gap-2 flex-wrap">
                    {achievement.certificate && (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-7 text-primary hover:text-primary/80 px-2" asChild>
                          <a
                            href={`${cleanBaseUrl}${achievement.certificate}`}
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
                          onClick={() => handleFileDownload(achievement.certificate, `Achievement_Certificate_${achievement.title.replace(/\s+/g, '_')}`)}
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    )}
                    {achievement.supportingDocument && (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-7 text-primary hover:text-primary/80 px-2" asChild>
                          <a
                            href={`${cleanBaseUrl}${achievement.supportingDocument}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <FileText className="h-4 w-4" />
                            Document
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-primary hover:text-primary/80 px-2 flex items-center gap-1"
                          onClick={() => handleFileDownload(achievement.supportingDocument, `Achievement_Doc_${achievement.title.replace(/\s+/g, '_')}`)}
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    )}
                  </div>

                  {achievement.status === 'pending' && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingRecord(achievement);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(achievement.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FacultyAchievements;
