import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { Sidebar } from './Sidebar.jsx';
import { TopBar } from './TopBar.jsx';
import { ErrorBoundary } from './ErrorBoundary.jsx';
import { selectToasts, dismissToast } from '../../store/uiSlice.js';

const SIDEBAR_EXPANDED = 240;
const SIDEBAR_COLLAPSED = 64;

export const AppShell = () => {
  const dispatch = useDispatch();
  const toasts = useSelector(selectToasts);
  const currentToast = toasts[0];
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const sidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed((v) => !v)} />
      <Box
        sx={{
          flex: 1,
          marginLeft: `${sidebarWidth}px`,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          transition: 'margin-left 0.2s ease',
        }}
      >
        <TopBar sidebarWidth={sidebarWidth} />
        <Box
          component="main"
          sx={{
            flex: 1,
            mt: '64px',
            p: 3,
            maxWidth: 1440,
            width: '100%',
            overflowY: 'auto',
          }}
        >
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </Box>
      </Box>

      {/* Global Toast Snackbar - single snackbar driven by queue */}
      {currentToast && (
        <Snackbar
          key={currentToast.id}
          open={true}
          autoHideDuration={currentToast.duration || 4000}
          onClose={() => dispatch(dismissToast(currentToast.id))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity={currentToast.severity}
            onClose={() => dispatch(dismissToast(currentToast.id))}
            variant="filled"
            sx={{ minWidth: 300 }}
          >
            {currentToast.message}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
};
