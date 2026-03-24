// Serial numbers are hidden until meeting.status === 'FINALIZED'
// Exception: R&A consolidator can see them during consolidation

export const shouldShowSerialNumber = (item, meeting, currentUser) => {
  if (!item || !currentUser) return false;

  const isRNAASJS = currentUser.global_role === 'RNA_ASJS';
  const isConsolidating = meeting?.status === 'CONSOLIDATED' || meeting?.status === 'PENDING_RNA';

  // RNA ASJS can see serial numbers during consolidation
  if (isRNAASJS && isConsolidating) return true;

  // All roles can see after finalization
  if (meeting?.status === 'FINALIZED' || meeting?.status === 'COMPLETED') return true;

  // After voting stages
  if (['VOTED', 'CHAIRMAN_DECIDED', 'ARCHIVED'].includes(meeting?.status)) return true;

  return false;
};

export const formatSerialNumber = (serialNumber, meetingYear) => {
  if (!serialNumber) return '—';
  if (meetingYear) return `${serialNumber}/${meetingYear}`;
  return String(serialNumber);
};
