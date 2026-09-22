import { describe, it, expect } from 'vitest';
import { TutorAccountMovement, BillReceipt } from '../../domain/types';

describe('ComprobanteDetailModal logic', () => {
  it('should correctly format movement receipt data for display', () => {
    const receipt: BillReceipt = {
      id: 'rec-1',
      receiptNumber: 'FC-B-0001-00004521',
      documentType: 'factura-b',
      emitAfip: true,
      afipCae: '74125896325874',
      afipCaeExpiration: '2026-08-30',
      date: '2026-08-15',
      ownerName: 'Carlos Mendoza',
      patientName: 'Firulais',
      paymentMethod: 'cuenta-corriente',
      items: [
        { id: 'i1', description: 'Consulta Médica General', type: 'service', quantity: 1, unitPrice: 15000, discountPercent: 0, subtotal: 15000 },
        { id: 'i2', description: 'Vacuna Antirrábica', type: 'product', quantity: 1, unitPrice: 8000, discountPercent: 10, subtotal: 7200 }
      ],
      subtotal: 23000,
      discountTotal: 800,
      taxAmount: 0,
      total: 22200,
      totalAmount: 22200
    };

    const movement: TutorAccountMovement = {
      id: 'm-1',
      type: 'receipt',
      receipt,
      tutorName: 'Carlos Mendoza',
      date: '2026-08-15',
      concept: 'Comprobante FC-B-0001-00004521',
      debe: 22200,
      haber: 0,
      saldo: 22200
    };

    expect(movement.type).toBe('receipt');
    expect(movement.receipt?.items.length).toBe(2);
    expect(movement.receipt?.receiptNumber).toBe('FC-B-0001-00004521');
    expect(movement.receipt?.totalAmount).toBe(22200);
    expect(movement.debe).toBe(22200);
  });

  it('should correctly format movement payment data for display', () => {
    const payment = {
      id: 'tp-1',
      tutorName: 'Carlos Mendoza',
      date: '2026-08-18',
      amount: 10000,
      concept: 'Abono en efectivo'
    };

    const movement: TutorAccountMovement = {
      id: 'm-2',
      type: 'payment',
      payment,
      tutorName: 'Carlos Mendoza',
      date: '2026-08-18',
      concept: 'Abono en efectivo',
      debe: 0,
      haber: 10000,
      saldo: 12200
    };

    expect(movement.type).toBe('payment');
    expect(movement.haber).toBe(10000);
    expect(movement.payment?.amount).toBe(10000);
  });
});
