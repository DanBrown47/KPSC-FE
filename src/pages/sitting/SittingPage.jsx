import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useGetMeetingQuery } from '../../store/api/meetingsApi.js';
import { useGetAgendaItemsQuery, useGetAgendaItemQuery } from '../../store/api/agendaApi.js';
import { useCastVoteMutation, useGetVotesQuery, useSubmitChairmanDecisionMutation } from '../../store/api/votingApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { StatusChip } from '../../components/common/StatusChip.jsx';
import { usePermissions } from '../../hooks/usePermissions.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice.js';
import { getVisibleFields, FIELD_GROUPS, BASE_FIELDS, WING_CONTENT_FIELDS, ADMIN_FIELDS, DECISION_FIELDS } from '../../utils/fieldVisibility.js';
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

const FieldRow = ({ label, value }) => (
  <Box sx={{ py: 1, borderBottom: '1px solid #F1F5F9', display: 'flex', gap: 2 }}>
    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140, flexShrink: 0 }}>
      {label}
    </Typography>
    <Typography variant="body2">{value || '—'}</Typography>
  </Box>
);

const MyVoteSection = ({ item, currentUser }) => {
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
      {myVote ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            label={VOTE_CONFIG[myVote]?.label || myVote}
            sx={{
              bgcolor: VOTE_CONFIG[myVote]?.bgColor,
              color: VOTE_CONFIG[myVote]?.color,
              fontWeight: 700,
            }}
          />
          <Button size="small" variant="outlined" onClick={() => {}}>Change</Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {VOTE_TYPES.map((v) => (
            <Button
              key={v.key}
              variant="contained"
              disabled={isLoading}
              onClick={() => handleVote(v.key)}
              sx={{
                minWidth: 120,
                height: 48,
                bgcolor: v.bg,
                color: v.color,
                border: `1px solid ${v.color}44`,
                fontWeight: 600,
                '&:hover': { bgcolor: v.bg, opacity: 0.85 },
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

const VoteCountSection = ({ itemId, isChairman, isChairmanPS }) => {
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
      {isChairmanPS && (
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

export const SittingPage = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { isMember, isChairman, isChairmanPS, currentUser } = usePermissions();

  const [activeTab, setActiveTab] = useState(0);
  const [selectedItemId, setSelectedItemId] = useState(null);

  const { data: meeting, isLoading: meetingLoading } = useGetMeetingQuery(meetingId);
  const { data: agendaData, isLoading: agendaLoading } = useGetAgendaItemsQuery({
    meeting_id: meetingId,
    limit: 100,
  });

  const allItems = Array.isArray(agendaData?.results) ? agendaData.results : Array.isArray(agendaData) ? agendaData : [];
  const regularItems = allItems.filter((i) => !i.is_supplementary);
  const supplementaryItems = allItems.filter((i) => i.is_supplementary);

  const TAB_FILTERS = [
    { label: 'All', filter: () => true },
    { label: 'Pending', filter: (i) => ['FINALIZED', 'DISCUSSED'].includes(i.status) },
    { label: 'Voted', filter: (i) => i.status === 'VOTED' },
    { label: 'Decided', filter: (i) => ['CHAIRMAN_DECIDED', 'ARCHIVED'].includes(i.status) },
  ];

  const filteredItems = regularItems.filter(TAB_FILTERS[activeTab].filter);

  const { data: selectedItem } = useGetAgendaItemQuery(selectedItemId, { skip: !selectedItemId });

  const visibleFields = selectedItem ? getVisibleFields(selectedItem, currentUser) : [];
  const showSerial = selectedItem ? shouldShowSerialNumber(selectedItem, meeting, currentUser) : false;

  if (meetingLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

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

      <Box sx={{ display: 'flex', flex: 1, gap: 0, border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden', bgcolor: 'background.paper' }}>
        {/* Left panel - Agenda list (xs=4) */}
        <Box sx={{ width: '33.33%', borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ borderBottom: '1px solid #E2E8F0' }}>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto" sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40, fontSize: '0.75rem', py: 1 } }}>
              {TAB_FILTERS.map((t, i) => (
                <Tab key={i} label={t.label} />
              ))}
            </Tabs>
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
            {agendaLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress size={24} /></Box>
            ) : (
              <>
                {filteredItems.map((item) => (
                  <Box
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    sx={{
                      p: 1.5,
                      mb: 0.5,
                      borderRadius: 1,
                      cursor: 'pointer',
                      borderLeft: selectedItemId === item.id ? '3px solid #F0B429' : '3px solid transparent',
                      bgcolor: selectedItemId === item.id ? '#FFFBEB' : 'transparent',
                      '&:hover': { bgcolor: '#F8FAFC' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      {showSerial && item.serial_number && (
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#F0B429', flexShrink: 0 }}>
                          #{item.serial_number}
                        </Typography>
                      )}
                      <Typography variant="body2" sx={{ flex: 1, fontWeight: selectedItemId === item.id ? 600 : 400 }} noWrap>
                        {item.topic}
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 0.5 }}>
                      <StatusChip status={item.status} size="small" />
                    </Box>
                  </Box>
                ))}
                {supplementaryItems.length > 0 && (
                  <>
                    <Divider sx={{ my: 1.5, borderColor: '#E9D5FF' }}>
                      <Typography variant="caption" sx={{ color: '#7C3AED', fontWeight: 600, fontSize: '0.6875rem' }}>
                        SUPPLEMENTARY AGENDA
                      </Typography>
                    </Divider>
                    {supplementaryItems.map((item) => (
                      <Box
                        key={item.id}
                        onClick={() => setSelectedItemId(item.id)}
                        sx={{
                          p: 1.5,
                          mb: 0.5,
                          borderRadius: 1,
                          cursor: 'pointer',
                          borderLeft: selectedItemId === item.id ? '3px solid #7C3AED' : '3px solid transparent',
                          bgcolor: selectedItemId === item.id ? '#F5F3FF' : 'transparent',
                          '&:hover': { bgcolor: '#F8FAFC' },
                        }}
                      >
                        <Typography variant="body2" sx={{ flex: 1 }} noWrap>{item.topic}</Typography>
                        <Chip label="Supplementary" size="small" sx={{ bgcolor: '#F5F3FF', color: '#7C3AED', height: 18, fontSize: '0.625rem', mt: 0.5 }} />
                      </Box>
                    ))}
                  </>
                )}
              </>
            )}
          </Box>
        </Box>

        {/* Right panel - Item detail (xs=8) */}
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

              <Divider sx={{ my: 2 }} />

              {/* Voting section */}
              {isMember && <MyVoteSection item={selectedItem} currentUser={currentUser} />}
              {(isChairman || isChairmanPS) && (
                <VoteCountSection itemId={selectedItem.id} isChairman={isChairman} isChairmanPS={isChairmanPS} />
              )}
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};
