import { describe, it, expect } from 'vitest';
import { 
  calculateExpirationDate, 
  determineVaccineStatus, 
  createDosisRecord,
  formatVaccineReminderMessage,
  getVencimientoLabel,
  getEstadoLabel,
  getEffectiveVaccineNextDueDate
} from './vaccineService';
import { VaccineCatalogItem } from '../types';

describe('vaccineService', () => {
  describe('calculateExpirationDate', () => {
    it('calculates expiration date based on frequency in days', () => {
      const applicationDate = '2024-03-15';
      const frequencyDays = 365;
      const expiration = calculateExpirationDate(applicationDate, frequencyDays);
      expect(expiration).toBe('2025-03-15');
    });

    it('handles short frequencies correctly', () => {
      const applicationDate = '2024-01-01';
      const frequencyDays = 30;
      const expiration = calculateExpirationDate(applicationDate, frequencyDays);
      expect(expiration).toBe('2024-01-31');
    });
  });

  describe('determineVaccineStatus', () => {
    const today = '2024-06-01';

    it('returns "ok" if expiration is more than 30 days away', () => {
      const status = determineVaccineStatus('2024-07-15', today);
      expect(status).toBe('ok');
    });

    it('returns "due_soon" if expiration is within 30 days', () => {
      const status = determineVaccineStatus('2024-06-15', today);
      expect(status).toBe('due_soon');
    });

    it('returns "expired" if expiration date has passed', () => {
      const status = determineVaccineStatus('2024-05-22', today);
      expect(status).toBe('expired');
    });
  });

  describe('createDosisRecord', () => {
    const vaccineCatalogItem: VaccineCatalogItem = {
      id: 'v1',
      name: 'Séxtuple Canina',
      frequencyDays: 365
    };

    it('creates a valid VaccineDosis record with auto-calculated expiration date', () => {
      const dosis = createDosisRecord(
        'p1',
        vaccineCatalogItem,
        '2024-03-15',
        'Dr. J. Silva',
        undefined,
        'LOT12345'
      );

      expect(dosis.patientId).toBe('p1');
      expect(dosis.vaccineId).toBe('v1');
      expect(dosis.vaccineName).toBe('Séxtuple Canina');
      expect(dosis.applicationDate).toBe('2024-03-15');
      expect(dosis.expirationDate).toBe('2025-03-15');
      expect(dosis.vetName).toBe('Dr. J. Silva');
      expect(dosis.batch).toBe('LOT12345');
    });

    it('allows overriding expiration date manually', () => {
      const dosis = createDosisRecord(
        'p1',
        vaccineCatalogItem,
        '2024-03-15',
        'Dra. Ana López',
        '2024-12-31'
      );

      expect(dosis.expirationDate).toBe('2024-12-31');
    });
  });

  describe('formatVaccineReminderMessage', () => {
    it('formats vaccine reminder text using exact specified pattern', () => {
      const msg = formatVaccineReminderMessage(
        'Juan Perez',
        'Antirrábica',
        'Prueba',
        '2026-10-15'
      );

      expect(msg).toBe(
        'Hola Juan Perez, te recordamos que la vacuna Antirrábica para Prueba vence el 2026-10-15 podemos agendar una visita para poner a Prueba al día!'
      );
    });
  });

  describe('getVencimientoLabel', () => {
    it('returns "Vencida" for expired status', () => {
      expect(getVencimientoLabel('expired')).toBe('Vencida');
    });

    it('returns "Al día" for ok or due_soon status', () => {
      expect(getVencimientoLabel('ok')).toBe('Al día');
      expect(getVencimientoLabel('due_soon')).toBe('Al día');
    });
  });

  describe('getEffectiveVaccineNextDueDate', () => {
    const catalog: VaccineCatalogItem[] = [
      { id: 'v1', name: 'Antirrábica', frequencyDays: 365 },
      { id: 'v2', name: 'Séxtuple Canina', frequencyDays: 180 }
    ];

    it('returns suggestedDate if vaccine is pending', () => {
      const vac = { id: 'req-1', vaccineName: 'Antirrábica', suggestedDate: '2026-10-15', status: 'pendiente' as const };
      const nextDate = getEffectiveVaccineNextDueDate('p1', vac, [], catalog);
      expect(nextDate).toBe('2026-10-15');
    });

    it('returns dosis.expirationDate if vaccine is applied and matching dose exists in history', () => {
      const vac = { id: 'req-1', vaccineName: 'Antirrábica', suggestedDate: '2026-10-15', status: 'aplicada' as const, appliedDate: '2026-09-28' };
      const doses = [{
        id: 'd1',
        patientId: 'p1',
        vaccineId: 'v1',
        vaccineName: 'Antirrábica',
        applicationDate: '2026-09-28',
        expirationDate: '2027-09-28',
        vetName: 'Dr. J. Silva',
        status: 'ok' as const
      }];
      const nextDate = getEffectiveVaccineNextDueDate('p1', vac, doses, catalog);
      expect(nextDate).toBe('2027-09-28');
    });

    it('calculates next due date from appliedDate + frequencyDays if no dose in history', () => {
      const vac = { id: 'req-2', vaccineName: 'Séxtuple Canina', suggestedDate: '2026-01-01', status: 'aplicada' as const, appliedDate: '2026-01-01' };
      const nextDate = getEffectiveVaccineNextDueDate('p1', vac, [], catalog);
      expect(nextDate).toBe('2026-06-30');
    });
  });
});

