import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { useGetAgendaItemsQuery, useConsolidateMeetingMutation } from '../../store/api/agendaApi.js';
import { useGetMeetingsQuery } from '../../store/api/meetingsApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { StatusChip } from '../../components/common/StatusChip.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice.js';
import MergeIcon from '@mui/icons-material/Merge';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export const ConsolidationPage = () => {
  const dispatch = useDispatch();
  const [consolidatingMeetingId, setConsolidatingMeetingId] = useState(null);

  // Fetch PENDING_RNA items across all meetings
  const { data, isLoading } = useGetAgendaItemsQuery({ status: 'PENDING_RNA', limit: 200 });
  const items = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];

  // Fetch meetings to get titles
  const { data: meetingsData } = useGetMeetingsQuery({ limit: 100 });
  const meetings = Array.isArray(meetingsData?.results) ? meetingsData.results : Array.isArray(meetingsData) ? meetingsData : [];

  const [consolidateMeeting, { isLoading: consolidating }] = useConsolidateMeetingMutation();

  // Group items by meeting, sorted by wing priority_order within each group
  const itemsByMeeting = useMemo(() => {
    const groups = {};
    items.forEach((item) => {
      const mId = item.meeting?.id || item.meeting;
      if (!groups[mId]) groups[mId] = [];
      groups[mId].push(item);
    });
    // Sort each group by wing name (proxy for priority — server sorts by priority on consolidation)
    Object.values(groups).forEach((grp) => grp.sort((a, b) =>
      (a.wing?.name || '').localeCompare(b.wing?.name || '')
    ));
    return groups;
  }, [items]);

  const getMeetingTitle = (meetingId) => {
    const m = meetings.find((m) => String(m.id) === String(meetingId));
    return m?.title || `Meeting #${meetingId}`;
  };

  const handleConsolidateAll = async (meetingId) => {
    setConsolidatingMeetingId(meetingId);
    try {
      const result = await consolidateMeeting(meetingId).unwrap();
      const count = result.consolidated?.length || 0;
      dispatch(showToast({
        message: `${count} item${count !== 1 ? 's' : ''} consolidated with serial numbers assigned automatically`,
        severity: 'success',
      }));
    } catch (err) {
      const msg = err?.data?.detail || 'Consolidation failed';
      dispatch(showToast({ message: msg, severity: 'error' }));
    } finally {
      setConsolidatingMeetingId(null);
    }
  };

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  const meetingIds = Object.keys(itemsByMeeting);

  return (
    <Box>
      <PageHeader
        title="R&A Consolidation"
        breadcrumbs={[{ label: 'Consolidation' }]}
      />

      <Alert severity="info" sx={{ mb: 3 }}>
        Serial numbers and agenda numbers are assigned <strong>automatically</strong> in Wing Priority Order
        when you click <em>Consolidate All</em>. This action is atomic — all items in a meeting are
        consolidated together or not at all.
      </Alert>

      {meetingIds.length === 0 ? (
        <EmptyState
          icon={MergeIcon}
          title="No items pending consolidation"
          description="All items have been processed."
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {meetingIds.map((meetingId) => {
            const meetingItems = itemsByMeeting[meetingId];
            const isThisConsolidating = consolidating && consolidatingMeetingId === meetingId;

            return (
              <Card key={meetingId} variant="outlined">
                <CardContent>
                  {/* Meeting header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                      <Typography variant="h5">{getMeetingTitle(meetingId)}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {meetingItems.length} item{meetingItems.length !== 1 ? 's' : ''} pending — serial numbers will be assigned 1–{meetingItems.length} in Wing Priority Order
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={isThisConsolidating ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                      onClick={() => handleConsolidateAll(meetingId)}
                      disabled={consolidating}
                    >
                      {isThisConsolidating ? 'Consolidating…' : `Consolidate All (${meetingItems.length})`}
                    </Button>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* Preview table — read-only, no manual serial entry */}
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Serial</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Wing</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Topic</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {meetingItems.map((item, idx) => (
                        <TableRow key={item.id} hover>
                          <TableCell>
                            <Chip label={`#${idx + 1}*`} size="small" variant="outlined" color="primary" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.wing?.name || '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.topic}</Typography>
                          </TableCell>
                          <TableCell>
                            <StatusChip status={item.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    * Preview order shown by wing name. Server assigns final serial numbers by Wing Priority Order.
                  </Typography>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
};
