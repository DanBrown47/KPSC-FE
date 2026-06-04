import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import UndoIcon from '@mui/icons-material/Undo';
import { format } from 'date-fns';

const ACTION_ICONS = {
  APPROVED: { Icon: CheckCircleIcon, color: '#059669' },
  REJECTED: { Icon: CancelIcon, color: '#DC2626' },
  RETURNED: { Icon: UndoIcon, color: '#D97706' },
  SUBMITTED: { Icon: CheckCircleIcon, color: '#1D4ED8' },
  DEFAULT: { Icon: CheckCircleIcon, color: '#6B7280' },
};

const LEVEL_LABELS = {
  1: 'Wing Approval',
  2: 'R&A Consolidation',
};

export const ApprovalHistory = ({ history = [] }) => {
  if (!history.length) return null;

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Timeline line */}
      <Box sx={{ position: 'absolute', left: 11, top: 0, bottom: 0, width: 2, bgcolor: '#E2E8F0' }} />

      {history.map((entry, i) => {
        const actionConfig = ACTION_ICONS[entry.action] || ACTION_ICONS.DEFAULT;
        const { Icon, color } = actionConfig;

        return (
          <Box key={i} sx={{ position: 'relative', pl: 4, pb: i < history.length - 1 ? 2.5 : 0 }}>
            {/* Dot */}
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                top: 2,
                width: 24,
                height: 24,
                borderRadius: '50%',
                bgcolor: 'background.paper',
                border: `2px solid ${color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
              }}
            >
              <Icon sx={{ fontSize: 14, color }} />
            </Box>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                <Typography variant="body2" fontWeight={600}>
                  {entry.approved_by_name || 'Unknown'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {entry.action?.replace(/_/g, ' ').toLowerCase()}
                </Typography>
                {entry.approval_level && (
                  <Typography variant="caption" sx={{ color: '#6B7280', bgcolor: '#F3F4F6', px: 0.75, py: 0.25, borderRadius: 0.5 }}>
                    {LEVEL_LABELS[entry.approval_level] || `Level ${entry.approval_level}`}
                  </Typography>
                )}
              </Box>
              <Typography variant="caption" color="text.disabled">
                {entry.actioned_at ? format(new Date(entry.actioned_at), 'dd MMM yyyy HH:mm') : '—'}
              </Typography>
              {entry.comments && (
                <Box sx={{ mt: 0.75, p: 1.5, bgcolor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ color: '#78350F' }}>{entry.comments}</Typography>
                </Box>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};
