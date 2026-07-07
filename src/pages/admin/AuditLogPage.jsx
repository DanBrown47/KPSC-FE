import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Chip from '@mui/material/Chip';
import { DataGrid } from '@mui/x-data-grid';
import { format } from 'date-fns';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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

const ACTION_COLORS = {
  LOGIN: '#16a34a',
  LOGOUT: '#6b7280',
  CREATE: '#2563eb',
  UPDATE: '#d97706',
  DELETE: '#dc2626',
  STATE_CHANGE: '#7c3aed',
  FILE_VIEW: '#0891b2',
  PERMISSION_CHANGE: '#be185d',
  CONFIG_CHANGE: '#4f46e5',
};

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

  const clearFilters = useCallback(() => {
    setFilters({ search: '', stream: '', action: '', date_from: '', date_to: '' });
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, []);

  const hasActiveFilters = filters.stream || filters.action || filters.date_from || filters.date_to;

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
      width: 170,
      valueFormatter: (value) => value ? format(new Date(value), 'dd MMM yyyy HH:mm') : '—',
    },
    {
      field: 'user_id',
      headerName: 'User',
      width: 200,
      renderCell: ({ row }) => (
        // <Box>
        //   {/* <Typography variant="body2" fontWeight={500}>{row.user_name || 'System'}</Typography> */}
        //   {row.username && <Typography variant="caption" color="text.secondary">{row.username}</Typography>}
        // </Box>
        <Typography variant="body2">{row.user_name || row.username || 'System'}</Typography>

      ),
    },
    {
      field: 'action',
      headerName: 'Action',
      width: 150,
      renderCell: ({ value }) => {
        const color = ACTION_COLORS[value] || '#6b7280';
        const label = ACTION_OPTIONS.find((o) => o.value === value)?.label || value;
        return <Chip label={label} size="small" sx={{ bgcolor: `${color}18`, color, fontWeight: 600, fontSize: '0.75rem' }} />;
      },
    },
    {
      field: 'stream',
      headerName: 'Stream',
      width: 130,
      renderCell: ({ value }) => {
        const label = STREAM_OPTIONS.find((o) => o.value === value)?.label || value;
        return <Typography variant="body2">{label}</Typography>;
      },
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1,
      minWidth: 200,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Audit Log"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Audit Log' }]}
      />
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}>
        <TextField
          placeholder="Search description or user…"
          value={filters.search}
          onChange={handleFilterChange('search')}
          size="small"
          sx={{ minWidth: 280, flex: 1 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
            endAdornment: filters.search ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClearSearch}><ClearIcon fontSize="small" /></IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
      </Box>
      <Accordion defaultExpanded={false} sx={{ mb: 2, boxShadow: 'none', border: '1px solid #E2E8F0', borderRadius: 1, '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 40, '& .MuiAccordionSummary-content': { my: 0.5, alignItems: 'center', display: 'flex', gap: 1 } }}>
          <FilterListIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography variant="body2" fontWeight={500}>Filters</Typography>
          {hasActiveFilters && (
            <Chip label="Active" size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
          )}
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              select
              label="Stream"
              value={filters.stream}
              onChange={handleFilterChange('stream')}
              size="small"
              sx={{ minWidth: 180 }}
            >
              {STREAM_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
            <TextField
              select
              label="Action"
              value={filters.action}
              onChange={handleFilterChange('action')}
              size="small"
              sx={{ minWidth: 180 }}
            >
              {ACTION_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
            <TextField
              label="From Date"
              type="date"
              value={filters.date_from}
              onChange={handleFilterChange('date_from')}
              size="small"
              sx={{ minWidth: 180 }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="To Date"
              type="date"
              value={filters.date_to}
              onChange={handleFilterChange('date_to')}
              size="small"
              sx={{ minWidth: 180 }}
              InputLabelProps={{ shrink: true }}
            />
            {hasActiveFilters && (
              <IconButton size="small" onClick={clearFilters} title="Clear all filters">
                <ClearIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
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