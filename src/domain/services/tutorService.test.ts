import { describe, it, expect } from 'vitest';
import { Patient } from '../types';
import { 
  getUniqueTutores, 
  updateTutorAndPetInfo 
} from './tutorService';

describe('tutorService', () => {
  const mockPatients: Patient[] = [
    {
      id: 'p1',
      ownerId: 'ow1',
      name: 'Rocky',
      species: 'Canino',
      breed: 'Golden Retriever',
      sex: 'Macho',
      birthDate: '2018-03-12',
      weightKg: 32.4,
      ownerName: 'Carlos Mendoza',
      ownerPhone: '+5491144556677',
      status: 'active',
      weightHistory: []
    },
    {
      id: 'p2',
      ownerId: 'ow1',
      name: 'Muna',
      species: 'Felino',
      breed: 'Gato Siamés',
      sex: 'Hembra',
      birthDate: '2020-06-15',
      weightKg: 4.2,
      ownerName: 'Carlos Mendoza',
      ownerPhone: '+5491144556677',
      status: 'active',
      weightHistory: []
    }
  ];

  it('getUniqueTutores should group patients by owner name correctly', () => {
    const tutores = getUniqueTutores(mockPatients);
    expect(tutores.length).toBe(1);
    expect(tutores[0].ownerName).toBe('Carlos Mendoza');
    expect(tutores[0].pets.length).toBe(2);
    expect(tutores[0].pets[0].name).toBe('Rocky');
    expect(tutores[0].pets[1].name).toBe('Muna');
  });

  it('updateTutorAndPetInfo should update tutor and pet data across patients', () => {
    const updated = updateTutorAndPetInfo(
      mockPatients,
      'Carlos Mendoza',
      {
        newOwnerName: 'Carlos E. Mendoza',
        newOwnerPhone: '+5491199887766',
        petUpdates: {
          p1: { name: 'Rocky II', weightKg: 33.0 }
        }
      }
    );

    const p1 = updated.find(p => p.id === 'p1')!;
    const p2 = updated.find(p => p.id === 'p2')!;

    expect(p1.ownerName).toBe('Carlos E. Mendoza');
    expect(p1.ownerPhone).toBe('+5491199887766');
    expect(p1.name).toBe('Rocky II');
    expect(p1.weightKg).toBe(33.0);

    expect(p2.ownerName).toBe('Carlos E. Mendoza');
    expect(p2.ownerPhone).toBe('+5491199887766');
    expect(p2.name).toBe('Muna');
  });
});
