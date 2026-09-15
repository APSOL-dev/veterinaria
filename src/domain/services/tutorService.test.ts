import { describe, it, expect } from 'vitest';
import { Patient } from '../types';
import { 
  getUniqueTutores, 
  updateTutorAndPetInfo,
  calculateTutorAccountMovements,
  getTutorAppointments,
  createPetForTutor
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

  it('calculateTutorAccountMovements should match receipts by petId when ownerName is undefined on receipt', () => {
    const receipts = [
      { id: 'r-db-1', receiptNumber: 'FC-C-0001-00007394', date: '2026-09-14', patientId: 'p1', totalAmount: 15000, paymentMethod: 'cuenta-corriente' }
    ];

    const movements = calculateTutorAccountMovements('Carlos Mendoza', receipts as any, [], ['p1', 'p2']);

    expect(movements.length).toBe(1);
    expect(movements[0].concept).toContain('FC-C-0001-00007394');
    expect(movements[0].debe).toBe(15000);
    expect(movements[0].haber).toBe(0);
    expect(movements[0].saldo).toBe(15000);
  });

  it('getTutorAppointments should retrieve medical and grooming appointments for a tutor', () => {
    const medical = [
      {
        id: 'med1',
        patientId: 'p1',
        patientName: 'Rocky',
        species: 'Canino' as const,
        breed: 'Golden Retriever',
        ownerName: 'Carlos Mendoza',
        vetName: 'Silva',
        date: '2026-09-20',
        time: '10:00',
        reason: 'Consulta general',
        status: 'pending' as const
      }
    ];

    const grooming = [
      {
        id: 'groom1',
        patientId: 'p1',
        patientName: 'Rocky',
        species: 'Canino' as const,
        breed: 'Golden Retriever',
        ownerName: 'Carlos Mendoza',
        serviceId: 's1',
        serviceName: 'Baño Completo',
        date: '2026-09-18',
        time: '14:00',
        durationMinutes: 45,
        price: 3500,
        status: 'pending' as const
      }
    ];

    const appointments = getTutorAppointments('Carlos Mendoza', ['p1', 'p2'], medical, grooming);

    expect(appointments.length).toBe(2);
    // Sorted by date/time: groom1 (2026-09-18) comes first, med1 (2026-09-20) second
    expect(appointments[0].id).toBe('groom1');
    expect(appointments[0].type).toBe('Peluquería / Estética');
    expect(appointments[1].id).toBe('med1');
    expect(appointments[1].type).toBe('Consulta Médica');
  });

  it('updateTutorAndPetInfo should update address, sex and birthDate', () => {
    const updated = updateTutorAndPetInfo(
      mockPatients,
      'Carlos Mendoza',
      {
        newOwnerName: 'Carlos Mendoza',
        newOwnerPhone: '+5491144556677',
        newAddress: 'Av. Corrientes 1234',
        petUpdates: {
          p1: { name: 'Rocky', sex: 'Macho', birthDate: '2017-05-10', weightKg: 32.4 }
        }
      }
    );

    const p1 = updated.find(p => p.id === 'p1')!;
    expect(p1.address).toBe('Av. Corrientes 1234');
    expect(p1.birthDate).toBe('2017-05-10');
  });

  it('createPetForTutor should generate a new patient with tutor details', () => {
    const { updatedPatients, newPet } = createPetForTutor(
      mockPatients,
      {
        ownerId: 'ow1',
        ownerName: 'Carlos Mendoza',
        ownerPhone: '+5491144556677',
        address: 'Av. Corrientes 1234'
      },
      {
        name: 'Thor',
        species: 'Canino',
        breed: 'Bulldog',
        sex: 'Macho',
        birthDate: '2022-01-01',
        weightKg: 15.0
      }
    );

    expect(updatedPatients.length).toBe(3);
    expect(newPet.name).toBe('Thor');
    expect(newPet.ownerName).toBe('Carlos Mendoza');
    expect(newPet.ownerId).toBe('ow1');
    expect(newPet.address).toBe('Av. Corrientes 1234');
    expect(newPet.species).toBe('Canino');
  });
});

