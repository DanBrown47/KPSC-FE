/**
 * Extract the sitting ordinal (e.g. "1st", "2nd") from a meeting title.
 * Titles follow the pattern: "1st SITTING OF THE COMMISSION FOR THE MONTH OF …"
 * Returns the ordinal string or null if the pattern doesn't match.
 */
export function extractSittingOrdinal(meetingTitle) {
  if (!meetingTitle) return null;
  const match = meetingTitle.match(/^(\d+(?:st|nd|rd|th))\s+SITTING/i);
  return match ? match[1] : null;
}

/**
 * Format a date string as DD-MM-YYYY.
 */
export function formatSittingDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Build a human-readable sitting info line from meeting title and date.
 * Returns something like "1st Sitting scheduled on 20-04-2026"
 * or a shorter fallback if the ordinal can't be extracted.
 */
export function formatSittingInfo(meetingTitle, meetingDate) {
  const ordinal = extractSittingOrdinal(meetingTitle);
  const dateStr = formatSittingDate(meetingDate);
  if (ordinal && dateStr) {
    return `${ordinal} Sitting scheduled on ${dateStr}`;
  }
  if (dateStr) {
    return `Sitting scheduled on ${dateStr}`;
  }
  return null;
}