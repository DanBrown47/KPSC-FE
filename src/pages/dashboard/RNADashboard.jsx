import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import { useNavigate } from 'react-router-dom';
import { useGetAgendaItemsQuery } from '../../store/api/agendaApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { useAuth } from '../../hooks/useAuth.js';

export const RNADashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const { data: allItems, isLoading } = useGetAgendaItemsQuery({ limit: 100 });
  const items = allItems?.results || allItems || [];
  const pendingRNA = items.filter((i) => i.status === 'PENDING_RNA');
  const wingApproved = items.filter((i) => i.status === 'WING_APPROVED');
  const consolidated = items.filter((i) => i.status === 'CONSOLIDATED');

  return (
    <Box>
      <PageHeader
        title={`Welcome, ${currentUser?.user?.first_name || currentUser?.full_name?.split(' ')[0] || 'R&A'}`}
        subtitle="Research & Administration"
        actions={
          <Button variant="contained" onClick={() => navigate('/consolidation')}>
            Go to Consolidation ({pendingRNA.length})
          </Button>
        }
      />
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ py: 2.5 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>Wing Approved</Typography>
              {isLoading ? <Skeleton width={40} height={40} /> : (
                <Typography variant="h1" sx={{ color: '#059669', fontWeight: 700 }}>{wingApproved.length}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ py: 2.5 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>Pending R&A Review</Typography>
              {isLoading ? <Skeleton width={40} height={40} /> : (
                <Typography variant="h1" sx={{ color: '#7C3AED', fontWeight: 700 }}>{pendingRNA.length}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ py: 2.5 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>Consolidated</Typography>
              {isLoading ? <Skeleton width={40} height={40} /> : (
                <Typography variant="h1" sx={{ color: '#1D4ED8', fontWeight: 700 }}>{consolidated.length}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
