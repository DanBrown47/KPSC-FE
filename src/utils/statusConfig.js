export const STATUS_CONFIG = {
  DRAFT: {
    label: 'Draft',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    description: 'Item is being prepared',
  },
  PENDING_WING_APPROVAL: {
    label: 'Pending Wing Approval',
    color: '#D97706',
    bgColor: '#FFFBEB',
    description: 'Awaiting wing approval',
  },
  WING_APPROVED: {
    label: 'Wing Approved',
    color: '#059669',
    bgColor: '#ECFDF5',
    description: 'Approved by wing',
  },
  PENDING_RNA: {
    label: 'Pending R&A',
    color: '#7C3AED',
    bgColor: '#F5F3FF',
    description: 'Awaiting R&A review',
  },
  CONSOLIDATED: {
    label: 'Consolidated',
    color: '#1D4ED8',
    bgColor: '#EFF6FF',
    description: 'Consolidated by R&A',
  },
  FINALIZED: {
    label: 'Finalized',
    color: '#0F1F3D',
    bgColor: '#E0F2FE',
    description: 'Finalized for sitting',
  },
  DISCUSSED: {
    label: 'Discussed',
    color: '#7C3AED',
    bgColor: '#F5F3FF',
    description: 'Item discussed in sitting',
  },
  VOTED: {
    label: 'Voted',
    color: '#0891B2',
    bgColor: '#ECFEFF',
    description: 'Members have voted',
  },
  SUPPLEMENTARY_PENDING: {
    label: 'Supplementary Pending',
    color: '#7C3AED',
    bgColor: '#F5F3FF',
    description: 'Supplementary item pending consolidation',
  },
  SUPPLEMENTARY_CONSOLIDATED: {
    label: 'Supplementary Consolidated',
    color: '#1D4ED8',
    bgColor: '#EFF6FF',
    description: 'Supplementary item consolidated',
  },
  CHAIRMAN_DECIDED: {
    label: 'Chairman Decided',
    color: '#065F46',
    bgColor: '#ECFDF5',
    description: 'Chairman has decided',
  },
  DEFERRED: {
    label: 'Deferred',
    color: '#92400E',
    bgColor: '#FFFBEB',
    description: 'Item deferred by chairman',
  },
  UNAPPROVED: {
    label: 'Unapproved',
    color: '#991B1B',
    bgColor: '#FEF2F2',
    description: 'Item not approved by chairman',
  },
  ARCHIVED: {
    label: 'Archived',
    color: '#374151',
    bgColor: '#F9FAFB',
    description: 'Archived',
  },
  // Meeting statuses
  SCHEDULED: {
    label: 'Scheduled',
    color: '#1D4ED8',
    bgColor: '#EFF6FF',
    description: 'Meeting is scheduled',
  },
  COMPLETED: {
    label: 'Completed',
    color: '#374151',
    bgColor: '#F9FAFB',
    description: 'Meeting is completed',
  },
};

export const VOTE_CONFIG = {
  APPROVE: { label: 'Approve', color: '#059669', bgColor: '#ECFDF5' },
  REJECT: { label: 'Reject', color: '#DC2626', bgColor: '#FEF2F2' },
  POSTPONE: { label: 'Postpone', color: '#D97706', bgColor: '#FFFBEB' },
  DEFER: { label: 'Defer', color: '#2563AB', bgColor: '#EFF6FF' },
  UNDO: { label: 'Undo', color: '#6B7280', bgColor: '#F3F4F6' },
};
