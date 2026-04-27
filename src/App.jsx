import { Routes, Route, Navigate } from 'react-router-dom';
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

// Wings
import { WingMarketplacePage } from './pages/wings/WingMarketplacePage.jsx';

// Reports
import { ReportsPage } from './pages/reports/ReportsPage.jsx';

function App() {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes - all wrapped in AppShell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardRouter />} />

        {/* Meetings */}
        <Route path="meetings" element={<MeetingListPage />} />
        <Route path="meetings/:id" element={<MeetingDetailPage />} />
        <Route path="calendar" element={<CalendarPage />} />

        {/* Agenda */}
        <Route path="agenda" element={<AgendaManagementPage />} />
        <Route path="agenda/create" element={<CreateAgendaPage />} />
        <Route path="agenda/:id" element={<AgendaDetailPage />} />
        <Route path="agenda/:id/edit" element={<CreateAgendaPage />} />
        <Route path="approvals" element={<AgendaApprovalPage />} />
        <Route path="consolidation" element={<ConsolidationPage />} />

        {/* Sitting */}
        <Route path="sitting/:meetingId" element={<SittingPage />} />

        {/* Wing Marketplace */}
        <Route path="my-wings" element={<WingMarketplacePage />} />

        {/* Admin — /webadmin/* avoids conflict with Django's /admin/ path */}
        <Route
          path="webadmin/users"
          element={
            <ProtectedRoute requiredPermission="user_manager">
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="webadmin/wings"
          element={
            <ProtectedRoute requiredPermission="config_manager">
              <WingConfigPage />
            </ProtectedRoute>
          }
        />
        <Route path="webadmin/audit" element={<AuditLogPage />} />

        {/* Reports */}
        <Route path="reports" element={<ReportsPage />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* Root redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
