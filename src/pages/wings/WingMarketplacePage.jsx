import { useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, setCredentials, selectToken, selectMenuPermissions, deriveMenuPermissions } from '../../store/authSlice.js';
import { useSwitchWingMutation } from '../../store/api/authApi.js';
import { showToast } from '../../store/uiSlice.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';

const WING_ROLE_LABEL = {
  AS_JS: 'AS / JS',
  WING_MEMBER: 'Wing Member',
  CA: 'CA',
};

const PERMISSION_LABEL = {
  agenda_item_create: 'Create Agenda',
  agenda_item_view: 'View Agenda',
  agenda_item_edit: 'Edit Agenda',
  agenda_item_delete: 'Delete Agenda',
  approve_agenda_item: 'Approve Items',
  final_agenda_view: 'Final Agenda',
  finalize_other_wings_agenda: 'Finalize Other Wings',
  add_subsequent_item_to_approved_agenda: 'Add Subsequent Items',
  meeting_convener: 'Meeting Convener',
  agenda_signoff_authority: 'Agenda Sign-off',
  committee_agenda_approver: 'Committee Approver',
  wing_agenda_approver: 'Wing Approver',
  wing_head: 'Wing Head',
  user_manager: 'User Manager',
  config_manager: 'Config Manager',
};

const PERMISSION_COLOR = {
  approve_agenda_item: 'warning',
  finalize_other_wings_agenda: 'error',
  meeting_convener: 'secondary',
  agenda_signoff_authority: 'secondary',
};

function WingCard({ wingRole, isActive, onSwitch, switching }) {
  const { wing_name, wing_code, wing_role, permission_roles, wing } = wingRole;
  const name = wing_name || wing?.name || `Wing ${wingRole.wing}`;
  const code = wing_code || wing?.code || '??';
  const permissions = permission_roles || [];

  return (
    <Card
      elevation={isActive ? 4 : 1}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: isActive ? '2px solid' : '1px solid',
        borderColor: isActive ? 'primary.main' : 'divider',
        borderRadius: 2,
        transition: 'box-shadow 0.2s, border-color 0.2s',
        '&:hover': {
          boxShadow: isActive ? 6 : 3,
        },
        position: 'relative',
        overflow: 'visible',
      }}
    >
      {isActive && (
        <Box
          sx={{
            position: 'absolute',
            top: -12,
            left: 16,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            px: 1.5,
            py: 0.25,
            borderRadius: 1,
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 13 }} />
          ACTIVE WING
        </Box>
      )}

      <CardContent sx={{ flex: 1, pt: isActive ? 3 : 2 }}>
        {/* Wing identity */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: isActive ? 'primary.main' : 'grey.200',
              color: isActive ? 'primary.contrastText' : 'text.secondary',
              width: 48,
              height: 48,
              fontWeight: 700,
              fontSize: '0.9rem',
            }}
          >
            {code}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
              {name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Wing Code: {code}
            </Typography>
          </Box>
        </Box>

        {/* Wing role badge */}
        <Box sx={{ mb: 1.5 }}>
          <Chip
            label={WING_ROLE_LABEL[wing_role] || wing_role}
            size="small"
            variant="outlined"
            color={isActive ? 'primary' : 'default'}
            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
          />
        </Box>

        {/* Permissions */}
        {permissions.length > 0 && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.75, display: 'block' }}>
              PERMISSIONS
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {permissions.map((p) => (
                <Chip
                  key={p.id}
                  label={PERMISSION_LABEL[p.permission_role] || p.permission_role}
                  size="small"
                  color={PERMISSION_COLOR[p.permission_role] || 'default'}
                  variant="filled"
                  sx={{ fontSize: '0.7rem', height: 22 }}
                />
              ))}
            </Box>
          </>
        )}

        {permissions.length === 0 && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
              No specific permissions assigned
            </Typography>
          </>
        )}
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2 }}>
        {isActive ? (
          <Button
            fullWidth
            variant="contained"
            color="primary"
            disabled
            startIcon={<CheckCircleIcon />}
            size="small"
          >
            Currently Active
          </Button>
        ) : (
          <Button
            fullWidth
            variant="outlined"
            color="primary"
            startIcon={<SwapHorizIcon />}
            size="small"
            onClick={() => onSwitch(wingRole.wing)}
            disabled={switching}
          >
            Switch to this Wing
          </Button>
        )}
      </CardActions>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card elevation={1} sx={{ borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Skeleton variant="circular" width={48} height={48} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="60%" height={20} />
            <Skeleton width="40%" height={16} />
          </Box>
        </Box>
        <Skeleton width={80} height={24} />
        <Skeleton width="100%" height={1} sx={{ my: 1.5 }} />
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Skeleton width={70} height={22} />
          <Skeleton width={90} height={22} />
        </Box>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Skeleton width="100%" height={32} />
      </CardActions>
    </Card>
  );
}

export const WingMarketplacePage = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const token = useSelector(selectToken);
  const [search, setSearch] = useState('');
  const [switchWing, { isLoading: switching }] = useSwitchWingMutation();

  const allWingRoles = (currentUser?.wing_roles || []).filter((r) => r.is_active);
  const activeWingId = currentUser?.active_wing_id ?? null;

  const filtered = allWingRoles.filter((wr) => {
    const name = (wr.wing_name || '').toLowerCase();
    const code = (wr.wing_code || '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || code.includes(q);
  });

  const handleSwitch = async (wingId) => {
    try {
      const updatedUser = await switchWing(wingId).unwrap();
      const newPermissions = deriveMenuPermissions(updatedUser);
      dispatch(
        setCredentials({
          token,
          user: updatedUser,
          menuPermissions: newPermissions,
        })
      );
      dispatch(showToast({ message: `Switched to ${updatedUser.active_wing_name}`, severity: 'success' }));
    } catch {
      dispatch(showToast({ message: 'Failed to switch wing.', severity: 'error' }));
    }
  };

  return (
    <Box>
      <PageHeader
        title="My Wings"
        subtitle="Browse and switch between your assigned wings"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'My Wings' }]}
      />

      {/* Active wing banner */}
      {activeWingId && currentUser?.active_wing_name && (
        <Alert
          icon={<AccountTreeIcon />}
          severity="info"
          sx={{ mb: 3, borderRadius: 2 }}
        >
          Currently working in <strong>{currentUser.active_wing_name}</strong> ({currentUser.active_wing_code})
        </Alert>
      )}

      {!activeWingId && allWingRoles.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          No active wing selected. Switch to a wing below to start working.
        </Alert>
      )}

      {/* Search */}
      {allWingRoles.length > 3 && (
        <TextField
          placeholder="Search wings..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 3, width: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      )}

      {/* Wing cards grid */}
      {allWingRoles.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <AccountTreeIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
          <Typography variant="h6" color="text.secondary">
            No wings assigned
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
            Contact your administrator to get assigned to wings.
          </Typography>
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
          <Typography variant="body1">No wings match your search.</Typography>
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {filtered.map((wr) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={wr.id}>
              <WingCard
                wingRole={wr}
                isActive={wr.wing === activeWingId}
                onSwitch={handleSwitch}
                switching={switching}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Summary footer */}
      {allWingRoles.length > 0 && (
        <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.disabled">
            You are assigned to {allWingRoles.length} wing{allWingRoles.length !== 1 ? 's' : ''}.
            {activeWingId ? ' Your active wing determines which agenda items and approvals you see.' : ''}
          </Typography>
        </Box>
      )}
    </Box>
  );
};
