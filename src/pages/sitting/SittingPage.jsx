import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockIcon from '@mui/icons-material/Lock';
import ArticleIcon from '@mui/icons-material/Article';
import { formatDistanceToNow } from 'date-fns';

import { useGetMeetingQuery, useEnableSittingMutation, useEnableVotingMutation } from '../../store/api/meetingsApi.js';
import { useGetAgendaItemsQuery, useGetAgendaItemQuery, useGetAttachmentsQuery, useGetItemAnnotationsQuery, useCreateItemAnnotationMutation } from '../../store/api/agendaApi.js';
import { useCastVoteMutation, useGetVotesQuery, useSubmitChairmanDecisionMutation, useGetRemarksQuery, useCreateRemarkMutation, useSubmitCommissionDecisionMutation } from '../../store/api/votingApi.js';
import { PDFSidePanel } from '../../components/agenda/PDFSidePanel.jsx';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { StatusChip } from '../../components/common/StatusChip.jsx';
import { usePermissions } from '../../hooks/usePermissions.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice.js';
import { getVisibleFields, FIELD_GROUPS } from '../../utils/fieldVisibility.js';
import { shouldShowSerialNumber } from '../../utils/serialNumberUtils.js';
import { VOTE_CONFIG } from '../../utils/statusConfig.js';

const VOTE_TYPES = [
  { key: 'APPROVE', label: 'Approve', color: '#059669', bg: '#ECFDF5' },
  { key: 'REJECT', label: 'Reject', color: '#DC2626', bg: '#FEF2F2' },
  { key: 'POSTPONE', label: 'Postpone', color: '#D97706', bg: '#FFFBEB' },
  { key: 'DEFER', label: 'Defer', color: '#2563AB', bg: '#EFF6FF' },
  { key: 'UNDO', label: 'Undo', color: '#6B7280', bg: '#F3F4F6' },
];

const DECISION_TYPES = [
  { key: 'APPROVE', label: 'Approve' },
  { key: 'DISAPPROVE', label: 'Disapprove' },
  { key: 'DEFER', label: 'Defer' },
  { key: 'UNDO', label: 'Undo' },
];

const DISCUSSED_STATUSES = new Set(['DISCUSSED', 'VOTED', 'CHAIRMAN_DECIDED', 'DEFERRED', 'UNAPPROVED', 'ARCHIVED']);

const FieldRow = ({ label, value }) => (
  <Box sx={{ py: 1, borderBottom: '1px solid #F1F5F9', display: 'flex', gap: 2 }}>
    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140, flexShrink: 0 }}>
      {label}
    </Typography>
    <Typography variant="body2">{value || '—'}</Typography>
  </Box>
);

