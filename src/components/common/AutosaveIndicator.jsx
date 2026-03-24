import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import SaveIcon from '@mui/icons-material/Save';
import { format } from 'date-fns';

export const AutosaveIndicator = ({ saveStatus, lastSaved }) => {
  const states = {
    saving: {
      icon: <CircularProgress size={14} sx={{ color: '#6B7280' }} />,
      text: 'Saving...',
      color: '#6B7280',
    },
    saved: {
      icon: <CheckCircleIcon sx={{ fontSize: 14, color: '#059669' }} />,
      text: `Saved${lastSaved ? ` at ${format(lastSaved, 'HH:mm')}` : ''}`,
      color: '#059669',
    },
    error: {
      icon: <ErrorIcon sx={{ fontSize: 14, color: '#DC2626' }} />,
      text: 'Save failed',
      color: '#DC2626',
    },
    idle: {
      icon: <SaveIcon sx={{ fontSize: 14, color: '#CBD5E1' }} />,
      text: lastSaved ? `Last saved ${format(lastSaved, 'HH:mm')}` : 'Auto-save enabled',
      color: '#94A3B8',
    },
  };

  const state = states[saveStatus] || states.idle;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        position: 'sticky',
        bottom: 16,
        float: 'right',
        bgcolor: 'background.paper',
        border: '1px solid #E2E8F0',
        borderRadius: 2,
        px: 1.5,
        py: 0.75,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      {state.icon}
      <Typography variant="caption" sx={{ color: state.color }}>
        {state.text}
      </Typography>
    </Box>
  );
};
