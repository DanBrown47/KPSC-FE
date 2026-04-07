import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import { format } from 'date-fns';
import { useGetMeetingsQuery } from '../../store/api/meetingsApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { StatusChip } from '../../components/common/StatusChip.jsx';
import { ViewToggle } from '../../components/common/ViewToggle.jsx';
import { usePermissions } from '../../hooks/usePermissions.js';
import { useViewPreference } from '../../hooks/useViewPreference.js';

export const MeetingListPage = () => {
  const navigate = useNavigate();
  const { isChairmanPS } = usePermissions();
  const { viewMode, setViewMode } = useViewPreference('meetings');
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });

  const { data, isLoading } = useGetMeetingsQuery({
    page: paginationModel.page + 1,
    page_size: paginationModel.pageSize,
  });

  const rows = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
  const rowCount = data?.count || rows.length;

  const columns = [
    { field: 'title', headerName: 'Title', flex: 2, minWidth: 200 },
    {
      field: 'sitting_date',
      headerName: 'Date',
      width: 150,
      valueFormatter: (value) => value ? format(new Date(value), 'dd MMM yyyy') : '—',
    },
    { field: 'venue', headerName: 'Venue', flex: 1, minWidth: 120 },
    {
      field: 'status',
      headerName: 'Status',
      width: 160,
      renderCell: ({ value }) => <StatusChip status={value} />,
    },
    {
      field: 'agenda_item_count',
      headerName: 'Agenda Items',
      width: 130,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'actions',
      headerName: '',
      width: 120,
      sortable: false,
      renderCell: ({ row }) => (
        <Button size="small" onClick={() => navigate(`/meetings/${row.id}`)}>View</Button>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Meetings"
        breadcrumbs={[{ label: 'Meetings' }]}
        actions={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <ViewToggle viewMode={viewMode} onChange={setViewMode} />
            {isChairmanPS && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/calendar')}>
                Schedule Meeting
              </Button>
            )}
          </Box>
        }
      />

      {viewMode === 'list' ? (
        <DataGrid
          rows={rows}
          columns={columns}
          rowCount={rowCount}
          loading={isLoading}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
          autoHeight
          sx={{ bgcolor: 'background.paper' }}
        />
      ) : (
        <Grid container spacing={2}>
          {rows.map((row) => (
            <Grid key={row.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardActionArea onClick={() => navigate(`/meetings/${row.id}`)} sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <StatusChip status={row.status} />
                      {row.agenda_item_count != null && (
                        <Chip label={`${row.agenda_item_count} items`} size="small" variant="outlined" />
                      )}
                    </Box>
                    <Typography variant="body1" fontWeight={600} gutterBottom sx={{ lineHeight: 1.4 }}>
                      {row.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.sitting_date ? format(new Date(row.sitting_date), 'dd MMM yyyy') : '—'}
                      {row.venue ? ` · ${row.venue}` : ''}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};