const SerialProgressPanel = ({ items, selectedItemId, onSelect }) => {
  if (!items.length) return null;

  const regularItems = items.filter((i) => !i.is_supplementary && i.serial_number);
  const supplementaryItems = items.filter((i) => i.is_supplementary);

  const getColor = (item) => {
    if (DISCUSSED_STATUSES.has(item.status)) return '#059669';
    if (item.id === selectedItemId) return '#2563AB';
    return '#94A3B8';
  };

  const getBg = (item) => {
    if (DISCUSSED_STATUSES.has(item.status)) return '#ECFDF5';
    if (item.id === selectedItemId) return '#EFF6FF';
    return '#F8FAFC';
  };

  return (
    <Box sx={{ p: 1.5, borderBottom: '1px solid #E2E8F0' }}>
      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
        Agenda Progress
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {regularItems.map((item) => (
          <Tooltip key={item.id} title={item.topic} placement="top">
            <Box
              onClick={() => onSelect(item.id)}
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                bgcolor: getBg(item),
                border: `2px solid ${getColor(item)}`,
                color: getColor(item),
                fontSize: '0.6875rem',
                fontWeight: 700,
                transition: 'all 0.15s',
                '&:hover': { opacity: 0.8, transform: 'scale(1.1)' },
              }}
            >
              {item.serial_number?.split('/')[0] || '?'}
            </Box>
          </Tooltip>
        ))}
        {supplementaryItems.map((item, idx) => (
          <Tooltip key={item.id} title={`[S] ${item.topic}`} placement="top">
            <Box
              onClick={() => onSelect(item.id)}
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                bgcolor: getBg(item),
                border: `2px dashed ${getColor(item)}`,
                color: getColor(item),
                fontSize: '0.6875rem',
                fontWeight: 700,
                transition: 'all 0.15s',
                '&:hover': { opacity: 0.8, transform: 'scale(1.1)' },
              }}
            >
              S{idx + 1}
            </Box>
          </Tooltip>
        ))}
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
        {[
          { color: '#059669', label: 'Discussed' },
          { color: '#2563AB', label: 'Current' },
          { color: '#94A3B8', label: 'Pending' },
        ].map(({ color, label }) => (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.6rem' }}>{label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const ChairmanControls = ({ meeting }) => {
  const dispatch = useDispatch();
  const [enableSitting, { isLoading: sittingLoading }] = useEnableSittingMutation();
  const [enableVoting, { isLoading: votingLoading }] = useEnableVotingMutation();

  const toggle = async (type, enabled) => {
    try {
      const fn = type === 'sitting' ? enableSitting : enableVoting;
      await fn({ meetingId: meeting.id, enabled }).unwrap();
      dispatch(showToast({ message: `${type === 'sitting' ? 'Sitting' : 'Voting'} ${enabled ? 'enabled' : 'disabled'}`, severity: 'success' }));
    } catch {
      dispatch(showToast({ message: 'Failed to update setting', severity: 'error' }));
    }
  };

  return (
    <Card sx={{ mb: 2, bgcolor: '#FFFBEB', border: '1px solid #FDE68A' }}>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#92400E', display: 'block', mb: 1 }}>
          Chairman Controls
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <FormControlLabel
            control={
              <Switch
                checked={!!meeting.sitting_enabled}
                onChange={(e) => toggle('sitting', e.target.checked)}
                disabled={sittingLoading}
                color="success"
                size="small"
              />
            }
            label={<Typography variant="body2" fontWeight={600}>Open Sitting for Members</Typography>}
          />
          <FormControlLabel
            control={
              <Switch
                checked={!!meeting.voting_enabled}
                onChange={(e) => toggle('voting', e.target.checked)}
                disabled={votingLoading}
                color="primary"
                size="small"
              />
            }
            label={<Typography variant="body2" fontWeight={600}>Enable Voting</Typography>}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

const MyVoteSection = ({ item, votingEnabled }) => {
  const dispatch = useDispatch();
  const [castVote, { isLoading }] = useCastVoteMutation();

  const handleVote = async (voteType) => {
    try {
      await castVote({ agendaItemId: item.id, vote: voteType }).unwrap();
      dispatch(showToast({ message: `Vote cast: ${voteType}`, severity: 'success' }));
    } catch {
      dispatch(showToast({ message: 'Failed to cast vote', severity: 'error' }));
    }
  };

  const myVote = item.my_vote;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>My Vote</Typography>
      {!votingEnabled && (
        <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mb: 1 }}>
          Voting is not open yet. Waiting for Chairman.
        </Typography>
      )}
      {myVote ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            label={VOTE_CONFIG[myVote]?.label || myVote}
            sx={{ bgcolor: VOTE_CONFIG[myVote]?.bgColor, color: VOTE_CONFIG[myVote]?.color, fontWeight: 700 }}
          />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {VOTE_TYPES.map((v) => (
            <Button
              key={v.key}
              variant="contained"
              disabled={isLoading || !votingEnabled}
              onClick={() => handleVote(v.key)}
              sx={{
                minWidth: 110,
                height: 44,
                bgcolor: v.bg,
                color: v.color,
                border: `1px solid ${v.color}44`,
                fontWeight: 600,
                '&:hover': { bgcolor: v.bg, opacity: 0.85 },
                '&:disabled': { bgcolor: '#F1F5F9', color: '#94A3B8' },
              }}
            >
              {v.label}
            </Button>
          ))}
        </Box>
      )}
    </Box>
  );
};

