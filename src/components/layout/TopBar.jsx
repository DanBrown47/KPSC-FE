import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import { useLocation } from 'react-router-dom';
import { NotificationBell } from '../common/NotificationBell.jsx';
import { useAuth } from '../../hooks/useAuth.js';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/meetings': 'Meetings',
  '/calendar': 'Calendar',
  '/agenda': 'Agenda Items',
  '/agenda/create': 'Create Agenda Item',
  '/approvals': 'Approvals',
  '/consolidation': 'Consolidation',
  '/reports': 'Reports',
  '/admin/users': 'User Management',
  '/admin/wings': 'Wing Configuration',
  '/admin/audit': 'Audit Log',
};

const getInitials = (user) => {
  if (!user) return 'U';
  // UserProfileSerializer: first_name/last_name are nested under user.user
  const first = user.user?.first_name?.[0] || user.full_name?.[0] || '';
  const last = user.user?.last_name?.[0] || user.full_name?.split(' ')?.[1]?.[0] || '';
  return (first + last).toUpperCase() || user.username?.[0]?.toUpperCase() || 'U';
};

export const TopBar = () => {
  const location = useLocation();
  const { currentUser } = useAuth();

  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    location.pathname === path || location.pathname.startsWith(path + '/')
  )?.[1] || 'KPSC';

  return (
    <AppBar
      position="fixed"
      sx={{
        left: 240,
        width: 'calc(100% - 240px)',
        zIndex: 1100,
      }}
    >
      <Toolbar sx={{ minHeight: 64 }}>
        <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.85)', flex: 1, fontWeight: 500 }}>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationBell />
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: '#F0B429',
              color: '#0F1F3D',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            {getInitials(currentUser)}
          </Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
