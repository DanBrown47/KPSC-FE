import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import DownloadIcon from '@mui/icons-material/Download';
import BarChartIcon from '@mui/icons-material/BarChart';
import RefreshIcon from '@mui/icons-material/Refresh';
import { format } from 'date-fns';
import { useGetMeetingsQuery } from '../../store/api/meetingsApi.js';
import { useGenerateReportMutation, useGetReportsQuery, useGetReportStatusQuery } from '../../store/api/reportsApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice.js';

const REPORT_TYPES = [
  { value: 'AGENDA_SUMMARY', label: 'Agenda Summary' },
  { value: 'DECISION_SUMMARY', label: 'Decision Summary' },
  { value: 'MINUTES', label: 'Minutes of Meeting' },
];

const STATUS_COLOR = {
  PENDING: 'default',
  PROCESSING: 'info',
  COMPLETED: 'success',
  FAILED: 'error',
};

const ReportStatusRow = ({ report }) => {
  const isPending = ['PENDING', 'PROCESSING'].includes(report.status);
  const { data: live } = useGetReportStatusQuery(report.id, {
    skip: !isPending,
    pollingInterval: isPending ? 3000 : 0,
  });
  const current = live || report;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, borderBottom: '1px solid #F1F5F9' }}>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" fontWeight={500}>{current.meeting_title}</Typography>
        <Typography variant="caption" color="text.secondary">
          {REPORT_TYPES.find((r) => r.value === current.report_type)?.label || current.report_type}
          {' · '}
          {current.created_at ? format(new Date(current.created_at), 'dd MMM yyyy HH:mm') : ''}
        </Typography>
      </Box>
      <Chip
        label={current.status}
        size="small"
        color={STATUS_COLOR[current.status] || 'default'}
      />
      {current.status === 'COMPLETED' && current.download_url && (
        <Button
          size="small"
          variant="outlined"
          startIcon={<DownloadIcon />}
          href={current.download_url}
          download
        >
          CSV
        </Button>
      )}
      {['PENDING', 'PROCESSING'].includes(current.status) && (
        <CircularProgress size={16} />
      )}
    </Box>
  );
};

export const ReportsPage = () => {
  const dispatch = useDispatch();
  const [meetingId, setMeetingId] = useState('');
  const [reportType, setReportType] = useState('AGENDA_SUMMARY');

  const { data: meetingsData } = useGetMeetingsQuery({ limit: 100 });
  const meetings = Array.isArray(meetingsData?.results) ? meetingsData.results : Array.isArray(meetingsData) ? meetingsData : [];

  const { data: reportsData, refetch } = useGetReportsQuery({});
  const reports = Array.isArray(reportsData?.results) ? reportsData.results : [];

  const [generateReport, { isLoading: generating }] = useGenerateReportMutation();

  const handleGenerate = async () => {
    if (!meetingId || !reportType) return;
    try {
      await generateReport({ meetingId, reportType }).unwrap();
      dispatch(showToast({ message: 'Report queued — it will appear below when ready', severity: 'info' }));
      setMeetingId('');
    } catch (err) {
      dispatch(showToast({ message: err?.data?.detail || 'Failed to queue report', severity: 'error' }));
    }
  };

  return (
    <Box>
      <PageHeader title="Reports" breadcrumbs={[{ label: 'Reports' }]} />

      <Card sx={{ maxWidth: 600, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>Generate Report</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              select
              label="Meeting"
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              fullWidth
              required
            >
              <MenuItem value="">Select a meeting...</MenuItem>
              {meetings.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.title}
                  {m.sitting_date ? ` — ${format(new Date(m.sitting_date), 'dd MMM yyyy')}` : ''}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Report Type"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              fullWidth
              required
            >
              {REPORT_TYPES.map((r) => (
                <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <BarChartIcon />}
              onClick={handleGenerate}
              disabled={!meetingId || !reportType || generating}
              fullWidth
              size="large"
            >
              {generating ? 'Queuing...' : 'Generate Report'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Report history */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h5">Report History</Typography>
            <Button size="small" startIcon={<RefreshIcon />} onClick={refetch}>Refresh</Button>
          </Box>
          <Divider sx={{ mb: 1 }} />
          {reports.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              No reports generated yet.
            </Typography>
          ) : (
            reports.map((r) => <ReportStatusRow key={r.id} report={r} />)
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
