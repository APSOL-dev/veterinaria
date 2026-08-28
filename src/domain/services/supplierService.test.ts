import { describe, it, expect } from 'vitest';
import { SupplierBill, SupplierQuote } from '../types';
import { 
  createSupplierBillRecord, 
  createSupplierQuoteRecord, 
  calculateSupplierTotals,
  calculateMonthlyExpenditureProjections,
  validateSupplierBillInput,
  resetInvoiceDrawerState,
  shouldShowResetButton 
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

  it('createSupplierBillRecord should create bill with cuit, razonSocial and tax breakdown', () => {
    const bill = createSupplierBillRecord({
      supplierName: 'FarmaVet SA',
      cuit: '30-71234567-8',
      razonSocial: 'FarmaVet Sociedad Anónima',
      lineaNegocio: 'Línea 1',
      documentType: 'Factura A',
      invoiceNumber: '0001-00045612',
      date: '2026-08-27',
      subtotal: 100000,
      taxAmount: 21000,
      perceptions: 5000,
      currency: 'AR$ (Pesos)',
      amount: 126000,
      itemsCount: 1,
      status: 'pending'
    });

    expect(bill.cuit).toBe('30-71234567-8');
    expect(bill.razonSocial).toBe('FarmaVet Sociedad Anónima');
    expect(bill.lineaNegocio).toBe('Línea 1');
    expect(bill.documentType).toBe('Factura A');
    expect(bill.subtotal).toBe(100000);
    expect(bill.taxAmount).toBe(21000);
    expect(bill.currency).toBe('AR$ (Pesos)');
  });

  it('createSupplierBillRecord should safely fallback missing fields to prevent UI crashes', () => {
    const bill = createSupplierBillRecord({
      supplierName: '',
      invoiceNumber: '',
      date: '',
      amount: NaN,
      itemsCount: 0,
      status: 'pending'
    });

    expect(bill.supplierName).toBe('Proveedor General');
    expect(bill.invoiceNumber).toBe('FC-0000-0000');
    expect(bill.date).toBeDefined();
    expect(bill.amount).toBe(0);
  });

  it('validateSupplierBillInput should validate and sanitize invoice input data', () => {
    const validResult = validateSupplierBillInput({
      supplierName: 'Laboratorios Zoonosis SRL',
      cuit: '30-98765432-1',
      razonSocial: 'Laboratorios Zoonosis',
      invoiceNumber: '0002-00012345',
      date: '2026-08-27',
      amount: 45000,
      status: 'paid'
    });

    expect(validResult.isValid).toBe(true);
    expect(validResult.bill.supplierName).toBe('Laboratorios Zoonosis SRL');
    expect(validResult.bill.amount).toBe(45000);
  });

  it('resetInvoiceDrawerState should return initial cleared drawer state', () => {
    const initialState = resetInvoiceDrawerState();

    expect(initialState.loadMode).toBe('automatic');
    expect(initialState.supplierName).toBe('');
    expect(initialState.cuit).toBe('');
    expect(initialState.selectedFile).toBeNull();
    expect(initialState.isProcessed).toBe(false);
    expect(initialState.isProcessing).toBe(false);
  });

  it('shouldShowResetButton should return false when invoice is not processed in automatic mode', () => {
    expect(shouldShowResetButton('automatic', false)).toBe(false);
    expect(shouldShowResetButton('automatic', true)).toBe(true);
    expect(shouldShowResetButton('manual', false)).toBe(true);
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

  describe('calculateMonthlyExpenditureProjections', () => {
    it('should aggregate supplier bills by month and calculate totals and fulfillment', () => {
      const bills: SupplierBill[] = [
        // Mayo 2025 - Exceeded (130%)
        { id: 'b1', supplierName: 'Sup A', invoiceNumber: '01', date: '2025-05-10', amount: 2175377, itemsCount: 1, status: 'paid' },
        // Junio 2025 - OK (76%)
        { id: 'b2', supplierName: 'Sup B', invoiceNumber: '02', date: '2025-06-15', amount: 1519447, itemsCount: 1, status: 'paid' },
        // Agosto 2025 - Warning (94%)
        { id: 'b3', supplierName: 'Sup C', invoiceNumber: '03', date: '2025-08-20', amount: 2069912, itemsCount: 1, status: 'paid' },
        // Agosto 2026 - Mixed pending and paid
        { id: 'b4', supplierName: 'Sup D', invoiceNumber: '04', date: '2026-08-05', amount: 1480531, itemsCount: 1, status: 'paid' },
        { id: 'b5', supplierName: 'Sup E', invoiceNumber: '05', date: '2026-08-18', amount: 487946, itemsCount: 1, status: 'pending' },
      ];

      const monthlyBudgets: Record<string, number> = {
        '2025-05': 1672203,
        '2025-06': 2000000,
        '2025-08': 2200000,
        '2026-08': 2000000,
      };

      const projections = calculateMonthlyExpenditureProjections(bills, monthlyBudgets);

      expect(projections).toBeDefined();

      const mayo2025 = projections.find(p => p.monthKey === '2025-05');
      expect(mayo2025).toBeDefined();
      expect(mayo2025?.dateLabel).toBe('mayo_2025');
      expect(mayo2025?.totalAdeudado).toBe(0);
      expect(mayo2025?.totalPagado).toBe(2175377);
      expect(mayo2025?.total).toBe(2175377);
      expect(mayo2025?.presupuestoTotal).toBe(1672203);
      expect(mayo2025?.cumplimientoPercentage).toBe(130);
      expect(mayo2025?.statusLevel).toBe('exceeded');

      const junio2025 = projections.find(p => p.monthKey === '2025-06');
      expect(junio2025?.cumplimientoPercentage).toBe(76);
      expect(junio2025?.statusLevel).toBe('ok');

      const agosto2025 = projections.find(p => p.monthKey === '2025-08');
      expect(agosto2025?.cumplimientoPercentage).toBe(94);
      expect(agosto2025?.statusLevel).toBe('warning');

      const agosto2026 = projections.find(p => p.monthKey === '2026-08');
      expect(agosto2026?.totalAdeudado).toBe(487946);
      expect(agosto2026?.totalPagado).toBe(1480531);
      expect(agosto2026?.total).toBe(1968477);
      expect(agosto2026?.cumplimientoPercentage).toBe(98);
      expect(agosto2026?.statusLevel).toBe('warning');
    });

    it('should group bills by paymentDate (fecha de pago) instead of invoice date when paymentDate is provided', () => {
      const bills: SupplierBill[] = [
        {
          id: 'b-sep',
          supplierName: 'FarmaVet',
          invoiceNumber: '001',
          date: '2026-08-25', // Fecha de factura: Agosto
          paymentDate: '2026-09-10', // Fecha de pago: Septiembre
          amount: 80000,
          itemsCount: 1,
          status: 'pending'
        }
      ];

      const projections = calculateMonthlyExpenditureProjections(bills, {});
      
      // Debe agruparse en Septiembre 2026 por su paymentDate
      const sept2026 = projections.find(p => p.monthKey === '2026-09');
      expect(sept2026).toBeDefined();
      expect(sept2026?.totalAdeudado).toBe(80000);

      // No debe figurar adeudado en Agosto 2026
      const agos2026 = projections.find(p => p.monthKey === '2026-08');
      expect(agos2026).toBeUndefined();
    });
  });
});
