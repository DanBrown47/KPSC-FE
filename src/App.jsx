import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell.jsx';
import { ProtectedRoute } from './components/layout/ProtectedRoute.jsx';

// Auth
import { LoginPage } from './pages/auth/LoginPage.jsx';

// Dashboards
import { DashboardRouter } from './pages/dashboard/DashboardRouter.jsx';

// Meetings
import { MeetingListPage } from './pages/meetings/MeetingListPage.jsx';
import { MeetingDetailPage } from './pages/meetings/MeetingDetailPage.jsx';
import { CalendarPage } from './pages/meetings/CalendarPage.jsx';

// Agenda
import { AgendaManagementPage } from './pages/agenda/AgendaManagementPage.jsx';
import { CreateAgendaPage } from './pages/agenda/CreateAgendaPage.jsx';
import { AgendaDetailPage } from './pages/agenda/AgendaDetailPage.jsx';
import { AgendaApprovalPage } from './pages/agenda/AgendaApprovalPage.jsx';
import { ConsolidationPage } from './pages/agenda/ConsolidationPage.jsx';

// Sitting
import { SittingPage } from './pages/sitting/SittingPage.jsx';

// Admin
import { UserManagementPage } from './pages/admin/UserManagementPage.jsx';
import { WingConfigPage } from './pages/admin/WingConfigPage.jsx';
import { AuditLogPage } from './pages/admin/AuditLogPage.jsx';
import { AgendaFormsPage } from './pages/admin/AgendaFormsPage.jsx';

// Wings
import { WingMarketplacePage } from './pages/wings/WingMarketplacePage.jsx';

// Reports
import { ReportsPage } from './pages/reports/ReportsPage.jsx';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardRouter /> },

      // Meetings
      { path: 'meetings', element: <MeetingListPage /> },
      { path: 'meetings/:id', element: <MeetingDetailPage /> },
      { path: 'calendar', element: <CalendarPage /> },

      // Agenda
      { path: 'agenda', element: <AgendaManagementPage /> },
      { path: 'agenda/create', element: <CreateAgendaPage /> },
      { path: 'agenda/:id', element: <AgendaDetailPage /> },
      { path: 'agenda/:id/edit', element: <CreateAgendaPage /> },
      { path: 'approvals', element: <AgendaApprovalPage /> },
      { path: 'consolidation', element: <ConsolidationPage /> },

      // Sitting
      { path: 'sitting/:meetingId', element: <SittingPage /> },

      // Wing Marketplace
      { path: 'my-wings', element: <WingMarketplacePage /> },

      // Admin
      {
        path: 'webadmin/users',
        element: (
          <ProtectedRoute requiredPermission="user_manager">
            <UserManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'webadmin/wings',
        element: (
          <ProtectedRoute requiredPermission="config_manager">
            <WingConfigPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'webadmin/audit',
        element: (
          <ProtectedRoute requiredPermission="audit_viewer">
            <AuditLogPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'webadmin/agenda-forms',
        element: (
          <ProtectedRoute requiredPermission="config_manager">
            <AgendaFormsPage />
          </ProtectedRoute>
        ),
      },

      // Reports
      { path: 'reports', element: <ReportsPage /> },

      // Catch-all
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
