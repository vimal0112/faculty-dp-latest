import { useState, useEffect } from 'react';
import { Search, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { hodAPI } from '@/lib/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FacultyDetailsModal } from '@/components/FacultyDetailsModal';


const HODFaculty = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);
  const [selectedFacultyName, setSelectedFacultyName] = useState<string>('');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    loadFaculty();
  }, []);

  const loadFaculty = async () => {
    try {
      setLoading(true);
      const data = await hodAPI.getFaculty();
      setFaculty(data || []);
    } catch (error) {
      console.error('Failed to load faculty:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFaculty = faculty.filter((fac: any) => {
    const q = searchQuery.toLowerCase();
    return (
      fac.name?.toLowerCase().includes(q) ||
      fac.email?.toLowerCase().includes(q) ||
      fac.department?.toLowerCase().includes(q) ||
      fac.designation?.toLowerCase().includes(q) ||
      fac.phone?.toLowerCase().includes(q) ||
      fac.recoveryEmail?.toLowerCase().includes(q)
    );
  });

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      faculty.map((fac: any, index: number) => ({
        'S.No': index + 1,
        'Faculty ID': fac._id || fac.id,
        'Name': fac.name,
        'Email': fac.email,
        'Department': fac.department,
        'Designation': fac.designation || 'Faculty',
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Faculty Profiles');
    XLSX.writeFile(workbook, `${user?.department}_Faculty_Profiles.xlsx`);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(`${user?.department} Department - Faculty Profiles`, 14, 20);

    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [['S.No', 'ID', 'Name', 'Email', 'Designation', 'Department']],
      body: faculty.map((fac: any, index: number) => [
        index + 1,
        (fac._id || fac.id).toString().substring(0, 8),
        fac.name,
        fac.email,
        fac.designation || 'Faculty',
        fac.department,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`${user?.department}_Faculty_Profiles.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">All Faculty</h1>
        <p className="text-muted-foreground">View and manage all faculty details</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Faculty Members</CardTitle>
              <CardDescription>Total: {faculty.length} faculty members</CardDescription>
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
                placeholder="Search by name, email, department, designation, phone..."
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
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Recovery Email</TableHead>
                  <TableHead>Join Date</TableHead>
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
                ) : filteredFaculty.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No faculty found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFaculty.map((fac: any) => (
                    <TableRow key={fac._id || fac.id}>
                      <TableCell>{fac.name}</TableCell>
                      <TableCell>{fac.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{fac.designation || 'Faculty'}</Badge>
                      </TableCell>
                      <TableCell>{fac.department}</TableCell>
                      <TableCell>{fac.phone || '-'}</TableCell>
                      <TableCell>{fac.recoveryEmail || '-'}</TableCell>
                      <TableCell>{fac.createdAt ? new Date(fac.createdAt).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedFacultyId(fac._id || fac.id);
                            setSelectedFacultyName(fac.name);
                            setIsViewModalOpen(true);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <FacultyDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        facultyId={selectedFacultyId}
        facultyName={selectedFacultyName}
      />
    </div>
  );
};

export default HODFaculty;
