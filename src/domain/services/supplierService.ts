import { SupplierBill, SupplierQuote, MonthlyExpenditureProjection } from '../types';

export function createSupplierBillRecord(input: {
  supplierName: string;
  cuit?: string;
  razonSocial?: string;
  lineaNegocio?: 'Línea 1' | 'Línea 2';
  documentType?: string;
  invoiceNumber: string;
  date: string;
  paymentDate?: string;
  subtotal?: number;
  taxAmount?: number;
  perceptions?: number;
  currency?: string;
  amount: number;
  itemsCount: number;
  status: 'paid' | 'pending';
}): SupplierBill {
  const safeAmount = Number(input.amount) || Number(input.subtotal) || 0;
  return {
    id: 'bill-' + Date.now(),
    supplierName: (input.supplierName && input.supplierName.trim()) || 'Proveedor General',
    cuit: input.cuit || '',
    razonSocial: input.razonSocial || '',
    lineaNegocio: input.lineaNegocio,
    documentType: input.documentType || 'Factura A',
    invoiceNumber: (input.invoiceNumber && input.invoiceNumber.trim()) || 'FC-0000-0000',
    date: input.date || new Date().toISOString().split('T')[0],
    paymentDate: input.paymentDate || '',
    subtotal: Number(input.subtotal) || 0,
    taxAmount: Number(input.taxAmount) || 0,
    perceptions: Number(input.perceptions) || 0,
    currency: input.currency || 'AR$ (Pesos)',
    amount: isNaN(safeAmount) ? 0 : safeAmount,
    itemsCount: Number(input.itemsCount) || 1,
    status: input.status || 'pending'
  };
}

export function validateSupplierBillInput(input: Partial<SupplierBill>): {
  isValid: boolean;
  bill: SupplierBill;
  errors: string[];
} {
  const errors: string[] = [];
  const bill = createSupplierBillRecord({
    supplierName: input.supplierName || '',
    cuit: input.cuit,
    razonSocial: input.razonSocial,
    lineaNegocio: input.lineaNegocio,
    documentType: input.documentType,
    invoiceNumber: input.invoiceNumber || '',
    date: input.date || '',
    subtotal: input.subtotal,
    taxAmount: input.taxAmount,
    perceptions: input.perceptions,
    currency: input.currency,
    amount: Number(input.amount) || Number(input.subtotal) || 0,
    itemsCount: Number(input.itemsCount) || 1,
    status: input.status || 'pending'
  });

  return {
    isValid: errors.length === 0,
    bill,
    errors
  };
}

export function resetInvoiceDrawerState() {
  return {
    loadMode: 'automatic' as const,
    supplierName: '',
    cuit: '',
    razonSocial: '',
    selectedFile: null,
    invoiceDate: new Date().toISOString().split('T')[0],
    documentType: 'Factura A',
    invoiceNumber: '',
    subtotal: '' as number | '',
    taxAmount: '' as number | '',
    perceptions: '' as number | '',
    currency: 'AR$ (Pesos)',
    totalAmount: '' as number | '',
    billStatus: 'pending' as const,
    isProcessing: false,
    isProcessed: false
  };
}

export function shouldShowResetButton(loadMode: 'automatic' | 'manual', isProcessed: boolean): boolean {
  return loadMode === 'manual' || isProcessed;
}

export function createSupplierQuoteRecord(input: {
  supplierName: string;
  title: string;
  date: string;
  amount: number;
  status: 'draft' | 'approved' | 'rejected';
}): SupplierQuote {
  return {
    id: 'quote-' + Date.now(),
    supplierName: input.supplierName,
    title: input.title,
    date: input.date,
    amount: input.amount,
    status: input.status
  };
}

export function calculateSupplierTotals(bills: SupplierBill[], quotes: SupplierQuote[]): {
  pendingBillsTotal: number;
  paidBillsTotal: number;
  approvedQuotesTotal: number;
} {
  const pendingBillsTotal = bills
    .filter(b => b.status === 'pending')
    .reduce((sum, b) => sum + b.amount, 0);

  const paidBillsTotal = bills
    .filter(b => b.status === 'paid')
    .reduce((sum, b) => sum + b.amount, 0);

  const approvedQuotesTotal = quotes
    .filter(q => q.status === 'approved')
    .reduce((sum, q) => sum + q.amount, 0);

  return {
    pendingBillsTotal,
    paidBillsTotal,
    approvedQuotesTotal
  };
}

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

export function calculateMonthlyExpenditureProjections(
  bills: SupplierBill[],
  monthlyBudgets: Record<string, number> = {}
): MonthlyExpenditureProjection[] {
  const aggregated: Record<string, { totalAdeudado: number; totalPagado: number }> = {};

  // Aggregate bills by YYYY-MM
  bills.forEach(bill => {
    if (!bill.date) return;
    const monthKey = bill.date.slice(0, 7); // e.g. "2025-05"
    if (!aggregated[monthKey]) {
      aggregated[monthKey] = { totalAdeudado: 0, totalPagado: 0 };
    }
    if (bill.status === 'pending') {
      aggregated[monthKey].totalAdeudado += bill.amount;
    } else if (bill.status === 'paid') {
      aggregated[monthKey].totalPagado += bill.amount;
    }
  });

  // Collect all month keys (from bills and provided budgets)
  const allKeysSet = new Set<string>([
    ...Object.keys(aggregated),
    ...Object.keys(monthlyBudgets)
  ]);

  const sortedKeys = Array.from(allKeysSet).filter(k => k && k.includes('-')).sort();

  return sortedKeys.map(monthKey => {
    const [yearStr, monthStr] = monthKey.split('-');
    const monthIndex = parseInt(monthStr, 10) - 1;
    const monthName = (!isNaN(monthIndex) && MONTH_NAMES[monthIndex]) ? MONTH_NAMES[monthIndex] : monthStr || monthKey;
    const dateLabel = `${monthName}_${yearStr || '2026'}`;

    const data = aggregated[monthKey] || { totalAdeudado: 0, totalPagado: 0 };
    const totalAdeudado = data.totalAdeudado;
    const totalPagado = data.totalPagado;
    const total = totalAdeudado + totalPagado;
    const presupuestoTotal = monthlyBudgets[monthKey] ?? 0;

    const cumplimientoPercentage = presupuestoTotal > 0
      ? Math.round((total / presupuestoTotal) * 100)
      : 0;

    let statusLevel: 'ok' | 'warning' | 'exceeded' = 'ok';
    if (cumplimientoPercentage > 100) {
      statusLevel = 'exceeded';
    } else if (cumplimientoPercentage >= 90) {
      statusLevel = 'warning';
    }

    return {
      monthKey,
      dateLabel,
      totalAdeudado,
      totalPagado,
      total,
      presupuestoTotal,
      cumplimientoPercentage,
      statusLevel
    };
  });
}

