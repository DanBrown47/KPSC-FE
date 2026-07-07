import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import { DataGrid } from '@mui/x-data-grid';
import { format } from 'date-fns';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { useGetAuditLogsQuery } from '../../store/api/configApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';

const STREAM_OPTIONS = [
  { value: '', label: 'All Streams' },
  { value: 'AGENDA_LOG', label: 'Agenda' },
  { value: 'USER_LOG', label: 'User' },
  { value: 'CONFIG_LOG', label: 'Config' },
  { value: 'MEETING_LOG', label: 'Meeting' },
];

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'STATE_CHANGE', label: 'State Change' },
  { value: 'FILE_VIEW', label: 'File View' },
  { value: 'PERMISSION_CHANGE', label: 'Permission Change' },
  { value: 'CONFIG_CHANGE', label: 'Config Change' },
];

export const AuditLogPage = () => {
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [filters, setFilters] = useState({
    search: '',
    stream: '',
    action: '',
    date_from: '',
    date_to: '',
  });

  const handleFilterChange = useCallback((field) => (e) => {
    setFilters((prev) => ({ ...prev, [field]: e.target.value }));
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, []);

  const handleClearSearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, search: '' }));
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, []);

  const queryParams = {
    page: paginationModel.page + 1,
    page_size: paginationModel.pageSize,
    ...(filters.search && { search: filters.search }),
    ...(filters.stream && { stream: filters.stream }),
    ...(filters.action && { action: filters.action }),
    ...(filters.date_from && { date_from: filters.date_from }),
    ...(filters.date_to && { date_to: filters.date_to }),
  };

  const { data, isLoading } = useGetAuditLogsQuery(queryParams);

  const rows = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
  const rowCount = data?.count || rows.length;

  const columns = [
    {
      field: 'timestamp',
      headerName: 'Timestamp',
      width: 180,
      valueFormatter: (value) => value ? format(new Date(value), 'dd MMM yyyy HH:mm') : '—',
    },
    {
      field: 'userId',
      headerName: 'User ID',
      width: 180,
      renderCell: ({ row }) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>{row.actor_name || '—'}</Typography>
          {row.username && <Typography variant="caption" color="text.secondary">{row.username}</Typography>}
        </Box>
      ),
    },
    { field: 'action', headerName: 'Action', width: 160 },
    { field: 'description', headerName: 'Description', flex: 1, minWidth: 200 },
  ];

  return (
    <Box>
      <PageHeader
        title="Audit Log"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Audit Log' }]}
      />
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search description or user…"
          value={filters.search}
          onChange={handleFilterChange('search')}
          size="small"
          sx={{ minWidth: 260, flex: 1 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
            endAdornment: filters.search ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClearSearch}><ClearIcon fontSize="small" /></IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
        <TextField
          select
          label="Stream"
          value={filters.stream}
          onChange={handleFilterChange('stream')}
          size="small"
          sx={{ minWidth: 160 }}
        >
          {STREAM_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>
        <TextField
          select
          label="Action"
          value={filters.action}
          onChange={handleFilterChange('action')}
          size="small"
          sx={{ minWidth: 160 }}
        >
          {ACTION_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>
        <TextField
          label="From"
          type="date"
          value={filters.date_from}
          onChange={handleFilterChange('date_from')}
          size="small"
          sx={{ minWidth: 160 }}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="To"
          type="date"
          value={filters.date_to}
          onChange={handleFilterChange('date_to')}
          size="small"
          sx={{ minWidth: 160 }}
          InputLabelProps={{ shrink: true }}
        />
      </Box>
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