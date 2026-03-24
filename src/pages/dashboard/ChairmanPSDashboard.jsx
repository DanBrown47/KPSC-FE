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
  const { data: agendaData, isLoading: agendaLoading } = useGetAgendaItemsQuery({ status: 'CONSOLIDATED', limit: 100 });

  const meetings = meetingsData?.results || meetingsData || [];
  const consolidatedItems = agendaData?.results || agendaData || [];
  const nextMeeting = meetings[0];

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
      {nextMeeting && (
        <Card sx={{ mb: 3, bgcolor: '#F0B429', border: 'none' }}>
          <CardContent>
            <Typography variant="caption" sx={{ color: '#78350F', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Next Sitting
            </Typography>
            <Typography variant="h2" sx={{ color: '#0F1F3D', mt: 0.5 }}>
              {nextMeeting.title}
            </Typography>
            <Typography variant="body2" sx={{ color: '#78350F', mt: 0.5 }}>
              {nextMeeting.sitting_date ? new Date(nextMeeting.sitting_date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
              {nextMeeting.venue ? ` · ${nextMeeting.venue}` : ''}
            </Typography>
            <Button
              variant="contained"
              size="small"
              sx={{ mt: 1.5, bgcolor: '#0F1F3D', color: '#fff', '&:hover': { bgcolor: '#1A3158' } }}
              onClick={() => navigate(`/sitting/${nextMeeting.id}`)}
            >
              Open Sitting Room
            </Button>
          </CardContent>
        </Card>
      )}
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
