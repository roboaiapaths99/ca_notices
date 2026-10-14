import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import ClientList from './pages/Clients/ClientList';
import NoticeInbox from './pages/Notices/NoticeInbox';
import NoticeDetail from './pages/Notices/NoticeDetail';
import ResponseStudio from './pages/Responses/ResponseStudio';
import DocumentVault from './pages/Documents/DocumentVault';

import AuditLogs from './pages/Admin/AuditLogs';
import MfaSetup from './pages/Settings/MfaSetup';
import OrgSettings from './pages/Admin/OrgSettings';
import TemplateManagement from './pages/Admin/TemplateManagement';
import Reports from './pages/Reports/Reports';
import NoticeCalendar from './pages/Notices/NoticeCalendar';
import AlertSettings from './pages/Settings/AlertSettings';
import ScanUpload from './pages/Notices/ScanUpload';
import DocumentRequests from './pages/Portal/DocumentRequests';
import ClientUploadPage from './pages/Portal/ClientUploadPage';
import DataSync from './pages/Tools/DataSync';
import PortalSync from './pages/Tools/PortalSync';
import { ClientAuthProvider } from './auth/ClientAuthContext';
import ClientPortalLayout from './layouts/ClientPortalLayout';
import ClientLogin from './pages/ClientPortal/ClientLogin';
import ClientDashboard from './pages/ClientPortal/ClientDashboard';
import ClientNoticeDetails from './pages/ClientPortal/ClientNoticeDetails';
import './styles/theme.css';

const UserManagement = lazy(() => import('./pages/Admin/UserManagement'));
const ForensicLogs = lazy(() => import('./pages/Admin/ForensicLogs'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Placeholder pages for future phases
const PlaceholderPage = ({ title }) => (
  <div>
    <div className="page-header"><h1>{title}</h1></div>
    <div className="card">
      <div className="empty-state">
        <h3>Coming Soon</h3>
        <p>This feature is being built.</p>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ClientAuthProvider>
          <BrowserRouter>
            <Suspense fallback={<div className="page-loading"><div className="spinner-lg" /></div>}>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />

                {/* Protected routes with layout */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <AppLayout><Dashboard /></AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/clients" element={
                  <ProtectedRoute>
                    <AppLayout><ClientList /></AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/notices" element={
                  <ProtectedRoute>
                    <AppLayout><NoticeInbox /></AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/notices/calendar" element={
                  <ProtectedRoute>
                    <AppLayout><NoticeCalendar /></AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/settings/alerts" element={
                  <ProtectedRoute>
                    <AppLayout><AlertSettings /></AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/notices/scan" element={
                  <ProtectedRoute>
                    <AppLayout><ScanUpload /></AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/document-requests" element={
                  <ProtectedRoute>
                    <AppLayout><DocumentRequests /></AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/notices/:id" element={
                  <ProtectedRoute>
                    <AppLayout><NoticeDetail /></AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/responses" element={
                  <ProtectedRoute>
                    <AppLayout><ResponseStudio /></AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/documents" element={
                  <ProtectedRoute>
                    <AppLayout><DocumentVault /></AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/reports" element={
                  <ProtectedRoute roles={['Partner', 'TenantAdmin', 'SuperAdmin']}>
                    <AppLayout><Reports /></AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/admin/users" element={
                  <ProtectedRoute roles={['TenantAdmin', 'SuperAdmin']}>
                    <AppLayout><UserManagement /></AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/admin/audit-logs" element={
                  <ProtectedRoute roles={['TenantAdmin', 'SuperAdmin']}>
                    <AppLayout><AuditLogs /></AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/admin/forensic-logs" element={
                  <ProtectedRoute roles={['TenantAdmin', 'SuperAdmin']}>
                    <AppLayout><ForensicLogs /></AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/settings/mfa" element={
                  <ProtectedRoute>
                    <AppLayout><MfaSetup /></AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/admin/templates" element={
                  <ProtectedRoute roles={['TenantAdmin', 'SuperAdmin']}>
                    <AppLayout><TemplateManagement /></AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/admin/settings" element={
                  <ProtectedRoute roles={['TenantAdmin', 'SuperAdmin']}>
                    <AppLayout><OrgSettings /></AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/tools/sync" element={
                  <ProtectedRoute>
                    <AppLayout><DataSync /></AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/tools/portal-sync" element={
                  <ProtectedRoute>
                    <AppLayout><PortalSync /></AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/profile" element={
                  <ProtectedRoute>
                    <AppLayout><PlaceholderPage title="My Account" /></AppLayout>
                  </ProtectedRoute>
                } />

                {/* Client Portal Routes */}
                <Route path="/portal/login" element={<ClientLogin />} />
                <Route path="/portal" element={<ClientPortalLayout />}>
                  <Route path="dashboard" element={<ClientDashboard />} />
                  <Route path="notices/:id" element={<ClientNoticeDetails />} />
                </Route>

                {/* Public Portal Route (NO client login required - for anonymous uploads) */}
                <Route path="/portal/:token" element={<ClientUploadPage />} />

                {/* Default redirect */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ClientAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
