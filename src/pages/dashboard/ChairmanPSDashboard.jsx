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

export const ChairmanPSDashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { data: meetingsData, isLoading: meetingsLoading } = useGetMeetingsQuery({ status: 'SCHEDULED', limit: 5 });
  const { data: finalizedData, isLoading: finalizedLoading } = useGetMeetingsQuery({ status: 'FINALIZED', limit: 10 });
  const { data: agendaData, isLoading: agendaLoading } = useGetAgendaItemsQuery({ status: 'CONSOLIDATED', limit: 100 });

  const meetings = Array.isArray(meetingsData?.results) ? meetingsData.results : Array.isArray(meetingsData) ? meetingsData : [];
  const finalizedMeetings = Array.isArray(finalizedData?.results) ? finalizedData.results : Array.isArray(finalizedData) ? finalizedData : [];
  const consolidatedItems = Array.isArray(agendaData?.results) ? agendaData.results : Array.isArray(agendaData) ? agendaData : [];
  const nextMeeting = meetings[0];

  // Find any meeting with an active sitting so the Chairman PS can rejoin
  const activeSitting = finalizedMeetings.find((m) => m.sitting_enabled);

  return (
    <Box>
      <PageHeader
        title={`Welcome, ${currentUser?.user?.first_name || currentUser?.full_name?.split(' ')[0] || 'Chairman PS'}`}
        subtitle="Chairman's Private Secretary"
        actions={
          <Button variant="contained" onClick={() => navigate('/meetings')}>
            Manage Meetings
          </Button>
        }
      />

      {/* Active sitting banner — allows Chairman PS to rejoin a live sitting */}
      {finalizedLoading ? (
        <Skeleton variant="rounded" height={120} sx={{ mb: 3 }} />
      ) : activeSitting ? (
        <Card sx={{ mb: 3, bgcolor: '#059669', border: '1px solid #047857', color: '#fff' }}>
          <CardContent>
            <Typography variant="caption" sx={{ color: '#D1FAE5', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
              Sitting is LIVE
            </Typography>
            <Typography variant="h2" sx={{ color: '#fff', mt: 0.5 }}>{activeSitting.title}</Typography>
            <Typography variant="body2" sx={{ color: '#D1FAE5', mt: 0.5 }}>
              {activeSitting.sitting_date
                ? new Date(activeSitting.sitting_date).toLocaleDateString('en-IN', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  })
                : '—'}
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={() => navigate(`/sitting/${activeSitting.id}`)}
              sx={{ mt: 1.5, bgcolor: '#fff', color: '#059669', '&:hover': { bgcolor: '#D1FAE5' } }}
            >
              Rejoin Sitting
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ py: 2.5 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>Scheduled Meetings</Typography>
              {meetingsLoading ? <Skeleton width={40} height={40} /> : (
                <Typography variant="h1" sx={{ color: '#1D4ED8', fontWeight: 700 }}>{meetings.length}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ py: 2.5 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>Ready to Finalize</Typography>
              {agendaLoading ? <Skeleton width={40} height={40} /> : (
                <Typography variant="h1" sx={{ color: '#059669', fontWeight: 700 }}>{consolidatedItems.length}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
