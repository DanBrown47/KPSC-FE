import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import { useNavigate } from 'react-router-dom';
import { useGetMeetingsQuery } from '../../store/api/meetingsApi.js';
import { useGetAgendaItemsQuery } from '../../store/api/agendaApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { useAuth } from '../../hooks/useAuth.js';

export const MemberPADashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const activeWingId = currentUser?.active_wing_id ?? null;
  const activeWingName = currentUser?.active_wing_name
    || currentUser?.wing_roles?.find((r) => r.is_active !== false)?.wing_name
    || '';

  const { data: finalizedData, isLoading: finalizedLoading } = useGetMeetingsQuery({ status: 'FINALIZED', limit: 10 });
  const { data: allItems, isLoading: agendaLoading } = useGetAgendaItemsQuery(
    { limit: 100, ...(activeWingId ? { wing: activeWingId } : {}) },
  );

  const finalizedMeetings = Array.isArray(finalizedData?.results) ? finalizedData.results : Array.isArray(finalizedData) ? finalizedData : [];
  const items = Array.isArray(allItems?.results) ? allItems.results : Array.isArray(allItems) ? allItems : [];

  const now = new Date();
  const upcomingSittings = finalizedMeetings.filter((m) => new Date(m.sitting_date) >= now);
  const nextMeeting = upcomingSittings[0];

  const draftItems = items.filter((i) => i.status === 'DRAFT' && !i.return_comment);
  const pendingItems = items.filter((i) => i.status === 'PENDING_WING_APPROVAL');

  return (
    <Box>
      <PageHeader
        title={`Welcome, ${currentUser?.user?.first_name || currentUser?.full_name?.split(' ')[0] || 'Member PA'}`}
        subtitle={activeWingName ? `Member PA — ${activeWingName}` : 'Member PA'}
      />
      {nextMeeting && (
        <Card sx={{ mb: 3, bgcolor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
          <CardContent>
            <Typography variant="caption" sx={{ color: '#1D4ED8', fontWeight: 600, textTransform: 'uppercase' }}>
              Next Sitting
            </Typography>
            <Typography variant="h2" sx={{ color: '#0F1F3D', mt: 0.5 }}>{nextMeeting.title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {nextMeeting.sitting_date
                ? new Date(nextMeeting.sitting_date).toLocaleDateString('en-IN', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  })
                : '—'}
            </Typography>
            <Button variant="contained" size="small" sx={{ mt: 1.5 }} onClick={() => navigate(`/meetings/${nextMeeting.id}`)}>
              View Details
            </Button>
          </CardContent>
        </Card>
      )}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent sx={{ py: 2.5 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>Upcoming Sittings</Typography>
              {finalizedLoading ? <Skeleton width={40} height={40} /> : (
                <Typography variant="h1" sx={{ color: '#059669', fontWeight: 700 }}>{upcomingSittings.length}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent sx={{ py: 2.5 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>Draft Items</Typography>
              {agendaLoading ? <Skeleton width={40} height={40} /> : (
                <Typography variant="h1" sx={{ color: '#6B7280', fontWeight: 700 }}>{draftItems.length}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent sx={{ py: 2.5 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>Pending Approval</Typography>
              {agendaLoading ? <Skeleton width={40} height={40} /> : (
                <Typography variant="h1" sx={{ color: '#D97706', fontWeight: 700 }}>{pendingItems.length}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};