import { useState } from 'react';
import Box from '@mui/material/Box';
import { DataGrid } from '@mui/x-data-grid';
import { format } from 'date-fns';
import { useGetAuditLogsQuery } from '../../store/api/configApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';

export const AuditLogPage = () => {
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });

  const { data, isLoading } = useGetAuditLogsQuery({
    page: paginationModel.page + 1,
    page_size: paginationModel.pageSize,
  });

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
      field: 'actor',
      headerName: 'Actor',
      width: 160,
      valueGetter: (value) => typeof value === 'object' ? (value?.full_name || `${value?.user?.first_name || ''} ${value?.user?.last_name || ''}`.trim() || value?.username) : value || '—',
    },
    { field: 'action', headerName: 'Action', width: 160 },
    {
      field: 'target',
      headerName: 'Target',
      width: 160,
      valueGetter: (value) => typeof value === 'object' ? JSON.stringify(value) : value || '—',
    },
    { field: 'description', headerName: 'Description', flex: 1, minWidth: 200 },
  ];

  return (
    <Box>
      <PageHeader
        title="Audit Log - To be developed"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Audit Log' }]}
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
