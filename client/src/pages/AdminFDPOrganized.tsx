import { useState, useEffect } from 'react';
import { FileSpreadsheet, FileText, Search, Check, X, Download, Eye } from 'lucide-react';
import { handleFileDownload } from '@/lib/downloadUtils';
import { RecordDetailsModal } from '@/components/RecordDetailsModal';
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

const AdminFDPOrganized = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const { toast } = useToast();
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const cleanBaseUrl = API_BASE_URL.replace('/api', '').replace(/\/$/, '');

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getFDPOrganized();
      setRecords(data || []);
    } catch (error) {
      console.error('Failed to load FDP records:', error);
      toast({ title: 'Failed to load records', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await adminAPI.updateFDPOrganizedStatus(id, status);
      toast({ title: `FDP ${status} successfully` });
      await loadRecords();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  };

  const filteredRecords = records.filter((record: any) =>
    record.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.venue?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.facultyId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      records.map((record: any, index: number) => ({
        'S.No': index + 1,
        'Faculty ID': record.facultyId?._id || record.facultyId || 'N/A',
        'Faculty Name': record.facultyId?.name || 'N/A',
        'Title': record.title,
        'Venue': record.venue,
        'Type': record.type,
        'Status': record.status || 'pending',
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'FDP Organized');
    XLSX.writeFile(workbook, 'FDP_Organized_Records.xlsx');
  };

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('FDP Organized Records', 14, 20);

    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [['S.No', 'Faculty', 'Title', 'Venue', 'Type', 'Status']],
      body: records.map((record: any, index: number) => [
        index + 1,
        record.facultyId?.name || 'N/A',
        record.title,
        record.venue,
        record.type,
        record.status || 'pending',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save('FDP_Organized_Records.pdf');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">FDP Organized Records</h1>
        <p className="text-muted-foreground">View and manage all FDP organized records</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>All FDP Organized</CardTitle>
              <CardDescription>Total: {records.length} records</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={downloadExcel} variant="outline" size="sm">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Button onClick={downloadPDF} variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by faculty name, title, type, or venue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">S.No</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record: any, index: number) => (
                    <TableRow key={record._id || record.id}>
                      <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {record.facultyId?.name || (record.facultyId?._id || record.facultyId || 'N/A').toString().substring(0, 8)}
                      </TableCell>
                      <TableCell>{record.title}</TableCell>
                      <TableCell>{record.venue}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{record.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            record.status === 'approved' ? 'default' :
                              record.status === 'pending' ? 'secondary' :
                                'destructive'
                          }
                        >
                          {record.status || 'pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {record.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(record._id || record.id, 'approved')}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(record._id || record.id, 'rejected')}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          )}
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
                                onClick={() => handleFileDownload(record.certificate, `FDP_Organized_Certificate_${record.title.replace(/\s+/g, '_')}`)}
                                title="Download Certificate"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <RecordDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        record={selectedRecord}
        type="fdp-organized"
      />
    </div>
  );
};

export default AdminFDPOrganized;
