import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import { useNavigate } from 'react-router-dom';
import { useGetMeetingsQuery } from '../../store/api/meetingsApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { useAuth } from '../../hooks/useAuth.js';

export const MemberDashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { data: meetingsData, isLoading } = useGetMeetingsQuery({ status: 'FINALIZED', limit: 10 });
  const meetings = Array.isArray(meetingsData?.results) ? meetingsData.results : Array.isArray(meetingsData) ? meetingsData : [];

  const now = new Date();
  const upcomingMeetings = meetings.filter((m) => new Date(m.sitting_date) >= now);
  const nextMeeting = upcomingMeetings[0];

  return (
    <Box>
      <PageHeader
        title={`Welcome, ${currentUser?.user?.first_name || currentUser?.full_name?.split(' ')[0] || 'Member'}`}
        subtitle="Commission Member"
      />
      {isLoading ? (
        <Skeleton variant="rounded" height={120} sx={{ mb: 3 }} />
      ) : nextMeeting ? (
        <Card sx={{ mb: 3, bgcolor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <CardContent>
            <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600, textTransform: 'uppercase' }}>
              Next Sitting — Action Required
            </Typography>
            <Typography variant="h2" sx={{ color: '#0F1F3D', mt: 0.5 }}>{nextMeeting.title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {nextMeeting.sitting_date
                ? new Date(nextMeeting.sitting_date).toLocaleDateString('en-IN', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  })
                : '—'}
            </Typography>
            <Tooltip title={!nextMeeting.sitting_enabled ? 'Chairman has not opened the sitting yet' : ''}>
              <span>
                <Button
                  variant="contained"
                  size="small"
                  color="success"
                  sx={{ mt: 1.5 }}
                  disabled={!nextMeeting.sitting_enabled}
                  onClick={() => navigate(`/sitting/${nextMeeting.id}`)}
                >
                  Join Sitting &amp; Vote
                </Button>
              </span>
            </Tooltip>
            {!nextMeeting.sitting_enabled && (
              <Typography variant="caption" sx={{ display: 'block', color: '#6B7280', mt: 0.5 }}>
                Waiting for Chairman to open the sitting
              </Typography>
            )}
          </CardContent>
        </Card>
      ) : null}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent sx={{ py: 2.5 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>Upcoming Sittings</Typography>
              {isLoading ? <Skeleton width={40} height={40} /> : (
                <Typography variant="h1" sx={{ color: '#059669', fontWeight: 700 }}>{upcomingMeetings.length}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
