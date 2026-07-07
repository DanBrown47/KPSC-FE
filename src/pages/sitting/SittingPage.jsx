import { useState, useMemo } from 'react';
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
  { key: 'APPROVE', label: 'Approve', color: '#ffffff', bg: '#059669' },
  { key: 'REJECT', label: 'Reject', color: '#ffffff', bg: '#DC2626' },
  { key: 'POSTPONE', label: 'Postpone', color: '#0b1c30', bg: '#F59E0B' },
  { key: 'DEFER', label: 'Defer', color: '#ffffff', bg: '#2563EB' },
  { key: 'UNDO', label: 'Undo', color: '#64748B', bg: '#E2E8F0' },
];

const DECISION_TYPES = [
  { key: 'APPROVE', label: 'Approve' },
  { key: 'DISAPPROVE', label: 'Disapprove' },
  { key: 'DEFER', label: 'Defer' },
  { key: 'UNDO', label: 'Undo' },
];

const DISCUSSED_STATUSES = new Set(['DISCUSSED', 'VOTED', 'CHAIRMAN_DECIDED', 'DEFERRED', 'UNAPPROVED', 'ARCHIVED']);

const NAVY = '#0F172A';
const ADMIN_BLUE = '#2563EB';
const AMBER = '#F59E0B';
const SURFACE = '#F8FAFC';
const CARD_BG = '#FFFFFF';

