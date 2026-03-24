import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useNavigate } from 'react-router-dom';

export const ReturnedItemsBanner = ({ items = [] }) => {
  const navigate = useNavigate();

  if (!items.length) return null;

  return (
    <Box
      sx={{
        bgcolor: '#FEF2F2',
        border: '1px solid #FECACA',
        borderRadius: 2,
        p: 2.5,
        mb: 3,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <WarningAmberIcon sx={{ color: '#DC2626' }} />
        <Typography variant="h5" sx={{ color: '#DC2626' }}>
          {items.length} item{items.length > 1 ? 's' : ''} returned for revision
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {items.slice(0, 5).map((item) => (
          <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#991B1B', flex: 1 }} noWrap>
              {item.topic}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => navigate(`/agenda/${item.id}/edit`)}
              sx={{ flexShrink: 0, minWidth: 120 }}
            >
              Review &amp; Resubmit
            </Button>
          </Box>
        ))}
        {items.length > 5 && (
          <Typography variant="caption" color="error">
            +{items.length - 5} more items
          </Typography>
        )}
      </Box>
    </Box>
  );
};
