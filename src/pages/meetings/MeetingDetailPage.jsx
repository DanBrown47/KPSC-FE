import { useState } from 'react';
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
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DownloadIcon from '@mui/icons-material/Download';
import AddIcon from '@mui/icons-material/Add';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import { format, isBefore, startOfDay, parseISO } from 'date-fns';
import { useGetMeetingQuery, useFinalizeMeetingMutation, useOpenMeetingMutation, usePostponeMeetingMutation } from '../../store/api/meetingsApi.js';
import { useGetAgendaItemsQuery } from '../../store/api/agendaApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { StatusChip } from '../../components/common/StatusChip.jsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx';
import { usePermissions } from '../../hooks/usePermissions.js';
import { useReportGeneration } from '../../hooks/useReportGeneration.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice.js';

const InfoRow = ({ label, value }) => (
  <Box sx={{ display: 'flex', gap: 2, py: 1, borderBottom: '1px solid #F1F5F9' }}>
    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140, flexShrink: 0 }}>
      {label}
    </Typography>
    <Typography variant="body2" component="span">{value || '—'}</Typography>
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
      onClick={() => startGeneration({ meetingId, reportType: 'AGENDA_SUMMARY' })}
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
  const { isChairmanPS, isRNAASJS, isChairman, isWingMember, isWingASJS } = usePermissions();
  const isWingUser = isWingMember || isWingASJS;
  const { data: meeting, isLoading } = useGetMeetingQuery(id);
  const [finalizeMeeting, { isLoading: finalizing }] = useFinalizeMeetingMutation();
  const [openMeeting, { isLoading: opening }] = useOpenMeetingMutation();
  const [postponeMeeting, { isLoading: postponing }] = usePostponeMeetingMutation();
  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false);
  const [postponeDialogOpen, setPostponeDialogOpen] = useState(false);
  const [newSittingDate, setNewSittingDate] = useState('');
  const [newSittingTime, setNewSittingTime] = useState('10:30');

  const isBeforeSittingDate = meeting?.sitting_date
    ? isBefore(startOfDay(new Date()), startOfDay(parseISO(meeting.sitting_date)))
    : false;

  const handleFinalizeClick = () => {
    setFinalizeDialogOpen(true);
  };

  const handleFinalizeConfirm = async () => {
    try {
      await finalizeMeeting(id).unwrap();
      dispatch(showToast({ message: 'Meeting finalized successfully', severity: 'success' }));
    } catch {
      dispatch(showToast({ message: 'Failed to finalize meeting', severity: 'error' }));
    } finally {
      setFinalizeDialogOpen(false);
    }
  };

  const handleOpenMeeting = async () => {
    try {
      await openMeeting(id).unwrap();
      dispatch(showToast({ message: 'Meeting reopened successfully', severity: 'success' }));
    } catch {
      dispatch(showToast({ message: 'Failed to reopen meeting', severity: 'error' }));
    }
  };

  const handlePostponeClick = () => {
    setNewSittingDate('');
    setNewSittingTime('10:30');
    setPostponeDialogOpen(true);
  };

  const handlePostponeConfirm = async () => {
    const datetime = `${newSittingDate}T${newSittingTime}:00`;
    try {
      await postponeMeeting({ id, new_sitting_date: datetime }).unwrap();
      dispatch(showToast({ message: 'Sitting postponed successfully', severity: 'success' }));
      setPostponeDialogOpen(false);
    } catch (err) {
      const message = err?.data?.detail || 'Failed to postpone sitting';
      dispatch(showToast({ message, severity: 'error' }));
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
            {isWingUser ? (
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => navigate(`/agenda/create?meeting=${id}`)}
              >
                Create Agenda Item
              </Button>
            ) : (
              <ReportButton meetingId={id} />
            )}
            {canFinalize && meeting.status === 'SCHEDULED' && (
              <Tooltip title={isBeforeSittingDate ? 'Finalization is available only on or after the sitting date' : ''}>
                <span>
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<GavelIcon />}
                    onClick={handleFinalizeClick}
                    disabled={finalizing || isBeforeSittingDate}
                  >
                    {finalizing ? 'Finalizing…' : 'Finalize Meeting'}
                  </Button>
                </span>
              </Tooltip>
            )}
            {canFinalize && meeting.status === 'FINALIZED' && (
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<LockOpenIcon />}
                onClick={handleOpenMeeting}
                disabled={opening}
              >
                {opening ? 'Opening…' : 'Open Meeting'}
              </Button>
            )}
            {isChairmanPS && meeting.status === 'FINALIZED' && (
              <Button variant="contained" startIcon={<GavelIcon />} onClick={() => navigate(`/sitting/${id}`)}>
                Open Sitting
              </Button>
            )}
            {canFinalize && meeting.status === 'SCHEDULED' && meeting.can_be_postponed && (
              <Tooltip title="Postpone this sitting to a new date. Only available when no chairman decisions have been recorded.">
                <span>
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<EventBusyIcon />}
                    onClick={handlePostponeClick}
                    disabled={postponing}
                  >
                    {postponing ? 'Postponing…' : 'Postpone Sitting'}
                  </Button>
                </span>
              </Tooltip>
            )}
            {canFinalize && meeting.status === 'SCHEDULED' && !meeting.can_be_postponed && (
              <Tooltip title="Cannot postpone: one or more agenda items already have a chairman decision.">
                <span>
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<EventBusyIcon />}
                    disabled
                  >
                    Postpone Sitting
                  </Button>
                </span>
              </Tooltip>
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
              <InfoRow label="Time" value={meeting.sitting_date ? format(new Date(meeting.sitting_date), 'hh:mm a') : '—'} />
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

      <ConfirmDialog
        open={finalizeDialogOpen}
        onClose={() => setFinalizeDialogOpen(false)}
        onConfirm={handleFinalizeConfirm}
        title="Finalize Meeting"
        message="Are you sure you want to finalize this meeting? Once finalized, no new regular agenda items can be added."
        variant="consequential"
        confirmLabel="Finalize"
        loading={finalizing}
      />

      <Dialog open={postponeDialogOpen} onClose={() => setPostponeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Postpone Sitting</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Reschedule this sitting to a new date. The meeting title will be updated to reflect the new date.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Current date: {meeting?.sitting_date ? format(new Date(meeting.sitting_date), 'EEEE, dd MMMM yyyy') : '—'}
            </Typography>
            <TextField
              fullWidth
              label="New Sitting Date"
              type="date"
              value={newSittingDate}
              onChange={(e) => setNewSittingDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              fullWidth
              label="New Sitting Time"
              type="time"
              value={newSittingTime}
              onChange={(e) => setNewSittingTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setPostponeDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handlePostponeConfirm}
            disabled={!newSittingDate || !newSittingTime || postponing}
          >
            {postponing ? 'Postponing…' : 'Postpone'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
