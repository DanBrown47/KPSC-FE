import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventIcon from '@mui/icons-material/Event';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import MergeIcon from '@mui/icons-material/Merge';
import GavelIcon from '@mui/icons-material/Gavel';
import PeopleIcon from '@mui/icons-material/People';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import BarChartIcon from '@mui/icons-material/BarChart';
import LogoutIcon from '@mui/icons-material/Logout';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useAuth } from '../../hooks/useAuth.js';

const ALL_NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: DashboardIcon, permission: null },
  { key: 'meetings', label: 'Meetings', path: '/meetings', icon: EventIcon, permission: 'meeting_viewer' },
  { key: 'calendar', label: 'Calendar', path: '/calendar', icon: CalendarMonthIcon, permission: 'meeting_viewer' },
  { key: 'agenda', label: 'Agenda Items', path: '/agenda', icon: AssignmentIcon, permission: 'agenda_viewer' },
  { key: 'approvals', label: 'Approvals', path: '/approvals', icon: PendingActionsIcon, permission: 'approver' },
  { key: 'consolidation', label: 'Consolidation', path: '/consolidation', icon: MergeIcon, permission: 'consolidator' },
  { key: 'reports', label: 'Reports', path: '/reports', icon: BarChartIcon, permission: 'report_viewer' },
  { key: 'my_wings', label: 'My Wings', path: '/my-wings', icon: SwapHorizIcon, permission: 'wing_switcher' },
  { divider: true },
  { key: 'admin_users', label: 'User Management', path: '/webadmin/users', icon: PeopleIcon, permission: 'user_manager' },
  { key: 'admin_wings', label: 'Wing Config', path: '/webadmin/wings', icon: AccountTreeIcon, permission: 'config_manager' },
  { key: 'admin_audit', label: 'Audit Log', path: '/webadmin/audit', icon: ManageSearchIcon, permission: 'audit_viewer' },
];

export const Sidebar = ({ collapsed = false, onToggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { menuPermissions, handleLogout, currentUser } = useAuth();

  const visibleItems = ALL_NAV_ITEMS.filter((item) => {
    if (item.divider) return true;
    if (!item.permission) return true;
    if (!menuPermissions) return false;
    return menuPermissions[item.permission] === true;
  });

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const width = collapsed ? 64 : 240;

  return (
    <Box
      sx={{
        width,
        flexShrink: 0,
        bgcolor: '#0F1F3D',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 1200,
        transition: 'width 0.2s ease',
      }}
    >
      {/* Logo/Brand */}
      <Box
        sx={{
          px: collapsed ? 1 : 2.5,
          py: 2.5,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          minHeight: 64,
        }}
      >
        {!collapsed && (
          <Box>
            <Typography
              variant="h6"
              sx={{ color: '#F0B429', fontWeight: 700, fontSize: '0.9375rem', lineHeight: 1.3 }}
            >
              KPSC
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6875rem' }}>
              Meeting Management System
            </Typography>
          </Box>
        )}
        <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="right">
          <IconButton
            onClick={onToggleCollapse}
            size="small"
            sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: '#F0B429' } }}
          >
            {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* User info */}
      {currentUser && !collapsed && (
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
            {currentUser.full_name || currentUser.username}
          </Typography>
          <Typography
            variant="caption"
            sx={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '0.6875rem', mt: 0.25 }}
          >
            {currentUser.global_role?.replace(/_/g, ' ')}
          </Typography>
          {currentUser.active_wing_name && (
            <Typography
              variant="caption"
              sx={{ display: 'block', color: '#F0B429', fontSize: '0.6875rem', mt: 0.25, fontWeight: 600 }}
            >
              {currentUser.active_wing_code} Wing
            </Typography>
          )}
        </Box>
      )}

      {/* Nav items */}
      <List sx={{ flex: 1, px: collapsed ? 0.5 : 1.5, py: 1 }}>
        {visibleItems.map((item, i) => {
          if (item.divider) {
            return <Divider key={`divider-${i}`} sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 1 }} />;
          }
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Tooltip key={item.key} title={collapsed ? item.label : ''} placement="right">
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={active}
                sx={{
                  borderRadius: 1.5,
                  minHeight: 48,
                  mb: 0.5,
                  px: collapsed ? 1.5 : 1.5,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderLeft: active ? '3px solid #F0B429' : '3px solid transparent',
                  bgcolor: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.07)' },
                  '&.Mui-selected': {
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: collapsed ? 'unset' : 36,
                    color: active ? '#F0B429' : 'rgba(255,255,255,0.6)',
                  }}
                >
                  <Icon fontSize="small" />
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: active ? 600 : 400,
                      color: active ? '#FFFFFF' : 'rgba(255,255,255,0.75)',
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>

      {/* Logout */}
      <Box sx={{ px: collapsed ? 0.5 : 1.5, pb: 2, borderTop: '1px solid rgba(255,255,255,0.08)', pt: 1 }}>
        <Tooltip title={collapsed ? 'Logout' : ''} placement="right">
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 1.5,
              minHeight: 48,
              px: 1.5,
              justifyContent: collapsed ? 'center' : 'flex-start',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.07)' },
            }}
          >
            <ListItemIcon sx={{ minWidth: collapsed ? 'unset' : 36, color: 'rgba(255,255,255,0.5)' }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}
              />
            )}
          </ListItemButton>
        </Tooltip>
      </Box>
    </Box>
  );
};
