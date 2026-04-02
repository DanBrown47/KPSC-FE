import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import { format } from 'date-fns';
import { useGetMeetingsQuery } from '../../store/api/meetingsApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { StatusChip } from '../../components/common/StatusChip.jsx';
import { usePermissions } from '../../hooks/usePermissions.js';

export const MeetingListPage = () => {
  const navigate = useNavigate();
  const { isChairmanPS } = usePermissions();
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
          isChairmanPS && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/calendar')}>
              Schedule Meeting
            </Button>
          )
        }
      />
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
    </Box>
  );
};
