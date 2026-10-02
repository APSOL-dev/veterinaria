import { describe, it, expect } from 'vitest';
import { Patient } from '../types';
import { 
  getUniqueTutores, 
  updateTutorAndPetInfo,
  calculateTutorAccountMovements,
  calculateTutorDebtAging,
  getTutorAppointments,
  createPetForTutor,
  summarizeReceiptItems
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
      { id: 'r1', receiptNumber: 'FC-B-0001', date: '2026-08-01', clientName: 'Carlos Mendoza', total: 15000, paymentMethod: 'cuenta-corriente' },
      { id: 'r2', receiptNumber: 'FC-B-0002', date: '2026-08-10', clientName: 'Carlos Mendoza', total: 5000, paymentMethod: 'cuenta-corriente' }
    ];
    const tutorPayments = [
      { id: 'tp1', tutorName: 'Carlos Mendoza', date: '2026-08-05', amount: 10000, concept: 'Abono a cuenta' }
    ];

    const movements = calculateTutorAccountMovements('Carlos Mendoza', receipts as any, tutorPayments);

    expect(movements.length).toBe(3);
    // 1. FC-B-0001 (2026-08-01): Debe = 15000, Haber = 0, Saldo = 15000
    expect(movements[0].debe).toBe(15000);
    expect(movements[0].saldo).toBe(15000);
    expect(movements[0].type).toBe('receipt');
    expect(movements[0].receipt).toBeDefined();
    expect(movements[0].receipt?.receiptNumber).toBe('FC-B-0001');

    // 2. Abono tp1 (2026-08-05): Debe = 0, Haber = 10000, Saldo = 5000
    expect(movements[1].haber).toBe(10000);
    expect(movements[1].saldo).toBe(5000);
    expect(movements[1].type).toBe('payment');
    expect(movements[1].payment).toBeDefined();
    expect(movements[1].payment?.amount).toBe(10000);

    // 3. FC-B-0002 (2026-08-10): Debe = 5000, Haber = 0, Saldo = 10000
    expect(movements[2].debe).toBe(5000);
    expect(movements[2].saldo).toBe(10000);
    expect(movements[2].type).toBe('receipt');
    expect(movements[2].receipt?.receiptNumber).toBe('FC-B-0002');
  });

  it('calculateTutorAccountMovements should only include receipts paid via cuenta-corriente', () => {
    const receipts = [
      { id: 'r1', receiptNumber: 'FC-B-0001', date: '2026-08-01', clientName: 'Carlos Mendoza', total: 15000, paymentMethod: 'efectivo' },
      { id: 'r2', receiptNumber: 'FC-B-0002', date: '2026-08-02', clientName: 'Carlos Mendoza', total: 8000, paymentMethod: 'tarjeta' },
      { id: 'r3', receiptNumber: 'FC-B-0003', date: '2026-08-03', clientName: 'Carlos Mendoza', total: 12000, paymentMethod: 'transferencia' },
      { id: 'r4', receiptNumber: 'FC-B-0004', date: '2026-08-04', clientName: 'Carlos Mendoza', total: 20000, paymentMethod: 'cuenta-corriente' }
    ];

    const movements = calculateTutorAccountMovements('Carlos Mendoza', receipts as any, []);

    expect(movements.length).toBe(1);
    expect(movements[0].concept).toContain('FC-B-0004');
    expect(movements[0].debe).toBe(20000);
    expect(movements[0].saldo).toBe(20000);
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

  it('getTutorAppointments should exclude completed (cobrados) or cancelled appointments', () => {
    const medical = [
      {
        id: 'med-completed',
        patientId: 'p1',
        patientName: 'Rocky',
        species: 'Canino' as const,
        breed: 'Golden Retriever',
        ownerName: 'Carlos Mendoza',
        vetName: 'Silva',
        date: '2026-09-10',
        time: '10:00',
        reason: 'Consulta general',
        status: 'completed' as const
      }
    ];

    const grooming = [
      {
        id: 'groom-pending',
        patientId: 'p1',
        patientName: 'Rocky',
        species: 'Canino' as const,
        breed: 'Golden Retriever',
        ownerName: 'Carlos Mendoza',
        serviceId: 's1',
        serviceName: 'Baño Completo',
        date: '2026-09-25',
        time: '14:00',
        durationMinutes: 45,
        price: 3500,
        status: 'pending' as const
      }
    ];

    const appointments = getTutorAppointments('Carlos Mendoza', ['p1'], medical, grooming);

    expect(appointments.length).toBe(1);
    expect(appointments[0].id).toBe('groom-pending');
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

  describe('calculateTutorDebtAging', () => {
    it('should return debt status and days since last payment when tutor has pending debt and prior payments', () => {
      const movements = [
        { id: '1', tutorName: 'Carlos', date: '2026-08-01', concept: 'Comprobante 1', debe: 20000, haber: 0, saldo: 20000 },
        { id: '2', tutorName: 'Carlos', date: '2026-08-10', concept: 'Abono parcial', debe: 0, haber: 8000, saldo: 12000 },
        { id: '3', tutorName: 'Carlos', date: '2026-08-15', concept: 'Comprobante 2', debe: 5000, haber: 0, saldo: 17000 }
      ];

      // Simulated reference date: 2026-08-25 (15 days after last payment on 2026-08-10)
      const result = calculateTutorDebtAging(movements, '2026-08-25');

      expect(result.status).toBe('debt');
      expect(result.currentSaldo).toBe(17000);
      expect(result.lastPaymentDate).toBe('2026-08-10');
      expect(result.daysSinceLastPayment).toBe(15);
      expect(result.message).toBe('Último pago hace 15 días (10/08/2026)');
    });

    it('should return debt status and debt age when tutor has never made a payment', () => {
      const movements = [
        { id: '1', tutorName: 'Ana', date: '2026-08-01', concept: 'Comprobante 1', debe: 15000, haber: 0, saldo: 15000 },
        { id: '2', tutorName: 'Ana', date: '2026-08-05', concept: 'Comprobante 2', debe: 10000, haber: 0, saldo: 25000 }
      ];

      // Reference date: 2026-08-21 (20 days since initial debt on 2026-08-01)
      const result = calculateTutorDebtAging(movements, '2026-08-21');

      expect(result.status).toBe('debt');
      expect(result.currentSaldo).toBe(25000);
      expect(result.lastPaymentDate).toBeUndefined();
      expect(result.daysSinceLastPayment).toBeUndefined();
      expect(result.daysSinceDebtStart).toBe(20);
      expect(result.message).toBe('Sin pagos registrados (deuda desde hace 20 días)');
    });

    it('should handle last payment today and yesterday appropriately', () => {
      const movementsToday = [
        { id: '1', tutorName: 'Pedro', date: '2026-08-01', concept: 'Factura', debe: 10000, haber: 0, saldo: 10000 },
        { id: '2', tutorName: 'Pedro', date: '2026-08-20', concept: 'Pago', debe: 0, haber: 4000, saldo: 6000 }
      ];

      const resultToday = calculateTutorDebtAging(movementsToday, '2026-08-20');
      expect(resultToday.daysSinceLastPayment).toBe(0);
      expect(resultToday.message).toBe('Último pago hoy');

      const resultYesterday = calculateTutorDebtAging(movementsToday, '2026-08-21');
      expect(resultYesterday.daysSinceLastPayment).toBe(1);
      expect(resultYesterday.message).toBe('Último pago ayer');
    });

    it('should report credit status when saldo is negative (saldo a favor)', () => {
      const movements = [
        { id: '1', tutorName: 'Laura', date: '2026-08-01', concept: 'Factura', debe: 5000, haber: 0, saldo: 5000 },
        { id: '2', tutorName: 'Laura', date: '2026-08-05', concept: 'Abono mayor', debe: 0, haber: 12000, saldo: -7000 }
      ];

      const result = calculateTutorDebtAging(movements, '2026-08-20');
      expect(result.status).toBe('credit');
      expect(result.currentSaldo).toBe(-7000);
      expect(result.message).toBe('Saldo a favor del tutor');
    });

    it('should report settled status when saldo is zero', () => {
      const movements = [
        { id: '1', tutorName: 'Laura', date: '2026-08-01', concept: 'Factura', debe: 5000, haber: 0, saldo: 5000 },
        { id: '2', tutorName: 'Laura', date: '2026-08-05', concept: 'Pago total', debe: 0, haber: 5000, saldo: 0 }
      ];

      const result = calculateTutorDebtAging(movements, '2026-08-20');
      expect(result.status).toBe('settled');
      expect(result.currentSaldo).toBe(0);
      expect(result.message).toBe('Al día (sin deuda)');
    });

    it('should return settled status for empty movements', () => {
      const result = calculateTutorDebtAging([], '2026-08-20');
      expect(result.status).toBe('settled');
      expect(result.currentSaldo).toBe(0);
      expect(result.message).toBe('Al día (sin deuda)');
    });
  });
});

describe('receipt detail for the tutor account', () => {
  const item = (description: string, quantity = 1) => ({ id: description, description, quantity, unitPrice: 100, discountPercent: 0 });

  it('summarizeReceiptItems says what was charged', () => {
    expect(summarizeReceiptItems([item('Baño Perro chico')])).toBe('Baño Perro chico');
    expect(summarizeReceiptItems([item('Consulta clínica', 2)])).toBe('Consulta clínica ×2');
    expect(summarizeReceiptItems([item('A'), item('B')])).toBe('A y B');
    expect(summarizeReceiptItems([item('A'), item('B'), item('C'), item('D')])).toBe('A, B y 2 más');
    expect(summarizeReceiptItems([])).toBeUndefined();
    expect(summarizeReceiptItems(undefined)).toBeUndefined();
  });

  it('account movements keep the receipt number as concept and add the charged items as detail', () => {
    const receipts = [{
      id: 'r1', receiptNumber: 'FC-C-0001-00001361', documentType: 'factura-c', emitAfip: false,
      date: '2026-10-01', ownerName: 'Mateo Prueba', paymentMethod: 'cuenta-corriente',
      items: [item('Baño Perro chico')], subtotal: 15000, discountTotal: 0, taxAmount: 0, total: 15000, totalAmount: 15000
    }] as any;
    const [mov] = calculateTutorAccountMovements('Mateo Prueba', receipts, [], []);
    expect(mov.concept).toContain('FC-C-0001-00001361');
    expect(mov.detail).toBe('Baño Perro chico');
  });
});