const FieldRow = ({ label, value }) => (
  <Box sx={{ py: 1, borderBottom: '1px solid #E2E8F0', display: 'flex', gap: 2 }}>
    <Typography variant="caption" sx={{ minWidth: 140, flexShrink: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', fontSize: '0.6875rem' }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ color: '#0F172A', fontWeight: 400 }}>{value || '—'}</Typography>
  </Box>
);

const SerialProgressPanel = ({ items, selectedItemId, onSelect }) => {
  if (!items.length) return null;

  const regularItems = items.filter((i) => !i.is_supplementary && i.serial_number);
  const supplementaryItems = items.filter((i) => i.is_supplementary);

  const getColor = (item) => {
    if (DISCUSSED_STATUSES.has(item.status)) return '#34D399';
    if (item.id === selectedItemId) return '#60A5FA';
    return '#64748B';
  };

  const getBg = (item) => {
    if (DISCUSSED_STATUSES.has(item.status)) return 'rgba(52,211,153,0.15)';
    if (item.id === selectedItemId) return 'rgba(96,165,250,0.2)';
    return 'rgba(100,116,139,0.15)';
  };

  return (
    <Box sx={{ p: 2, borderBottom: '1px solid rgba(148,163,184,0.2)' }}>
      <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1.5, fontSize: '0.6875rem' }}>
        Agenda Progress
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {regularItems.map((item, idx) => (
          <Tooltip key={item.id} title={item.topic} placement="top">
            <Box
              onClick={() => onSelect(item.id)}
              sx={{
                width: 32,
                height: 32,
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                bgcolor: getBg(item),
                border: `1.5px solid ${getColor(item)}`,
                color: getColor(item),
                fontSize: '0.6875rem',
                fontWeight: 700,
                transition: 'all 0.15s',
                '&:hover': { opacity: 0.85, transform: 'scale(1.08)' },
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
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                bgcolor: getBg(item),
                border: `1.5px dashed ${getColor(item)}`,
                color: getColor(item),
                fontSize: '0.6875rem',
                fontWeight: 700,
                transition: 'all 0.15s',
                '&:hover': { opacity: 0.85, transform: 'scale(1.08)' },
              }}
            >
              S{idx + 1}
            </Box>
          </Tooltip>
        ))}
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mt: 1.5 }}>
        {[
          { color: '#34D399', label: 'Discussed' },
          { color: '#60A5FA', label: 'Current' },
          { color: '#64748B', label: 'Pending' },
        ].map(({ color, label }) => (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: color }} />
            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.6rem', fontWeight: 500 }}>{label}</Typography>
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
    <Card sx={{ mb: 2, bgcolor: '#FFFBEB', border: '1px solid #F59E0B', borderRadius: '8px' }}>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#92400E', display: 'block', mb: 1, fontSize: '0.6875rem' }}>
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
      <Typography variant="h5" gutterBottom sx={{ fontFamily: '"Hanken Grotesk", sans-serif', fontWeight: 600, color: '#0F172A' }}>My Vote</Typography>
      {!votingEnabled && (
        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1, fontWeight: 500 }}>
          Voting is not open yet. Waiting for Chairman.
        </Typography>
      )}
      {myVote ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            label={VOTE_CONFIG[myVote]?.label || myVote}
            sx={{ bgcolor: VOTE_CONFIG[myVote]?.bgColor, color: VOTE_CONFIG[myVote]?.color, fontWeight: 700, borderRadius: '4px' }}
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
                border: 'none',
                borderRadius: '4px',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { bgcolor: v.bg, opacity: 0.85 },
                '&:disabled': { bgcolor: '#E2E8F0', color: '#94A3B8' },
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
        <Typography variant="h5" sx={{ fontFamily: '"Hanken Grotesk", sans-serif', fontWeight: 600, color: '#0F172A' }}>Vote Count</Typography>
        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
          {totalVotes} of {totalMembers} members voted
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={totalMembers > 0 ? (totalVotes / totalMembers) * 100 : 0}
        sx={{ mb: 2, height: 4, borderRadius: 2, bgcolor: '#E2E8F0', '& .MuiLinearProgress-bar': { bgcolor: ADMIN_BLUE } }}
      />
      {VOTE_TYPES.map((v) => (
        <Box key={v.key} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Typography variant="caption" sx={{ color: v.bg, fontWeight: 700, minWidth: 80, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{v.label}</Typography>
          <Box sx={{ flex: 1, height: 12, bgcolor: '#F1F5F9', borderRadius: '2px', overflow: 'hidden' }}>
            <Box
              sx={{
                height: '100%',
                width: `${totalVotes > 0 ? ((summary[v.key] || 0) / totalVotes) * 100 : 0}%`,
                bgcolor: v.bg,
                borderRadius: '2px',
                transition: 'width 0.3s',
              }}
            />
          </Box>
          <Typography variant="caption" sx={{ minWidth: 24, textAlign: 'right', fontWeight: 600, color: '#0F172A' }}>{summary[v.key] || 0}</Typography>
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
            sx={{ bgcolor: AMBER, color: '#0F172A', fontWeight: 700, borderRadius: '4px', '&:hover': { bgcolor: '#D97706' } }}
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
      <Divider sx={{ mb: 2, borderColor: '#E2E8F0' }} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <LockIcon sx={{ fontSize: 16, color: '#F59E0B' }} />
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', fontSize: '0.6875rem' }}>
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
              sx={{ p: 1.5, bgcolor: '#FFFBEB', border: '1px solid #F59E0B33', borderRadius: '4px' }}
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
          sx={{ flexShrink: 0, height: 56, borderColor: '#E2E8F0', color: '#0F172A', borderRadius: '4px' }}
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
      <Divider sx={{ mb: 2, borderColor: '#E2E8F0' }} />
      <Typography variant="h5" gutterBottom sx={{ fontFamily: '"Hanken Grotesk", sans-serif', fontWeight: 600, color: '#0F172A' }}>Points for Discussion</Typography>
      {isLoading ? (
        <CircularProgress size={20} />
      ) : remarks.length === 0 ? (
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1.5 }}>
          No remarks yet.
        </Typography>
      ) : (
        <Box sx={{ mb: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {remarks.map((r) => (
            <Box key={r.id} sx={{ p: 1.5, bgcolor: '#EFF6FF', border: '1px solid #2563EB22', borderRadius: '4px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: ADMIN_BLUE, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  {r.member_name}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {r.created_at ? formatDistanceToNow(new Date(r.created_at), { addSuffix: true }) : ''}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#0F172A' }}>
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
          sx={{ flexShrink: 0, height: 56, borderColor: '#E2E8F0', color: '#0F172A', borderRadius: '4px' }}
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
      <Divider sx={{ mb: 2, borderColor: '#E2E8F0' }} />
      <Box sx={{ p: 2, bgcolor: '#FFFBEB', border: '1px solid #F59E0B', borderRadius: '8px' }}>
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#92400E', display: 'block', mb: 1.5, fontSize: '0.6875rem' }}>
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
          sx={{ bgcolor: AMBER, color: '#0F172A', fontWeight: 700, borderRadius: '4px', '&:hover': { bgcolor: '#D97706' } }}
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
      <Typography variant="h5" gutterBottom sx={{ fontFamily: '"Hanken Grotesk", sans-serif', fontWeight: 600, color: '#0F172A' }}>Documents</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {list.map((att) => (
          <Box
            key={att.id}
            sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: '4px', border: '1px solid #E2E8F0', cursor: 'pointer', bgcolor: CARD_BG, '&:hover': { bgcolor: '#F8FAFC', borderColor: ADMIN_BLUE } }}
            onClick={() => onOpenDoc(att)}
          >
            <ArticleIcon sx={{ fontSize: 18, color: ADMIN_BLUE }} />
            <Typography variant="body2" sx={{ flex: 1, color: '#0F172A' }} noWrap>{att.friendly_name}</Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>{att.mime_type?.includes('pdf') ? 'PDF' : 'Image'}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export const SittingPage = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { isMember, isChairman, currentUser, canUsePrivateNotes } = usePermissions();

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

  // Group regular items by wing, ordered by wing.priority_order
  const wingGroups = useMemo(() => {
    const map = new Map();
    for (const item of regularItems) {
      const wingId = item.wing || 0;
      const wingName = item.wing_name || 'Unknown Wing';
      const wingPriority = item.wing_priority_order ?? Infinity;
      if (!map.has(wingId)) {
        map.set(wingId, { wingId, wingName, wingPriority, items: [] });
      }
      map.get(wingId).items.push(item);
    }
    const groups = Array.from(map.values());
    groups.sort((a, b) => a.wingPriority - b.wingPriority);
    return groups;
  }, [regularItems]);

  const supplementaryWingGroups = useMemo(() => {
    const map = new Map();
    for (const item of supplementaryItems) {
      const wingId = item.wing || 0;
      const wingName = item.wing_name || 'Unknown Wing';
      const wingPriority = item.wing_priority_order ?? Infinity;
      if (!map.has(wingId)) {
        map.set(wingId, { wingId, wingName, wingPriority, items: [] });
      }
      map.get(wingId).items.push(item);
    }
    const groups = Array.from(map.values());
    groups.sort((a, b) => a.wingPriority - b.wingPriority);
    return groups;
  }, [supplementaryItems]);

  const { data: selectedItem } = useGetAgendaItemQuery(selectedItemId, { skip: !selectedItemId });

  const visibleFields = selectedItem ? getVisibleFields(selectedItem, currentUser) : [];
  const showSerial = selectedItem ? shouldShowSerialNumber(selectedItem, meeting, currentUser) : false;

  const votingEnabled = !!meeting?.voting_enabled;

  if (meetingLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  const renderItemRow = (item, isSupplementary) => {
    const isDiscussed = DISCUSSED_STATUSES.has(item.status);
    const isCurrent = item.id === selectedItemId;
    const borderColor = isDiscussed ? '#34D399' : isCurrent ? ADMIN_BLUE : 'transparent';
    const bg = isDiscussed ? 'rgba(52,211,153,0.08)' : isCurrent ? 'rgba(37,99,235,0.12)' : 'transparent';

    return (
      <Box
        key={item.id}
        onClick={() => setSelectedItemId(item.id)}
        sx={{
          p: 1.5, mb: 0.5, borderRadius: '4px', cursor: 'pointer',
          borderLeft: isCurrent ? `3px solid ${ADMIN_BLUE}` : isDiscussed ? '3px solid #34D399' : '3px solid transparent',
          bgcolor: bg,
          transition: 'all 0.15s',
          '&:hover': { bgcolor: isCurrent ? bg : 'rgba(148,163,184,0.1)' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          {item.serial_number && (
            <Typography variant="caption" sx={{ fontWeight: 700, color: isDiscussed ? '#34D399' : isCurrent ? '#60A5FA' : '#64748B', flexShrink: 0 }}>
              #{item.serial_number}
            </Typography>
          )}
          {item.agenda_number && (
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#94A3B8', flexShrink: 0 }}>
              A{item.agenda_number}
            </Typography>
          )}
          {isSupplementary && (
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#A78BFA', flexShrink: 0 }}>S</Typography>
          )}
          <Typography variant="body2" sx={{ flex: 1, fontWeight: isCurrent ? 600 : 400, color: isCurrent ? '#ffffff' : '#CBD5E1' }} noWrap>
            {item.topic}
          </Typography>
        </Box>
        <Box sx={{ mt: 0.5 }}>
          <StatusChip status={item.status} size="small" />
        </Box>
      </Box>
    );
  };

  const renderWingGroups = (groups, isSupplementary) =>
    groups.map((group) => (
      <Box key={group.wingId}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', px: 0.5, pt: 1, pb: 0.25, fontSize: '0.6875rem', borderBottom: '1px solid rgba(148,163,184,0.2)', mb: 0.5 }}>
          {group.wingName}
        </Typography>
        {group.items.map((item) => renderItemRow(item, isSupplementary))}
      </Box>
    ));

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 0, pt: 0, pb: 2 }}>
        <PageHeader
          title={meeting?.title || 'Sitting Room'}
          breadcrumbs={[{ label: 'Meetings', href: '/meetings' }, { label: meeting?.title || 'Sitting' }]}
          actions={
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/meetings/${meetingId}`)} variant="outlined" sx={{ borderColor: '#E2E8F0', color: '#0F172A', borderRadius: '4px', '&:hover': { borderColor: ADMIN_BLUE, color: ADMIN_BLUE } }}>
              Back
            </Button>
          }
        />
      </Box>

      {isChairman && meeting && <ChairmanControls meeting={meeting} />}

      <Box sx={{ display: 'flex', flex: 1, gap: 0, borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
        {/* Left panel — dark navy sidebar */}
        <Box sx={{ width: '32%', bgcolor: NAVY, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <SerialProgressPanel items={allItems} selectedItemId={selectedItemId} onSelect={setSelectedItemId} />
          <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
            {agendaLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress size={24} sx={{ color: '#94A3B8' }} /></Box>
            ) : (
              <>
                {renderWingGroups(wingGroups, false)}
                {supplementaryItems.length > 0 && (
                  <>
                    <Divider sx={{ my: 1.5, borderColor: 'rgba(167,139,250,0.3)' }}>
                      <Typography variant="caption" sx={{ color: '#A78BFA', fontWeight: 600, fontSize: '0.6875rem' }}>
                        SUPPLEMENTARY AGENDA
                      </Typography>
                    </Divider>
                    {renderWingGroups(supplementaryWingGroups, true)}
                  </>
                )}
              </>
            )}
          </Box>
        </Box>

        {/* Right panel — light content area */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3, bgcolor: SURFACE }}>
          {!selectedItem ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8', gap: 1 }}>
              <Typography variant="body1">Select an agenda item to view details</Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
                {selectedItem.serial_number && (
                  <Chip label={`Sl No. ${selectedItem.serial_number}`} sx={{ bgcolor: AMBER, color: '#0F172A', fontWeight: 700, borderRadius: '4px' }} />
                )}
                {selectedItem.agenda_number && (
                  <Chip label={`Agenda No. ${selectedItem.agenda_number}`} variant="outlined" sx={{ fontWeight: 700, borderColor: '#CBD5E1', color: '#475569', borderRadius: '4px' }} />
                )}
                <Typography variant="h2" sx={{ flex: 1, fontFamily: '"Hanken Grotesk", sans-serif', fontWeight: 700, color: '#0F172A' }}>{selectedItem.topic}</Typography>
                <StatusChip status={selectedItem.status} />
              </Box>

              {visibleFields.includes(FIELD_GROUPS.BASE) && (
                <Box sx={{ mb: 2, bgcolor: CARD_BG, borderRadius: '8px', border: '1px solid #E2E8F0', p: 2 }}>
                  <FieldRow label="Wing" value={selectedItem.wing?.name} />
                  <FieldRow label="File No." value={selectedItem.file_number} />
                  {selectedItem.is_supplementary && (
                    <FieldRow label="Type" value={<Chip label="Supplementary" size="small" sx={{ bgcolor: '#F5F3FF', color: '#7C3AED', borderRadius: '4px' }} />} />
                  )}
                </Box>
              )}

              {visibleFields.includes(FIELD_GROUPS.WING_CONTENT) && selectedItem.description && (
                <Box sx={{ mb: 2, bgcolor: CARD_BG, borderRadius: '8px', border: '1px solid #E2E8F0', p: 2 }}>
                  <Typography variant="h5" gutterBottom sx={{ fontFamily: '"Hanken Grotesk", sans-serif', fontWeight: 600, color: '#0F172A' }}>Description</Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.8, color: '#0F172A' }}>{selectedItem.description}</Typography>
                </Box>
              )}

              {visibleFields.includes(FIELD_GROUPS.WING_CONTENT) && selectedItem.discussion_points && (
                <Box sx={{ mb: 2, bgcolor: CARD_BG, borderRadius: '8px', border: '1px solid #E2E8F0', p: 2 }}>
                  <Typography variant="h5" gutterBottom sx={{ fontFamily: '"Hanken Grotesk", sans-serif', fontWeight: 600, color: '#0F172A' }}>Discussion Points</Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.8, color: '#0F172A' }}>{selectedItem.discussion_points}</Typography>
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
              {canUsePrivateNotes && <AnnotationsPanel agendaItemId={selectedItem.id} />}

              <Divider sx={{ my: 2, borderColor: '#E2E8F0' }} />

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
