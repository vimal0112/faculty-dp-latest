import { useState, useEffect } from 'react';
import { FileSpreadsheet, FileText, Search, Eye, Download, CheckCircle, XCircle } from 'lucide-react';
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

const AdminJointTeaching = () => {
  const { toast } = useToast();
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
      const data = await adminAPI.getJointTeaching();
      setRecords(data || []);
    } catch (error) {
      console.error('Failed to load joint teaching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter((record: any) =>
    record.courseName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.courseCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.facultyInvolved?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.facultyId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      records.map((record: any, index: number) => ({
        'S.No': index + 1,
        'Faculty ID': record.facultyId?._id || record.facultyId || 'N/A',
        'Faculty Name': record.facultyId?.name || 'N/A',
        'Course Name': record.courseName,
        'Course Code': record.courseCode,
        'Faculty Involved': record.facultyInvolved,
        'Hours': record.hours,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Joint Teaching');
    XLSX.writeFile(workbook, 'Joint_Teaching_Records.xlsx');
  };

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Joint Teaching Records', 14, 20);

    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [['S.No', 'Faculty', 'Course', 'Code', 'Faculty Involved', 'Hours']],
      body: records.map((record: any, index: number) => [
        index + 1,
        record.facultyId?.name || 'N/A',
        record.courseName,
        record.courseCode,
        record.facultyInvolved,
        record.hours,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save('Joint_Teaching_Records.pdf');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Joint Teaching Records</h1>
        <p className="text-muted-foreground">View and manage all joint teaching records</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>All Joint Teaching</CardTitle>
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
                placeholder="Search by faculty name, course name, code, or faculty involved..."
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
                  <TableHead>Course Name</TableHead>
                  <TableHead>Course Code</TableHead>
                  <TableHead>Faculty Involved</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
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
                      <TableCell>{record.courseName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{record.courseCode}</Badge>
                      </TableCell>
                      <TableCell>{record.facultyWithinCollege || record.facultyInvolved || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            record.status === 'approved' ? 'default' :
                              record.status === 'rejected' ? 'destructive' :
                                'secondary'
                          }
                        >
                          {record.status || 'pending'}
                        </Badge>
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
                              onClick={() => handleFileDownload(record.certificate, `Joint_Teaching_Certificate_${record.courseName.replace(/\s+/g, '_')}`)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          {(record.status === 'pending' || !record.status) && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={async () => {
                                  try {
                                    await adminAPI.updateJointTeachingStatus(record._id || record.id, 'approved');
                                    toast({ title: 'Approved', description: `Joint Teaching for "${record.courseName}" has been approved.` });
                                    loadRecords();
                                  } catch (error) {
                                    toast({ title: 'Error approving record', variant: 'destructive' });
                                    console.error('Failed to approve:', error);
                                  }
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={async () => {
                                  try {
                                    await adminAPI.updateJointTeachingStatus(record._id || record.id, 'rejected');
                                    toast({ title: 'Rejected', description: `Joint Teaching for "${record.courseName}" has been rejected.`, variant: 'destructive' });
                                    loadRecords();
                                  } catch (error) {
                                    toast({ title: 'Error rejecting record', variant: 'destructive' });
                                    console.error('Failed to reject:', error);
                                  }
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
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
        type="joint-teaching"
      />
    </div>
  );
};

export default AdminJointTeaching;
