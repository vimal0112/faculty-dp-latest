// Type definitions for the application

export interface FacultyProfile {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  joinDate: string;
  fdpCount: number;
  seminarCount: number;
  workshopCount: number;
}

export interface FDP {
  id: string;
  facultyId: string;
  title: string;
  organizer: string;
  startDate: string;
  endDate: string;
  duration: string;
  certificate?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface FDPAttended {
  id: string;
  facultyId: string;
  title: string;
  mode: 'online' | 'offline' | 'hybrid';
  fromDate?: string;
  toDate?: string;
  duration: string;
  venue: string;
  reportUpload?: string;
  proofDoc?: string;
  certificate?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface FDPOrganized {
  id: string;
  facultyId: string;
  title: string;
  mode: 'online' | 'offline' | 'hybrid';
  fromDate?: string;
  toDate?: string;
  duration: string;
  venue: string;
  type: 'conference' | 'workshop';
  certificate?: string;
  proofDoc?: string;
  report?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ActivityBasedLearning {
  id: string;
  facultyId: string;
  subjectName: string;
  courseCode: string;
  industryConnect: string;
  proofDoc?: string;
  fromDate?: string;
  toDate?: string;
  calculatedDuration?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface AdjunctFaculty {
  id: string;
  facultyId: string;
  facultyName: string;
  department: string;
  courseCode: string;
  fromDate: string;
  toDate: string;
  duration: number;
  durationType: 'days' | 'weeks';
  certificate: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface JointTeaching {
  id: string;
  facultyId: string;
  courseName: string;
  courseCode: string;
  facultyInvolved?: string; // Deprecated, keeping for compatibility
  facultyWithinCollege?: string;
  facultyOutsideCollege?: string;
  syllabusDoc?: string;
  certificate?: string;
  hours: number;
  fromDate?: string;
  toDate?: string;
  calculatedDuration?: string;
  toBePaid?: number;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface Seminar {
  id: string;
  facultyId: string;
  title: string;
  topic: string;
  date: string;
  venue: string;
  description: string;
  attendees?: number;
  certificate?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Notification {
  id: string;
  recipientId: string;
  sender: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

export interface UpcomingEvent {
  id: string;
  title: string;
  type: 'FDP' | 'Seminar' | 'Workshop' | 'Conference';
  date: string;
  venue: string;
  description: string;
  registrationLink?: string;
}

export interface FDPReimbursement {
  id: string;
  facultyId: string;
  fdpId: string;
  fdpTitle: string;
  amount: number;
  currency: string;
  expenseType: 'travel' | 'accommodation' | 'registration' | 'food' | 'other';
  description?: string;
  receiptDocument?: string;
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountHolderName: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  submittedDate?: string;
  reviewComments?: string;
}

export interface Achievement {
  id: string;
  facultyId: string;
  title: string;
  description: string;
  category: 'award' | 'publication' | 'research' | 'patent' | 'recognition' | 'certification' | 'other';
  issuer?: string;
  date: string;
  certificate?: string;
  supportingDocument?: string;
  link?: string;
  status: 'pending' | 'verified' | 'rejected';
}

export interface Internship {
  id: string;
  facultyId: string;
  regNo: string;
  studentName: string;
  companyName: string;
  companyAddress?: string;
  mode: 'online' | 'offline' | 'hybrid';
  startDate: string;
  endDate: string;
  duration?: number;
  durationUnit?: 'days' | 'weeks';
  stipend?: number;
  description?: string;
  skillsGained?: string[];
  projectTitle?: string;
  status: 'pending' | 'approved' | 'rejected' | 'ongoing' | 'completed';
  certificate: string;
  report?: string;
}
