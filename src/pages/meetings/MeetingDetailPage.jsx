import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import GavelIcon from '@mui/icons-material/Gavel';
import DownloadIcon from '@mui/icons-material/Download';
import { format } from 'date-fns';
import { useGetMeetingQuery, useFinalizeMeetingMutation } from '../../store/api/meetingsApi.js';
import { useGetAgendaItemsQuery } from '../../store/api/agendaApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { StatusChip } from '../../components/common/StatusChip.jsx';
import { usePermissions } from '../../hooks/usePermissions.js';
import { useReportGeneration } from '../../hooks/useReportGeneration.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice.js';

const InfoRow = ({ label, value }) => (
  <Box sx={{ display: 'flex', gap: 2, py: 1, borderBottom: '1px solid #F1F5F9' }}>
    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140, flexShrink: 0 }}>
      {label}
    </Typography>
    <Typography variant="body2">{value || '—'}</Typography>
  </Box>
);

const ReportButton = ({ meetingId }) => {
  const { startGeneration, status, downloadUrl, reset } = useReportGeneration();

  if (status === 'ready' && downloadUrl) {
    return (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button variant="contained" startIcon={<DownloadIcon />} href={downloadUrl} download onClick={reset}>
          Download Report
        </Button>
        <Button variant="outlined" onClick={reset} size="small">New</Button>
      </Box>
    );
  }

  if (status === 'generating') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 200 }}>
        <LinearProgress sx={{ flex: 1 }} />
        <Typography variant="caption" color="text.secondary">Generating...</Typography>
      </Box>
    );
  }

  return (
    <Button
      variant="outlined"
      startIcon={status === 'error' ? undefined : undefined}
      onClick={() => startGeneration({ meetingId, reportType: 'AGENDA' })}
      color={status === 'error' ? 'error' : 'primary'}
    >
      {status === 'error' ? 'Retry Report' : 'Generate Report'}
    </Button>
  );
};

export const MeetingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isChairmanPS, isRNAASJS, isChairman } = usePermissions();
  const { data: meeting, isLoading } = useGetMeetingQuery(id);
  const [finalizeMeeting, { isLoading: finalizing }] = useFinalizeMeetingMutation();

  const handleFinalize = async () => {
    try {
      await finalizeMeeting(id).unwrap();
      dispatch(showToast({ message: 'Meeting finalized successfully', severity: 'success' }));
    } catch {
      dispatch(showToast({ message: 'Failed to finalize meeting', severity: 'error' }));
    }
  };

  // RNA_ASJS is the primary finalizer; Chairman/ChairmanPS retain override
  const canFinalize = isRNAASJS || isChairman || isChairmanPS;
  const { data: agendaData } = useGetAgendaItemsQuery({ meeting_id: id, limit: 100 });
  const agendaItems = Array.isArray(agendaData?.results) ? agendaData.results : Array.isArray(agendaData) ? agendaData : [];

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  if (!meeting) return null;

  return (
    <Box>
      <PageHeader
        title={meeting.title}
        breadcrumbs={[{ label: 'Meetings', href: '/meetings' }, { label: meeting.title }]}
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ReportButton meetingId={id} />
            {canFinalize && meeting.status === 'SCHEDULED' && (
              <Button
                variant="outlined"
                color="warning"
                startIcon={<GavelIcon />}
                onClick={handleFinalize}
                disabled={finalizing}
              >
                {finalizing ? 'Finalizing…' : 'Finalize Meeting'}
              </Button>
            )}
            {isChairmanPS && meeting.status === 'FINALIZED' && (
              <Button variant="contained" startIcon={<GavelIcon />} onClick={() => navigate(`/sitting/${id}`)}>
                Open Sitting
              </Button>
            )}
          </Box>
        }
      />
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>Meeting Details</Typography>
              <InfoRow label="Status" value={<StatusChip status={meeting.status} />} />
              <InfoRow label="Date" value={meeting.sitting_date ? format(new Date(meeting.sitting_date), 'EEEE, dd MMMM yyyy') : '—'} />
              <InfoRow label="Venue" value={meeting.venue} />
              <InfoRow label="Description" value={meeting.description} />
              <InfoRow label="Created" value={meeting.created_at ? format(new Date(meeting.created_at), 'dd MMM yyyy') : '—'} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Agenda Items ({agendaItems.length})
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {agendaItems.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No agenda items assigned to this meeting.</Typography>
              ) : (
                agendaItems.map((item, i) => (
                  <Box
                    key={item.id}
                    sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, borderBottom: i < agendaItems.length - 1 ? '1px solid #F1F5F9' : 'none', cursor: 'pointer', '&:hover': { bgcolor: '#F8FAFC' }, borderRadius: 1, px: 1 }}
                    onClick={() => navigate(`/agenda/${item.id}`)}
                  >
                    {item.serial_number && (
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#F0B429', minWidth: 32 }}>
                        #{item.serial_number}
                      </Typography>
                    )}
                    <Typography variant="body2" sx={{ flex: 1 }}>{item.topic}</Typography>
                    <StatusChip status={item.status} />
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
