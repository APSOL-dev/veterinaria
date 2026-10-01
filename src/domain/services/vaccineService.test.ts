import { describe, it, expect } from 'vitest';
import { 
  calculateExpirationDate, 
  determineVaccineStatus, 
  createDosisRecord,
  formatVaccineReminderMessage,
  getVencimientoLabel,
  getEstadoLabel,
  getEffectiveVaccineNextDueDate,
  getPendingOrDueVaccine,
  calculatePatientVaccineCoverage
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
  });

  describe('getPendingOrDueVaccine', () => {
    const patientWithoutVaccines = {
      id: 'p-mona',
      ownerId: 'own-1',
      name: 'MONA',
      species: 'Canino' as const,
      breed: 'Mestizo',
      sex: 'Hembra' as const,
      birthDate: '2020-01-01',
      ownerName: 'Juan',
      status: 'active' as const,
      weightKg: 10,
      requiredVaccines: []
    };

    it('returns null when patient has no doses and no required vaccines', () => {
      const result = getPendingOrDueVaccine(patientWithoutVaccines, []);
      expect(result).toBeNull();
    });

    it('returns pending required vaccine when patient has pending required vaccines', () => {
      const patientWithReq = {
        ...patientWithoutVaccines,
        requiredVaccines: [
          { id: 'req-1', vaccineName: 'Quíntuple', suggestedDate: '2026-11-01', status: 'pendiente' as const }
        ]
      };
      const result = getPendingOrDueVaccine(patientWithReq, []);
      expect(result).toEqual({
        vaccineName: 'Quíntuple',
        expirationDate: '2026-11-01',
        isExpired: false,
        isRequiredPending: true
      });
    });

    it('returns expired or due soon dose when dose exists for patient', () => {
      const doses = [{
        id: 'd-1',
        patientId: 'p-mona',
        vaccineId: 'v1',
        vaccineName: 'Antirrábica',
        applicationDate: '2025-05-01',
        expirationDate: '2026-05-01',
        vetName: 'Dr. Silva',
        status: 'expired' as const
      }];
      const result = getPendingOrDueVaccine(patientWithoutVaccines, doses);
      expect(result).toEqual({
        vaccineName: 'Antirrábica',
        expirationDate: '2026-05-01',
        isExpired: true,
        isRequiredPending: false
      });
    });

    it('returns null when all doses are ok and all required vaccines are applied', () => {
      const patientWithApplied = {
        ...patientWithoutVaccines,
        requiredVaccines: [
          { id: 'req-1', vaccineName: 'Antirrábica', suggestedDate: '2026-05-01', status: 'aplicada' as const, appliedDate: '2026-05-01' }
        ]
      };
      const doses = [{
        id: 'd-1',
        patientId: 'p-mona',
        vaccineId: 'v1',
        vaccineName: 'Antirrábica',
        applicationDate: '2026-05-01',
        expirationDate: '2027-05-01',
        vetName: 'Dr. Silva',
        status: 'ok' as const
      }];
      const result = getPendingOrDueVaccine(patientWithApplied, doses);
      expect(result).toBeNull();
    });
  });

  describe('calculatePatientVaccineCoverage', () => {
    const today = '2026-10-01';

    it('returns 0% when patient has doses but all of them are expired (case BILBO)', () => {
      const patient = {
        id: 'p-bilbo',
        ownerId: 'own-1',
        name: 'BILBO',
        species: 'Canino' as const,
        breed: 'LABRADOR',
        sex: 'Macho' as const,
        birthDate: '2018-01-01',
        ownerName: 'LEONARDO',
        status: 'active' as const,
        weightKg: 30,
        requiredVaccines: []
      };

      const doses = [
        {
          id: 'd-1',
          patientId: 'p-bilbo',
          vaccineId: 'v1',
          vaccineName: 'QUINTUPLE',
          applicationDate: '2019-04-13',
          expirationDate: '2019-05-06',
          vetName: 'Veterinaria',
          status: 'expired' as const
        },
        {
          id: 'd-2',
          patientId: 'p-bilbo',
          vaccineId: 'v2',
          vaccineName: 'SEXTUPLE',
          applicationDate: '2021-06-24',
          expirationDate: '2022-06-24',
          vetName: 'Veterinaria',
          status: 'expired' as const
        },
        {
          id: 'd-3',
          patientId: 'p-bilbo',
          vaccineId: 'v3',
          vaccineName: 'ANTIRRABICA',
          applicationDate: '2021-06-24',
          expirationDate: '2022-06-24',
          vetName: 'Veterinaria',
          status: 'expired' as const
        }
      ];

      const coverage = calculatePatientVaccineCoverage(patient, doses, [], today);
      expect(coverage.percentage).toBe(0);
      expect(coverage.validCount).toBe(0);
      expect(coverage.totalCount).toBe(3);
      expect(coverage.label).toContain('0 de 3 vacunas al día');
    });

    it('returns 100% when all latest doses are valid/up to date', () => {
      const patient = {
        id: 'p-1',
        ownerId: 'own-1',
        name: 'Firulais',
        species: 'Canino' as const,
        breed: 'Mestizo',
        sex: 'Macho' as const,
        birthDate: '2020-01-01',
        ownerName: 'Ana',
        status: 'active' as const,
        weightKg: 15,
        requiredVaccines: []
      };

      const doses = [
        {
          id: 'd-1',
          patientId: 'p-1',
          vaccineId: 'v1',
          vaccineName: 'ANTIRRABICA',
          applicationDate: '2026-05-01',
          expirationDate: '2027-05-01',
          vetName: 'Dr. Silva',
          status: 'ok' as const
        }
      ];

      const coverage = calculatePatientVaccineCoverage(patient, doses, [], today);
      expect(coverage.percentage).toBe(100);
      expect(coverage.validCount).toBe(1);
      expect(coverage.totalCount).toBe(1);
    });

    it('calculates percentage correctly based on required vaccines when defined', () => {
      const patient = {
        id: 'p-2',
        ownerId: 'own-1',
        name: 'Pelusa',
        species: 'Felino' as const,
        breed: 'Común',
        sex: 'Hembra' as const,
        birthDate: '2021-01-01',
        ownerName: 'Carlos',
        status: 'active' as const,
        weightKg: 4,
        requiredVaccines: [
          { id: 'req-1', vaccineName: 'Triple Felina', suggestedDate: '2026-11-01', status: 'aplicada' as const, appliedDate: '2026-06-01' },
          { id: 'req-2', vaccineName: 'Antirrábica', suggestedDate: '2026-08-01', status: 'pendiente' as const }
        ]
      };

      const doses = [
        {
          id: 'd-1',
          patientId: 'p-2',
          vaccineId: 'v1',
          vaccineName: 'Triple Felina',
          applicationDate: '2026-06-01',
          expirationDate: '2027-06-01',
          vetName: 'Dr. Silva',
          status: 'ok' as const
        }
      ];

      const coverage = calculatePatientVaccineCoverage(patient, doses, [], today);
      expect(coverage.percentage).toBe(50);
      expect(coverage.validCount).toBe(1);
      expect(coverage.totalCount).toBe(2);
    });

    it('returns 0% if required vaccine was marked aplicada but its expiration is in the past', () => {
      const patient = {
        id: 'p-3',
        ownerId: 'own-1',
        name: 'Rex',
        species: 'Canino' as const,
        breed: 'Ovejero',
        sex: 'Macho' as const,
        birthDate: '2019-01-01',
        ownerName: 'Juan',
        status: 'active' as const,
        weightKg: 30,
        requiredVaccines: [
          { id: 'req-1', vaccineName: 'Antirrábica', suggestedDate: '2024-01-01', status: 'aplicada' as const, appliedDate: '2024-01-01' }
        ]
      };

      const doses = [
        {
          id: 'd-1',
          patientId: 'p-3',
          vaccineId: 'v1',
          vaccineName: 'Antirrábica',
          applicationDate: '2024-01-01',
          expirationDate: '2025-01-01',
          vetName: 'Dr. Silva',
          status: 'expired' as const
        }
      ];

      const coverage = calculatePatientVaccineCoverage(patient, doses, [], today);
      expect(coverage.percentage).toBe(0);
      expect(coverage.validCount).toBe(0);
      expect(coverage.totalCount).toBe(1);
    });
  });
});

