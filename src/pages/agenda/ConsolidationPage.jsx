import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetAgendaItemsQuery, useConsolidateMutation, useBulkApproveRNAMutation } from '../../store/api/agendaApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { StatusChip } from '../../components/common/StatusChip.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice.js';
import MergeIcon from '@mui/icons-material/Merge';

export const ConsolidationPage = () => {
  const dispatch = useDispatch();
  const [selected, setSelected] = useState([]);
  const [serialNumbers, setSerialNumbers] = useState({});

  const { data, isLoading } = useGetAgendaItemsQuery({ status: 'PENDING_RNA', limit: 100 });
  const items = data?.results || data || [];

  const [consolidate] = useConsolidateMutation();
  const [bulkApprove] = useBulkApproveRNAMutation();

  const handleBulkApprove = async () => {
    try {
      await bulkApprove(selected).unwrap();
      dispatch(showToast({ message: `${selected.length} items approved for R&A`, severity: 'success' }));
      setSelected([]);
    } catch {
      dispatch(showToast({ message: 'Bulk approve failed', severity: 'error' }));
    }
  };

  const handleConsolidate = async (item) => {
    const serialNumber = serialNumbers[item.id];
    try {
      await consolidate({ id: item.id, serialNumber }).unwrap();
      dispatch(showToast({ message: `Item consolidated${serialNumber ? ` as #${serialNumber}` : ''}`, severity: 'success' }));
    } catch {
      dispatch(showToast({ message: 'Consolidation failed', severity: 'error' }));
    }
  };

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <PageHeader
        title="Consolidation"
        breadcrumbs={[{ label: 'Consolidation' }]}
        actions={
          selected.length > 0 && (
            <Button variant="contained" color="primary" onClick={handleBulkApprove}>
              Bulk Approve ({selected.length})
            </Button>
          )
        }
      />
      {items.length === 0 ? (
        <EmptyState
          icon={MergeIcon}
          title="No items pending R&A review"
          description="All items have been processed."
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Checkbox
                    checked={selected.includes(item.id)}
                    onChange={(e) => {
                      setSelected((prev) =>
                        e.target.checked ? [...prev, item.id] : prev.filter((id) => id !== item.id)
                      );
                    }}
                    sx={{ mt: -0.5 }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                      <Typography variant="h5">{item.topic}</Typography>
                      <StatusChip status={item.status} />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {item.wing?.name || '—'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                    <TextField
                      size="small"
                      label="Serial No."
                      placeholder="e.g. 42"
                      value={serialNumbers[item.id] || ''}
                      onChange={(e) => setSerialNumbers((p) => ({ ...p, [item.id]: e.target.value }))}
                      sx={{ width: 120 }}
                      type="number"
                    />
                    <Button variant="contained" size="small" onClick={() => handleConsolidate(item)}>
                      Consolidate
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};
