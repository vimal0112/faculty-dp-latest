import { useState, useEffect } from 'react';
import { FileSpreadsheet, FileText, Search, CheckCircle, XCircle, Clock, Eye, Download } from 'lucide-react';
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

const AdminAdjunctFaculty = () => {
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
      const data = await adminAPI.getAdjunctFaculty();
      setRecords(data || []);
    } catch (error) {
      console.error('Failed to load adjunct faculty records:', error);
      toast({ title: 'Failed to load records', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await adminAPI.updateAdjunctFacultyStatus(id, status);
      toast({
        title: `Record ${status} successfully`,
        variant: status === 'approved' ? 'default' : 'destructive'
      });
      await loadRecords();
    } catch (error) {
      console.error(`Failed to ${status} record:`, error);
      toast({
        title: `Failed to ${status} record`,
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const filteredRecords = records.filter((record: any) =>
    record.facultyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.courseCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.facultyId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      records.map((record: any, index: number) => ({
        'S.No': index + 1,
        'Faculty ID': record.facultyId?._id || record.facultyId || 'N/A',
        'Faculty Name': record.facultyId?.name || 'N/A',
        'Adjunct Faculty Name': record.facultyName,
        'Department': record.department,
        'Course Code': record.courseCode,
        'From Date': record.fromDate ? new Date(record.fromDate).toLocaleDateString() : 'N/A',
        'To Date': record.toDate ? new Date(record.toDate).toLocaleDateString() : 'N/A',
        'Duration': record.duration ? `${record.duration} ${record.durationType}` : 'N/A',
        'Certificate': record.certificate || 'N/A',
        'Status': record.status || 'pending',
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Adjunct Faculty');
    XLSX.writeFile(workbook, 'Adjunct_Faculty_Records.xlsx');
  };

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Adjunct Faculty Records', 14, 20);

    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [['S.No', 'Faculty', 'Adjunct Faculty', 'Department', 'Course Code', 'Duration', 'Status']],
      body: records.map((record: any, index: number) => [
        index + 1,
        record.facultyId?.name || 'N/A',
        record.facultyName,
        record.department,
        record.courseCode,
        record.duration ? `${record.duration} ${record.durationType}` : 'N/A',
        record.status || 'pending',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save('Adjunct_Faculty_Records.pdf');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Adjunct Faculty Records</h1>
        <p className="text-muted-foreground">View and manage all adjunct faculty records</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>All Adjunct Faculty</CardTitle>
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
                placeholder="Search by faculty name, adjunct faculty, department, or course code..."
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
                  <TableHead>Faculty Name</TableHead>
                  <TableHead>Adjunct Faculty Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Course Code</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Certificate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      No records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record: any, index: number) => (
                    <TableRow key={record._id || record.id}>
                      <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {record.facultyId?.name || 'N/A'}
                      </TableCell>
                      <TableCell>{record.facultyName}</TableCell>
                      <TableCell>{record.department}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{record.courseCode}</Badge>
                      </TableCell>
                      <TableCell>
                        {record.fromDate && record.toDate ? (
                          <div className="text-sm">
                            <div>{new Date(record.fromDate).toLocaleDateString()} - {new Date(record.toDate).toLocaleDateString()}</div>
                            <div className="text-xs text-blue-600">{record.duration} {record.durationType}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {record.certificate ? (
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm truncate max-w-20">{record.certificate}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(record.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRecord(record);
                              setIsViewModalOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {record.certificate && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleFileDownload(record.certificate, `Adjunct_Faculty_Certificate_${record.facultyName.replace(/\s+/g, '_')}`)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          {record.status !== 'approved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => updateStatus(record._id || record.id, 'approved')}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                          )}
                          {record.status !== 'rejected' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => updateStatus(record._id || record.id, 'rejected')}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
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
        type="adjunct-faculty"
      />
    </div>
  );
};

export default AdminAdjunctFaculty;
