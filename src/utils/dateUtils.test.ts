import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime } from './dateUtils';

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('formats YYYY-MM-DD to DD/MM/YYYY', () => {
      expect(formatDate('2026-09-24')).toBe('24/09/2026');
      expect(formatDate('2026-01-05')).toBe('05/01/2026');
      expect(formatDate('2026-12-31')).toBe('31/12/2026');
    });

    it('formats ISO timestamps with T to DD/MM/YYYY', () => {
      expect(formatDate('2026-09-24T15:30:00.000Z')).toBe('24/09/2026');
      expect(formatDate('2026-08-10T00:00:00')).toBe('10/08/2026');
    });

    it('formats Date objects to DD/MM/YYYY', () => {
      const d = new Date(2026, 8, 24); // Sept 24, 2026 (month 8 is 0-indexed)
      expect(formatDate(d)).toBe('24/09/2026');
    });

    it('preserves already formatted DD/MM/YYYY strings', () => {
      expect(formatDate('24/09/2026')).toBe('24/09/2026');
      expect(formatDate('01/01/2025')).toBe('01/01/2025');
    });

    it('handles single digit months or days in YYYY-M-D', () => {
      expect(formatDate('2026-9-4')).toBe('04/09/2026');
    });

    it('returns empty string for null, undefined, or empty string', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
      expect(formatDate('')).toBe('');
      expect(formatDate('   ')).toBe('');
    });

    it('handles invalid dates gracefully without throwing', () => {
      expect(formatDate('not-a-date')).toBe('not-a-date');
    });
  });

  describe('formatDateTime', () => {
    it('formats date and adds time in brackets with hs', () => {
      expect(formatDateTime('2026-09-24', '10:00')).toBe('24/09/2026 (10:00 hs)');
    });

    it('returns only date when time is not provided', () => {
      expect(formatDateTime('2026-09-24')).toBe('24/09/2026');
      expect(formatDateTime('2026-09-24', '')).toBe('24/09/2026');
    });

    it('returns empty string if date is empty', () => {
      expect(formatDateTime('', '10:00')).toBe('');
    });
  });
});
