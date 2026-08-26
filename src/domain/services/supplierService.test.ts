import { describe, it, expect } from 'vitest';
import { SupplierBill, SupplierQuote } from '../types';
import { 
  createSupplierBillRecord, 
  createSupplierQuoteRecord, 
  calculateSupplierTotals 
} from './supplierService';

describe('supplierService', () => {
  it('createSupplierBillRecord should create a supplier bill', () => {
    const bill = createSupplierBillRecord({
      supplierName: 'Distribuidora Veterinaria Sur',
      invoiceNumber: 'FC-A-0001-000452',
      date: '2026-08-25',
      amount: 150000,
      itemsCount: 15,
      status: 'pending'
    });

    expect(bill.id).toBeDefined();
    expect(bill.supplierName).toBe('Distribuidora Veterinaria Sur');
    expect(bill.amount).toBe(150000);
    expect(bill.status).toBe('pending');
  });

  it('createSupplierQuoteRecord should create a quote record', () => {
    const quote = createSupplierQuoteRecord({
      supplierName: 'FarmaVet SA',
      title: 'Presupuesto Vacunas Séxtuples',
      date: '2026-08-26',
      amount: 85000,
      status: 'draft'
    });

    expect(quote.id).toBeDefined();
    expect(quote.title).toBe('Presupuesto Vacunas Séxtuples');
    expect(quote.status).toBe('draft');
  });

  it('calculateSupplierTotals should calculate totals correctly', () => {
    const bills: SupplierBill[] = [
      { id: 'b1', supplierName: 'Sup A', invoiceNumber: '001', date: '2026-08-01', amount: 100, itemsCount: 2, status: 'pending' },
      { id: 'b2', supplierName: 'Sup B', invoiceNumber: '002', date: '2026-08-02', amount: 200, itemsCount: 5, status: 'paid' }
    ];
    const quotes: SupplierQuote[] = [
      { id: 'q1', supplierName: 'Sup A', title: 'Q1', date: '2026-08-01', amount: 300, status: 'approved' }
    ];

    const totals = calculateSupplierTotals(bills, quotes);
    expect(totals.pendingBillsTotal).toBe(100);
    expect(totals.paidBillsTotal).toBe(200);
    expect(totals.approvedQuotesTotal).toBe(300);
  });
});
