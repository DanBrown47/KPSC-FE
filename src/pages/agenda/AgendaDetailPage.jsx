import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import IconButton from '@mui/material/IconButton';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import VisibilityIcon from '@mui/icons-material/Visibility';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import { format } from 'date-fns';
import { useGetAgendaItemQuery, useGetAttachmentsQuery, useSubmitAgendaItemMutation, useApproveWingMutation, useReturnFromWingMutation, useApproveRNAMutation, useReturnFromRNAMutation, useUploadApprovalDocumentMutation } from '../../store/api/agendaApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { StatusChip } from '../../components/common/StatusChip.jsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx';
import { ApprovalHistory } from '../../components/agenda/ApprovalHistory.jsx';
import { PDFSidePanel } from '../../components/agenda/PDFSidePanel.jsx';
import { getAgendaActions, isItemLocked } from '../../utils/agendaActions.js';
import { getVisibleFields, FIELD_GROUPS } from '../../utils/fieldVisibility.js';
import { shouldShowSerialNumber } from '../../utils/serialNumberUtils.js';
import { usePermissions } from '../../hooks/usePermissions.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice.js';

const FieldRow = ({ label, value }) => (
  <Box sx={{ py: 1.5, display: 'flex', gap: 2, borderBottom: '1px solid #F1F5F9' }}>
    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160, flexShrink: 0, fontWeight: 500 }}>
      {label}
    </Typography>
    <Box sx={{ flex: 1 }}>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Typography variant="body2">{value || '—'}</Typography>
      ) : value || <Typography variant="body2" color="text.disabled">—</Typography>}
    </Box>
  </Box>
);

