import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Skeleton from '@mui/material/Skeleton';
import Checkbox from '@mui/material/Checkbox';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { useDispatch } from 'react-redux';
import { useGetAgendaItemsQuery, useBulkConsolidateMutation, useBulkReturnRNAMutation, useBulkConsolidateSupplementaryMutation } from '../../store/api/agendaApi.js';
import { useGetMeetingsQuery, useToggleSupplementaryMutation } from '../../store/api/meetingsApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { StatusChip } from '../../components/common/StatusChip.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { showToast } from '../../store/uiSlice.js';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UndoIcon from '@mui/icons-material/Undo';

const StatCard = ({ label, value, color, isLoading }) => (
  <Card>
    <CardContent sx={{ py: 2.5 }}>
      <Typography variant="body2" color="text.secondary" gutterBottom>{label}</Typography>
      {isLoading
        ? <Skeleton width={40} height={40} />
        : <Typography variant="h1" sx={{ color, fontWeight: 700 }}>{value}</Typography>
      }
    </CardContent>
  </Card>
);

export const RNADashboard = () => {
  const dispatch = useDispatch();
  const { currentUser } = useAuth();

  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedSupplIds, setSelectedSupplIds] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  const { data: meetingsData, isLoading: meetingsLoading } = useGetMeetingsQuery({ limit: 100 });
  const meetings = useMemo(
    () => (Array.isArray(meetingsData?.results) ? meetingsData.results : Array.isArray(meetingsData) ? meetingsData : []),
    [meetingsData]
  );

  // Global counts (no meeting filter)
  const { data: allData, isLoading: allLoading } = useGetAgendaItemsQuery({ limit: 500 });
  const allItems = useMemo(
    () => (Array.isArray(allData?.results) ? allData.results : Array.isArray(allData) ? allData : []),
    [allData]
  );

  const pendingRNACount = allItems.filter((i) => i.status === 'PENDING_RNA').length;
  const wingApprovedCount = allItems.filter((i) => i.status === 'WING_APPROVED').length;
  const consolidatedCount = allItems.filter((i) => i.status === 'CONSOLIDATED').length;
  const supplPendingCount = allItems.filter((i) => i.status === 'SUPPLEMENTARY_PENDING').length;

  // Items for selected meeting
  const { data: meetingItemsData, isLoading: itemsLoading } = useGetAgendaItemsQuery(
    selectedMeetingId ? { meeting: selectedMeetingId, limit: 500 } : {},
    { skip: !selectedMeetingId }
  );
  const meetingItems = useMemo(
    () => (Array.isArray(meetingItemsData?.results) ? meetingItemsData.results : Array.isArray(meetingItemsData) ? meetingItemsData : []),
    [meetingItemsData]
  );

  const pendingItems = useMemo(
    () => meetingItems.filter((i) => i.status === 'PENDING_RNA').sort((a, b) =>
      (a.wing?.name || '').localeCompare(b.wing?.name || '')
    ),
    [meetingItems]
  );
  const supplItems = useMemo(
    () => meetingItems.filter((i) => i.status === 'SUPPLEMENTARY_PENDING').sort((a, b) =>
      (a.wing?.name || '').localeCompare(b.wing?.name || '')
    ),
    [meetingItems]
  );

  const selectedMeeting = meetings.find((m) => String(m.id) === String(selectedMeetingId));

  const [bulkConsolidate, { isLoading: consolidating }] = useBulkConsolidateMutation();
  const [bulkReturn, { isLoading: returning }] = useBulkReturnRNAMutation();
  const [bulkConsolidateSuppl, { isLoading: consolidatingSuppl }] = useBulkConsolidateSupplementaryMutation();
  const [toggleSupplementary, { isLoading: togglingSuppl }] = useToggleSupplementaryMutation();

  const busy = consolidating || returning || consolidatingSuppl || togglingSuppl;

  // Pending items checkbox logic
  const allPendingChecked = pendingItems.length > 0 && selectedIds.length === pendingItems.length;
  const somePendingChecked = selectedIds.length > 0 && !allPendingChecked;

  const toggleAllPending = () => {
    setSelectedIds(allPendingChecked ? [] : pendingItems.map((i) => i.id));
  };
  const togglePendingItem = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  // Supplementary items checkbox logic
  const allSupplChecked = supplItems.length > 0 && selectedSupplIds.length === supplItems.length;

  const toggleAllSuppl = () => {
    setSelectedSupplIds(allSupplChecked ? [] : supplItems.map((i) => i.id));
  };
  const toggleSupplItem = (id) => {
    setSelectedSupplIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleConsolidate = async () => {
    if (!selectedIds.length) return;
    try {
      const result = await bulkConsolidate({ meetingId: selectedMeetingId, ids: selectedIds }).unwrap();
      const count = result.consolidated?.length || 0;
      dispatch(showToast({ message: `${count} item${count !== 1 ? 's' : ''} consolidated`, severity: 'success' }));
      setSelectedIds([]);
    } catch (err) {
      dispatch(showToast({ message: err?.data?.detail || 'Consolidation failed', severity: 'error' }));
    }
  };

  const handleReturn = async () => {
    if (!selectedIds.length) return;
    try {
      const result = await bulkReturn({ ids: selectedIds }).unwrap();
      const count = result.success?.length || 0;
      dispatch(showToast({ message: `${count} item${count !== 1 ? 's' : ''} returned to wing`, severity: 'info' }));
      setSelectedIds([]);
    } catch (err) {
      dispatch(showToast({ message: err?.data?.detail || 'Return failed', severity: 'error' }));
    }
  };

  const handleConsolidateSuppl = async () => {
    if (!selectedSupplIds.length) return;
    try {
      const result = await bulkConsolidateSuppl({ meetingId: selectedMeetingId, ids: selectedSupplIds }).unwrap();
      const count = result.consolidated?.length || 0;
      dispatch(showToast({ message: `${count} supplementary item${count !== 1 ? 's' : ''} consolidated; serial numbers reindexed`, severity: 'success' }));
      setSelectedSupplIds([]);
    } catch (err) {
      dispatch(showToast({ message: err?.data?.detail || 'Supplementary consolidation failed', severity: 'error' }));
    }
  };

  const handleToggleWingSuppl = async (wingId, currentlyOpen) => {
    try {
      await toggleSupplementary({ meetingId: selectedMeetingId, wingIds: [wingId], open: !currentlyOpen }).unwrap();
      dispatch(showToast({
        message: `Supplementary ${!currentlyOpen ? 'opened' : 'closed'} for wing`,
        severity: 'success',
      }));
    } catch (err) {
      dispatch(showToast({ message: err?.data?.detail || 'Toggle failed', severity: 'error' }));
    }
  };

  // Unique wings from all items in the selected meeting for supplementary toggle panel
  const meetingWings = useMemo(() => {
    const seen = new Map();
    meetingItems.forEach((item) => {
      if (item.wing && !seen.has(item.wing.id)) seen.set(item.wing.id, item.wing);
    });
    return Array.from(seen.values()).sort((a, b) => (a.priority_order || 0) - (b.priority_order || 0));
  }, [meetingItems]);

  const openWingIds = useMemo(
    () => new Set(selectedMeeting?.supplementary_open_wings || []),
    [selectedMeeting]
  );

  return (
    <Box>
      <PageHeader
        title={`Welcome, ${currentUser?.user?.first_name || currentUser?.full_name?.split(' ')[0] || 'R&A'}`}
        subtitle="Records & Archives Wing"
      />

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Wing Approved" value={wingApprovedCount} color="#059669" isLoading={allLoading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Pending R&A Review" value={pendingRNACount} color="#7C3AED" isLoading={allLoading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Consolidated" value={consolidatedCount} color="#1D4ED8" isLoading={allLoading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Supplementary Pending" value={supplPendingCount} color="#D97706" isLoading={allLoading} />
        </Grid>
      </Grid>

      {/* Meeting selector */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Select Meeting</Typography>
          <FormControl fullWidth size="small">
            <InputLabel>Meeting</InputLabel>
            <Select
              value={selectedMeetingId}
              label="Meeting"
              onChange={(e) => {
                setSelectedMeetingId(e.target.value);
                setSelectedIds([]);
                setSelectedSupplIds([]);
              }}
              disabled={meetingsLoading}
            >
              <MenuItem value=""><em>— Choose a meeting —</em></MenuItem>
              {meetings.map((m) => (
                <MenuItem key={m.id} value={String(m.id)}>
                  {m.title} <Chip label={m.status} size="small" sx={{ ml: 1 }} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {selectedMeetingId && (
        <Card>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
            <Tab label={`Pending RNA (${pendingItems.length})`} />
            <Tab label={`Supplementary (${supplItems.length})`} />
            <Tab label="Wing Windows" />
          </Tabs>

          {/* Tab 0 — PENDING_RNA items */}
          {activeTab === 0 && (
            <CardContent>
              {itemsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
              ) : pendingItems.length === 0 ? (
                <Alert severity="info">No items pending R&A review for this meeting.</Alert>
              ) : (
                <>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                      {selectedIds.length} of {pendingItems.length} selected
                    </Typography>
                    <ButtonGroup variant="contained" size="small" disabled={busy || !selectedIds.length}>
                      <Button
                        startIcon={consolidating ? <CircularProgress size={14} color="inherit" /> : <CheckCircleIcon />}
                        onClick={handleConsolidate}
                        color="primary"
                      >
                        Consolidate Selected
                      </Button>
                      <Button
                        startIcon={returning ? <CircularProgress size={14} color="inherit" /> : <UndoIcon />}
                        onClick={handleReturn}
                        color="warning"
                      >
                        Return to Wing
                      </Button>
                    </ButtonGroup>
                  </Box>

                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={allPendingChecked}
                            indeterminate={somePendingChecked}
                            onChange={toggleAllPending}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Wing</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Topic</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>File No.</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendingItems.map((item) => (
                        <TableRow
                          key={item.id}
                          hover
                          onClick={() => togglePendingItem(item.id)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedIds.includes(item.id)}
                              onChange={() => togglePendingItem(item.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>{item.wing?.name || '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.topic}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{item.file_number || '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <StatusChip status={item.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          )}

          {/* Tab 1 — Supplementary items */}
          {activeTab === 1 && (
            <CardContent>
              {itemsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
              ) : supplItems.length === 0 ? (
                <Alert severity="info">No supplementary items pending for this meeting.</Alert>
              ) : (
                <>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Consolidating supplementary items assigns new agenda numbers and reindexes all serial numbers for this meeting.
                  </Alert>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                      {selectedSupplIds.length} of {supplItems.length} selected
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      color="primary"
                      startIcon={consolidatingSuppl ? <CircularProgress size={14} color="inherit" /> : <CheckCircleIcon />}
                      onClick={handleConsolidateSuppl}
                      disabled={busy || !selectedSupplIds.length}
                    >
                      Consolidate & Reindex
                    </Button>
                  </Box>

                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={allSupplChecked}
                            indeterminate={selectedSupplIds.length > 0 && !allSupplChecked}
                            onChange={toggleAllSuppl}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Wing</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Topic</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {supplItems.map((item) => (
                        <TableRow
                          key={item.id}
                          hover
                          onClick={() => toggleSupplItem(item.id)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedSupplIds.includes(item.id)}
                              onChange={() => toggleSupplItem(item.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>{item.wing?.name || '—'}</Typography>
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
                </>
              )}
            </CardContent>
          )}

          {/* Tab 2 — Wing supplementary windows */}
          {activeTab === 2 && (
            <CardContent>
              <Alert severity="info" sx={{ mb: 2 }}>
                Toggle supplementary submission windows per wing. Open wings can submit new items for this meeting after finalization.
              </Alert>
              {itemsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
              ) : meetingWings.length === 0 ? (
                <Alert severity="warning">No wings have submitted items for this meeting yet.</Alert>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Wing</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Supplementary Open</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {meetingWings.map((wing) => {
                      const isOpen = openWingIds.has(wing.id);
                      return (
                        <TableRow key={wing.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>{wing.name}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{wing.priority_order ?? '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={isOpen}
                                  onChange={() => handleToggleWingSuppl(wing.id, isOpen)}
                                  disabled={togglingSuppl}
                                  color="primary"
                                />
                              }
                              label={isOpen ? 'Open' : 'Closed'}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          )}
        </Card>
      )}
    </Box>
  );
};
