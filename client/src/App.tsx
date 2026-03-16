import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardLayout } from "./components/DashboardLayout";
const Login = lazy(() => import("./pages/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const FacultyDashboard = lazy(() => import("./pages/FacultyDashboard"));
const FacultyFDPs = lazy(() => import("./pages/FacultyFDPs"));
const FacultyFDPAttended = lazy(() => import("./pages/FacultyFDPAttended"));
const FacultyFDPOrganized = lazy(() => import("./pages/FacultyFDPOrganized"));
const FacultyABL = lazy(() => import("./pages/FacultyABL"));
const FacultyAdjunctFaculty = lazy(() => import("./pages/FacultyAdjunctFaculty"));
const FacultyJointTeaching = lazy(() => import("./pages/FacultyJointTeaching"));
const FacultySeminars = lazy(() => import("./pages/FacultySeminars"));
const FacultyEvents = lazy(() => import("./pages/FacultyEvents"));
const FacultyNotifications = lazy(() => import("./pages/FacultyNotifications"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminFaculty = lazy(() => import("./pages/AdminFaculty"));
const AdminFDPAttended = lazy(() => import("./pages/AdminFDPAttended"));
const AdminFDPOrganized = lazy(() => import("./pages/AdminFDPOrganized"));
const AdminSeminars = lazy(() => import("./pages/AdminSeminars"));
const AdminABL = lazy(() => import("./pages/AdminABL"));
const AdminAdjunctFaculty = lazy(() => import("./pages/AdminAdjunctFaculty"));
const AdminJointTeaching = lazy(() => import("./pages/AdminJointTeaching"));
const AdminNotifications = lazy(() => import("./pages/AdminNotifications"));
const AdminControl = lazy(() => import("./pages/AdminControl"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const HODDashboard = lazy(() => import("./pages/HODDashboard"));
const HODFaculty = lazy(() => import("./pages/HODFaculty"));
const HODAnalytics = lazy(() => import("./pages/HODAnalytics"));
const HODRecords = lazy(() => import("./pages/HODRecords"));
const HODNotifications = lazy(() => import("./pages/HODNotifications"));
const FacultyFDPReimbursement = lazy(() => import("./pages/FacultyFDPReimbursement"));
const FacultyAchievements = lazy(() => import("./pages/FacultyAchievements"));
const FacultyInternships = lazy(() => import("./pages/FacultyInternships"));
const AdminReimbursements = lazy(() => import("./pages/AdminReimbursements"));
const AdminAchievements = lazy(() => import("./pages/AdminAchievements"));
const AdminInternships = lazy(() => import("./pages/AdminInternships"));
const AuditReports = lazy(() => import("./pages/AuditReports"));
const FacultyFiltration = lazy(() => import("./pages/FacultyFiltration"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route element={<DashboardLayout />}>
                <Route
                  path="/faculty"
                  element={
                    <ProtectedRoute allowedRoles={['faculty']}>
                      <FacultyDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/faculty/fdps"
                  element={
                    <ProtectedRoute allowedRoles={['faculty']}>
                      <FacultyFDPs />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/faculty/fdp/attended"
                  element={
                    <ProtectedRoute allowedRoles={['faculty']}>
                      <FacultyFDPAttended />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/faculty/fdp/organized"
                  element={
                    <ProtectedRoute allowedRoles={['faculty']}>
                      <FacultyFDPOrganized />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/faculty/abl"
                  element={
                    <ProtectedRoute allowedRoles={['faculty']}>
                      <FacultyABL />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/faculty/adjunct"
                  element={
                    <ProtectedRoute allowedRoles={['faculty']}>
                      <FacultyAdjunctFaculty />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/faculty/joint-teaching"
                  element={
                    <ProtectedRoute allowedRoles={['faculty']}>
                      <FacultyJointTeaching />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/faculty/seminars"
                  element={
                    <ProtectedRoute allowedRoles={['faculty']}>
                      <FacultySeminars />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/faculty/events"
                  element={
                    <ProtectedRoute allowedRoles={['faculty']}>
                      <FacultyEvents />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/faculty/notifications"
                  element={
                    <ProtectedRoute allowedRoles={['faculty']}>
                      <FacultyNotifications />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/faculty/reimbursements"
                  element={
                    <ProtectedRoute allowedRoles={['faculty']}>
                      <FacultyFDPReimbursement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/faculty/achievements"
                  element={
                    <ProtectedRoute allowedRoles={['faculty']}>
                      <FacultyAchievements />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/faculty/internships"
                  element={
                    <ProtectedRoute allowedRoles={['faculty']}>
                      <FacultyInternships />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/faculty"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminFaculty />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/fdp/attended"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminFDPAttended />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/fdp/organized"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminFDPOrganized />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/seminars"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminSeminars />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/abl"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminABL />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/adjunct"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminAdjunctFaculty />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/joint-teaching"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminJointTeaching />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/notifications"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminNotifications />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/control"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminControl />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/settings"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminSettings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/reimbursements"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminReimbursements />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/achievements"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminAchievements />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/internships"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminInternships />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/audit"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AuditReports />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/faculty-filtration"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <FacultyFiltration />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hod"
                  element={
                    <ProtectedRoute allowedRoles={['hod']}>
                      <HODDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hod/faculty"
                  element={
                    <ProtectedRoute allowedRoles={['hod']}>
                      <HODFaculty />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hod/analytics"
                  element={
                    <ProtectedRoute allowedRoles={['hod']}>
                      <HODAnalytics />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hod/records"
                  element={
                    <ProtectedRoute allowedRoles={['hod']}>
                      <HODRecords />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hod/notifications"
                  element={
                    <ProtectedRoute allowedRoles={['hod']}>
                      <HODNotifications />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hod/audit"
                  element={
                    <ProtectedRoute allowedRoles={['hod']}>
                      <AuditReports />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hod/faculty-filtration"
                  element={
                    <ProtectedRoute allowedRoles={['hod']}>
                      <FacultyFiltration />
                    </ProtectedRoute>
                  }
                />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
