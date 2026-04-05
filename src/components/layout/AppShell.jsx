import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { Sidebar } from './Sidebar.jsx';
import { TopBar } from './TopBar.jsx';
import { ErrorBoundary } from './ErrorBoundary.jsx';
import { selectToasts, dismissToast } from '../../store/uiSlice.js';

export const AppShell = () => {
  const dispatch = useDispatch();
  const toasts = useSelector(selectToasts);
  const currentToast = toasts[0];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box
        sx={{
          flex: 1,
          marginLeft: '240px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <TopBar />
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
