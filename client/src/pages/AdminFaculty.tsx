import { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { adminAPI } from '@/lib/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { FacultyDetailsModal } from '@/components/FacultyDetailsModal';

const AdminFaculty = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [facultyProfiles, setFacultyProfiles] = useState([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);
  const [selectedFacultyName, setSelectedFacultyName] = useState<string>('');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadFaculty = async () => {
      try {
        const faculty = await adminAPI.getFaculty();
        setFacultyProfiles(faculty);
      } catch (error) {
        toast({ title: 'Failed to load faculty', variant: 'destructive' });
      }
    };
    loadFaculty();
  }, []);

  const filteredFaculty = facultyProfiles.filter(faculty =>
    faculty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faculty.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faculty.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      facultyProfiles.map((faculty, index) => ({
        'S.No': index + 1,
        'Faculty ID': faculty.id,
        'Name': faculty.name,
        'Email': faculty.email,
        'Department': faculty.department,
        'Designation': faculty.designation,
        'Join Date': faculty.joinDate,
        'FDPs': faculty.fdpCount,
        'Seminars': faculty.seminarCount,
        'Workshops': faculty.workshopCount,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Faculty Profiles');
    XLSX.writeFile(workbook, 'Faculty_Profiles.xlsx');
  };

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Faculty Profiles Report', 14, 20);

    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [['S.No', 'ID', 'Name', 'Department', 'Designation', 'FDPs', 'Seminars', 'Workshops']],
      body: facultyProfiles.map((faculty, index) => [
        index + 1,
        faculty.id,
        faculty.name,
        faculty.department,
        faculty.designation,
        faculty.fdpCount,
        faculty.seminarCount,
        faculty.workshopCount,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save('Faculty_Profiles.pdf');
  };

  const handleViewFaculty = (faculty: any) => {
    setSelectedFacultyId(faculty.id || faculty._id);
    setSelectedFacultyName(faculty.name);
    setIsViewModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Faculty Profiles</h1>
        <p className="text-muted-foreground">Manage and view all faculty members</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>All Faculty Members</CardTitle>
              <CardDescription>Total: {facultyProfiles.length} faculty members</CardDescription>
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
                placeholder="Search by name, department, or email..."
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
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>FDPs</TableHead>
                  <TableHead>Seminars</TableHead>
                  <TableHead>Workshops</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFaculty.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No faculty members found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFaculty.map((faculty) => (
                    <TableRow key={faculty.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{faculty.name}</p>
                          <p className="text-sm text-muted-foreground">{faculty.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{faculty.department}</TableCell>
                      <TableCell>{faculty.designation}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{faculty.fdpCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{faculty.seminarCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{faculty.workshopCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewFaculty(faculty)}>View</Button>
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

      <FacultyDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        facultyId={selectedFacultyId}
        facultyName={selectedFacultyName}
      />
    </div>
  );
};

export default AdminFaculty;
