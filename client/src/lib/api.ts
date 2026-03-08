// API Base URL
const API_BASE_URL =
  (import.meta.env.VITE_API_URL || "http://localhost:3001") + "/api";

// Helper function to get auth headers
const getAuthHeaders = (includeContentType: boolean = true): HeadersInit => {
  const userId = localStorage.getItem('user-id');
  const headers: HeadersInit = {};
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  if (userId) {
    headers['user-id'] = userId;
  }
  return headers;
};

// Generic API request function
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      const err = new Error(data.error || `HTTP error! status: ${response.status}`);
      if (data.fieldErrors) {
        (err as Error & { fieldErrors?: Record<string, string> }).fieldErrors = data.fieldErrors;
      }
      throw err;
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// ========== Authentication API ==========
export const authAPI = {
  login: async (email: string, password: string, role: string) => {
    return apiRequest<{ message: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
  },

  register: async (userData: {
    username: string;
    name: string;
    email: string;
    password: string;
    role: string;
    department: string;
    phone: string;
  }) => {
    return apiRequest<{ message: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  getCurrentUser: async () => {
    return apiRequest<{ user: any }>('/auth/me');
  },

  forgotPassword: async (email: string) => {
    return apiRequest<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (token: string, password: string) => {
    return apiRequest<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },
};

// ========== Faculty API ==========
export const facultyAPI = {
  // FDP Attended
  getFDPAttended: async () => {
    return apiRequest<any[]>('/faculty/fdp/attended');
  },

  createFDPAttended: async (data: {
    title: string;
    mode: 'online' | 'offline' | 'hybrid';
    fromDate: string;
    toDate: string;
    venue: string;
    reportUpload?: string;
    proofDoc?: string;
    certificate: File;
  }) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('mode', data.mode);
    formData.append('fromDate', data.fromDate);
    formData.append('toDate', data.toDate);
    formData.append('venue', data.venue);
    if (data.reportUpload) formData.append('reportUpload', data.reportUpload);
    if (data.proofDoc) formData.append('proofDoc', data.proofDoc);
    formData.append('certificate', data.certificate);

    const userId = localStorage.getItem('user-id');
    const url = `${API_BASE_URL}/faculty/fdp/attended`;
    const config: RequestInit = {
      method: 'POST',
      headers: {
        'user-id': userId || '',
      },
      body: formData,
    };

    const response = await fetch(url, config);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }
    return result;
  },

  updateFDPAttended: async (id: string, data: any & { certificate?: File; fromDate?: string; toDate?: string }) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'certificate' && data[key] instanceof File) {
        formData.append('certificate', data[key]);
      } else if (key !== 'certificate' && data[key] !== undefined) {
        formData.append(key, String(data[key]));
      }
    });

    const userId = localStorage.getItem('user-id');
    const url = `${API_BASE_URL}/faculty/fdp/attended/${id}`;
    const config: RequestInit = {
      method: 'PUT',
      headers: {
        'user-id': userId || '',
      },
      body: formData,
    };

    const response = await fetch(url, config);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }
    return result;
  },

  deleteFDPAttended: async (id: string) => {
    return apiRequest<{ message: string }>(`/faculty/fdp/attended/${id}`, {
      method: 'DELETE',
    });
  },

  // FDP Organized
  getFDPOrganized: async () => {
    return apiRequest<any[]>('/faculty/fdp/organized');
  },

  createFDPOrganized: async (data: {
    title: string;
    mode: 'online' | 'offline' | 'hybrid';
    fromDate: string;
    toDate: string;
    venue: string;
    type: 'conference' | 'workshop';
    certificate: File;
    proofDoc?: string;
    report?: string;
  }) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('mode', data.mode);
    formData.append('fromDate', data.fromDate);
    formData.append('toDate', data.toDate);
    formData.append('venue', data.venue);
    formData.append('type', data.type);
    formData.append('certificate', data.certificate);
    if (data.proofDoc) formData.append('proofDoc', data.proofDoc);
    if (data.report) formData.append('report', data.report);

    const userId = localStorage.getItem('user-id');
    const url = `${API_BASE_URL}/faculty/fdp/organized`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'user-id': userId || '' },
      body: formData,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `HTTP error! status: ${response.status}`);
    return result;
  },

  updateFDPOrganized: async (id: string, data: any & { certificate?: File }) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'certificate' && data[key] instanceof File) {
        formData.append('certificate', data[key]);
      } else if (key !== 'certificate' && data[key] !== undefined) {
        formData.append(key, String(data[key]));
      }
    });

    const userId = localStorage.getItem('user-id');
    const url = `${API_BASE_URL}/faculty/fdp/organized/${id}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'user-id': userId || '' },
      body: formData,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `HTTP error! status: ${response.status}`);
    return result;
  },

  deleteFDPOrganized: async (id: string) => {
    return apiRequest<{ message: string }>(`/faculty/fdp/organized/${id}`, {
      method: 'DELETE',
    });
  },

  // Seminars
  getSeminars: async () => {
    return apiRequest<any[]>('/faculty/seminars');
  },

  createSeminar: async (data: {
    title: string;
    topic: string;
    date: string;
    venue: string;
    description?: string;
    attendees?: number;
    certificate?: File;
  }) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('topic', data.topic);
    formData.append('date', data.date);
    formData.append('venue', data.venue);
    if (data.description) formData.append('description', data.description);
    if (data.attendees !== undefined) formData.append('attendees', data.attendees.toString());
    if (data.certificate) formData.append('certificate', data.certificate);

    const userId = localStorage.getItem('user-id');
    const url = `${API_BASE_URL}/faculty/seminars`;
    const config: RequestInit = {
      method: 'POST',
      headers: {
        'user-id': userId || '',
      },
      body: formData,
    };

    const response = await fetch(url, config);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }
    return result;
  },

  updateSeminar: async (id: string, data: any & { certificate?: File }) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'certificate' && data[key] instanceof File) {
        formData.append('certificate', data[key]);
      } else if (key !== 'certificate') {
        formData.append(key, data[key]);
      }
    });

    const userId = localStorage.getItem('user-id');
    const url = `${API_BASE_URL}/faculty/seminars/${id}`;
    const config: RequestInit = {
      method: 'PUT',
      headers: {
        'user-id': userId || '',
      },
      body: formData,
    };

    const response = await fetch(url, config);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }
    return result;
  },

  deleteSeminar: async (id: string) => {
    return apiRequest<{ message: string }>(`/faculty/seminars/${id}`, {
      method: 'DELETE',
    });
  },

  // ABL
  getABL: async () => {
    return apiRequest<any[]>('/faculty/abl');
  },

  createABL: async (data: {
    subjectName: string;
    courseCode: string;
    industryConnect: string;
    fromDate: string;
    toDate: string;
    calculatedDuration: string;
    proofDoc?: File;
  }) => {
    const formData = new FormData();
    formData.append('subjectName', data.subjectName);
    formData.append('courseCode', data.courseCode);
    formData.append('industryConnect', data.industryConnect);
    formData.append('fromDate', data.fromDate);
    formData.append('toDate', data.toDate);
    formData.append('calculatedDuration', data.calculatedDuration);
    if (data.proofDoc) formData.append('proofDoc', data.proofDoc);

    const userId = localStorage.getItem('user-id');
    const url = `${API_BASE_URL}/faculty/abl`;
    const config: RequestInit = {
      method: 'POST',
      headers: {
        'user-id': userId || '',
      },
      body: formData,
    };

    const response = await fetch(url, config);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }
    return result;
  },

  updateABL: async (id: string, data: any & { proofDoc?: File; fromDate?: string; toDate?: string }) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'proofDoc' && data[key] instanceof File) {
        formData.append('proofDoc', data[key]);
      } else if (key !== 'proofDoc' && data[key] !== undefined) {
        formData.append(key, String(data[key]));
      }
    });

    const userId = localStorage.getItem('user-id');
    const url = `${API_BASE_URL}/faculty/abl/${id}`;
    const config: RequestInit = {
      method: 'PUT',
      headers: {
        'user-id': userId || '',
      },
      body: formData,
    };

    const response = await fetch(url, config);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }
    return result;
  },

  deleteABL: async (id: string) => {
    return apiRequest<{ message: string }>(`/faculty/abl/${id}`, {
      method: 'DELETE',
    });
  },

  // Joint Teaching
  getJointTeaching: async () => {
    return apiRequest<any[]>('/faculty/joint-teaching');
  },

  createJointTeaching: async (data: {
    courseName: string;
    courseCode: string;
    facultyWithinCollege: string;
    facultyOutsideCollege?: string;
    hours: number;
    fromDate: string;
    toDate: string;
    calculatedDuration: string;
    toBePaid: number;
    certificate: File;
  }) => {
    const formData = new FormData();
    formData.append('courseName', data.courseName);
    formData.append('courseCode', data.courseCode);
    formData.append('facultyWithinCollege', data.facultyWithinCollege);
    if (data.facultyOutsideCollege) formData.append('facultyOutsideCollege', data.facultyOutsideCollege);
    formData.append('hours', data.hours.toString());
    formData.append('fromDate', data.fromDate);
    formData.append('toDate', data.toDate);
    formData.append('calculatedDuration', data.calculatedDuration);
    formData.append('toBePaid', data.toBePaid.toString());
    formData.append('certificate', data.certificate);

    const userId = localStorage.getItem('user-id');
    const url = `${API_BASE_URL}/faculty/joint-teaching`;
    const config: RequestInit = {
      method: 'POST',
      headers: {
        'user-id': userId || '',
      },
      body: formData,
    };

    const response = await fetch(url, config);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }
    return result;
  },

  updateJointTeaching: async (id: string, data: any & { certificate?: File }) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'certificate' && data[key] instanceof File) {
        formData.append('certificate', data[key]);
      } else if (key !== 'certificate') {
        formData.append(key, data[key]);
      }
    });

    const userId = localStorage.getItem('user-id');
    const url = `${API_BASE_URL}/faculty/joint-teaching/${id}`;
    const config: RequestInit = {
      method: 'PUT',
      headers: {
        'user-id': userId || '',
      },
      body: formData,
    };

    const response = await fetch(url, config);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }
    return result;
  },

  deleteJointTeaching: async (id: string) => {
    return apiRequest<{ message: string }>(`/faculty/joint-teaching/${id}`, {
      method: 'DELETE',
    });
  },

  // Adjunct Faculty
  getAdjunctFaculty: async () => {
    return apiRequest<any[]>('/faculty/adjunct');
  },

  createAdjunctFaculty: async (data: {
    facultyName: string;
    department: string;
    courseCode: string;
    fromDate: string;
    toDate: string;
    duration: number;
    durationType: 'days' | 'weeks';
    certificate: File;
  }) => {
    const formData = new FormData();
    formData.append('facultyName', data.facultyName);
    formData.append('department', data.department);
    formData.append('courseCode', data.courseCode);
    formData.append('fromDate', data.fromDate);
    formData.append('toDate', data.toDate);
    formData.append('duration', data.duration.toString());
    formData.append('durationType', data.durationType);
    formData.append('certificate', data.certificate);

    const userId = localStorage.getItem('user-id');
    const url = `${API_BASE_URL}/faculty/adjunct`;
    const config: RequestInit = {
      method: 'POST',
      headers: {
        'user-id': userId || '',
      },
      body: formData,
    };

    const response = await fetch(url, config);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }
    return result;
  },

  updateAdjunctFaculty: async (id: string, data: any & { certificate?: File }) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'certificate' && data[key] instanceof File) {
        formData.append('certificate', data[key]);
      } else if (key !== 'certificate' && data[key] !== undefined) {
        formData.append(key, String(data[key]));
      }
    });

    const userId = localStorage.getItem('user-id');
    const url = `${API_BASE_URL}/faculty/adjunct/${id}`;
    const config: RequestInit = {
      method: 'PUT',
      headers: {
        'user-id': userId || '',
      },
      body: formData,
    };

    const response = await fetch(url, config);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }
    return result;
  },

  deleteAdjunctFaculty: async (id: string) => {
    return apiRequest<{ message: string }>(`/faculty/adjunct/${id}`, {
      method: 'DELETE',
    });
  },

  // Notifications
  getNotifications: async () => {
    return apiRequest<any[]>('/faculty/notifications');
  },

  markNotificationRead: async (id: string) => {
    return apiRequest<any>(`/faculty/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  markAllNotificationsRead: async () => {
    return apiRequest<{ message: string }>('/faculty/notifications/read-all', {
      method: 'PUT',
    });
  },

  // Dashboard
  getDashboard: async () => {
    return apiRequest<{
      stats: any;
      recentFDPs: any[];
    }>('/faculty/dashboard');
  },

  // FDP Reimbursements
  getReimbursements: async () => {
    return apiRequest<any[]>('/faculty/reimbursements');
  },

  createReimbursement: async (data: any & { receiptDocument?: File }) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'receiptDocument' && data[key] instanceof File) {
        formData.append('receiptDocument', data[key]);
      } else if (key !== 'receiptDocument') {
        formData.append(key, data[key]);
      }
    });

    const userId = localStorage.getItem('user-id');
    const url = `${API_BASE_URL}/faculty/reimbursements`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'user-id': userId || '' },
      body: formData,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Request failed');
    return result;
  },

  updateReimbursement: async (id: string, data: any & { receiptDocument?: File }) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'receiptDocument' && data[key] instanceof File) {
        formData.append('receiptDocument', data[key]);
      } else if (key !== 'receiptDocument') {
        formData.append(key, data[key]);
      }
    });

    const userId = localStorage.getItem('user-id');
    const url = `${API_BASE_URL}/faculty/reimbursements/${id}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'user-id': userId || '' },
      body: formData,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Request failed');
    return result;
  },

  deleteReimbursement: async (id: string) => {
    return apiRequest<{ message: string }>(`/faculty/reimbursements/${id}`, {
      method: 'DELETE',
    });
  },

  // Achievements
  getAchievements: async () => {
    return apiRequest<any[]>('/faculty/achievements');
  },

  createAchievement: async (data: any & { certificate?: File; supportingDocument?: File }) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if ((key === 'certificate' || key === 'supportingDocument') && data[key] instanceof File) {
        formData.append(key, data[key]);
      } else if (key !== 'certificate' && key !== 'supportingDocument') {
        formData.append(key, data[key]);
      }
    });

    const userId = localStorage.getItem('user-id');
    const url = `${API_BASE_URL}/faculty/achievements`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'user-id': userId || '' },
      body: formData,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Request failed');
    return result;
  },

  updateAchievement: async (id: string, data: any & { certificate?: File; supportingDocument?: File }) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if ((key === 'certificate' || key === 'supportingDocument') && data[key] instanceof File) {
        formData.append(key, data[key]);
      } else if (key !== 'certificate' && key !== 'supportingDocument') {
        formData.append(key, data[key]);
      }
    });

    const userId = localStorage.getItem('user-id');
    const url = `${API_BASE_URL}/faculty/achievements/${id}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'user-id': userId || '' },
      body: formData,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Request failed');
    return result;
  },

  deleteAchievement: async (id: string) => {
    return apiRequest<{ message: string }>(`/faculty/achievements/${id}`, {
      method: 'DELETE',
    });
  },

  // Internships
  getInternships: async () => {
    return apiRequest<any[]>('/faculty/internships');
  },

  createInternship: async (data: any & { certificate?: File; report?: File }) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if ((key === 'certificate' || key === 'report') && data[key] instanceof File) {
        formData.append(key, data[key]);
      } else if (key !== 'certificate' && key !== 'report') {
        if (key === 'skillsGained' && Array.isArray(data[key])) {
          formData.append(key, data[key].join(','));
        } else {
          formData.append(key, data[key]);
        }
      }
    });

    const userId = localStorage.getItem('user-id');
    const url = `${API_BASE_URL}/faculty/internships`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'user-id': userId || '' },
      body: formData,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Request failed');
    return result;
  },

  updateInternship: async (id: string, data: any & { certificate?: File; report?: File }) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if ((key === 'certificate' || key === 'report') && data[key] instanceof File) {
        formData.append(key, data[key]);
      } else if (key !== 'certificate' && key !== 'report') {
        if (key === 'skillsGained' && Array.isArray(data[key])) {
          formData.append(key, data[key].join(','));
        } else {
          formData.append(key, data[key]);
        }
      }
    });

    const userId = localStorage.getItem('user-id');
    const url = `${API_BASE_URL}/faculty/internships/${id}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'user-id': userId || '' },
      body: formData,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Request failed');
    return result;
  },

  deleteInternship: async (id: string) => {
    return apiRequest<{ message: string }>(`/faculty/internships/${id}`, {
      method: 'DELETE',
    });
  },

  // Upcoming Events
  getUpcomingEvents: async () => {
    return apiRequest<any[]>('/faculty/upcoming-events');
  },

  createUpcomingEvent: async (data: {
    eventName: string;
    venue: string;
    startDate: string;
    endDate: string;
    duration: number;
    durationUnit: string;
    description?: string;
  }) => {
    return apiRequest<any>('/faculty/upcoming-events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateUpcomingEvent: async (id: string, data: any) => {
    return apiRequest<any>(`/faculty/upcoming-events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteUpcomingEvent: async (id: string) => {
    return apiRequest<{ message: string }>(`/faculty/upcoming-events/${id}`, {
      method: 'DELETE',
    });
  },

  updateUpcomingEventNotification: async (id: string) => {
    return apiRequest<any>(`/faculty/upcoming-events/${id}/notification`, {
      method: 'PUT',
    });
  },

  deleteNotification: async (id: string) => {
    return apiRequest<{ message: string }>(`/faculty/notifications/${id}`, {
      method: 'DELETE',
    });
  },
};