export const AgendaDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = usePermissions();

  const [returnDialog, setReturnDialog] = useState({ open: false, type: null });
  const [pdfPanel, setPdfPanel] = useState({ open: false, attachment: null });
  const approvalFileRef = useRef(null);

  const { data: item, isLoading } = useGetAgendaItemQuery(id);
  const { data: attachments } = useGetAttachmentsQuery(id, { skip: !id });

  const [submitItem, { isLoading: submitting }] = useSubmitAgendaItemMutation();
  const [approveWing] = useApproveWingMutation();
  const [returnFromWing] = useReturnFromWingMutation();
  const [approveRNA] = useApproveRNAMutation();
  const [returnFromRNA] = useReturnFromRNAMutation();
  const [uploadApprovalDocument, { isLoading: uploadingApproval }] = useUploadApprovalDocumentMutation();

  const isChairmanPS = currentUser?.global_role === 'CHAIRMAN_PS';
  const POST_DECISION_STATUSES = ['CHAIRMAN_DECIDED', 'DEFERRED', 'UNAPPROVED', 'ARCHIVED'];
  const showApprovalDoc = item && POST_DECISION_STATUSES.includes(item.status);
  const canUploadApproval = isChairmanPS && item && ['CHAIRMAN_DECIDED', 'DEFERRED', 'UNAPPROVED'].includes(item.status);

  const handleApprovalUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await uploadApprovalDocument({ agendaItemId: id, formData }).unwrap();
      dispatch(showToast({ message: 'Approval document uploaded', severity: 'success' }));
    } catch (err) {
      dispatch(showToast({ message: err?.data?.detail || 'Upload failed', severity: 'error' }));
    }
    e.target.value = '';
  };

  const actions = item ? getAgendaActions(item, currentUser) : [];
  const locked = item ? isItemLocked(item) : false;
  const visibleFields = item ? getVisibleFields(item, currentUser) : [];
  const showSerial = item ? shouldShowSerialNumber(item, item?.meeting, currentUser) : false;

  const handleAction = async (actionKey, reason) => {
    try {
      switch (actionKey) {
        case 'submit':
          await submitItem(id).unwrap();
          dispatch(showToast({ message: 'Item submitted for approval', severity: 'success' }));
          break;
        case 'approve_wing':
          await approveWing(id).unwrap();
          dispatch(showToast({ message: 'Item approved', severity: 'success' }));
          break;
        case 'return_wing':
          await returnFromWing({ id, reason }).unwrap();
          dispatch(showToast({ message: 'Item returned for revision', severity: 'info' }));
          break;
        case 'approve_rna':
          await approveRNA(id).unwrap();
          dispatch(showToast({ message: 'Item approved for R&A', severity: 'success' }));
          break;
        case 'return_rna':
          await returnFromRNA({ id, reason }).unwrap();
          dispatch(showToast({ message: 'Item returned from R&A', severity: 'info' }));
          break;
        case 'edit':
          navigate(`/agenda/${id}/edit`);
          return;
        case 'view':
        case 'view_detail':
          // Already on detail page
          return;
        default:
          break;
      }
    } catch {
      dispatch(showToast({ message: 'Action failed', severity: 'error' }));
    }
    setReturnDialog({ open: false, type: null });
  };

  const handleButtonClick = (action) => {
    if (action.key === 'return_wing' || action.key === 'return_rna') {
      setReturnDialog({ open: true, type: action.key });
    } else {
      handleAction(action.key);
    }
  };

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  if (!item) return null;

  const attachmentList = Array.isArray(attachments?.results) ? attachments.results : Array.isArray(attachments) ? attachments : [];

  return (
    <Box>
      <PageHeader
        title={item.topic}
        breadcrumbs={[{ label: 'Agenda Items', href: '/agenda' }, { label: item.topic }]}
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            {actions
              .filter((a) => !['view', 'view_detail'].includes(a.key))
              .map((action) => (
                <Button
                  key={action.key}
                  variant={action.variant}
                  color={action.color}
                  size="small"
                  onClick={() => handleButtonClick(action)}
                  disabled={submitting}
                >
                  {action.label}
                </Button>
              ))}
          </Box>
        }
      />

      {/* Return reason banner */}
      {item.status === 'DRAFT' && item.return_comment && (
        <Box sx={{ mb: 3, p: 2, bgcolor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 2 }}>
          <Typography variant="body2" sx={{ color: '#92400E', fontWeight: 600, mb: 0.5 }}>
            This item was returned for revision:
          </Typography>
          <Typography variant="body2" sx={{ color: '#78350F' }}>{item.return_comment}</Typography>
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Main content */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                {showSerial && item.serial_number && (
                  <Chip label={`#${item.serial_number}`} sx={{ bgcolor: '#F0B429', color: '#0F1F3D', fontWeight: 700 }} />
                )}
                {item.is_supplementary && (
                  <Chip label="Supplementary" size="small" sx={{ bgcolor: '#F5F3FF', color: '#7C3AED', fontWeight: 600 }} />
                )}
                <StatusChip status={item.status} />
              </Box>

              {/* Base fields */}
              {visibleFields.includes(FIELD_GROUPS.BASE) && (
                <>
                  <FieldRow label="Wing" value={item.wing?.name} />
                  <FieldRow label="File Number" value={item.file_number} />
                  <FieldRow label="Created" value={item.created_at ? format(new Date(item.created_at), 'dd MMM yyyy') : null} />
                  <FieldRow label="Submitted" value={item.submitted_at ? format(new Date(item.submitted_at), 'dd MMM yyyy') : null} />
                </>
              )}

              {/* Wing content fields */}
              {visibleFields.includes(FIELD_GROUPS.WING_CONTENT) && (
                <>
                  {item.description && (
                    <Box sx={{ mt: 2.5 }}>
                      <Typography variant="h5" gutterBottom>Description</Typography>
                      <Typography variant="body2" sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                        {item.description}
                      </Typography>
                    </Box>
                  )}
                  {item.discussion_points && (
                    <Box sx={{ mt: 2.5 }}>
                      <Typography variant="h5" gutterBottom>Discussion Points</Typography>
                      <Typography variant="body2" sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                        {item.discussion_points}
                      </Typography>
                    </Box>
                  )}
                </>
              )}

              {/* Decision fields */}
              {visibleFields.includes(FIELD_GROUPS.DECISION) && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h5" gutterBottom>Decision</Typography>
                  {item.chairman_decision && (
                    <Box sx={{ p: 2, bgcolor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 1, mb: 1 }}>
                      <Typography variant="caption" sx={{ color: '#065F46', fontWeight: 600 }}>Chairman's Decision</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>{item.chairman_decision}</Typography>
                    </Box>
                  )}
                  {item.commission_decision && (
                    <Box sx={{ p: 2, bgcolor: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ color: '#0369A1', fontWeight: 600 }}>Commission Decision</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>{item.commission_decision}</Typography>
                    </Box>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Attachments */}
          {attachmentList.length > 0 && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>Attachments</Typography>
                <List disablePadding>
                  {attachmentList.map((att) => (
                    <ListItem
                      key={att.id}
                      disablePadding
                      sx={{
                        py: 1,
                        borderBottom: '1px solid #F1F5F9',
                        '&:last-child': { borderBottom: 'none' },
                      }}
                      secondaryAction={
                        <IconButton size="small" onClick={() => setPdfPanel({ open: true, attachment: att })}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <AttachFileIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Tooltip title={att.original_filename || att.file_name || ''}>
                            <Typography variant="body2" fontWeight={500}>
                              {att.friendly_name || att.file_name || 'Document'}
                            </Typography>
                          </Tooltip>
                        }
                        secondary={att.file_size ? `${(att.file_size / 1024).toFixed(0)} KB` : null}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Admin fields */}
          {visibleFields.includes(FIELD_GROUPS.ADMIN) && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>Admin Details</Typography>
                <FieldRow label="Priority" value={item.priority} />
                <FieldRow label="Meeting" value={item.meeting?.title} />
              </CardContent>
            </Card>
          )}

          {/* Approval document — visible post-decision */}
          {showApprovalDoc && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>Approval Document</Typography>
                {item.approval_document ? (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {item.approval_document.original_filename}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.approval_document.file_size
                        ? `${(item.approval_document.file_size / 1024).toFixed(0)} KB · `
                        : ''}
                      Uploaded {item.approval_document.uploaded_at
                        ? format(new Date(item.approval_document.uploaded_at), 'dd MMM yyyy')
                        : ''}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        href={`/api/v1/agenda/${id}/approval_document/download/`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Download PDF
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">No approval document uploaded.</Typography>
                )}
                {canUploadApproval && (
                  <Box sx={{ mt: 1.5 }}>
                    <input
                      ref={approvalFileRef}
                      type="file"
                      accept=".pdf"
                      style={{ display: 'none' }}
                      onChange={handleApprovalUpload}
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={uploadingApproval ? <CircularProgress size={14} /> : <UploadFileIcon />}
                      onClick={() => approvalFileRef.current?.click()}
                      disabled={uploadingApproval}
                    >
                      {item.approval_document ? 'Replace PDF' : 'Upload PDF'}
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* Approval history — backend serializes as `approvals` (AgendaApproval related set) */}
          {item.approvals && item.approvals.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>Approval History</Typography>
                <ApprovalHistory history={item.approvals} />
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Return dialog */}
      <ConfirmDialog
        open={returnDialog.open}
        onClose={() => setReturnDialog({ open: false, type: null })}
        onConfirm={(reason) => handleAction(returnDialog.type, reason)}
        title="Return Agenda Item"
        message="Provide a reason for returning this item for revision."
        variant="destructive"
        confirmLabel="Return Item"
      />

      {/* PDF Side Panel */}
      {pdfPanel.attachment && (
        <PDFSidePanel
          open={pdfPanel.open}
          attachment={pdfPanel.attachment}
          agendaItemId={id}
          onClose={() => setPdfPanel({ open: false, attachment: null })}
        />
      )}
    </Box>
  );
};
