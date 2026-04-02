import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { useGetMeetingsQuery, useCreateMeetingMutation } from '../../store/api/meetingsApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { usePermissions } from '../../hooks/usePermissions.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice.js';

const STATUS_COLORS = {
  SCHEDULED: '#1D4ED8',
  FINALIZED: '#F0B429',
  COMPLETED: '#6B7280',
};

export const CalendarPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isChairmanPS } = usePermissions();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [newMeeting, setNewMeeting] = useState({ title: '', venue: '', description: '' });

  const { data: meetingsData } = useGetMeetingsQuery({
    month: format(currentDate, 'yyyy-MM'),
    limit: 100,
  });
  const [createMeeting, { isLoading: creating }] = useCreateMeetingMutation();

  const meetings = Array.isArray(meetingsData?.results)
    ? meetingsData.results
    : Array.isArray(meetingsData)
    ? meetingsData
    : [];

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getMeetingsForDay = (day) =>
    meetings.filter((m) => m.sitting_date && isSameDay(new Date(m.sitting_date), day));

  const handleDayClick = (day) => {
    if (!isChairmanPS) return;
    if (!isSameMonth(day, currentDate)) return;
    const dayMeetings = getMeetingsForDay(day);
    if (dayMeetings.length === 0) {
      setSelectedDate(day);
      setCreateOpen(true);
    }
  };

  const handleCreate = async () => {
    try {
      const meeting = await createMeeting({
        ...newMeeting,
        sitting_date: format(selectedDate, "yyyy-MM-dd'T'HH:mm:ssxxx"),
      }).unwrap();
      dispatch(showToast({ message: 'Meeting scheduled successfully', severity: 'success' }));
      setCreateOpen(false);
      setNewMeeting({ title: '', venue: '', description: '' });
      navigate(`/meetings/${meeting.id}`);
    } catch {
      dispatch(showToast({ message: 'Failed to schedule meeting', severity: 'error' }));
    }
  };

  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Box>
      <PageHeader title="Calendar" breadcrumbs={[{ label: 'Calendar' }]} />
      <Card>
        <CardContent>
          {/* Month nav */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <IconButton onClick={() => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="h2">{format(currentDate, 'MMMM yyyy')}</Typography>
            <IconButton onClick={() => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>
              <ChevronRightIcon />
            </IconButton>
          </Box>

          {/* Weekday headers */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 0.5 }}>
            {WEEKDAYS.map((d) => (
              <Typography key={d} variant="caption" sx={{ textAlign: 'center', fontWeight: 600, color: 'text.secondary', py: 0.5 }}>
                {d}
              </Typography>
            ))}
          </Box>

          {/* Days grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
            {days.map((day) => {
              const dayMeetings = getMeetingsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());

              return (
                <Box
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  sx={{
                    minHeight: 80,
                    border: '1px solid #E2E8F0',
                    borderRadius: 1,
                    p: 0.75,
                    bgcolor: isToday ? '#EFF6FF' : 'transparent',
                    opacity: isCurrentMonth ? 1 : 0.35,
                    cursor: isChairmanPS && isCurrentMonth && dayMeetings.length === 0 ? 'pointer' : 'default',
                    '&:hover': isChairmanPS && isCurrentMonth && dayMeetings.length === 0 ? { bgcolor: '#F8FAFC' } : {},
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: isToday ? 700 : 400,
                      color: isToday ? 'primary.main' : 'text.primary',
                      display: 'block',
                      mb: 0.5,
                    }}
                  >
                    {format(day, 'd')}
                  </Typography>
                  {dayMeetings.map((m) => (
                    <Box
                      key={m.id}
                      onClick={(e) => { e.stopPropagation(); navigate(`/meetings/${m.id}`); }}
                      sx={{
                        bgcolor: STATUS_COLORS[m.status] || '#6B7280',
                        borderRadius: 0.5,
                        px: 0.5,
                        py: 0.25,
                        mb: 0.25,
                        cursor: 'pointer',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#fff', fontSize: '0.625rem', fontWeight: 500, display: 'block' }} noWrap>
                        {m.title}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              );
            })}
          </Box>
        </CardContent>
      </Card>

      {/* Create meeting dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Meeting — {selectedDate ? format(selectedDate, 'dd MMMM yyyy') : ''}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField fullWidth label="Meeting Title" value={newMeeting.title} onChange={(e) => setNewMeeting((p) => ({ ...p, title: e.target.value }))} required />
            <TextField fullWidth label="Venue" value={newMeeting.venue} onChange={(e) => setNewMeeting((p) => ({ ...p, venue: e.target.value }))} required />
            <TextField fullWidth label="Description" value={newMeeting.description} onChange={(e) => setNewMeeting((p) => ({ ...p, description: e.target.value }))} multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={creating || !newMeeting.title || !newMeeting.venue}>
            {creating ? 'Scheduling...' : 'Schedule Meeting'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
