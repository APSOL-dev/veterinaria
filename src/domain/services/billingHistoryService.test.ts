import { describe, it, expect } from 'vitest';
import { BillReceipt } from '../types';
import { filterAndSortReceipts, BillingHistoryFilterOptions } from './billingHistoryService';

describe('billingHistoryService - filterAndSortReceipts', () => {
  const sampleReceipts: BillReceipt[] = [
    {
      id: 'rec-1',
      receiptNumber: 'FC-B-0001-00000001',
      documentType: 'factura-b',
      emitAfip: true,
      afipCae: '74123456789012',
      date: '2026-10-01T10:00:00Z',
      patientId: 'p1',
      patientName: 'Luna',
      ownerName: 'Carlos Gómez',
      paymentMethod: 'efectivo',
      items: [
        { id: 'item-1', description: 'Vacuna Séxtuple Canina', quantity: 1, unitPrice: 15000, discountPercent: 0 }
      ],
      subtotal: 15000,
      discountTotal: 0,
      taxAmount: 0,
      total: 15000,
      totalAmount: 15000,
      voucherName: 'Factura_0001.pdf',
      voucherUrl: 'data:application/pdf;base64,...'
    },
    {
      id: 'rec-2',
      receiptNumber: 'FC-A-0001-00000002',
      documentType: 'factura-a',
      emitAfip: true,
      date: '2026-09-15T14:30:00Z',
      patientId: 'p2',
      patientName: 'Milo',
      ownerName: 'Ana Perez',
      paymentMethod: 'transferencia',
      items: [
        { id: 'item-2', description: 'Consulta General', quantity: 1, unitPrice: 8000, discountPercent: 0 },
        { id: 'item-3', description: 'Antiparasitario Nexgard', quantity: 1, unitPrice: 12000, discountPercent: 10 }
      ],
      subtotal: 20000,
      discountTotal: 1200,
      taxAmount: 3948,
      total: 22748,
      totalAmount: 22748
    },
    {
      id: 'rec-3',
      receiptNumber: 'REM-0001-00000003',
      documentType: 'remito',
      emitAfip: false,
      date: '2026-10-02T09:15:00Z',
      patientId: 'p3',
      patientName: 'Thor',
      ownerName: 'Bruno Diaz',
      paymentMethod: 'cuenta-corriente',
      items: [
        { id: 'item-4', description: 'Baño y Corte Canino', quantity: 1, unitPrice: 9500, discountPercent: 0 }
      ],
      subtotal: 9500,
      discountTotal: 0,
      taxAmount: 0,
      total: 9500,
      totalAmount: 9500
    },
    {
      id: 'rec-4',
      receiptNumber: 'FC-C-0001-00000004',
      documentType: 'factura-c',
      emitAfip: false,
      date: '2026-08-20T16:00:00Z',
      patientId: 'p1',
      patientName: 'Luna',
      ownerName: 'Carlos Gómez',
      paymentMethod: 'tarjeta',
      items: [
        { id: 'item-5', description: 'Ecografía Abdominal', quantity: 1, unitPrice: 18000, discountPercent: 0 }
      ],
      subtotal: 18000,
      discountTotal: 0,
      taxAmount: 0,
      total: 18000,
      totalAmount: 18000
    }
  ];

  it('returns all receipts when no filter options are set', () => {
    const result = filterAndSortReceipts(sampleReceipts, {});
    expect(result.length).toBe(4);
  });

  it('filters by general search query matching owner name', () => {
    const result = filterAndSortReceipts(sampleReceipts, { searchQuery: 'Perez' });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('rec-2');
  });

  it('filters by general search query matching patient name', () => {
    const result = filterAndSortReceipts(sampleReceipts, { searchQuery: 'Thor' });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('rec-3');
  });

  it('filters by general search query matching receipt number', () => {
    const result = filterAndSortReceipts(sampleReceipts, { searchQuery: '00000004' });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('rec-4');
  });

  it('filters by general search query matching item description', () => {
    const result = filterAndSortReceipts(sampleReceipts, { searchQuery: 'Nexgard' });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('rec-2');
  });

  it('filters by document type', () => {
    const result = filterAndSortReceipts(sampleReceipts, { documentType: 'factura-a' });
    expect(result.length).toBe(1);
    expect(result[0].documentType).toBe('factura-a');
  });

  it('filters by payment method', () => {
    const result = filterAndSortReceipts(sampleReceipts, { paymentMethod: 'efectivo' });
    expect(result.length).toBe(1);
    expect(result[0].paymentMethod).toBe('efectivo');
  });

  it('sorts by totalAmount descending', () => {
    const result = filterAndSortReceipts(sampleReceipts, {
      sortBy: 'total',
      sortDirection: 'desc'
    });
    expect(result.map(r => r.totalAmount)).toEqual([22748, 18000, 15000, 9500]);
  });

  it('sorts by totalAmount ascending', () => {
    const result = filterAndSortReceipts(sampleReceipts, {
      sortBy: 'total',
      sortDirection: 'asc'
    });
    expect(result.map(r => r.totalAmount)).toEqual([9500, 15000, 18000, 22748]);
  });

  it('sorts by date descending (newest first)', () => {
    const result = filterAndSortReceipts(sampleReceipts, {
      sortBy: 'date',
      sortDirection: 'desc'
    });
    expect(result.map(r => r.id)).toEqual(['rec-3', 'rec-1', 'rec-2', 'rec-4']);
  });

  it('sorts by ownerName ascending', () => {
    const result = filterAndSortReceipts(sampleReceipts, {
      sortBy: 'ownerName',
      sortDirection: 'asc'
    });
    expect(result.map(r => r.ownerName)).toEqual(['Ana Perez', 'Bruno Diaz', 'Carlos Gómez', 'Carlos Gómez']);
  });
});
