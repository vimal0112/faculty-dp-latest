import { useState, useEffect } from 'react';
import { FileSpreadsheet, FileText, Search, Check, X, DollarSign, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { adminAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminReimbursements = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewDialog, setReviewDialog] = useState<{ open: boolean; record: any }>({ open: false, record: null });
  const [reviewComments, setReviewComments] = useState('');
  const { toast } = useToast();
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getReimbursements();
      setRecords(data || []);
    } catch (error) {
      console.error('Failed to load reimbursements:', error);
      toast({ title: 'Failed to load records', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    if (!reviewDialog.record) return;

    try {
      await adminAPI.updateReimbursementStatus(reviewDialog.record._id || reviewDialog.record.id, status, reviewComments);
      toast({ title: `Reimbursement ${status} successfully` });
      setReviewDialog({ open: false, record: null });
      setReviewComments('');
      await loadRecords();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  };

  const filteredRecords = records.filter((record: any) =>
    record.fdpTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.facultyId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.expenseType?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      records.map((record: any, index: number) => ({
        'S.No': index + 1,
        'Faculty Name': record.facultyId?.name || 'N/A',
        'FDP Title': record.fdpTitle,
        'Amount': record.amount,
        'Currency': record.currency || 'INR',
        'Expense Type': record.expenseType,
        'Status': record.status,
        'Submitted Date': record.submittedDate ? new Date(record.submittedDate).toLocaleDateString() : 'N/A',
        'Reviewed Date': record.reviewedDate ? new Date(record.reviewedDate).toLocaleDateString() : 'N/A',
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reimbursements');
    XLSX.writeFile(workbook, 'FDP_Reimbursements.xlsx');
  };

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('FDP Reimbursement Records', 14, 20);

    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [['S.No', 'Faculty', 'FDP Title', 'Amount', 'Type', 'Status', 'Date']],
      body: records.map((record: any, index: number) => [
        index + 1,
        record.facultyId?.name || 'N/A',
        record.fdpTitle,
        `${record.currency || 'INR'} ${record.amount}`,
        record.expenseType,
        record.status,
        record.submittedDate ? new Date(record.submittedDate).toLocaleDateString() : 'N/A',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save('FDP_Reimbursements.pdf');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', label: 'Pending' },
      approved: { variant: 'default', label: 'Approved' },
      rejected: { variant: 'destructive', label: 'Rejected' },
      processed: { variant: 'default', label: 'Processed' },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">FDP Reimbursements</h1>
          <p className="text-muted-foreground">Review and manage reimbursement requests</p>
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
          <CardTitle>Reimbursement Requests</CardTitle>
          <CardDescription>Review and approve/reject reimbursement requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search by faculty name, FDP title, or expense type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No reimbursement requests found</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">S.No</TableHead>
                    <TableHead>Faculty</TableHead>
                    <TableHead>FDP Title</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record: any, index: number) => (
                    <TableRow key={record._id || record.id}>
                      <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>{record.facultyId?.name || 'N/A'}</TableCell>
                      <TableCell>{record.fdpTitle}</TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {record.currency || 'INR'} {record.amount?.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>{record.expenseType}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>
                        {record.submittedDate ? new Date(record.submittedDate).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {record.receiptDocument && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`${API_BASE_URL.replace('/api', '')}${record.receiptDocument}`, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setReviewDialog({ open: true, record })}
                          >
                            {record.status === 'pending' ? 'Review' : 'View'}
                          </Button>
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

      <Dialog open={reviewDialog.open} onOpenChange={(open) => setReviewDialog({ open, record: reviewDialog.record })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Reimbursement Request</DialogTitle>
            <DialogDescription>
              Review the reimbursement request and approve or reject it
            </DialogDescription>
          </DialogHeader>
          {reviewDialog.record && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Faculty: </span>
                  <span className="font-medium">{reviewDialog.record.facultyId?.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Amount: </span>
                  <span className="font-medium">
                    {reviewDialog.record.currency || 'INR'} {reviewDialog.record.amount}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">FDP: </span>
                  <span className="font-medium">{reviewDialog.record.fdpTitle}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Type: </span>
                  <span className="font-medium">{reviewDialog.record.expenseType}</span>
                </div>
              </div>

              {reviewDialog.record.description && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Description: </span>
                  <p>{reviewDialog.record.description}</p>
                </div>
              )}

              {reviewDialog.record.status === 'pending' && (
                <>
                  <div>
                    <Label htmlFor="reviewComments">Review Comments</Label>
                    <Textarea
                      id="reviewComments"
                      value={reviewComments}
                      onChange={(e) => setReviewComments(e.target.value)}
                      rows={3}
                      placeholder="Add comments for the faculty member..."
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusUpdate('rejected')}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate('approved')}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  </div>
                </>
              )}
              {reviewDialog.record.status !== 'pending' && reviewDialog.record.comments && (
                <div className="text-sm mt-4">
                  <span className="text-muted-foreground">Admin Comments: </span>
                  <p>{reviewDialog.record.comments}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReimbursements;