const VoteCountSection = ({ itemId, isChairman }) => {
  const { data: votes } = useGetVotesQuery(itemId);
  const dispatch = useDispatch();
  const [chairmanDecision, setChairmanDecision] = useState({ type: '', notes: '' });
  const [submitDecision, { isLoading: submitting }] = useSubmitChairmanDecisionMutation();

  if (!votes) return null;

  const summary = votes.summary || {};
  const totalVotes = votes.total || 0;
  const totalMembers = votes.total_members || 0;

  const handleSubmitDecision = async () => {
    try {
      await submitDecision({ agendaItemId: itemId, decision: chairmanDecision.type, commission_decision_text: chairmanDecision.notes }).unwrap();
      dispatch(showToast({ message: 'Decision submitted', severity: 'success' }));
    } catch {
      dispatch(showToast({ message: 'Failed to submit decision', severity: 'error' }));
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h5">Vote Count</Typography>
        <Typography variant="caption" color="text.secondary">
          {totalVotes} of {totalMembers} members voted
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={totalMembers > 0 ? (totalVotes / totalMembers) * 100 : 0}
        sx={{ mb: 2, height: 6, borderRadius: 3 }}
      />
      {VOTE_TYPES.map((v) => (
        <Box key={v.key} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Typography variant="body2" sx={{ color: v.color, fontWeight: 600, minWidth: 80 }}>{v.label}</Typography>
          <Box sx={{ flex: 1, height: 16, bgcolor: '#F1F5F9', borderRadius: 1, overflow: 'hidden' }}>
            <Box
              sx={{
                height: '100%',
                width: `${totalVotes > 0 ? ((summary[v.key] || 0) / totalVotes) * 100 : 0}%`,
                bgcolor: v.color,
                transition: 'width 0.3s',
              }}
            />
          </Box>
          <Typography variant="caption" sx={{ minWidth: 24, textAlign: 'right' }}>{summary[v.key] || 0}</Typography>
        </Box>
      ))}
      {isChairman && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h5" gutterBottom>Final Decision</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
            {DECISION_TYPES.map((d) => (
              <Button
                key={d.key}
                size="small"
                variant={chairmanDecision.type === d.key ? 'contained' : 'outlined'}
                onClick={() => setChairmanDecision((prev) => ({ ...prev, type: d.key }))}
              >
                {d.label}
              </Button>
            ))}
          </Box>
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="Commission decision notes (optional)..."
            value={chairmanDecision.notes}
            onChange={(e) => setChairmanDecision((prev) => ({ ...prev, notes: e.target.value }))}
            sx={{ mb: 1 }}
          />
          <Button
            variant="contained"
            disabled={!chairmanDecision.type || submitting}
            onClick={handleSubmitDecision}
            sx={{ bgcolor: '#F0B429', color: '#0F1F3D', '&:hover': { bgcolor: '#D97706' } }}
          >
            Enter Decision
          </Button>
        </Box>
      )}
    </Box>
  );
};