// ========== Admin API ==========
export const adminAPI = {
  getFaculty: async () => {
    return apiRequest<any[]>('/admin/faculty');
  },

  getFacultyById: async (id: string) => {
    return apiRequest<any>(`/admin/faculty/${id}`);
  },

  // FDP Attended
  getFDPAttended: async () => {
    return apiRequest<any[]>('/admin/fdp/attended');
  },

  updateFDPAttendedStatus: async (id: string, status: 'pending' | 'approved' | 'rejected') => {
    return apiRequest<any>(`/admin/fdp/attended/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // FDP Organized
  getFDPOrganized: async () => {
    return apiRequest<any[]>('/admin/fdp/organized');
  },

  updateFDPOrganizedStatus: async (id: string, status: 'pending' | 'approved' | 'rejected') => {
    return apiRequest<any>(`/admin/fdp/organized/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Seminars
  getSeminars: async () => {
    return apiRequest<any[]>('/admin/seminars');
  },

  updateSeminarStatus: async (id: string, status: 'pending' | 'approved' | 'rejected') => {
    return apiRequest<any>(`/admin/seminars/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // ABL
  getABL: async () => {
    return apiRequest<any[]>('/admin/abl');
  },

  updateABLStatus: async (id: string, status: 'approved' | 'rejected') => {
    return apiRequest<any>(`/admin/abl/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Joint Teaching
  getJointTeaching: async () => {
    return apiRequest<any[]>('/admin/joint-teaching');
  },

  // Adjunct Faculty
  getAdjunctFaculty: async () => {
    return apiRequest<any[]>('/admin/adjunct');
  },

  updateAdjunctFacultyStatus: async (id: string, status: 'pending' | 'approved' | 'rejected') => {
    return apiRequest<any>(`/admin/adjunct/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Events
  getEvents: async () => {
    return apiRequest<any[]>('/admin/events');
  },

  createEvent: async (data: {
    title: string;
    type: 'FDP' | 'Seminar' | 'Workshop' | 'Conference';
    date: string;
    venue: string;
    description?: string;
    registrationLink?: string;
  }) => {
    return apiRequest<any>('/admin/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateEvent: async (id: string, data: any) => {
    return apiRequest<any>(`/admin/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteEvent: async (id: string) => {
    return apiRequest<{ message: string }>(`/admin/events/${id}`, {
      method: 'DELETE',
    });
  },

  // Notifications
  getNotifications: async () => {
    return apiRequest<any[]>('/admin/notifications');
  },

  createNotification: async (data: {
    recipientId: string;
    message: string;
    type?: 'info' | 'success' | 'warning';
  }) => {
    return apiRequest<any>('/admin/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteNotification: async (id: string) => {
    return apiRequest<{ message: string }>(`/admin/notifications/${id}`, {
      method: 'DELETE',
    });
  },

  markAllNotificationsRead: async () => {
    return apiRequest<{ message: string }>('/admin/notifications/read-all', {
      method: 'PUT',
    });
  },

  markNotificationRead: async (id: string) => {
    return apiRequest<any>(`/admin/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  // Settings & Profile
  getSettings: async () => {
    return apiRequest<any>('/admin/settings');
  },

  updateSettings: async (data: any) => {
    return apiRequest<any>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateProfile: async (data: { name: string; email: string }) => {
    return apiRequest<any>('/admin/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Dashboard
  getDashboard: async () => {
    return apiRequest<{ stats: any }>('/admin/dashboard');
  },

  // Reimbursements
  getReimbursements: async () => {
    return apiRequest<any[]>('/admin/reimbursements');
  },

  updateReimbursementStatus: async (id: string, status: string, reviewComments?: string) => {
    return apiRequest<any>(`/admin/reimbursements/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, reviewComments }),
    });
  },

  // Achievements
  getAchievements: async () => {
    return apiRequest<any[]>('/admin/achievements');
  },

  verifyAchievement: async (id: string, status: 'pending' | 'verified' | 'rejected') => {
    return apiRequest<any>(`/admin/achievements/${id}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Internships
  getInternships: async () => {
    return apiRequest<any[]>('/admin/internships');
  },

  updateInternshipStatus: async (id: string, status: 'approved' | 'rejected') => {
    return apiRequest<any>(`/admin/internships/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
};

// ========== HOD API ==========
export const hodAPI = {
  getFaculty: async () => {
    return apiRequest<any[]>('/hod/faculty');
  },

  getFacultyById: async (id: string) => {
    return apiRequest<any>(`/hod/faculty/${id}`);
  },

  getRecords: async () => {
    return apiRequest<{
      fdpAttended: any[];
      fdpOrganized: any[];
      seminars: any[];
      abl: any[];
      jointTeaching: any[];
      adjunct: any[];
    }>('/hod/records');
  },

  getAnalytics: async () => {
    return apiRequest<{
      overview: any;
      monthlyFDPs: any[];
      topFaculty: any[];
    }>('/hod/analytics');
  },

  getNotifications: async () => {
    return apiRequest<any[]>('/hod/notifications');
  },

  markNotificationRead: async (id: string) => {
    return apiRequest<any>(`/hod/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  getDashboard: async () => {
    return apiRequest<{ stats: any }>('/hod/dashboard');
  },
};

// ========== Events API (Public) ==========
export const eventsAPI = {
  getUpcomingEvents: async () => {
    return apiRequest<any[]>('/events');
  },

  getAllEvents: async () => {
    return apiRequest<any[]>('/events/all');
  },

  getEventById: async (id: string) => {
    return apiRequest<any>(`/events/${id}`);
  },
};

// ========== Audit API ==========
export const auditAPI = {
  getAuditData: async (params?: {
    startDate?: string;
    endDate?: string;
    department?: string;
    facultyId?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.department) queryParams.append('department', params.department);
    if (params?.facultyId) queryParams.append('facultyId', params.facultyId);

    const url = `/audit/data${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return apiRequest<any>(url);
  },

  getAuditStats: async (params?: {
    startDate?: string;
    endDate?: string;
    department?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.department) queryParams.append('department', params.department);

    const url = `/audit/stats${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return apiRequest<any>(url);
  },
};
