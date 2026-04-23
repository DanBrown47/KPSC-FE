import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import { useNavigate } from 'react-router-dom';
import { useGetAgendaItemsQuery } from '../../store/api/agendaApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { ReturnedItemsBanner } from './ReturnedItemsBanner.jsx';
import { useAuth } from '../../hooks/useAuth.js';

const AGENDA_VIEW_PERMS = new Set([
  'agenda_item_view', 'agenda_item_create', 'agenda_item_edit',
  'agenda_item_delete', 'final_agenda_view', 'approve_agenda_item',
]);

export const WingASJSDashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const activeWingRoles = (currentUser?.wing_roles || []).filter((r) => r.is_active !== false);
  const activeWingId = currentUser?.active_wing_id
    ?? (activeWingRoles.length === 1 ? activeWingRoles[0].wing : null);

  // Determine if the active wing has any permissions assigned
  const activeWingRole = activeWingId
    ? activeWingRoles.find((r) => Number(r.wing) === Number(activeWingId))
    : null;
  const activeWingPerms = (activeWingRole?.permission_roles || []).map((p) => p.permission_role);
  const hasAnyPermission = activeWingPerms.some((p) => AGENDA_VIEW_PERMS.has(p));

  const queryParams = { limit: 100, ...(activeWingId ? { wing: activeWingId } : {}) };
  const { data: allItems, isLoading } = useGetAgendaItemsQuery(queryParams, { skip: !hasAnyPermission });
  const items = Array.isArray(allItems?.results) ? allItems.results : Array.isArray(allItems) ? allItems : [];
  const returnedItems = items.filter((i) => i.status === 'DRAFT' && i.return_comment);
  const pendingApproval = items.filter((i) => i.status === 'PENDING_WING_APPROVAL');

  const activeWingName = currentUser?.active_wing_name
    || activeWingRole?.wing_name
    || 'Wing AS/JS';

  if (!activeWingId) {
    return (
      <Box>
        <PageHeader
          title={`Welcome, ${currentUser?.user?.first_name || currentUser?.full_name?.split(' ')[0] || 'AS/JS'}`}
          subtitle="No active wing selected"
        />
        <Alert severity="info" sx={{ mt: 2 }}>
          You are assigned to multiple wings. Switch to a wing from <strong>My Wings</strong> to get started.
        </Alert>
      </Box>
    );
  }

  if (!hasAnyPermission) {
    return (
      <Box>
        <PageHeader
          title={`Welcome, ${currentUser?.user?.first_name || currentUser?.full_name?.split(' ')[0] || 'AS/JS'}`}
          subtitle={activeWingName}
        />
        <Alert severity="warning" sx={{ mt: 2 }}>
          No permissions have been assigned to you under <strong>{activeWingName}</strong>. Contact your web administrator.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={`Welcome, ${currentUser?.user?.first_name || currentUser?.full_name?.split(' ')[0] || 'AS/JS'}`}
        subtitle={activeWingName}
        actions={
          <Button variant="contained" onClick={() => navigate('/approvals')}>
            Review Approvals ({pendingApproval.length})
          </Button>
        }
      />
      <ReturnedItemsBanner items={returnedItems} />
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent sx={{ py: 2.5 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>Pending Wing Approval</Typography>
              {isLoading ? <Skeleton width={40} height={40} /> : (
                <Typography variant="h1" sx={{ color: '#D97706', fontWeight: 700 }}>{pendingApproval.length}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent sx={{ py: 2.5 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>Returned Items</Typography>
              {isLoading ? <Skeleton width={40} height={40} /> : (
                <Typography variant="h1" sx={{ color: '#DC2626', fontWeight: 700 }}>{returnedItems.length}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
