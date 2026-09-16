import { describe, it, expect } from 'vitest';
import { SupplierBill, SupplierQuote, SupplierPayment, ExpenseRecord } from '../types';
import { 
  createSupplierBillRecord, 
  createSupplierQuoteRecord, 
  calculateSupplierTotals,
  calculateMonthlyExpenditureProjections,
  groupProjectionsByYear,
  calculateSupplierAccountMovements,
  calculateDueDateFromTerm,
  getTermDaysFromType,
  formatTermLabel,
  getSupplierCreditTerms,
  saveSupplierCreditTerm,
  validateSupplierBillInput,
  resetInvoiceDrawerState,
  shouldShowResetButton,
  formatInvoiceFullNumber,
  filterBillsByDateRange,
  filterPaymentsByDateRange,
  getDefaultDateRange,
  calculateInvoiceSubtotalAndTax,
  filterPaymentsByDeletedBill,
  filterAndSortSupplierBills,
  prepareDuplicatedExpenseInput,
  getDeleteBillConfirmationDetails
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
    expect(bill.perceptions).toBe(5000);
    expect(bill.currency).toBe('AR$ (Pesos)');
  });

  it('createSupplierBillRecord should preserve items array when provided', () => {
    const items = [
      { id: '1', productId: 'prod-2', productName: 'Royal Canin Gastrointestinal 2kg', quantity: 15, unitCost: 24990, subtotal: 374850 }
    ];
    const bill = createSupplierBillRecord({
      supplierName: 'FarmaVet SA',
      invoiceNumber: '0001-00045612',
      date: '2026-08-27',
      amount: 374850,
      itemsCount: 1,
      status: 'pending',
      items
    });

    expect(bill.items).toEqual(items);
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

  it('calculateSupplierTotals should calculate totals correctly including purchasedThisMonth and committed30Days', () => {
    const bills: SupplierBill[] = [
      { id: 'b1', supplierName: 'Sup A', invoiceNumber: '001', date: '2026-08-01', paymentDate: '2026-09-01', amount: 100, itemsCount: 2, status: 'pending' },
      { id: 'b2', supplierName: 'Sup B', invoiceNumber: '002', date: '2026-08-02', paymentDate: '2026-08-20', amount: 200, itemsCount: 5, status: 'paid' }
    ];
    const quotes: SupplierQuote[] = [
      { id: 'q1', supplierName: 'Sup A', title: 'Q1', date: '2026-08-01', amount: 300, status: 'approved' }
    ];

    const totals = calculateSupplierTotals(bills, quotes, [], '2026-08-01');
    expect(totals.purchasedThisMonthTotal).toBe(200);
    expect(totals.pendingBillsTotal).toBe(0);
    expect(totals.paidBillsTotal).toBe(200);
    expect(totals.committed30DaysTotal).toBe(100);
    expect(totals.approvedQuotesTotal).toBe(300);
  });

  describe('KPIs de Proveedores — Facturas de Compras (Modelo Proyección)', () => {
    const mockBills: SupplierBill[] = [
      // Septiembre 2026 (mes actual): Factura por $719.625,04 con vencimiento el 20/09/2026
      { id: 'b-sep', supplierName: 'FarmaVet SA', invoiceNumber: '0001-0001', date: '2026-08-10', paymentDate: '2026-09-20', amount: 719625.04, itemsCount: 5, status: 'pending' },
      // Octubre 2026 (mes siguiente / 30 días): Factura por $1.155.668,50 con vencimiento el 10/10/2026
      { id: 'b-oct', supplierName: 'Zoonosis SRL', invoiceNumber: '0002-0002', date: '2026-09-01', paymentDate: '2026-10-10', amount: 1155668.50, itemsCount: 3, status: 'pending' },
      // Noviembre 2026 (60 días): Factura por $200.000,00 con vencimiento el 30/11/2026
      { id: 'b-nov', supplierName: 'Insumos Sur', invoiceNumber: '0003-0003', date: '2026-09-10', paymentDate: '2026-11-30', amount: 200000.00, itemsCount: 1, status: 'pending' }
    ];

    const mockPayments: SupplierPayment[] = [
      // Pago registrado en Septiembre por $100.000,00
      { id: 'p1', billId: 'b-old', billInvoiceNumber: '0000-0000', supplierName: 'FarmaVet SA', date: '2026-09-12', amount: 100000.00, paymentMethod: 'Efectivo' }
    ];

    const mockExpenses: ExpenseRecord[] = [
      // Gasto operativo registrado en Septiembre por $28.500,00
      { id: 'exp1', category: 'Gastos Varios', description: 'Caja chica', amount: 28500.00, date: '2026-09-05', responsible: 'Admin', allocation: 'Santo Tomé', paymentMethod: 'Efectivo' }
    ];

    it('1. Comprado este mes debe calcular las erogaciones totales del mes (Adeudado + Pagado + Gastos = $848.125,04)', () => {
      const totals = calculateSupplierTotals(mockBills, [], mockPayments, '2026-09-16', mockExpenses);
      // $719.625,04 + $100.000,00 + $28.500,00 = $848.125,04
      expect(totals.purchasedThisMonthTotal).toBeCloseTo(848125.04, 2);
    });

    it('2. Facturas pagadas debe reflejar únicamente los pagos de facturas del mes ($100.000,00), excluyendo los gastos', () => {
      const totals = calculateSupplierTotals(mockBills, [], mockPayments, '2026-09-16', mockExpenses);
      expect(totals.paidBillsTotal).toBeCloseTo(100000.00, 2);
    });

    it('3. Pendiente de pago debe reflejar exclusivamente el saldo adeudado del mes actual ($719.625,04)', () => {
      const totals = calculateSupplierTotals(mockBills, [], mockPayments, '2026-09-16', mockExpenses);
      expect(totals.pendingBillsTotal).toBeCloseTo(719625.04, 2);
    });

    it('4. Comprometido a 30 días debe calcular la proyección adeudada del mes siguiente ($1.155.668,50)', () => {
      const totals = calculateSupplierTotals(mockBills, [], mockPayments, '2026-09-16', mockExpenses);
      expect(totals.committed30DaysTotal).toBeCloseTo(1155668.50, 2);
    });

    it('debe manejar correctamente el salto de año (diciembre a enero) para Comprometido a 30 días', () => {
      const yearEndBills: SupplierBill[] = [
        { id: 'b-dec', supplierName: 'Sup A', invoiceNumber: '001', date: '2026-12-01', paymentDate: '2026-12-15', amount: 500000, itemsCount: 1, status: 'pending' },
        { id: 'b-jan', supplierName: 'Sup B', invoiceNumber: '002', date: '2026-12-10', paymentDate: '2027-01-20', amount: 750000, itemsCount: 1, status: 'pending' }
      ];

      const totals = calculateSupplierTotals(yearEndBills, [], [], '2026-12-16');
      expect(totals.pendingBillsTotal).toBe(500000);
      expect(totals.committed30DaysTotal).toBe(750000); // Enero 2027 projection
    });

    it('debe retornar 0 en todos los KPIs si no existen comprobantes ni movimientos en el período', () => {
      const totals = calculateSupplierTotals([], [], [], '2026-09-16', []);
      expect(totals.purchasedThisMonthTotal).toBe(0);
      expect(totals.paidBillsTotal).toBe(0);
      expect(totals.pendingBillsTotal).toBe(0);
      expect(totals.committed30DaysTotal).toBe(0);
    });
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
      expect(mayo2025?.dateLabel).toBe('Mayo 2025');
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

    it('should calculate totalPagado from payments array and update totalAdeudado with remaining balance', () => {
      const bills: SupplierBill[] = [
        {
          id: 'b-sep-1',
          supplierName: 'Laboratorios Zoonosis SRL',
          invoiceNumber: '0002-00001500',
          date: '2026-08-15',
          paymentDate: '2026-09-10',
          amount: 1211885.04,
          itemsCount: 1,
          status: 'pending'
        }
      ];

      const payments = [
        {
          id: 'pay-1',
          billId: 'b-sep-1',
          billInvoiceNumber: '0002-00001500',
          supplierName: 'Laboratorios Zoonosis SRL',
          date: '2026-08-31',
          amount: 1210000,
          paymentMethod: 'Efectivo' as const
        }
      ];

      const projections = calculateMonthlyExpenditureProjections(bills, {}, payments);

      // En Agosto 2026 debe sumar el pago realizado en su fecha (2026-08-31)
      const agos2026 = projections.find(p => p.monthKey === '2026-08');
      expect(agos2026).toBeDefined();
      expect(agos2026?.totalPagado).toBe(1210000);
      expect(agos2026?.totalAdeudado).toBe(0);

      // En Septiembre 2026 debe quedar únicamente el saldo restante adeudado ($1.885,04)
      const sept2026 = projections.find(p => p.monthKey === '2026-09');
      expect(sept2026).toBeDefined();
      expect(sept2026?.totalAdeudado).toBeCloseTo(1885.04, 2);
      expect(sept2026?.totalPagado).toBe(0);
    });

    it('calculateSupplierTotals should compute paid totals from payments array and pending totals from remaining balances', () => {
      const bills: SupplierBill[] = [
        { id: 'b1', supplierName: 'Sup A', invoiceNumber: '001', date: '2026-08-01', amount: 1000, itemsCount: 2, status: 'pending' }
      ];
      const payments = [
        { id: 'p1', billId: 'b1', billInvoiceNumber: '001', supplierName: 'Sup A', date: '2026-08-05', amount: 600, paymentMethod: 'Efectivo' as const }
      ];

      const totals = calculateSupplierTotals(bills, [], payments, '2026-08-01');
      expect(totals.paidBillsTotal).toBe(600);
      expect(totals.pendingBillsTotal).toBe(400);
    });

    it('formatInvoiceFullNumber should format invoice number with type prefix, punto de venta and numero de factura', () => {
      expect(formatInvoiceFullNumber({ documentType: 'Factura A', invoiceNumber: '0002-00001503' })).toBe('A-0002-00001503');
      expect(formatInvoiceFullNumber({ documentType: 'Factura B', invoiceNumber: '0001-00000045' })).toBe('B-0001-00000045');
      expect(formatInvoiceFullNumber({ documentType: 'Factura C', invoiceNumber: '0003-00000100' })).toBe('C-0003-00000100');
      expect(formatInvoiceFullNumber({ documentType: 'Remito', invoiceNumber: '0005-00000200' })).toBe('R-0005-00000200');
      expect(formatInvoiceFullNumber({ documentType: 'Factura A', invoiceNumber: 'FC-A-0002-00001503' })).toBe('A-0002-00001503');
      expect(formatInvoiceFullNumber({ documentType: 'Factura A', invoiceNumber: 'A-0002-00001503' })).toBe('A-0002-00001503');
    });

    it('filterBillsByDateRange should filter bills within start and end date range', () => {
      const bills: SupplierBill[] = [
        { id: 'b1', supplierName: 'Sup A', invoiceNumber: '001', date: '2026-05-10', amount: 100, itemsCount: 1, status: 'paid' },
        { id: 'b2', supplierName: 'Sup B', invoiceNumber: '002', date: '2026-08-15', amount: 200, itemsCount: 1, status: 'pending' },
        { id: 'b3', supplierName: 'Sup C', invoiceNumber: '003', date: '2026-11-20', amount: 300, itemsCount: 1, status: 'pending' }
      ];

      const filtered = filterBillsByDateRange(bills, '2026-06-01', '2026-09-30');
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('b2');
    });

    it('calculateMonthlyExpenditureProjections should generate all consecutive months within startDate and endDate range', () => {
      const bills: SupplierBill[] = [
        { id: 'b1', supplierName: 'Sup A', invoiceNumber: '001', date: '2026-09-10', amount: 100, itemsCount: 1, status: 'pending' }
      ];

      // Septiembre 2026 a Febrero 2027 (6 meses)
      const projections = calculateMonthlyExpenditureProjections(bills, {}, [], '2026-09-01', '2027-02-28');
      expect(projections.length).toBe(6);
    });
    it('calculateMonthlyExpenditureProjections should format dateLabel as "Noviembre 2025" with capitalized month name and space', () => {
      const bills: SupplierBill[] = [
        { id: 'b1', supplierName: 'Sup A', invoiceNumber: '001', date: '2025-11-15', amount: 500, itemsCount: 1, status: 'pending' }
      ];

      const projections = calculateMonthlyExpenditureProjections(bills, {}, [], '2025-11-01', '2025-11-30');
      expect(projections.length).toBe(1);
      expect(projections[0].dateLabel).toBe('Noviembre 2025');
    });

    it('calculateMonthlyExpenditureProjections should split bill across months according to supplier credit term percentage breakdown', () => {
      const bills: SupplierBill[] = [
        {
          id: 'b-split',
          supplierName: 'Insumos Médicos del Plata',
          invoiceNumber: '0001-00009999',
          date: '2026-08-01',
          amount: 100000,
          itemsCount: 1,
          status: 'pending'
        }
      ];

      const customTerms = [
        {
          supplierName: 'Insumos Médicos del Plata',
          termType: 'cuotas_30_60' as const,
          termDays: 30,
          installmentsCount: 2,
          contadoPercent: 0,
          dias30Percent: 50,
          dias60Percent: 50,
          dias90Percent: 0
        }
      ];

      const projections = calculateMonthlyExpenditureProjections(bills, {}, [], '2026-08-01', '2026-10-31', customTerms);
      
      // 50% ($50.000) at 30 days -> 2026-08-31 (Agosto 2026)
      const agos = projections.find(p => p.monthKey === '2026-08');
      expect(agos?.totalAdeudado).toBe(50000);

      // 50% ($50.000) at 60 days -> 2026-09-30 (Septiembre 2026)
      const sept = projections.find(p => p.monthKey === '2026-09');
      expect(sept?.totalAdeudado).toBe(50000);
    });

    it('groupProjectionsByYear should group monthly projections into years with total aggregates', () => {
      const bills: SupplierBill[] = [
        { id: 'b1', supplierName: 'Sup A', invoiceNumber: '001', date: '2025-11-15', amount: 500, itemsCount: 1, status: 'pending' },
        { id: 'b2', supplierName: 'Sup B', invoiceNumber: '002', date: '2026-03-10', amount: 1200, itemsCount: 1, status: 'pending' }
      ];

      const monthly = calculateMonthlyExpenditureProjections(bills, {}, [], '2025-11-01', '2026-03-31');
      const yearly = groupProjectionsByYear(monthly);

      expect(yearly.length).toBe(2);
      expect(yearly[0].year).toBe(2025);
      expect(yearly[0].totalAdeudado).toBe(500);
      expect(yearly[1].year).toBe(2026);
      expect(yearly[1].totalAdeudado).toBe(1200);
    });

    it('calculateDueDateFromTerm and credit terms helper functions should calculate due dates correctly', () => {
      expect(calculateDueDateFromTerm('2026-11-01', 30)).toBe('2026-12-01');
      expect(calculateDueDateFromTerm('2026-11-01', 60)).toBe('2026-12-31');
      expect(calculateDueDateFromTerm('2026-11-01', 0)).toBe('2026-11-01');

      expect(getTermDaysFromType('30_dias')).toBe(30);
      expect(getTermDaysFromType('60_dias')).toBe(60);
      expect(getTermDaysFromType('contado')).toBe(0);
    });

    it('calculateSupplierAccountMovements should calculate Debe, Haber and running Saldo chronologically', () => {
      const bills: SupplierBill[] = [
        { id: 'b1', supplierName: 'FarmaVet', invoiceNumber: '0001-00002721', date: '2026-08-01', amount: 10000, itemsCount: 1, status: 'pending' },
        { id: 'b2', supplierName: 'FarmaVet', invoiceNumber: '0001-00002722', date: '2026-08-15', amount: 5000, itemsCount: 1, status: 'pending' }
      ];
      const payments: SupplierPayment[] = [
        { id: 'p1', billId: 'b1', billInvoiceNumber: '0001-00002721', supplierName: 'FarmaVet', date: '2026-08-10', amount: 4000, paymentMethod: 'Transferencia' }
      ];

      const movements = calculateSupplierAccountMovements('FarmaVet', bills, payments);

      expect(movements.length).toBe(3);
      // 1. Factura b1 (2026-08-01): Debe = 10000, Haber = 0, Saldo = 10000
      expect(movements[0].voucherNumber).toContain('2721');
      expect(movements[0].debe).toBe(10000);
      expect(movements[0].haber).toBe(0);
      expect(movements[0].saldo).toBe(10000);

      // 2. Pago p1 (2026-08-10): Debe = 0, Haber = 4000, Saldo = 6000
      expect(movements[1].haber).toBe(4000);
      expect(movements[1].saldo).toBe(6000);

      // 3. Factura b2 (2026-08-15): Debe = 5000, Haber = 0, Saldo = 11000
      expect(movements[2].debe).toBe(5000);
      expect(movements[2].saldo).toBe(11000);
    });
  });

  describe('calculateInvoiceSubtotalAndTax', () => {
    it('should sum products for totalAmount and calculate subtotal/IVA when IVA is enabled', () => {
      const items = [
        { id: '1', productName: 'Meloxicam', quantity: 10, unitCost: 18200, subtotal: 182000 },
        { id: '2', productName: 'Royal Canin', quantity: 15, unitCost: 24990, subtotal: 374850 }
      ];

      const res = calculateInvoiceSubtotalAndTax(items, true, 0.21);
      expect(res.itemsSum).toBe(556850);
      expect(res.totalAmount).toBe(556850);
      expect(res.subtotal).toBe(460206.61);
      expect(res.taxAmount).toBe(96643.39);
      expect(res.subtotal + res.taxAmount).toBeCloseTo(res.totalAmount);
    });

    it('should set subtotal equal to totalAmount and IVA to 0 when IVA is disabled', () => {
      const items = [
        { id: '1', productName: 'Meloxicam', quantity: 10, unitCost: 18200, subtotal: 182000 },
        { id: '2', productName: 'Royal Canin', quantity: 15, unitCost: 24990, subtotal: 374850 }
      ];

      const res = calculateInvoiceSubtotalAndTax(items, false, 0.21);
      expect(res.itemsSum).toBe(556850);
      expect(res.totalAmount).toBe(556850);
      expect(res.subtotal).toBe(556850);
      expect(res.taxAmount).toBe(0);
    });
  });

  describe('supplier breakdown per month', () => {
    it('calculateMonthlyExpenditureProjections should include supplierBreakdown array for each month', () => {
      const bills: SupplierBill[] = [
        { id: 'b1', supplierName: 'Distribuidora FarmaVet SA', invoiceNumber: '001', date: '2026-09-01', amount: 500000, itemsCount: 1, status: 'pending' },
        { id: 'b2', supplierName: 'Laboratorios Zoonosis SRL', invoiceNumber: '002', date: '2026-09-05', amount: 300000, itemsCount: 1, status: 'pending' }
      ];

      const payments: SupplierPayment[] = [
        { id: 'p1', billId: 'b1', billInvoiceNumber: '001', supplierName: 'Distribuidora FarmaVet SA', date: '2026-09-10', amount: 200000, paymentMethod: 'Efectivo' }
      ];

      const projections = calculateMonthlyExpenditureProjections(bills, {}, payments, '2026-09-01', '2026-09-30');
      const sept = projections.find(p => p.monthKey === '2026-09');

      expect(sept).toBeDefined();
      expect(sept?.supplierBreakdown).toBeDefined();
      expect(sept?.supplierBreakdown?.length).toBeGreaterThanOrEqual(1);

      const farmaVet = sept?.supplierBreakdown?.find(s => s.supplierName === 'Distribuidora FarmaVet SA');
      expect(farmaVet).toBeDefined();
      expect(farmaVet?.totalPagado).toBe(200000);
      expect(farmaVet?.totalAdeudado).toBe(300000);
      expect(farmaVet?.total).toBe(500000);
    });
  });

  describe('cascade deletion of payments for deleted bill', () => {
    it('filterPaymentsByDeletedBill should remove payments associated by billId or invoiceNumber', () => {
      const payments: SupplierPayment[] = [
        { id: 'p1', billId: 'bill-1', billInvoiceNumber: '0001-00001234', supplierName: 'Laboratorio X', date: '2026-09-01', amount: 1000, paymentMethod: 'Efectivo' },
        { id: 'p2', billId: 'bill-2', billInvoiceNumber: '0001-00005678', supplierName: 'Laboratorio Y', date: '2026-09-02', amount: 2000, paymentMethod: 'Transferencia' },
        { id: 'p3', billId: 'other-bill', billInvoiceNumber: '0001-00001234', supplierName: 'Laboratorio X', date: '2026-09-03', amount: 500, paymentMethod: 'Efectivo' }
      ];

      const remaining = filterPaymentsByDeletedBill(payments, 'bill-1', '00001234', 'FC-A 0001-00001234');
      expect(remaining.length).toBe(1);
      expect(remaining[0].id).toBe('p2');
    });
  });

  describe('filterAndSortSupplierBills', () => {
    const sampleBills: SupplierBill[] = [
      { id: 'b1', supplierName: 'FarmaVet SA', invoiceNumber: '0001-0001', date: '2026-09-10', amount: 5000, itemsCount: 2, status: 'pending' },
      { id: 'b2', supplierName: 'Zoonosis SRL', invoiceNumber: '0002-0005', date: '2026-09-01', amount: 12000, itemsCount: 5, status: 'paid' },
      { id: 'b3', supplierName: 'FarmaVet SA', invoiceNumber: '0001-0099', date: '2026-09-15', amount: 1000, itemsCount: 1, status: 'pending' }
    ];

    it('should filter by supplier name substring or selection', () => {
      const filtered = filterAndSortSupplierBills(sampleBills, 'FarmaVet', '', '', 'asc');
      expect(filtered.length).toBe(2);
      expect(filtered.every(b => b.supplierName.includes('FarmaVet'))).toBe(true);
    });

    it('should filter by invoice number', () => {
      const filtered = filterAndSortSupplierBills(sampleBills, '', '0005', '', 'asc');
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('b2');
    });

    it('should sort bills by date, amount or supplierName asc and desc', () => {
      const sortedByAmountDesc = filterAndSortSupplierBills(sampleBills, '', '', 'amount', 'desc');
      expect(sortedByAmountDesc[0].id).toBe('b2');
      expect(sortedByAmountDesc[1].id).toBe('b1');
      expect(sortedByAmountDesc[2].id).toBe('b3');

      const sortedBySupplierAsc = filterAndSortSupplierBills(sampleBills, '', '', 'supplierName', 'asc');
      expect(sortedBySupplierAsc[0].supplierName).toBe('FarmaVet SA');
      expect(sortedBySupplierAsc[2].supplierName).toBe('Zoonosis SRL');
    });
  });

  describe('prepareDuplicatedExpenseInput', () => {
    it('should copy expense fields but reset voucherFile and voucherUrl', () => {
      const source: ExpenseRecord = {
        id: 'exp-123',
        category: 'Insumos',
        description: 'Compra de gasas',
        amount: 4500,
        date: '2026-09-10',
        responsible: 'Juan',
        allocation: 'Clínica',
        paymentMethod: 'Efectivo',
        note: 'Factura 123',
        voucherFile: 'factura_123.pdf',
        voucherUrl: 'https://storage.supabase.co/factura_123.pdf'
      };

      const copy = prepareDuplicatedExpenseInput(source);
      expect(copy.category).toBe(source.category);
      expect(copy.description).toBe(`${source.description} (Copia)`);
      expect(copy.amount).toBe(source.amount);
      expect(copy.voucherFile).toBeUndefined();
      expect(copy.voucherUrl).toBeUndefined();
    });
  });

  describe('getDeleteBillConfirmationDetails', () => {
    it('should generate clear confirmation title and message including full invoice number and supplier', () => {
      const bill = {
        documentType: 'Factura A',
        invoiceNumber: '0002-00001503',
        supplierName: 'Distribuidora FarmaVet SA'
      };

      const details = getDeleteBillConfirmationDetails(bill);
      expect(details.title).toBe('Confirmar eliminación de factura');
      expect(details.message).toContain('A-0002-00001503');
      expect(details.message).toContain('Distribuidora FarmaVet SA');
      expect(details.message).toContain('Esta acción eliminará el comprobante y todos sus pagos asociados.');
    });
  });
});

