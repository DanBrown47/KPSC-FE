import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import { format } from 'date-fns';
import { useGetAgendaItemsQuery } from '../../store/api/agendaApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { StatusChip } from '../../components/common/StatusChip.jsx';
import { ViewToggle } from '../../components/common/ViewToggle.jsx';
import { usePermissions } from '../../hooks/usePermissions.js';
import { useViewPreference } from '../../hooks/useViewPreference.js';
import { shouldShowSerialNumber } from '../../utils/serialNumberUtils.js';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_WING_APPROVAL', label: 'Pending Wing Approval' },
  { value: 'WING_APPROVED', label: 'Wing Approved' },
  { value: 'PENDING_RNA', label: 'Pending R&A' },
  { value: 'CONSOLIDATED', label: 'Consolidated' },
  { value: 'FINALIZED', label: 'Finalized' },
  { value: 'VOTED', label: 'Voted' },
  { value: 'CHAIRMAN_DECIDED', label: 'Chairman Decided' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export const AgendaManagementPage = () => {
  const navigate = useNavigate();
  const { isWingMember, currentUser } = usePermissions();
  const { viewMode, setViewMode } = useViewPreference('agenda');
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useGetAgendaItemsQuery({
    page: paginationModel.page + 1,
    page_size: paginationModel.pageSize,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const rows = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
  const rowCount = data?.count || rows.length;

  const columns = [
    {
      field: 'serial_number',
      headerName: 'Serial No.',
      width: 110,
      renderCell: ({ row }) => {
        const show = shouldShowSerialNumber(row, row.meeting, currentUser);
        return show && row.serial_number ? (
          <Chip label={row.serial_number} size="small" sx={{ bgcolor: '#F0B429', color: '#0F1F3D', fontWeight: 700 }} />
        ) : (
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>—</span>
        );
      },
    },
    {
      field: 'topic',
      headerName: 'Topic',
      flex: 2,
      minWidth: 200,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.topic}</span>
          {row.is_supplementary && (
            <Chip label="Supplementary" size="small" sx={{ bgcolor: '#F5F3FF', color: '#7C3AED', fontWeight: 600, fontSize: '0.625rem', height: 18 }} />
          )}
        </Box>
      ),
    },
    {
      field: 'wing',
      headerName: 'Wing',
      width: 140,
      valueGetter: (value) => value?.name || value || '—',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 180,
      renderCell: ({ value }) => <StatusChip status={value} />,
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 120,
      valueFormatter: (value) => value ? format(new Date(value), 'dd MMM yyyy') : '—',
    },
    {
      field: 'actions',
      headerName: '',
      width: 80,
      sortable: false,
      renderCell: ({ row }) => (
        <Button size="small" onClick={() => navigate(`/agenda/${row.id}`)}>View</Button>
      ),
    },
  ];

  const handleSearch = () => setSearch(searchInput);

  return (
    <Box>
      <PageHeader
        title="Agenda Items"
        breadcrumbs={[{ label: 'Agenda Items' }]}
        actions={
          isWingMember && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/agenda/create')}>
              New Item
            </Button>
          )
        }
      />

      {/* Toolbar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search subjects..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          sx={{ width: 280 }}
        />
        <Button variant="outlined" onClick={handleSearch}>Search</Button>
        <TextField
          select
          size="small"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ width: 200 }}
          label="Status"
        >
          {STATUS_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
          ))}
        </TextField>
        <Box sx={{ ml: 'auto' }}>
          <ViewToggle viewMode={viewMode} onChange={setViewMode} />
        </Box>
      </Box>

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
          {rows.map((row) => {
            const showSerial = shouldShowSerialNumber(row, row.meeting, currentUser);
            return (
              <Grid key={row.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardActionArea onClick={() => navigate(`/agenda/${row.id}`)} sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                        {showSerial && row.serial_number && (
                          <Chip label={`#${row.serial_number}`} size="small" sx={{ bgcolor: '#F0B429', color: '#0F1F3D', fontWeight: 700, flexShrink: 0 }} />
                        )}
                        <StatusChip status={row.status} />
                        {row.is_supplementary && (
                          <Chip label="Supp." size="small" sx={{ bgcolor: '#F5F3FF', color: '#7C3AED', fontWeight: 600, fontSize: '0.625rem', height: 18, flexShrink: 0 }} />
                        )}
                      </Box>
                      <Typography variant="body1" fontWeight={600} gutterBottom sx={{ lineHeight: 1.4 }}>
                        {row.topic}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.wing?.name || '—'} · {row.created_at ? format(new Date(row.created_at), 'dd MMM yyyy') : '—'}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};
