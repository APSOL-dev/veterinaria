/**
 * Domain service for managing agenda time calculations and schedule slots.
 */

/**
 * Calculates end time given start time (HH:MM) and duration in minutes.
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  if (!startTime || durationMinutes <= 0) return startTime;
  const [hours, mins] = startTime.split(':').map(Number);
  if (isNaN(hours) || isNaN(mins)) return startTime;

  const totalMinutes = hours * 60 + mins + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMins = totalMinutes % 60;

  return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
}

/**
 * Calculates duration in minutes between start time (HH:MM) and end time (HH:MM).
 */
export function calculateDurationMinutes(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return 0;

  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  return Math.max(0, endTotal - startTotal);
}

/**
 * Formats a time range (e.g., "09:00 - 10:30").
 */
export function formatTimeRange(
  startTime: string, 
  endTime?: string, 
  defaultDurationMinutes?: number
): string {
  if (!startTime) return '';
  let resolvedEnd = endTime;
  if (!resolvedEnd && defaultDurationMinutes && defaultDurationMinutes > 0) {
    resolvedEnd = calculateEndTime(startTime, defaultDurationMinutes);
  }
  if (resolvedEnd && resolvedEnd !== startTime) {
    return `${startTime} - ${resolvedEnd}`;
  }
  return startTime;
}

/**
 * Determines whether a grid slot (HH:MM) is occupied by an appointment.
 */
export function isSlotOccupiedByAppointment(
  slotTime: string, 
  startTime: string, 
  endTime?: string, 
  defaultDurationMinutes?: number
): { isStart: boolean; isOccupied: boolean } {
  if (!slotTime || !startTime) {
    return { isStart: false, isOccupied: false };
  }

  let resolvedEnd = endTime;
  if (!resolvedEnd && defaultDurationMinutes && defaultDurationMinutes > 0) {
    resolvedEnd = calculateEndTime(startTime, defaultDurationMinutes);
  }

  const [slotH, slotM] = slotTime.split(':').map(Number);
  const [startH, startM] = startTime.split(':').map(Number);

  const slotTotal = slotH * 60 + slotM;
  const startTotal = startH * 60 + startM;

  if (slotTotal === startTotal) {
    return { isStart: true, isOccupied: true };
  }

  if (!resolvedEnd) {
    return { isStart: false, isOccupied: false };
  }

  const [endH, endM] = resolvedEnd.split(':').map(Number);
  const endTotal = endH * 60 + endM;

  if (slotTotal > startTotal && slotTotal < endTotal) {
    return { isStart: false, isOccupied: true };
  }

  return { isStart: false, isOccupied: false };
}

/**
 * Formats a Date object to YYYY-MM-DD string in local time.
 */
export function formatDateToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns the Monday Date of the week containing refDate.
 */
export function getMondayOfDate(refDate?: Date | string): Date {
  const d = refDate ? (typeof refDate === 'string' ? new Date(refDate.includes('T') ? refDate : refDate + 'T00:00:00') : new Date(refDate)) : new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Shifts a reference date by weeksCount weeks.
 */
export function shiftWeek(refDate: Date | string, weeksCount: number): Date {
  const d = typeof refDate === 'string' ? new Date(refDate.includes('T') ? refDate : refDate + 'T00:00:00') : new Date(refDate.getTime());
  d.setDate(d.getDate() + weeksCount * 7);
  return d;
}

const DAY_NAMES_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/**
 * Returns an array of 6 day objects (Monday to Saturday) for the week of refDate.
 */
export function getWeekDays(refDate?: Date | string): Array<{
  dateStr: string;
  dayName: string;
  dayNumber: number;
  fullLabel: string;
}> {
  const monday = getMondayOfDate(refDate);
  const result = [];

  for (let i = 0; i < 6; i++) {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + i);
    const dateStr = formatDateToISO(cur);
    const dayNumber = cur.getDate();
    const dayName = DAY_NAMES_SHORT[i];
    result.push({
      dateStr,
      dayName,
      dayNumber,
      fullLabel: `${dayName} ${dayNumber}`
    });
  }

  return result;
}

const MONTH_NAMES_CAP = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Formats header title string for week range (e.g. "Semana del 7 al 12 de Septiembre").
 */
export function formatWeekRangeHeader(refDate?: Date | string): string {
  const monday = getMondayOfDate(refDate);
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);

  const startDay = monday.getDate();
  const startMonth = MONTH_NAMES_CAP[monday.getMonth()];
  const endDay = saturday.getDate();
  const endMonth = MONTH_NAMES_CAP[saturday.getMonth()];

  if (startMonth === endMonth) {
    return `Semana del ${startDay} al ${endDay} de ${startMonth}`;
  } else {
    return `Semana del ${startDay} de ${startMonth} al ${endDay} de ${endMonth}`;
  }
}

/**
 * Returns YYYY-MM-DD for Wednesday of the week containing refDate.
 */
export function getWednesdayOfCurrentWeek(refDate?: Date | string): string {
  const mon = getMondayOfDate(refDate);
  mon.setDate(mon.getDate() + 2);
  return formatDateToISO(mon);
}
