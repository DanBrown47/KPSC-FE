import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import { useNavigate } from 'react-router-dom';
import { useGetMeetingsQuery } from '../../store/api/meetingsApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { useAuth } from '../../hooks/useAuth.js';

export const SecretaryPADashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { data: finalizedData, isLoading: finalizedLoading } = useGetMeetingsQuery({ status: 'FINALIZED', limit: 10 });
  const { data: scheduledData, isLoading: scheduledLoading } = useGetMeetingsQuery({ status: 'SCHEDULED', limit: 5 });

  const finalizedMeetings = Array.isArray(finalizedData?.results) ? finalizedData.results : Array.isArray(finalizedData) ? finalizedData : [];
  const scheduledMeetings = Array.isArray(scheduledData?.results) ? scheduledData.results : Array.isArray(scheduledData) ? scheduledData : [];

  const now = new Date();
  const upcomingSittings = finalizedMeetings.filter((m) => new Date(m.sitting_date) >= now);
  const nextMeeting = upcomingSittings[0];

  const activeWingName = currentUser?.active_wing_name
    || currentUser?.wing_roles?.find((r) => r.is_active !== false)?.wing_name
    || '';

  return (
    <Box>
      <PageHeader
        title={`Welcome, ${currentUser?.user?.first_name || currentUser?.full_name?.split(' ')[0] || 'Secretary PA'}`}
        subtitle={activeWingName ? `Secretary PA — ${activeWingName}` : 'Secretary PA'}
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
              <Typography variant="body2" color="text.secondary" gutterBottom>Scheduled Meetings</Typography>
              {scheduledLoading ? <Skeleton width={40} height={40} /> : (
                <Typography variant="h1" sx={{ color: '#1D4ED8', fontWeight: 700 }}>{scheduledMeetings.length}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
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
      </Grid>
    </Box>
  );
};