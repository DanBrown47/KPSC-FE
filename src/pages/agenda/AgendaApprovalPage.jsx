import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { useGetAgendaItemsQuery, useApproveWingMutation, useReturnFromWingMutation, useReturnFromRNAMutation } from '../../store/api/agendaApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { StatusChip } from '../../components/common/StatusChip.jsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { usePermissions } from '../../hooks/usePermissions.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice.js';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import MergeIcon from '@mui/icons-material/Merge';

export const AgendaApprovalPage = () => {
  const { isWingASJS, isRNAASJS } = usePermissions();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [returnDialog, setReturnDialog] = useState({ open: false, item: null, type: null });

  // RNA_ASJS sees PENDING_RNA items — these are consolidated via ConsolidationPage, not approved here
  // Wing AS/JS sees PENDING_WING_APPROVAL items for their wing
  const statusFilter = isRNAASJS ? 'PENDING_RNA' : 'PENDING_WING_APPROVAL';
  const { data, isLoading } = useGetAgendaItemsQuery({ status: statusFilter, limit: 100 });
  const items = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];

  const [approveWing] = useApproveWingMutation();
  const [returnFromWing] = useReturnFromWingMutation();
  const [returnFromRNA] = useReturnFromRNAMutation();

  const handleApprove = async (item) => {
    try {
      await approveWing(item.id).unwrap();
      dispatch(showToast({ message: 'Item approved — entered R&A queue', severity: 'success' }));
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

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  // RNA_ASJS: redirect them to Consolidation — no per-item approve needed
  if (isRNAASJS) {
    return (
      <Box>
        <PageHeader title="R&A Queue" breadcrumbs={[{ label: 'R&A Queue' }]} />
        {items.length === 0 ? (
          <EmptyState
            icon={PendingActionsIcon}
            title="No items pending R&A"
            description="All items have been consolidated or the queue is empty."
          />
        ) : (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              {items.length} item{items.length !== 1 ? 's' : ''} are ready for consolidation.
              Use the Consolidation page to assign serial numbers and finalize the agenda.
            </Alert>
            <Button
              variant="contained"
              startIcon={<MergeIcon />}
              onClick={() => navigate('/agenda/consolidation')}
              sx={{ mb: 3 }}
            >
              Go to Consolidation
            </Button>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {items.map((item) => (
                <Card key={item.id} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                          <Typography
                            variant="h5"
                            sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                            onClick={() => navigate(`/agenda/${item.id}`)}
                          >
                            {item.topic}
                          </Typography>
                          <StatusChip status={item.status} />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {item.wing?.name || '—'} · {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
                        </Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => setReturnDialog({ open: true, item, type: 'rna' })}
                      >
                        Return
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </>
        )}
        <ConfirmDialog
          open={returnDialog.open}
          onClose={() => setReturnDialog({ open: false, item: null, type: null })}
          onConfirm={handleReturn}
          title="Return to Wing"
          message={`Return "${returnDialog.item?.topic}" to wing for revision. Please provide a reason.`}
          variant="destructive"
          confirmLabel="Return Item"
        />
      </Box>
    );
  }

  // Wing AS/JS: approve or return items pending wing approval
  return (
    <Box>
      <PageHeader title="Approvals" breadcrumbs={[{ label: 'Approvals' }]} />

      {items.length === 0 ? (
        <EmptyState
          icon={PendingActionsIcon}
          title="No pending items"
          description="All items from your wing have been reviewed."
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
                      <Typography
                        variant="h5"
                        sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                        onClick={() => navigate(`/agenda/${item.id}`)}
                      >
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
                    {item.form_data && Object.keys(item.form_data).length > 0 && (
                      <Box sx={{ mt: 1.5 }}>
                        <Divider sx={{ mb: 1 }} />
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {item.form_data.subject && (
                            <Box sx={{ width: '100%' }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>Subject</Typography>
                              <Typography variant="body2" sx={{ mt: 0.25 }}>
                                {item.form_data.subject.length > 200
                                  ? `${item.form_data.subject.slice(0, 200)}…`
                                  : item.form_data.subject}
                              </Typography>
                            </Box>
                          )}
                          {Object.entries(item.form_data)
                            .filter(([k]) => k !== 'subject' && k !== 'remarks_proposal' && k !== 'remarks_proposals')
                            .slice(0, 4)
                            .map(([k, v]) => v !== '' && v !== null && v !== undefined ? (
                              <Chip
                                key={k}
                                label={`${k.replace(/_/g, ' ')}: ${v}`}
                                size="small"
                                variant="outlined"
                                sx={{ textTransform: 'capitalize', fontSize: '0.7rem' }}
                              />
                            ) : null)}
                        </Box>
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                    <Button variant="contained" color="success" size="small" onClick={() => handleApprove(item)}>
                      Approve
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => setReturnDialog({ open: true, item, type: 'wing' })}
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
