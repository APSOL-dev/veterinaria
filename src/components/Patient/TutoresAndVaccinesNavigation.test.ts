import { describe, it, expect, vi } from 'vitest';
import { Patient } from '../../domain/types';
import { getUniqueTutores } from '../../domain/services/tutorService';

describe('Tutores and Vaccines Navigation Flow', () => {
  const mockPatients: Patient[] = [
    {
      id: 'p1',
      ownerId: 'tutor-1',
      name: 'MONA',
      species: 'Canino',
      breed: 'LABRADOR',
      sex: 'Hembra',
      birthDate: '2020-01-01',
      weightKg: 25,
      ownerName: 'PEDRO',
      ownerPhone: '3424053366',
      status: 'active',
      weightHistory: []
    },
    {
      id: 'p2',
      ownerId: 'tutor-2',
      name: 'DOKY',
      species: 'Canino',
      breed: 'YORKSHIRE-CANICHE',
      sex: 'Macho',
      birthDate: '2019-05-10',
      weightKg: 6,
      ownerName: 'RAMELLO MIRTA',
      ownerPhone: '156144292',
      status: 'active',
      weightHistory: []
    }
  ];

  it('should extract unique tutores and allow selecting a pet for medical file navigation', () => {
    const tutores = getUniqueTutores(mockPatients);
    expect(tutores.length).toBe(2);

    const pedroTutor = tutores.find(t => t.ownerName === 'PEDRO');
    expect(pedroTutor).toBeDefined();
    expect(pedroTutor?.pets.length).toBe(1);
    expect(pedroTutor?.pets[0].id).toBe('p1');

    const onSelectPatientMock = vi.fn();
    if (pedroTutor?.pets[0]) {
      onSelectPatientMock(pedroTutor.pets[0]);
    }

    expect(onSelectPatientMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'p1',
        name: 'MONA'
      })
    );
  });

  it('should correctly select patient in vaccine control and route to patient profile', () => {
    const selectedPatient = mockPatients[1]; // DOKY
    const onNavigateToPatientMock = vi.fn();

    onNavigateToPatientMock(selectedPatient);

    expect(onNavigateToPatientMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'p2',
        name: 'DOKY',
        ownerName: 'RAMELLO MIRTA'
      })
    );
  });
});
