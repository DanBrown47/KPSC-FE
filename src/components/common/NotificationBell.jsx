import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Popover from '@mui/material/Popover';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import GavelIcon from '@mui/icons-material/Gavel';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../../hooks/useNotifications.js';
import { useMarkAllReadMutation } from '../../store/api/notificationsApi.js';

const NOTIFICATION_ICONS = {
  AGENDA_SUBMITTED: AssignmentIcon,
  AGENDA_APPROVED: CheckCircleIcon,
  AGENDA_RETURNED: WarningIcon,
  MEETING_SCHEDULED: GavelIcon,
  MEETING_FINALIZED: GavelIcon,
  VOTE_CAST: GavelIcon,
  DEFAULT: InfoIcon,
};

const getNotificationPath = (notification) => {
  const { notification_type, related_object_id } = notification;
  if (notification_type?.includes('AGENDA') && related_object_id) {
    return `/agenda/${related_object_id}`;
  }
  if (notification_type?.includes('MEETING') && related_object_id) {
    return `/meetings/${related_object_id}`;
  }
  return '/dashboard';
};

export const NotificationBell = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, markRead } = useNotifications();
  const [markAllRead] = useMarkAllReadMutation();

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markRead(notification.id);
    }
    handleClose();
    navigate(getNotificationPath(notification));
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen} size="large">
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 380, maxHeight: 500, overflow: 'hidden', display: 'flex', flexDirection: 'column' } }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0' }}>
          <Typography variant="h5">Notifications</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={() => markAllRead()}>
              Mark all read
            </Button>
          )}
        </Box>
        <Box sx={{ overflowY: 'auto', flex: 1 }}>
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          {!isLoading && notifications.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No notifications
              </Typography>
            </Box>
          )}
          <List disablePadding>
            {notifications.map((notification, i) => {
              const Icon = NOTIFICATION_ICONS[notification.notification_type] || NOTIFICATION_ICONS.DEFAULT;
              return (
                <Box key={notification.id}>
                  <ListItem
                    button
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      bgcolor: notification.is_read ? 'transparent' : '#EFF6FF',
                      '&:hover': { bgcolor: '#F8FAFC' },
                      alignItems: 'flex-start',
                      py: 1.5,
                    }}
                  >
                    <ListItemIcon sx={{ mt: 0.5, minWidth: 36 }}>
                      <Icon sx={{ fontSize: 20, color: notification.is_read ? 'text.disabled' : 'primary.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={notification.is_read ? 400 : 600}>
                          {notification.title || notification.message}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {notification.created_at
                            ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })
                            : ''}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {i < notifications.length - 1 && <Divider />}
                </Box>
              );
            })}
          </List>
        </Box>
      </Popover>
    </>
  );
};
