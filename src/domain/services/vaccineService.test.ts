import { describe, it, expect } from 'vitest';
import { 
  calculateExpirationDate, 
  determineVaccineStatus, 
  createDosisRecord 
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
});
