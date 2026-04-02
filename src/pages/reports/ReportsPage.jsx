import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import LinearProgress from '@mui/material/LinearProgress';
import DownloadIcon from '@mui/icons-material/Download';
import BarChartIcon from '@mui/icons-material/BarChart';
import { useGetMeetingsQuery } from '../../store/api/meetingsApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { useReportGeneration } from '../../hooks/useReportGeneration.js';

const REPORT_TYPES = [
  { value: 'AGENDA', label: 'Agenda Report' },
  { value: 'MINUTES', label: 'Minutes of Meeting' },
  { value: 'DECISIONS', label: 'Decisions Report' },
  { value: 'ATTENDANCE', label: 'Attendance Report' },
];

export const ReportsPage = () => {
  const [meetingId, setMeetingId] = useState('');
  const [reportType, setReportType] = useState('AGENDA');
  const { startGeneration, status, downloadUrl, reset } = useReportGeneration();

  const { data: meetingsData } = useGetMeetingsQuery({ limit: 50 });
  const meetings = Array.isArray(meetingsData?.results) ? meetingsData.results : Array.isArray(meetingsData) ? meetingsData : [];

  const handleGenerate = () => {
    if (!meetingId || !reportType) return;
    startGeneration({ meetingId, reportType });
  };

  return (
    <Box>
      <PageHeader
        title="Reports"
        breadcrumbs={[{ label: 'Reports' }]}
      />
      <Card sx={{ maxWidth: 600 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>Generate Report</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              select
              label="Meeting"
              value={meetingId}
              onChange={(e) => { setMeetingId(e.target.value); reset(); }}
              fullWidth
              required
            >
              <MenuItem value="">Select a meeting...</MenuItem>
              {meetings.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.title} — {m.sitting_date ? new Date(m.sitting_date).toLocaleDateString() : '—'}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Report Type"
              value={reportType}
              onChange={(e) => { setReportType(e.target.value); reset(); }}
              fullWidth
              required
            >
              {REPORT_TYPES.map((r) => (
                <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
              ))}
            </TextField>

            {status === 'generating' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LinearProgress sx={{ flex: 1 }} />
                <Typography variant="caption" color="text.secondary">Generating report...</Typography>
              </Box>
            )}

            {status === 'error' && (
              <Typography variant="body2" color="error">Report generation failed. Please try again.</Typography>
            )}

            {status === 'ready' && downloadUrl ? (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" startIcon={<DownloadIcon />} href={downloadUrl} download fullWidth>
                  Download Report
                </Button>
                <Button variant="outlined" onClick={reset}>New</Button>
              </Box>
            ) : (
              <Button
                variant="contained"
                startIcon={<BarChartIcon />}
                onClick={handleGenerate}
                disabled={!meetingId || !reportType || status === 'generating'}
                fullWidth
                size="large"
              >
                {status === 'generating' ? 'Generating...' : 'Generate Report'}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
