import { useState, useEffect } from 'react';
import { FileSpreadsheet, FileText, Filter, Calendar, Search, ArrowLeft, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { auditAPI, adminAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const FacultyFiltration = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [faculty, setFaculty] = useState<any[]>([]);
    const [departments, setDepartments] = useState<string[]>([]);
    const [filteredData, setFilteredData] = useState<any>(null);

    // Filters
    const [selectedFacultyId, setSelectedFacultyId] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadFaculty();
    }, []);

    const loadFaculty = async () => {
        try {
            const data = await adminAPI.getFaculty();
            setFaculty(data || []);
            const deptSet = new Set(data.map((f: any) => f.department).filter(Boolean));
            setDepartments(Array.from(deptSet));
        } catch (error) {
            console.error('Failed to load faculty:', error);
            toast({ title: 'Failed to load faculty list', variant: 'destructive' });
        }
    };

    const handleApplyFilters = async () => {
        if (!selectedFacultyId) {
            toast({ title: 'Faculty name is mandatory', variant: 'destructive' });
            return;
        }

        try {
            setLoading(true);
            const data = await auditAPI.getAuditData({
                facultyId: selectedFacultyId,
                startDate,
                endDate,
                department: selectedDepartment === 'all' ? undefined : selectedDepartment
            });
            setFilteredData(data);
            toast({ title: 'Filters applied successfully' });
        } catch (error) {
            console.error('Failed to fetch filtered data:', error);
            toast({ title: 'Failed to fetch data', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const downloadExcel = () => {
        if (!filteredData) return;

        const workbook = XLSX.utils.book_new();
        const summaryData = [
            ['Faculty Audit Report'],
            ['Faculty Name', filteredData.data.faculty[0]?.name || 'N/A'],
            ['Department', filteredData.data.faculty[0]?.department || 'N/A'],
            ['Period', `${startDate} to ${endDate}`],
            [],
            ['Activity', 'Count'],
            ['FDP Attended', filteredData.summary.totalFDPAttended],
            ['FDP Organized', filteredData.summary.totalFDPOrganized],
            ['Seminars', filteredData.summary.totalSeminars],
            ['ABL Activities', filteredData.summary.totalABL],
            ['Joint Teaching', filteredData.summary.totalJointTeaching],
            ['Adjunct Faculty', filteredData.summary.totalAdjunctFaculty],
            ['Reimbursements', filteredData.summary.totalReimbursements],
            ['Achievements', filteredData.summary.totalAchievements],
            ['Internships', filteredData.summary.totalInternships],
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
        XLSX.writeFile(workbook, `Faculty_Report_${selectedFacultyId}.xlsx`);
    };

    const downloadPDF = () => {
        if (!filteredData) return;

        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Faculty Audit Report', 14, 20);

        doc.setFontSize(11);
        doc.text(`Faculty: ${filteredData.data.faculty[0]?.name || 'N/A'}`, 14, 30);
        doc.text(`Department: ${filteredData.data.faculty[0]?.department || 'N/A'}`, 14, 37);
        doc.text(`Period: ${startDate} to ${endDate}`, 14, 44);

        autoTable(doc, {
            startY: 55,
            head: [['Activity', 'Count']],
            body: [
                ['FDP Attended', filteredData.summary.totalFDPAttended],
                ['FDP Organized', filteredData.summary.totalFDPOrganized],
                ['Seminars', filteredData.summary.totalSeminars],
                ['ABL Activities', filteredData.summary.totalABL],
                ['Joint Teaching', filteredData.summary.totalJointTeaching],
                ['Adjunct Faculty', filteredData.summary.totalAdjunctFaculty],
                ['Reimbursements', filteredData.summary.totalReimbursements],
                ['Achievements', filteredData.summary.totalAchievements],
                ['Internships', filteredData.summary.totalInternships],
            ],
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] },
        });

        doc.save(`Faculty_Report_${selectedFacultyId}.pdf`);
    };

    const filteredFacultyList = faculty.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (selectedDepartment === 'all' || f.department === selectedDepartment)
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Faculty Filtration</h1>
                    <p className="text-muted-foreground">Filter and view individual faculty performance</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters
                    </CardTitle>
                    <CardDescription>All fields marked with * are mandatory</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="faculty">Faculty Name *</Label>
                            <Select value={selectedFacultyId} onValueChange={setSelectedFacultyId}>
                                <SelectTrigger id="faculty">
                                    <SelectValue placeholder="Select Faculty" />
                                </SelectTrigger>
                                <SelectContent>
                                    <div className="p-2 border-b">
                                        <div className="relative">
                                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search name..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-8 h-8"
                                            />
                                        </div>
                                    </div>
                                    {filteredFacultyList.length === 0 ? (
                                        <div className="p-2 text-sm text-center text-muted-foreground">No faculty found</div>
                                    ) : (
                                        filteredFacultyList.map((f) => (
                                            <SelectItem key={f._id} value={f._id}>{f.name}</SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="department">Department</Label>
                            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                <SelectTrigger id="department">
                                    <SelectValue placeholder="All Departments" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {departments.map((dept) => (
                                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="endDate">End Date</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end mt-6">
                        <Button onClick={handleApplyFilters} disabled={loading} className="w-full md:w-auto">
                            {loading ? 'Processing...' : 'Apply Filters'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {filteredData && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">
                            Results for {faculty.find(f => f._id === selectedFacultyId)?.name || 'Faculty'}
                        </h2>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={downloadExcel}>
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Export Excel
                            </Button>
                            <Button variant="outline" size="sm" onClick={downloadPDF}>
                                <FileText className="mr-2 h-4 w-4" />
                                Export PDF
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { label: 'FDP Attended', count: filteredData.summary.totalFDPAttended },
                            { label: 'FDP Organized', count: filteredData.summary.totalFDPOrganized },
                            { label: 'Seminars', count: filteredData.summary.totalSeminars },
                            { label: 'ABL Activities', count: filteredData.summary.totalABL },
                            { label: 'Joint Teaching', count: filteredData.summary.totalJointTeaching },
                            { label: 'Adjunct Faculty', count: filteredData.summary.totalAdjunctFaculty },
                            { label: 'Reimbursements', count: filteredData.summary.totalReimbursements },
                            { label: 'Achievements', count: filteredData.summary.totalAchievements },
                            { label: 'Internships', count: filteredData.summary.totalInternships },
                        ].map((item, idx) => (
                            <Card key={idx} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{item.count}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultyFiltration;
