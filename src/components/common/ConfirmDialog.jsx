import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Typography from '@mui/material/Typography';

// variant: 'simple' | 'consequential' | 'destructive'
// destructive requires reason >= 10 chars
export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  variant = 'simple',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
}) => {
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');

  const icons = {
    simple: <HelpOutlineIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
    consequential: <WarningAmberIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
    destructive: <ErrorOutlineIcon sx={{ fontSize: 40, color: 'error.main' }} />,
  };

  const colors = {
    simple: 'primary',
    consequential: 'warning',
    destructive: 'error',
  };

  const handleConfirm = () => {
    if (variant === 'destructive') {
      if (reason.length < 10) {
        setReasonError('Reason must be at least 10 characters');
        return;
      }
    }
    onConfirm(reason || undefined);
    setReason('');
    setReasonError('');
  };

  const handleClose = () => {
    setReason('');
    setReasonError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogContent sx={{ pt: 3, pb: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 1.5 }}>
          {icons[variant]}
          <Typography variant="h2">{title}</Typography>
          <DialogContentText>{message}</DialogContentText>
        </Box>
        {variant === 'destructive' && (
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for return / rejection"
            placeholder="Provide a reason (minimum 10 characters)..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (reasonError) setReasonError('');
            }}
            error={!!reasonError}
            helperText={reasonError || `${reason.length} characters`}
            sx={{ mt: 2 }}
          />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={colors[variant]}
          disabled={loading || (variant === 'destructive' && reason.length < 10)}
        >
          {loading ? 'Processing...' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
