import Chip from '@mui/material/Chip';
import { STATUS_CONFIG, VOTE_CONFIG } from '../../utils/statusConfig.js';

export const StatusChip = ({ status, size = 'small', sx = {} }) => {
  const config = STATUS_CONFIG[status] || VOTE_CONFIG[status];
  if (!config) return null;

  return (
    <Chip
      label={config.label}
      size={size}
      sx={{
        backgroundColor: config.bgColor,
        color: config.color,
        fontWeight: 600,
        fontSize: size === 'small' ? '0.6875rem' : '0.75rem',
        height: size === 'small' ? 22 : 26,
        borderRadius: '4px',
        border: `1px solid ${config.color}22`,
        ...sx,
      }}
    />
  );
};
