import { describe, it, expect } from 'vitest';
import { Patient } from '../types';
import { 
  getUniqueTutores, 
  updateTutorAndPetInfo,
  calculateTutorAccountMovements 
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

  it('calculateTutorAccountMovements should calculate Debe, Haber and running Saldo for a tutor', () => {
    const receipts = [
      { id: 'r1', receiptNumber: 'FC-B-0001', date: '2026-08-01', clientName: 'Carlos Mendoza', total: 15000 },
      { id: 'r2', receiptNumber: 'FC-B-0002', date: '2026-08-10', clientName: 'Carlos Mendoza', total: 5000 }
    ];
    const tutorPayments = [
      { id: 'tp1', tutorName: 'Carlos Mendoza', date: '2026-08-05', amount: 10000, concept: 'Abono a cuenta' }
    ];

    const movements = calculateTutorAccountMovements('Carlos Mendoza', receipts as any, tutorPayments);

    expect(movements.length).toBe(3);
    // 1. FC-B-0001 (2026-08-01): Debe = 15000, Haber = 0, Saldo = 15000
    expect(movements[0].debe).toBe(15000);
    expect(movements[0].saldo).toBe(15000);

    // 2. Abono tp1 (2026-08-05): Debe = 0, Haber = 10000, Saldo = 5000
    expect(movements[1].haber).toBe(10000);
    expect(movements[1].saldo).toBe(5000);

    // 3. FC-B-0002 (2026-08-10): Debe = 5000, Haber = 0, Saldo = 10000
    expect(movements[2].debe).toBe(5000);
    expect(movements[2].saldo).toBe(10000);
  });
});
