import { useState, useEffect } from 'react';
import { FileSpreadsheet, FileText, Search, CheckCircle, XCircle, Clock, Download, Eye } from 'lucide-react';
import { handleFileDownload } from '@/lib/downloadUtils';
import { RecordDetailsModal } from '@/components/RecordDetailsModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminAPI } from '@/lib/api';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminSeminars = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const cleanBaseUrl = API_BASE_URL.replace('/api', '').replace(/\/$/, '');

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getSeminars();
      setRecords(data || []);
    } catch (error) {
      console.error('Failed to load seminar records:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter((record: any) =>
    record.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.topic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.venue?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.facultyId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await adminAPI.updateSeminarStatus(id, status);
      toast.success(`Seminar ${status} successfully`);
      await loadRecords();
    } catch (error) {
      console.error(`Failed to ${status} seminar:`, error);
      toast.error(`Failed to ${status} seminar`);
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

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      records.map((record: any, index: number) => ({
        'S.No': index + 1,
        'Faculty ID': record.facultyId?._id || record.facultyId || 'N/A',
        'Faculty Name': record.facultyId?.name || 'N/A',
        'Title': record.title,
        'Topic': record.topic,
        'Date': record.date ? new Date(record.date).toLocaleDateString() : 'N/A',
        'Venue': record.venue,
        'Attendees': record.attendees || 0,
        'Certificate': record.certificate ? 'Available' : 'Not Available',
        'Status': record.status || 'pending',
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Seminars');
    XLSX.writeFile(workbook, 'Seminar_Records.xlsx');
  };

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Seminar Records', 14, 20);

    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [['S.No', 'Faculty', 'Title', 'Topic', 'Date', 'Venue', 'Attendees', 'Status']],
      body: records.map((record: any, index: number) => [
        index + 1,
        record.facultyId?.name || 'N/A',
        record.title,
        record.topic || 'N/A',
        record.date ? new Date(record.date).toLocaleDateString() : 'N/A',
        record.venue,
        (record.attendees || 0).toString(),
        record.status || 'pending',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save('Seminar_Records.pdf');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Seminar Records</h1>
        <p className="text-muted-foreground">View and manage all seminar records</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>All Seminars</CardTitle>
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
                placeholder="Search by faculty name, title, topic, or venue..."
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
                  <TableHead>Topic</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Attendees</TableHead>
                  <TableHead>Certificate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground">
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
                      <TableCell>
                        <Badge variant="secondary">{record.topic || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>
                        {record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>{record.venue}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.attendees || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        {record.certificate ? (
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm truncate max-w-20">Available</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not Available</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(record.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
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
                              onClick={() => handleFileDownload(record.certificate, `Seminar_Certificate_${record.title.replace(/\s+/g, '_')}`)}
                            >
                              <Download className="h-4 w-4" />
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
        type="seminar"
      />
    </div>
  );
};

export default AdminSeminars;
