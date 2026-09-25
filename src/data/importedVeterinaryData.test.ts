import { describe, it, expect } from 'vitest';
import {
  importedOwners,
  importedPatients,
  importedClinicalNotes,
  importedVaccineCatalog,
  importedVaccineDoses
} from './importedVeterinaryData';
import { initialPatients, initialOwners, initialClinicalNotes, initialVaccineCatalog, initialVaccineDoses } from './mockData';
import { getUniqueTutores } from '../domain/services/tutorService';

describe('Imported Veterinary Data - HDG Excel Integration', () => {
  it('loads exactly 620 clients/tutores from excel', () => {
    expect(importedOwners.length).toBe(620);
    expect(initialOwners.length).toBe(620);
    
    // Verify sample owner
    const firstOwner = importedOwners[0];
    expect(firstOwner.id).toBe('owner-1');
    expect(firstOwner.name).toBe('PEDRO');
    expect(firstOwner.phone).toBe('3424053366');
  });

  it('loads exactly 766 patients with mapped attributes', () => {
    expect(importedPatients.length).toBe(766);
    expect(initialPatients.length).toBe(766);

    // Check first patient
    const mona = importedPatients[0];
    expect(mona.id).toBe('patient-1');
    expect(mona.name).toBe('MONA');
    expect(mona.species).toBe('Canino');
    expect(mona.breed).toBe('LABRADOR');
    expect(mona.sex).toBe('Hembra');
    expect(mona.ownerName).toBe('PEDRO');
    expect(mona.alerts).toContain('Esterilizado');
    expect(mona.weightKg).toBeGreaterThan(0);
  });

  it('handles orphan patients with id_cliente 0 gracefully without crash', () => {
    const orphanPatients = importedPatients.filter(p => p.ownerId === 'owner-0');
    expect(orphanPatients.length).toBe(2);
    orphanPatients.forEach(p => {
      expect(p.ownerName).toBe('Sin tutor asignado');
    });
  });

  it('loads exactly 1564 clinical consultation notes', () => {
    expect(importedClinicalNotes.length).toBe(1564);
    expect(initialClinicalNotes.length).toBe(1564);

    const firstNote = importedClinicalNotes[0];
    expect(firstNote.id).toBe('note-1');
    expect(firstNote.patientId).toBe('patient-1');
    expect(firstNote.notes).toContain('DIAGNÓSTICO: DOLOR');
    expect(firstNote.notes).toContain('TTO: DEXA+TRAMADOL');
  });

  it('loads 19 vaccine catalog items and 797 vaccine doses', () => {
    expect(importedVaccineCatalog.length).toBe(19);
    expect(initialVaccineCatalog.length).toBe(19);

    expect(importedVaccineDoses.length).toBe(797);
    expect(initialVaccineDoses.length).toBe(797);

    const firstDose = importedVaccineDoses[0];
    expect(firstDose.id).toBe('dose-1');
    expect(firstDose.patientId).toBe('patient-2');
    expect(firstDose.vaccineName).toBe('SEXTUPLE');
    expect(firstDose.batch).toBe('QUANTUM');
  });

  it('allows tutorService to aggregate imported patients by tutor properly', () => {
    const tutores = getUniqueTutores(importedPatients);
    expect(tutores.length).toBeGreaterThan(500);
    const pedroTutor = tutores.find(t => t.ownerName === 'PEDRO');
    expect(pedroTutor).toBeDefined();
    expect(pedroTutor?.pets.length).toBeGreaterThanOrEqual(1);
  });
});
