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

export const ChairmanDashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { data: meetingsData, isLoading } = useGetMeetingsQuery({ status: 'FINALIZED', limit: 5 });
  const meetings = Array.isArray(meetingsData?.results) ? meetingsData.results : Array.isArray(meetingsData) ? meetingsData : [];
  const now = new Date();
  const upcomingMeetings = meetings.filter((m) => new Date(m.sitting_date) >= now);
  const nextMeeting = upcomingMeetings[0];

  return (
    <Box>
      <PageHeader
        title={`Welcome, ${currentUser?.user?.first_name || currentUser?.full_name?.split(' ')[0] || 'Chairman'}`}
        subtitle="Chairman, Kerala Public Service Commission"
      />
      {nextMeeting && (
        nextMeeting.sitting_enabled ? (
          <Card sx={{ mb: 3, bgcolor: '#059669', border: '1px solid #047857', color: '#fff' }}>
            <CardContent>
              <Typography variant="caption" sx={{ color: '#D1FAE5', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                Sitting is LIVE
              </Typography>
              <Typography variant="h2" sx={{ color: '#fff', mt: 0.5 }}>{nextMeeting.title}</Typography>
              <Typography variant="body2" sx={{ color: '#D1FAE5', mt: 0.5 }}>
                {nextMeeting.sitting_date ? new Date(nextMeeting.sitting_date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => navigate(`/sitting/${nextMeeting.id}`)}
                sx={{ mt: 1.5, bgcolor: '#fff', color: '#059669', '&:hover': { bgcolor: '#D1FAE5' } }}
              >
                Join Sitting
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card sx={{ mb: 3, bgcolor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
            <CardContent>
              <Typography variant="caption" sx={{ color: '#1D4ED8', fontWeight: 600, textTransform: 'uppercase' }}>
                Upcoming Sitting
              </Typography>
              <Typography variant="h2" sx={{ color: '#0F1F3D', mt: 0.5 }}>{nextMeeting.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {nextMeeting.sitting_date ? new Date(nextMeeting.sitting_date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
              </Typography>
              <Button variant="contained" size="small" sx={{ mt: 1.5 }} onClick={() => navigate(`/sitting/${nextMeeting.id}`)}>
                Join Sitting
              </Button>
            </CardContent>
          </Card>
        )
      )}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent sx={{ py: 2.5 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>Upcoming Sittings</Typography>
              {isLoading ? <Skeleton width={40} height={40} /> : (
                <Typography variant="h1" sx={{ color: '#1D4ED8', fontWeight: 700 }}>{upcomingMeetings.length}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
