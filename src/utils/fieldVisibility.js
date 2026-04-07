// Returns visible field groups based on role
// Base fields visible to all; wing-content/admin/decision fields gated by role

export const FIELD_GROUPS = {
  BASE: 'base',
  WING_CONTENT: 'wing_content',
  ADMIN: 'admin',
  DECISION: 'decision',
};

export const getVisibleFields = (item, currentUser) => {
  if (!item || !currentUser) return [FIELD_GROUPS.BASE];

  const { global_role } = currentUser;
  const fields = [FIELD_GROUPS.BASE];

  // Wing content visible to wing roles + RNA (own-wing only) + above
  const canSeeWingContent = ['WING_MEMBER', 'WING_ASJS', 'CHAIRMAN_PS', 'CHAIRMAN', 'MEMBER', 'WEB_ADMIN'].includes(global_role)
    || (global_role === 'RNA_ASJS' && (() => {
      // RNA_ASJS: only show wing content for items from their own wing(s)
      const userWingIds = (currentUser.wing_roles || [])
        .filter(wr => wr.is_active)
        .map(wr => wr.wing);
      return userWingIds.includes(item.wing);
    })());
  if (canSeeWingContent) {
    fields.push(FIELD_GROUPS.WING_CONTENT);
  }

  // Admin fields for RNA and above
  if (['RNA_ASJS', 'CHAIRMAN_PS', 'WEB_ADMIN'].includes(global_role)) {
    fields.push(FIELD_GROUPS.ADMIN);
  }

  // Decision fields visible after voting for chairman roles
  if (['CHAIRMAN', 'CHAIRMAN_PS', 'MEMBER'].includes(global_role)) {
    const decisionStatuses = ['VOTED', 'CHAIRMAN_DECIDED', 'ARCHIVED'];
    if (decisionStatuses.includes(item.status)) {
      fields.push(FIELD_GROUPS.DECISION);
    }
  }

  return fields;
};

export const BASE_FIELDS = [
  { key: 'serial_number', label: 'Serial No.' },
  { key: 'topic', label: 'Topic' },
  { key: 'wing', label: 'Wing' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Created' },
  { key: 'submitted_at', label: 'Submitted' },
];

export const WING_CONTENT_FIELDS = [
  { key: 'description', label: 'Description' },
  { key: 'discussion_points', label: 'Discussion Points' },
  { key: 'file_number', label: 'File No.' },
];

export const ADMIN_FIELDS = [
  { key: 'is_supplementary', label: 'Type' },
  { key: 'approvals', label: 'Approval History' },
];

export const DECISION_FIELDS = [
  { key: 'vote_summary', label: 'Vote Summary' },
  { key: 'chairman_decision', label: "Chairman's Decision" },
  { key: 'commission_decision', label: 'Commission Decision' },
  { key: 'decided_at', label: 'Decision Date' },
];
