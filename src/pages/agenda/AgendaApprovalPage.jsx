import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import { useGetAgendaItemsQuery, useApproveWingMutation, useReturnFromWingMutation, useApproveRNAMutation, useReturnFromRNAMutation, useBulkApproveRNAMutation } from '../../store/api/agendaApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { StatusChip } from '../../components/common/StatusChip.jsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { usePermissions } from '../../hooks/usePermissions.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice.js';
import { useNavigate } from 'react-router-dom';
import PendingActionsIcon from '@mui/icons-material/PendingActions';

export const AgendaApprovalPage = () => {
  const { isWingASJS, isRNAASJS } = usePermissions();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [returnDialog, setReturnDialog] = useState({ open: false, item: null, type: null });
  const [selected, setSelected] = useState([]);

  const statusFilter = isRNAASJS ? 'PENDING_RNA' : 'PENDING_WING_APPROVAL';
  const { data, isLoading } = useGetAgendaItemsQuery({ status: statusFilter, limit: 100 });
  const items = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];

  const [approveWing] = useApproveWingMutation();
  const [returnFromWing] = useReturnFromWingMutation();
  const [approveRNA] = useApproveRNAMutation();
  const [returnFromRNA] = useReturnFromRNAMutation();
  const [bulkApproveRNA] = useBulkApproveRNAMutation();

  const handleApprove = async (item) => {
    try {
      if (isRNAASJS) {
        await approveRNA(item.id).unwrap();
      } else {
        await approveWing(item.id).unwrap();
      }
      dispatch(showToast({ message: 'Item approved successfully', severity: 'success' }));
    } catch {
      dispatch(showToast({ message: 'Failed to approve item', severity: 'error' }));
    }
  };

  const handleReturn = async (reason) => {
    const { item, type } = returnDialog;
    try {
      if (type === 'rna') {
        await returnFromRNA({ id: item.id, reason }).unwrap();
      } else {
        await returnFromWing({ id: item.id, reason }).unwrap();
      }
      dispatch(showToast({ message: 'Item returned with reason', severity: 'info' }));
    } catch {
      dispatch(showToast({ message: 'Failed to return item', severity: 'error' }));
    }
    setReturnDialog({ open: false, item: null, type: null });
  };

  const handleBulkApprove = async () => {
    try {
      await bulkApproveRNA(selected).unwrap();
      dispatch(showToast({ message: `${selected.length} items approved`, severity: 'success' }));
      setSelected([]);
    } catch {
      dispatch(showToast({ message: 'Bulk approve failed', severity: 'error' }));
    }
  };

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <PageHeader
        title="Approvals"
        breadcrumbs={[{ label: 'Approvals' }]}
        actions={
          isRNAASJS && selected.length > 0 && (
            <Button variant="contained" color="success" onClick={handleBulkApprove}>
              Approve All ({selected.length})
            </Button>
          )
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={PendingActionsIcon}
          title="No pending items"
          description="All items have been reviewed."
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  {isRNAASJS && (
                    <Checkbox
                      checked={selected.includes(item.id)}
                      onChange={(e) => {
                        setSelected((prev) =>
                          e.target.checked ? [...prev, item.id] : prev.filter((id) => id !== item.id)
                        );
                      }}
                      sx={{ mt: -0.5 }}
                    />
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
                      <Typography variant="h5" sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }} onClick={() => navigate(`/agenda/${item.id}`)}>
                        {item.topic}
                      </Typography>
                      <StatusChip status={item.status} />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {item.wing?.name || '—'} · Created {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
                    </Typography>
                    {item.return_comment && (
                      <Box sx={{ mt: 1, p: 1.5, bgcolor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 1 }}>
                        <Typography variant="caption" sx={{ color: '#92400E', fontWeight: 600 }}>Previously Returned:</Typography>
                        <Typography variant="body2" sx={{ color: '#78350F', mt: 0.25 }}>{item.return_comment}</Typography>
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={() => handleApprove(item)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => setReturnDialog({ open: true, item, type: isRNAASJS ? 'rna' : 'wing' })}
                    >
                      Return
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <ConfirmDialog
        open={returnDialog.open}
        onClose={() => setReturnDialog({ open: false, item: null, type: null })}
        onConfirm={handleReturn}
        title="Return Agenda Item"
        message={`Return "${returnDialog.item?.topic}" for revision. Please provide a reason.`}
        variant="destructive"
        confirmLabel="Return Item"
      />
    </Box>
  );
};
