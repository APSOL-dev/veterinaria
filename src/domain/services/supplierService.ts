import { SupplierBill, SupplierQuote, MonthlyExpenditureProjection, SupplierPayment } from '../types';

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

export function calculateSupplierTotals(
  bills: SupplierBill[],
  quotes: SupplierQuote[] = [],
  payments: SupplierPayment[] = [],
  referenceDateStr?: string
): {
  purchasedThisMonthTotal: number;
  paidBillsTotal: number;
  pendingBillsTotal: number;
  committed30DaysTotal: number;
  approvedQuotesTotal: number;
} {
  const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();
  const currentMonthKey = refDate.toISOString().substring(0, 7);

  // 1. Comprado este mes (Total de facturas emitidas este mes)
  const purchasedThisMonthTotal = bills
    .filter(b => b.date && b.date.startsWith(currentMonthKey))
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  // 2. Facturas pagadas & Pendiente de pago
  let pendingBillsTotal = 0;
  let paidBillsTotal = 0;

  if (payments.length > 0) {
    paidBillsTotal = payments.reduce((sum, p) => sum + p.amount, 0);
    pendingBillsTotal = bills.reduce((sum, b) => {
      const paidForBill = payments.filter(p => p.billId === b.id).reduce((s, p) => s + p.amount, 0);
      return sum + Math.max(0, b.amount - paidForBill);
    }, 0);
  } else {
    pendingBillsTotal = bills
      .filter(b => b.status === 'pending')
      .reduce((sum, b) => sum + b.amount, 0);

    paidBillsTotal = bills
      .filter(b => b.status === 'paid')
      .reduce((sum, b) => sum + b.amount, 0);
  }

  // 3. Comprometido a 30 días (Suma de saldos pendientes con fecha de pago dentro de los próximos 30 días o vencidas)
  const refTime = refDate.getTime();
  const thirtyDaysLater = refTime + 30 * 24 * 60 * 60 * 1000;

  const committed30DaysTotal = bills.reduce((sum, b) => {
    const paidForBill = payments.length > 0 
      ? payments.filter(p => p.billId === b.id).reduce((s, p) => s + p.amount, 0)
      : (b.status === 'paid' ? b.amount : 0);

    const remaining = Math.max(0, b.amount - paidForBill);
    if (remaining <= 0) return sum;

    const dueDateStr = b.paymentDate || b.date;
    if (!dueDateStr) return sum + remaining;

    const dueTime = new Date(dueDateStr).getTime();
    if (isNaN(dueTime) || dueTime <= thirtyDaysLater) {
      return sum + remaining;
    }

    return sum;
  }, 0);

  const approvedQuotesTotal = quotes
    .filter(q => q.status === 'approved')
    .reduce((sum, q) => sum + q.amount, 0);

  return {
    purchasedThisMonthTotal,
    paidBillsTotal,
    pendingBillsTotal,
    committed30DaysTotal,
    approvedQuotesTotal
  };
}

export function filterBillsByDateRange(
  bills: SupplierBill[],
  startDate?: string,
  endDate?: string
): SupplierBill[] {
  return bills.filter(b => {
    const d = b.paymentDate || b.date;
    if (!d) return true;
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  });
}

export function filterPaymentsByDateRange(
  payments: SupplierPayment[],
  startDate?: string,
  endDate?: string
): SupplierPayment[] {
  return payments.filter(p => {
    const d = p.date;
    if (!d) return true;
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  });
}

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

