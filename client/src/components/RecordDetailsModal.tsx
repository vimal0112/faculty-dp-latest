import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, ExternalLink } from 'lucide-react';

export type RecordType = 'fdp-attended' | 'fdp-organized' | 'seminar' | 'joint-teaching' | 'abl' | 'adjunct-faculty' | 'internship';

interface RecordDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    record: any;
    type: RecordType;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function RecordDetailsModal({
    isOpen,
    onClose,
    record,
    type,
}: RecordDetailsModalProps) {
    if (!record) return null;

    const renderField = (label: string, value: any) => {
        if (!value) return null;
        return (
            <div className="flex flex-col gap-1 pb-4">
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
                <span className="text-base text-foreground">{value}</span>
            </div>
        );
    };

    const renderStatus = (status: string) => (
        <div className="flex flex-col gap-1 pb-4">
            <span className="text-sm font-medium text-muted-foreground">Status</span>
            <Badge
                variant={
                    status === 'approved' || status === 'verified'
                        ? 'default'
                        : status === 'rejected'
                            ? 'destructive'
                            : 'secondary'
                }
                className="w-fit"
            >
                {status || 'pending'}
            </Badge>
        </div>
    );

    const getDocUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;

        // Ensure baseUrl doesn't end with / and path starts with /
        const baseUrl = API_BASE_URL.replace('/api', '').replace(/\/$/, '');
        const cleanPath = path.startsWith('/') ? path : `/${path}`;

        return `${baseUrl}${cleanPath}`;
    };

    const renderDocument = (path: string, label: string = 'Certificate') => {
        if (!path) return null;
        const url = getDocUrl(path);

        return (
            <div className="flex flex-col gap-2 pb-4">
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Argument
                        </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <a href={url} download>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                        </a>
                    </Button>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (type) {
            case 'fdp-attended':
                return (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            {renderField('Title', record.title)}
                            {renderField('Mode', record.mode)}
                            {renderField('Duration', record.duration)}
                            {renderField('Venue', record.venue)}
                            {renderStatus(record.status)}
                        </div>
                        <div className="border-t pt-4">
                            {renderDocument(record.certificate, 'Certificate')}
                            {renderDocument(record.reportUpload, 'Report')}
                            {renderDocument(record.proofDoc, 'Proof Document')}
                        </div>
                    </>
                );
            case 'fdp-organized':
                return (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            {renderField('Title', record.title)}
                            {renderField('Type', record.type)}
                            {renderField('Venue', record.venue)}
                            {renderStatus(record.status)}
                        </div>
                        <div className="border-t pt-4">
                            {renderDocument(record.proofDoc, 'Proof Document')}
                            {renderDocument(record.report, 'Report')}
                        </div>
                    </>
                );
            case 'seminar':
                return (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            {renderField('Title', record.title)}
                            {renderField('Topic', record.topic)}
                            {renderField('Date', record.date ? new Date(record.date).toLocaleDateString() : '')}
                            {renderField('Venue', record.venue)}
                            {renderField('Attendees', record.attendees)}
                            {renderField('Description', record.description)}
                        </div>
                        <div className="border-t pt-4">
                            {renderDocument(record.certificate, 'Certificate')}
                        </div>
                    </>
                );
            case 'joint-teaching':
                return (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            {renderField('Course Name', record.courseName)}
                            {renderField('Course Code', record.courseCode)}
                            {renderField('Faculty Involved', record.facultyInvolved)}
                            {renderField('Hours', record.hours)}
                        </div>
                        <div className="border-t pt-4">
                            {renderDocument(record.certificate, 'Certificate')}
                            {renderDocument(record.syllabusDoc, 'Syllabus Document')}
                        </div>
                    </>
                );
            case 'abl':
                return (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            {renderField('Faculty Name', record.facultyId?.name)}
                            {renderField('Subject', record.subjectName)}
                            {renderField('Course Code', record.courseCode)}
                            {renderField('Industry Connect', record.industryConnect)}
                            {renderStatus(record.status)}
                        </div>
                        <div className="border-t pt-4">
                            {renderDocument(record.certificate, 'Certificate')}
                        </div>
                    </>
                );
            case 'adjunct-faculty':
                return (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            {renderField('Faculty Name', record.facultyId?.name)}
                            {renderField('Adjunct Faculty Name', record.facultyName)}
                            {renderField('Department', record.department)}
                            {renderField('Course Code', record.courseCode)}
                            {renderField('Duration', record.duration ? `${record.duration} ${record.durationType}` : '')}
                            {renderStatus(record.status)}
                        </div>
                        <div className="border-t pt-4">
                            {renderDocument(record.certificate, 'Certificate')}
                        </div>
                    </>
                );
            case 'internship':
                return (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            {renderField('Faculty Member Name', record.facultyMemberName || record.studentName)}
                            {renderField('Company Name', record.companyName)}
                            {renderField('Registration Number', record.regNo)}
                            {renderField('Position', record.position)}
                            {renderField('Mode', record.mode)}
                            {renderField('Duration', record.duration ? `${record.duration} ${record.durationUnit || 'weeks'}` : '')}
                            {renderStatus(record.status)}
                        </div>
                        <div className="border-t pt-4">
                            {renderDocument(record.internshipReport, 'Internship Report')}
                            {renderDocument(record.certificate, 'Certificate')}
                        </div>
                    </>
                );
            default:
                return <div>Unknown record type</div>;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Record Details</DialogTitle>
                    <DialogDescription>
                        {type.replace('-', ' ').toUpperCase()} - {record.title || record.courseName}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-4">
                        {/* Common Faculty Info if available */}
                        {record.facultyId && (
                            <div className="bg-muted/50 p-3 rounded-lg mb-4">
                                <h4 className="font-semibold text-sm mb-2">Faculty Information</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div><span className="text-muted-foreground mr-2">Name:</span>{record.facultyId.name || 'N/A'}</div>
                                    <div><span className="text-muted-foreground mr-2">Email:</span>{record.facultyId.email || 'N/A'}</div>
                                    <div><span className="text-muted-foreground mr-2">Dept:</span>{record.facultyId.department || 'N/A'}</div>
                                </div>
                            </div>
                        )}

                        {renderContent()}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