const AnnotationsPanel = ({ agendaItemId }) => {
  const [newNote, setNewNote] = useState('');
  const { data: rawNotes } = useGetItemAnnotationsQuery(agendaItemId, { skip: !agendaItemId });
  const [createAnnotation, { isLoading }] = useCreateItemAnnotationMutation();

  const notes = Array.isArray(rawNotes?.results) ? rawNotes.results : Array.isArray(rawNotes) ? rawNotes : [];

  const handleSubmit = async () => {
    if (!newNote.trim()) return;
    try {
      await createAnnotation({ agendaItemId, content: newNote.trim() }).unwrap();
      setNewNote('');
    } catch {
      // silently fail
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <LockIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>
          My Private Annotations
        </Typography>
      </Box>
      {notes.length === 0 ? (
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1.5 }}>
          No annotations yet. Your notes are private and visible only to you.
        </Typography>
      ) : (
        <Box sx={{ mb: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {notes.map((note) => (
            <Box
              key={note.id}
              sx={{ p: 1.5, bgcolor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 1 }}
            >
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {note.content}
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                {note.created_at ? formatDistanceToNow(new Date(note.created_at), { addSuffix: true }) : ''}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        <TextField
          size="small"
          fullWidth
          multiline
          rows={2}
          placeholder="Add a private annotation..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
        />
        <Button
          variant="outlined"
          size="small"
          onClick={handleSubmit}
          disabled={!newNote.trim() || isLoading}
          sx={{ flexShrink: 0, height: 56 }}
        >
          Add
        </Button>
      </Box>
    </Box>
  );
};

const RemarksPanel = ({ agendaItemId }) => {
  const dispatch = useDispatch();
  const [newRemark, setNewRemark] = useState('');
  const { data: rawRemarks, isLoading } = useGetRemarksQuery(agendaItemId, { skip: !agendaItemId });
  const [createRemark, { isLoading: submitting }] = useCreateRemarkMutation();

  const remarks = Array.isArray(rawRemarks?.results) ? rawRemarks.results : Array.isArray(rawRemarks) ? rawRemarks : [];

  const handleSubmit = async () => {
    if (!newRemark.trim()) return;
    try {
      await createRemark({ agendaItemId, content: newRemark.trim() }).unwrap();
      setNewRemark('');
      dispatch(showToast({ message: 'Remark added', severity: 'success' }));
    } catch {
      dispatch(showToast({ message: 'Failed to add remark', severity: 'error' }));
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="h5" gutterBottom>Points for Discussion</Typography>
      {isLoading ? (
        <CircularProgress size={20} />
      ) : remarks.length === 0 ? (
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1.5 }}>
          No remarks yet.
        </Typography>
      ) : (
        <Box sx={{ mb: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {remarks.map((r) => (
            <Box key={r.id} sx={{ p: 1.5, bgcolor: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#0369A1' }}>
                  {r.member_name}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {r.created_at ? formatDistanceToNow(new Date(r.created_at), { addSuffix: true }) : ''}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {r.content}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        <TextField
          size="small"
          fullWidth
          multiline
          rows={2}
          placeholder="Add a remark for discussion..."
          value={newRemark}
          onChange={(e) => setNewRemark(e.target.value)}
        />
        <Button
          variant="outlined"
          size="small"
          onClick={handleSubmit}
          disabled={!newRemark.trim() || submitting}
          sx={{ flexShrink: 0, height: 56 }}
        >
          Add
        </Button>
      </Box>
    </Box>
  );
};

const CommissionDecisionPanel = ({ agendaItemId, existingDecision }) => {
  const dispatch = useDispatch();
  const [decisionText, setDecisionText] = useState(existingDecision?.commission_decision_text || '');
  const [decisionNumber, setDecisionNumber] = useState(existingDecision?.decision_number || '');
  const [submitCommissionDecision, { isLoading: saving }] = useSubmitCommissionDecisionMutation();

  const handleSave = async () => {
    try {
      await submitCommissionDecision({ agendaItemId, commission_decision_text: decisionText, decision_number: decisionNumber }).unwrap();
      dispatch(showToast({ message: 'Commission decision saved', severity: 'success' }));
    } catch {
      dispatch(showToast({ message: 'Failed to save commission decision', severity: 'error' }));
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ p: 2, bgcolor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#92400E', display: 'block', mb: 1.5 }}>
          Decision of the Commission
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder="Enter commission decision text (Malayalam/English)..."
          value={decisionText}
          onChange={(e) => setDecisionText(e.target.value)}
          sx={{ mb: 1.5 }}
        />
        <TextField
          fullWidth
          size="small"
          placeholder="Decision No."
          label="Decision No."
          value={decisionNumber}
          onChange={(e) => setDecisionNumber(e.target.value)}
          sx={{ mb: 1.5 }}
        />
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          sx={{ bgcolor: '#F0B429', color: '#0F1F3D', '&:hover': { bgcolor: '#D97706' } }}
        >
          Save Decision
        </Button>
      </Box>
    </Box>
  );
};

const DocumentsSection = ({ agendaItemId, onOpenDoc }) => {
  const { data: attachments } = useGetAttachmentsQuery(agendaItemId, { skip: !agendaItemId });
  const list = Array.isArray(attachments?.results) ? attachments.results : Array.isArray(attachments) ? attachments : [];

  if (!list.length) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>Documents</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {list.map((att) => (
          <Box
            key={att.id}
            sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 1, border: '1px solid #E2E8F0', cursor: 'pointer', '&:hover': { bgcolor: '#F8FAFC' } }}
            onClick={() => onOpenDoc(att)}
          >
            <ArticleIcon sx={{ fontSize: 18, color: '#64748B' }} />
            <Typography variant="body2" sx={{ flex: 1 }} noWrap>{att.friendly_name}</Typography>
            <Typography variant="caption" color="text.secondary">{att.mime_type?.includes('pdf') ? 'PDF' : 'Image'}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export const SittingPage = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { isMember, isChairman, currentUser } = usePermissions();

  const [selectedItemId, setSelectedItemId] = useState(null);
  const [openDoc, setOpenDoc] = useState(null);

  const { data: meeting, isLoading: meetingLoading } = useGetMeetingQuery(meetingId);
  const { data: agendaData, isLoading: agendaLoading } = useGetAgendaItemsQuery({
    meeting_id: meetingId,
    limit: 100,
  });

  const allItems = Array.isArray(agendaData?.results) ? agendaData.results : Array.isArray(agendaData) ? agendaData : [];
  const regularItems = allItems.filter((i) => !i.is_supplementary);
  const supplementaryItems = allItems.filter((i) => i.is_supplementary);

  const { data: selectedItem } = useGetAgendaItemQuery(selectedItemId, { skip: !selectedItemId });

  const visibleFields = selectedItem ? getVisibleFields(selectedItem, currentUser) : [];
  const showSerial = selectedItem ? shouldShowSerialNumber(selectedItem, meeting, currentUser) : false;

  const votingEnabled = !!meeting?.voting_enabled;

  if (meetingLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  const renderAgendaList = (items, isSupplementary) => items.map((item) => {
    const isDiscussed = DISCUSSED_STATUSES.has(item.status);
    const isCurrent = item.id === selectedItemId;
    const borderColor = isDiscussed ? '#059669' : isCurrent ? '#2563AB' : 'transparent';
    const bg = isDiscussed ? '#F0FDF4' : isCurrent ? '#EFF6FF' : 'transparent';

    return (
      <Box
        key={item.id}
        onClick={() => setSelectedItemId(item.id)}
        sx={{
          p: 1.5, mb: 0.5, borderRadius: 1, cursor: 'pointer',
          borderLeft: `3px solid ${borderColor}`,
          bgcolor: bg,
          '&:hover': { bgcolor: isCurrent ? bg : '#F8FAFC' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          {item.serial_number && (
            <Typography variant="caption" sx={{ fontWeight: 700, color: isDiscussed ? '#059669' : isCurrent ? '#2563AB' : '#94A3B8', flexShrink: 0 }}>
              #{item.serial_number}
            </Typography>
          )}
          {isSupplementary && (
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#7C3AED', flexShrink: 0 }}>S</Typography>
          )}
          <Typography variant="body2" sx={{ flex: 1, fontWeight: isCurrent ? 600 : 400 }} noWrap>
            {item.topic}
          </Typography>
        </Box>
        <Box sx={{ mt: 0.5 }}>
          <StatusChip status={item.status} size="small" />
        </Box>
      </Box>
    );
  });

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 0, pt: 0, pb: 2 }}>
        <PageHeader
          title={meeting?.title || 'Sitting Room'}
          breadcrumbs={[{ label: 'Meetings', href: '/meetings' }, { label: meeting?.title || 'Sitting' }]}
          actions={
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/meetings/${meetingId}`)} variant="outlined">
              Back
            </Button>
          }
        />
      </Box>

      {isChairman && meeting && <ChairmanControls meeting={meeting} />}

      <Box sx={{ display: 'flex', flex: 1, gap: 0, border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden', bgcolor: 'background.paper' }}>
        {/* Left panel — serial progress + agenda list */}
        <Box sx={{ width: '32%', borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <SerialProgressPanel items={allItems} selectedItemId={selectedItemId} onSelect={setSelectedItemId} />
          <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
            {agendaLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress size={24} /></Box>
            ) : (
              <>
                {renderAgendaList(regularItems, false)}
                {supplementaryItems.length > 0 && (
                  <>
                    <Divider sx={{ my: 1.5, borderColor: '#E9D5FF' }}>
                      <Typography variant="caption" sx={{ color: '#7C3AED', fontWeight: 600, fontSize: '0.6875rem' }}>
                        SUPPLEMENTARY AGENDA
                      </Typography>
                    </Divider>
                    {renderAgendaList(supplementaryItems, true)}
                  </>
                )}
              </>
            )}
          </Box>
        </Box>

        {/* Right panel — item detail, documents, annotations, voting */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          {!selectedItem ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.disabled', gap: 1 }}>
              <Typography variant="body1">Select an agenda item to view details</Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                {showSerial && selectedItem.serial_number && (
                  <Chip label={`#${selectedItem.serial_number}`} sx={{ bgcolor: '#F0B429', color: '#0F1F3D', fontWeight: 700 }} />
                )}
                <Typography variant="h2" sx={{ flex: 1 }}>{selectedItem.topic}</Typography>
                <StatusChip status={selectedItem.status} />
              </Box>

              {visibleFields.includes(FIELD_GROUPS.BASE) && (
                <Box sx={{ mb: 2 }}>
                  <FieldRow label="Wing" value={selectedItem.wing?.name} />
                  <FieldRow label="File No." value={selectedItem.file_number} />
                  {selectedItem.is_supplementary && (
                    <FieldRow label="Type" value={<Chip label="Supplementary" size="small" sx={{ bgcolor: '#F5F3FF', color: '#7C3AED' }} />} />
                  )}
                </Box>
              )}

              {visibleFields.includes(FIELD_GROUPS.WING_CONTENT) && selectedItem.description && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h5" gutterBottom>Description</Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.8 }}>{selectedItem.description}</Typography>
                </Box>
              )}

              {visibleFields.includes(FIELD_GROUPS.WING_CONTENT) && selectedItem.discussion_points && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h5" gutterBottom>Discussion Points</Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.8 }}>{selectedItem.discussion_points}</Typography>
                </Box>
              )}

              {/* Documents */}
              <DocumentsSection
                agendaItemId={selectedItem.id}
                onOpenDoc={(att) => setOpenDoc({ attachment: att, agendaItemId: selectedItem.id })}
              />

              {/* Remarks — members and chairman */}
              {(isMember || isChairman) && <RemarksPanel agendaItemId={selectedItem.id} />}

              {/* Private annotations */}
              {(isMember || isChairman) && <AnnotationsPanel agendaItemId={selectedItem.id} />}

              <Divider sx={{ my: 2 }} />

              {/* Voting */}
              {(isMember || isChairman) && (
                <MyVoteSection item={selectedItem} votingEnabled={votingEnabled} />
              )}
              {isChairman && <VoteCountSection itemId={selectedItem.id} isChairman={isChairman} />}

              {/* Commission Decision — chairman only */}
              {isChairman && (
                <CommissionDecisionPanel
                  agendaItemId={selectedItem.id}
                  existingDecision={selectedItem.chairman_decision}
                />
              )}
            </>
          )}
        </Box>
      </Box>

      {/* PDF viewer side panel */}
      {openDoc && (
        <PDFSidePanel
          open={!!openDoc}
          attachment={openDoc.attachment}
          agendaItemId={openDoc.agendaItemId}
          onClose={() => setOpenDoc(null)}
        />
      )}
    </Box>
  );
};