export function calculateMonthlyExpenditureProjections(
  bills: SupplierBill[],
  monthlyBudgets: Record<string, number> = {},
  payments: SupplierPayment[] = [],
  startDate?: string,
  endDate?: string
): MonthlyExpenditureProjection[] {
  const aggregated: Record<string, { totalAdeudado: number; totalPagado: number }> = {};

  const ensureMonthKey = (key: string) => {
    if (!aggregated[key]) {
      aggregated[key] = { totalAdeudado: 0, totalPagado: 0 };
    }
  };

  // Process payments
  if (payments.length > 0) {
    payments.forEach(payment => {
      if (!payment.date) return;
      const monthKey = payment.date.slice(0, 7);
      ensureMonthKey(monthKey);
      aggregated[monthKey].totalPagado += payment.amount;
    });
  }

  // Process bills
  bills.forEach(bill => {
    const relevantDate = (bill.paymentDate && bill.paymentDate.trim()) || bill.date;
    if (!relevantDate) return;
    const monthKey = relevantDate.slice(0, 7);
    ensureMonthKey(monthKey);

    if (payments.length > 0) {
      const paidForBill = payments.filter(p => p.billId === bill.id).reduce((s, p) => s + p.amount, 0);
      const remaining = Math.max(0, bill.amount - paidForBill);
      if (remaining > 0) {
        aggregated[monthKey].totalAdeudado += remaining;
      }
    } else {
      if (bill.status === 'pending') {
        aggregated[monthKey].totalAdeudado += bill.amount;
      } else if (bill.status === 'paid') {
        aggregated[monthKey].totalPagado += bill.amount;
      }
    }
  });

  const startMonthKey = startDate ? startDate.slice(0, 7) : undefined;
  const endMonthKey = endDate ? endDate.slice(0, 7) : undefined;

  let sortedKeys: string[] = [];

  if (startMonthKey && endMonthKey && startMonthKey <= endMonthKey) {
    const keysSet = new Set<string>();
    const [startYear, startMonth] = startMonthKey.split('-').map(Number);
    const [endYear, endMonth] = endMonthKey.split('-').map(Number);

    let currYear = startYear;
    let currMonth = startMonth;

    while (currYear < endYear || (currYear === endYear && currMonth <= endMonth)) {
      const monthStr = String(currMonth).padStart(2, '0');
      keysSet.add(`${currYear}-${monthStr}`);
      currMonth++;
      if (currMonth > 12) {
        currMonth = 1;
        currYear++;
      }
    }

    sortedKeys = Array.from(keysSet);
  } else {
    const allKeysSet = new Set<string>([
      ...Object.keys(aggregated),
      ...Object.keys(monthlyBudgets)
    ]);
    sortedKeys = Array.from(allKeysSet).filter(k => k && k.includes('-')).sort();

    if (startMonthKey) sortedKeys = sortedKeys.filter(k => k >= startMonthKey);
    if (endMonthKey) sortedKeys = sortedKeys.filter(k => k <= endMonthKey);
  }

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

export function formatInvoiceFullNumber(bill: { documentType?: string; invoiceNumber: string }): string {
  const inv = bill.invoiceNumber ? bill.invoiceNumber.trim() : '';
  if (!inv) return 'A-0000-00000000';

  // If formatted like FC-A-0001-00001234 -> replace FC-A- with A-
  if (/^FC-[A-Z]-/i.test(inv)) {
    return inv.replace(/^FC-/i, '');
  }

  // If already starts with a letter prefix and dash e.g. A-0002-00001503, B-0001-00000012
  if (/^[A-Z]{1,2}-\d+/i.test(inv)) {
    return inv.toUpperCase();
  }

  // Determine prefix letter from documentType
  const docType = (bill.documentType || '').toLowerCase();
  let prefix = 'A';
  if (docType.includes('factura b') || docType === 'b') {
    prefix = 'B';
  } else if (docType.includes('factura c') || docType === 'c') {
    prefix = 'C';
  } else if (docType.includes('remito') || docType === 'r') {
    prefix = 'R';
  } else if (docType.includes('nota de crédito') || docType.includes('nc')) {
    prefix = 'NC';
  } else if (docType.includes('nota de débito') || docType.includes('nd')) {
    prefix = 'ND';
  } else if (docType.includes('factura a') || docType === 'a') {
    prefix = 'A';
  }

  return `${prefix}-${inv}`;
}

export function getDefaultDateRange(referenceDateStr?: string): { startDate: string; endDate: string } {
  const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();
  const year = refDate.getFullYear();
  const month = refDate.getMonth();

  const startObj = new Date(year, month, 1);
  const startY = startObj.getFullYear();
  const startM = String(startObj.getMonth() + 1).padStart(2, '0');
  const startDate = `${startY}-${startM}-01`;

  const endObj = new Date(year, month + 7, 0);
  const endY = endObj.getFullYear();
  const endM = String(endObj.getMonth() + 1).padStart(2, '0');
  const endD = String(endObj.getDate()).padStart(2, '0');
  const endDate = `${endY}-${endM}-${endD}`;

  return { startDate, endDate };
}

