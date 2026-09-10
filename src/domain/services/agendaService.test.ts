import { describe, it, expect } from 'vitest';
import { 
  calculateEndTime, 
  calculateDurationMinutes, 
  formatTimeRange, 
  isSlotOccupiedByAppointment,
  getMondayOfDate,
  getWeekDays,
  formatWeekRangeHeader,
  shiftWeek,
  formatDateToISO,
  getWednesdayOfCurrentWeek
} from './agendaService';

describe('agendaService', () => {
  describe('calculateEndTime', () => {
    it('should correctly add 60 minutes to 09:00', () => {
      expect(calculateEndTime('09:00', 60)).toBe('10:00');
    });

    it('should correctly add 45 minutes to 09:30', () => {
      expect(calculateEndTime('09:30', 45)).toBe('10:15');
    });

    it('should correctly add 120 minutes across hours', () => {
      expect(calculateEndTime('10:00', 120)).toBe('12:00');
    });

    it('should return startTime if duration is 0 or negative', () => {
      expect(calculateEndTime('09:00', 0)).toBe('09:00');
      expect(calculateEndTime('09:00', -15)).toBe('09:00');
    });
  });

  describe('calculateDurationMinutes', () => {
    it('should calculate 60 minutes between 09:00 and 10:00', () => {
      expect(calculateDurationMinutes('09:00', '10:00')).toBe(60);
    });

    it('should calculate 90 minutes between 10:00 and 11:30', () => {
      expect(calculateDurationMinutes('10:00', '11:30')).toBe(90);
    });

    it('should return 0 if endTime is equal or before startTime', () => {
      expect(calculateDurationMinutes('10:00', '10:00')).toBe(0);
      expect(calculateDurationMinutes('10:00', '09:00')).toBe(0);
    });
  });

  describe('formatTimeRange', () => {
    it('should format range when both startTime and endTime are provided', () => {
      expect(formatTimeRange('09:00', '10:30')).toBe('09:00 - 10:30');
    });

    it('should format range using defaultDurationMinutes when endTime is missing', () => {
      expect(formatTimeRange('09:00', undefined, 60)).toBe('09:00 - 10:00');
    });

    it('should return only startTime when no endTime or duration is given', () => {
      expect(formatTimeRange('09:00')).toBe('09:00');
    });
  });

  describe('isSlotOccupiedByAppointment', () => {
    it('should return isStart: true and isOccupied: true when slot matches start time', () => {
      const result = isSlotOccupiedByAppointment('09:00', '09:00', '10:30');
      expect(result).toEqual({ isStart: true, isOccupied: true });
    });

    it('should return isStart: false and isOccupied: true when slot is within range', () => {
      const result = isSlotOccupiedByAppointment('10:00', '09:00', '11:00');
      expect(result).toEqual({ isStart: false, isOccupied: true });
    });

    it('should return isStart: false and isOccupied: false when slot is at or after end time', () => {
      const result = isSlotOccupiedByAppointment('11:00', '09:00', '11:00');
      expect(result).toEqual({ isStart: false, isOccupied: false });
    });

    it('should return isStart: false and isOccupied: false when slot is before start time', () => {
      const result = isSlotOccupiedByAppointment('08:00', '09:00', '10:00');
      expect(result).toEqual({ isStart: false, isOccupied: false });
    });

    it('should handle missing endTime using defaultDurationMinutes', () => {
      const result1 = isSlotOccupiedByAppointment('09:00', '09:00', undefined, 120);
      expect(result1).toEqual({ isStart: true, isOccupied: true });

      const result2 = isSlotOccupiedByAppointment('10:00', '09:00', undefined, 120);
      expect(result2).toEqual({ isStart: false, isOccupied: true });

      const result3 = isSlotOccupiedByAppointment('11:00', '09:00', undefined, 120);
      expect(result3).toEqual({ isStart: false, isOccupied: false });
    });
  });

  describe('week calendar calculations', () => {
    it('getMondayOfDate should find Monday for any day of the week', () => {
      // Wednesday Sept 9, 2026 -> Monday Sept 7, 2026
      const wed = new Date(2026, 8, 9); // Month is 0-indexed: 8 = Sept
      const mon = getMondayOfDate(wed);
      expect(mon.getDate()).toBe(7);
      expect(mon.getMonth()).toBe(8);

      // Sunday Sept 13, 2026 -> Monday Sept 7, 2026
      const sun = new Date(2026, 8, 13);
      const monFromSun = getMondayOfDate(sun);
      expect(monFromSun.getDate()).toBe(7);

      // Monday Sept 7, 2026 -> Monday Sept 7, 2026
      const monSelf = getMondayOfDate(new Date(2026, 8, 7));
      expect(monSelf.getDate()).toBe(7);
    });

    it('getWeekDays should return 6 days from Monday to Saturday with dateStr and labels', () => {
      const wed = new Date(2026, 8, 9); // Sept 9, 2026
      const days = getWeekDays(wed);

      expect(days.length).toBe(6);
      expect(days[0]).toEqual({ dateStr: '2026-09-07', dayName: 'Lun', dayNumber: 7, fullLabel: 'Lun 7' });
      expect(days[1]).toEqual({ dateStr: '2026-09-08', dayName: 'Mar', dayNumber: 8, fullLabel: 'Mar 8' });
      expect(days[2]).toEqual({ dateStr: '2026-09-09', dayName: 'Mié', dayNumber: 9, fullLabel: 'Mié 9' });
      expect(days[3]).toEqual({ dateStr: '2026-09-10', dayName: 'Jue', dayNumber: 10, fullLabel: 'Jue 10' });
      expect(days[4]).toEqual({ dateStr: '2026-09-11', dayName: 'Vie', dayNumber: 11, fullLabel: 'Vie 11' });
      expect(days[5]).toEqual({ dateStr: '2026-09-12', dayName: 'Sáb', dayNumber: 12, fullLabel: 'Sáb 12' });
    });

    it('formatWeekRangeHeader should format single month and cross month week ranges', () => {
      // Same month: Sept 7 to Sept 12
      const septWeek = new Date(2026, 8, 9);
      expect(formatWeekRangeHeader(septWeek)).toBe('Semana del 7 al 12 de Septiembre');

      // Cross month: Aug 31 to Sept 5, 2026
      const crossMonthWeek = new Date(2026, 8, 2); // Wednesday Sept 2, 2026 -> Monday is Aug 31
      expect(formatWeekRangeHeader(crossMonthWeek)).toBe('Semana del 31 de Agosto al 5 de Septiembre');
    });

    it('shiftWeek should add or subtract 7 days correctly', () => {
      const initial = new Date(2026, 8, 9); // Sept 9
      const nextWeek = shiftWeek(initial, 1);
      expect(formatDateToISO(nextWeek)).toBe('2026-09-16');

      const prevWeek = shiftWeek(initial, -1);
      expect(formatDateToISO(prevWeek)).toBe('2026-09-02');
    });

    it('getWednesdayOfCurrentWeek should return YYYY-MM-DD for Wednesday of the current week', () => {
      const thu = new Date(2026, 8, 10); // Thursday Sept 10
      expect(getWednesdayOfCurrentWeek(thu)).toBe('2026-09-09');
    });
  });
});
