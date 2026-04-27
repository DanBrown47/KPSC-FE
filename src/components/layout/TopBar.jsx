import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import CheckIcon from '@mui/icons-material/Check';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { NotificationBell } from '../common/NotificationBell.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { selectToken, setCredentials, deriveMenuPermissions } from '../../store/authSlice.js';
import { useSwitchWingMutation } from '../../store/api/authApi.js';
import { showToast } from '../../store/uiSlice.js';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/meetings': 'Meetings',
  '/calendar': 'Calendar',
  '/agenda': 'Agenda Items',
  '/agenda/create': 'Create Agenda Item',
  '/approvals': 'Approvals',
  '/consolidation': 'Consolidation',
  '/reports': 'Reports',
  '/my-wings': 'My Wings',
  '/webadmin/users': 'User Management',
  '/webadmin/wings': 'Wing Configuration',
  '/webadmin/audit': 'Audit Log',
};

const getInitials = (user) => {
  if (!user) return 'U';
  const first = user.user?.first_name?.[0] || user.full_name?.[0] || '';
  const last = user.user?.last_name?.[0] || user.full_name?.split(' ')?.[1]?.[0] || '';
  return (first + last).toUpperCase() || user.username?.[0]?.toUpperCase() || 'U';
};

const WingSwitcher = ({ currentUser }) => {
  const dispatch = useDispatch();
  const token = useSelector(selectToken);
  const [anchor, setAnchor] = useState(null);
  const [switchWing, { isLoading }] = useSwitchWingMutation();

  const activeWings = (currentUser?.wing_roles || []).filter((r) => r.is_active !== false);
  if (activeWings.length < 2) return null;

  const activeWingId = currentUser?.active_wing_id ?? null;
  const activeWing = activeWings.find((r) => r.wing === activeWingId);

  const handleSwitch = async (wingId) => {
    setAnchor(null);
    if (wingId === activeWingId) return;
    try {
      const updatedUser = await switchWing(wingId).unwrap();
      dispatch(setCredentials({ token, user: updatedUser, menuPermissions: deriveMenuPermissions(updatedUser) }));
      dispatch(showToast({ message: `Switched to ${updatedUser.active_wing_name}`, severity: 'success' }));
    } catch {
      dispatch(showToast({ message: 'Failed to switch wing.', severity: 'error' }));
    }
  };

  return (
    <>
      <Button
        onClick={(e) => setAnchor(e.currentTarget)}
        endIcon={isLoading ? <CircularProgress size={14} color="inherit" /> : <ExpandMoreIcon fontSize="small" />}
        startIcon={<AccountTreeIcon fontSize="small" />}
        size="small"
        sx={{
          color: 'rgba(255,255,255,0.9)',
          borderColor: 'rgba(255,255,255,0.25)',
          border: '1px solid',
          borderRadius: 1.5,
          px: 1.5,
          py: 0.5,
          textTransform: 'none',
          fontSize: '0.8125rem',
          fontWeight: 500,
          minWidth: 0,
          '&:hover': { borderColor: 'rgba(255,255,255,0.5)', bgcolor: 'rgba(255,255,255,0.07)' },
        }}
        disabled={isLoading}
      >
        {activeWing ? (activeWing.wing_name || activeWing.wing_code) : 'Select Wing'}
      </Button>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { mt: 0.5, minWidth: 220, maxHeight: 320 } } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            SWITCH WING
          </Typography>
        </Box>
        <Divider />
        {activeWings.map((wr) => {
          const isCurrent = wr.wing === activeWingId;
          return (
            <MenuItem
              key={wr.id}
              onClick={() => handleSwitch(wr.wing)}
              selected={isCurrent}
              sx={{ gap: 1, py: 1.25 }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={isCurrent ? 600 : 400}>
                  {wr.wing_name || wr.wing_code}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {wr.wing_code} · {wr.wing_role === 'AS_JS' ? 'AS/JS' : wr.wing_role === 'CA' ? 'CA' : 'Wing Member'}
                </Typography>
              </Box>
              {isCurrent && <CheckIcon fontSize="small" color="primary" />}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <WingSwitcher currentUser={currentUser} />
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
