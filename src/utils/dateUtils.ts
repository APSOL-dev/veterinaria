/**
 * Utility functions for date formatting across the entire application.
 * All user-facing dates should be presented in DD/MM/YYYY format.
 */

/**
 * Formats a date string (YYYY-MM-DD or ISO) or Date object to DD/MM/YYYY.
 * If the input is already in DD/MM/YYYY format, it returns it directly.
 * Handles undefined/null/empty gracefully.
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '';

  if (date instanceof Date) {
    if (isNaN(date.getTime())) return '';
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }

  const str = String(date).trim();
  if (!str) return '';

  // Already DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    return str;
  }

  // Check for ISO Date string like YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  // Try parsing as Date
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const d = String(parsed.getDate()).padStart(2, '0');
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const y = parsed.getFullYear();
    return `${d}/${m}/${y}`;
  }

  return str;
}

/**
 * Formats a date with time, e.g. "24/09/2026 (10:00 hs)"
 */
export function formatDateTime(date: string | Date | null | undefined, time?: string): string {
  const formattedDate = formatDate(date);
  if (!formattedDate) return '';
  if (!time) return formattedDate;
  return `${formattedDate} (${time} hs)`;
}
