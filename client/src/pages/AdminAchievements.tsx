import { useState, useEffect } from 'react';
import { FileSpreadsheet, FileText, Search, Check, X, Award, Eye, Download } from 'lucide-react';
import { handleFileDownload } from '@/lib/downloadUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminAchievements = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const cleanBaseUrl = API_BASE_URL.replace('/api', '').replace(/\/$/, '');

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getAchievements();
      setRecords(data || []);
    } catch (error) {
      console.error('Failed to load achievements:', error);
      toast({ title: 'Failed to load records', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string, status: 'verified' | 'rejected') => {
    try {
      await adminAPI.verifyAchievement(id, status);
      toast({ title: `Achievement ${status} successfully` });
      await loadRecords();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  };

  const filteredRecords = records.filter((record: any) =>
    record.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.facultyId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      records.map((record: any, index: number) => ({
        'S.No': index + 1,
        'Faculty Name': record.facultyId?.name || 'N/A',
        'Title': record.title,
        'Category': record.category,
        'Issuer': record.issuer || 'N/A',
        'Date': record.date ? new Date(record.date).toLocaleDateString() : 'N/A',
        'Status': record.status,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Achievements');
    XLSX.writeFile(workbook, 'Faculty_Achievements.xlsx');
  };

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Faculty Achievements', 14, 20);

    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [['S.No', 'Faculty', 'Title', 'Category', 'Issuer', 'Date', 'Status']],
      body: records.map((record: any, index: number) => [
        index + 1,
        record.facultyId?.name || 'N/A',
        record.title,
        record.category,
        record.issuer || 'N/A',
        record.date ? new Date(record.date).toLocaleDateString() : 'N/A',
        record.status,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save('Faculty_Achievements.pdf');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', label: 'Pending' },
      verified: { variant: 'default', label: 'Verified' },
      rejected: { variant: 'destructive', label: 'Rejected' },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Faculty Achievements</h1>
          <p className="text-muted-foreground">View and verify faculty achievements</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={downloadPDF}>
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Achievement Records</CardTitle>
          <CardDescription>Verify faculty achievements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search by faculty name, title, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No achievements found</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">S.No</TableHead>
                    <TableHead>Faculty</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Issuer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record: any, index: number) => (
                    <TableRow key={record._id || record.id}>
                      <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>{record.facultyId?.name || 'N/A'}</TableCell>
                      <TableCell>{record.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.category}</Badge>
                      </TableCell>
                      <TableCell>{record.issuer || 'N/A'}</TableCell>
                      <TableCell>
                        {record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {record.certificate && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`${cleanBaseUrl}${record.certificate}`, '_blank')}
                                title="View Certificate"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                title="Download Certificate"
                                onClick={() => handleFileDownload(record.certificate, `Achievement_Certificate_${record.title.replace(/\s+/g, '_')}`)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {record.supportingDocument && (
                            <Button
                              size="sm"
                              variant="outline"
                              title="Download Document"
                              onClick={() => handleFileDownload(record.supportingDocument, `Achievement_Doc_${record.title.replace(/\s+/g, '_')}`)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                          {record.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleVerify(record._id || record.id, 'verified')}
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleVerify(record._id || record.id, 'rejected')}
                              >
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAchievements;
