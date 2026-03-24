import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import InboxIcon from '@mui/icons-material/Inbox';

export const EmptyState = ({
  icon: Icon = InboxIcon,
  title = 'No items found',
  description,
  action,
  actionLabel,
  onAction,
  sx = {},
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: 8,
        px: 4,
        gap: 2,
        ...sx,
      }}
    >
      <Icon sx={{ fontSize: 64, color: 'text.disabled' }} />
      <Box>
        <Typography variant="h3" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.disabled">
            {description}
          </Typography>
        )}
      </Box>
      {(action || (actionLabel && onAction)) && (
        <Box>
          {action || (
            <Button variant="contained" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};
