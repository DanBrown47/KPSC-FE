import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { useGetAgendaItemsQuery } from '../../store/api/agendaApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { ReturnedItemsBanner } from './ReturnedItemsBanner.jsx';
import { useAuth } from '../../hooks/useAuth.js';

const StatCard = ({ label, value, color = 'primary.main', loading }) => (
  <Card>
    <CardContent sx={{ py: 2.5 }}>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {label}
      </Typography>
      {loading ? (
        <Skeleton variant="text" width={40} height={40} />
      ) : (
        <Typography variant="h1" sx={{ color, fontWeight: 700 }}>
          {value ?? 0}
        </Typography>
      )}
    </CardContent>
  </Card>
);

export const WingMemberDashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const activeWingId = currentUser?.active_wing_id ?? null;
  const queryParams = { limit: 100, ...(activeWingId ? { wing: activeWingId } : {}) };
  const { data: allItems, isLoading } = useGetAgendaItemsQuery(queryParams);
  const items = Array.isArray(allItems?.results) ? allItems.results : Array.isArray(allItems) ? allItems : [];

  const returnedItems = items.filter((i) => i.status === 'DRAFT' && i.return_comment);
  const draftItems = items.filter((i) => i.status === 'DRAFT' && !i.return_comment);
  const pendingItems = items.filter((i) => i.status === 'PENDING_WING_APPROVAL');
  const approvedItems = items.filter((i) => ['WING_APPROVED', 'PENDING_RNA', 'CONSOLIDATED', 'FINALIZED'].includes(i.status));

  return (
    <Box>
      <PageHeader
        title={`Welcome, ${currentUser?.user?.first_name || currentUser?.full_name?.split(' ')[0] || 'Wing Member'}`}
        subtitle={currentUser?.active_wing_name || currentUser?.wing_roles?.find(r => r.is_active !== false)?.wing_name || ''}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/agenda/create')}>
            New Agenda Item
          </Button>
        }
      />
      <ReturnedItemsBanner items={returnedItems} />
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Draft Items" value={draftItems.length} color="#6B7280" loading={isLoading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Pending Approval" value={pendingItems.length} color="#D97706" loading={isLoading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Approved/Forwarded" value={approvedItems.length} color="#059669" loading={isLoading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Returned" value={returnedItems.length} color="#DC2626" loading={isLoading} />
        </Grid>
      </Grid>
    </Box>
  );
};
