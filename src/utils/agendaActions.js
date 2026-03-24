// Derives available action buttons from (status + role + wing)
// Never hardcode buttons per page — always call this function

export const getAgendaActions = (item, currentUser) => {
  if (!item || !currentUser) return [];

  const { status } = item;
  const { global_role, wing_roles = [] } = currentUser;

  const actions = [];

  const isWingMember = global_role === 'WING_MEMBER';
  const isWingASJS = global_role === 'WING_ASJS' || wing_roles.some(r => r.wing_role === 'AS_JS');
  const isRNAASJS = global_role === 'RNA_ASJS';
  const isChairmanPS = global_role === 'CHAIRMAN_PS';
  const isMember = global_role === 'MEMBER';
  const isChairman = global_role === 'CHAIRMAN';
  const isWebAdmin = global_role === 'WEB_ADMIN';

  // Wing is not a direct FK on UserProfile — derive from wing_roles
  const userWingId = currentUser.wing_roles?.find(r => r.is_active !== false)?.wing;
  const itemWingId = item.wing?.id || item.wing;
  const isOwnWing = userWingId && itemWingId && userWingId === itemWingId;

  switch (status) {
    case 'DRAFT':
      if (isWingMember && isOwnWing) {
        actions.push({ key: 'edit', label: 'Edit', variant: 'outlined', color: 'primary' });
        actions.push({ key: 'submit', label: 'Submit for Approval', variant: 'contained', color: 'primary' });
        actions.push({ key: 'delete', label: 'Delete', variant: 'outlined', color: 'error' });
      }
      break;

    case 'PENDING_WING_APPROVAL':
      if (isWingASJS && isOwnWing) {
        actions.push({ key: 'approve_wing', label: 'Approve', variant: 'contained', color: 'success' });
        actions.push({ key: 'return_wing', label: 'Return', variant: 'outlined', color: 'error' });
      }
      if (isWingMember && isOwnWing) {
        actions.push({ key: 'withdraw', label: 'Withdraw', variant: 'outlined', color: 'warning' });
      }
      break;

    case 'WING_APPROVED':
      if (isRNAASJS) {
        actions.push({ key: 'approve_rna', label: 'Approve for RNA', variant: 'contained', color: 'primary' });
        actions.push({ key: 'return_rna', label: 'Return', variant: 'outlined', color: 'error' });
      }
      break;

    case 'PENDING_RNA':
      if (isRNAASJS) {
        actions.push({ key: 'consolidate', label: 'Consolidate', variant: 'contained', color: 'primary' });
        actions.push({ key: 'return_rna', label: 'Return', variant: 'outlined', color: 'error' });
      }
      break;

    case 'CONSOLIDATED':
      if (isChairmanPS) {
        actions.push({ key: 'finalize', label: 'Finalize', variant: 'contained', color: 'primary' });
      }
      break;

    case 'FINALIZED':
      if (isMember || isChairman || isChairmanPS) {
        actions.push({ key: 'view_detail', label: 'View Detail', variant: 'outlined', color: 'primary' });
      }
      break;

    case 'DISCUSSED':
      if (isChairman || isChairmanPS || isMember) {
        actions.push({ key: 'view_detail', label: 'View Detail', variant: 'outlined', color: 'primary' });
      }
      break;

    case 'VOTED':
      if (isChairmanPS) {
        actions.push({ key: 'chairman_decision', label: 'Enter Decision', variant: 'contained', color: 'secondary' });
      }
      break;

    case 'CHAIRMAN_DECIDED':
      if (isChairmanPS || isWebAdmin) {
        actions.push({ key: 'archive', label: 'Archive', variant: 'outlined', color: 'inherit' });
      }
      break;

    default:
      break;
  }

  // View is always available for non-web-admin roles
  if (!isWebAdmin && !actions.find(a => a.key === 'view_detail')) {
    actions.push({ key: 'view', label: 'View', variant: 'text', color: 'primary' });
  }

  return actions;
};

export const isItemLocked = (item) => {
  const lockedStatuses = ['PENDING_WING_APPROVAL', 'WING_APPROVED', 'PENDING_RNA', 'CONSOLIDATED', 'FINALIZED', 'VOTED', 'CHAIRMAN_DECIDED', 'ARCHIVED'];
  return lockedStatuses.includes(item?.status);
};
