import { 
  SupplierBill, 
  SupplierBillItem, 
  SupplierQuote, 
  MonthlyExpenditureProjection, 
  SupplierPayment, 
  YearlyExpenditureProjection, 
  SupplierCreditTerm, 
  SupplierAccountMovement,
  ExpenseRecord,
  ExpenseBreakdownItem
} from '../types';
import { getTotalPaidForBill, getRemainingBalance } from './paymentService';

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
  voucherName?: string;
  voucherUrl?: string;
  items?: SupplierBillItem[];
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
    itemsCount: Number(input.itemsCount) || (input.items ? input.items.length : 1),
    status: input.status || 'pending',
    voucherName: input.voucherName,
    voucherUrl: input.voucherUrl,
    items: input.items
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
    itemsCount: Number(input.itemsCount) || (input.items ? input.items.length : 1),
    status: input.status || 'pending',
    voucherName: input.voucherName,
    voucherUrl: input.voucherUrl,
    items: input.items
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
  endDate?: string,
  creditTerms: SupplierCreditTerm[] = [],
  expenses: ExpenseRecord[] = []
): MonthlyExpenditureProjection[] {
  const aggregated: Record<string, { totalAdeudado: number; totalPagado: number; totalGastos: number }> = {};
  const supplierAggregated: Record<string, Record<string, { totalAdeudado: number; totalPagado: number }>> = {};
  const expenseCategoryAggregated: Record<string, Record<string, number>> = {};

  const ensureMonthKey = (key: string) => {
    if (!aggregated[key]) {
      aggregated[key] = { totalAdeudado: 0, totalPagado: 0, totalGastos: 0 };
    }
  };

  const ensureSupplierMonth = (key: string, suppName?: string) => {
    const supp = (suppName && suppName.trim()) || 'Proveedor General';
    if (!supplierAggregated[key]) supplierAggregated[key] = {};
    if (!supplierAggregated[key][supp]) {
      supplierAggregated[key][supp] = { totalAdeudado: 0, totalPagado: 0 };
    }
    return supplierAggregated[key][supp];
  };

  // Process payments
  if (payments.length > 0) {
    payments.forEach(payment => {
      if (!payment.date) return;
      const monthKey = payment.date.slice(0, 7);
      ensureMonthKey(monthKey);
      aggregated[monthKey].totalPagado += payment.amount;
      ensureSupplierMonth(monthKey, payment.supplierName).totalPagado += payment.amount;
    });
  }

  // Process expenses (egresos operativos)
  if (expenses.length > 0) {
    expenses.forEach(exp => {
      if (!exp.date) return;
      const monthKey = exp.date.slice(0, 7);
      ensureMonthKey(monthKey);
      aggregated[monthKey].totalGastos += exp.amount;

      const cat = (exp.category && exp.category.trim()) || 'Gastos Varios';
      if (!expenseCategoryAggregated[monthKey]) expenseCategoryAggregated[monthKey] = {};
      if (!expenseCategoryAggregated[monthKey][cat]) expenseCategoryAggregated[monthKey][cat] = 0;
      expenseCategoryAggregated[monthKey][cat] += exp.amount;
    });
  }

  // Process bills
  bills.forEach(bill => {
    let paidForBill = 0;
    if (payments.length > 0) {
      paidForBill = payments.filter(p => p.billId === bill.id).reduce((s, p) => s + p.amount, 0);
    } else if (bill.status === 'paid') {
      paidForBill = bill.amount || 0;
      const paidDate = (bill.paymentDate && bill.paymentDate.trim()) || bill.date;
      if (paidDate) {
        const monthKey = paidDate.slice(0, 7);
        ensureMonthKey(monthKey);
        aggregated[monthKey].totalPagado += bill.amount || 0;
        ensureSupplierMonth(monthKey, bill.supplierName).totalPagado += bill.amount || 0;
      }
    }

    const remaining = Math.max(0, (bill.amount || 0) - paidForBill);
    if (remaining <= 0) return;

    const term = getSupplierCreditTerms(bill.supplierName, creditTerms);
    const nonZeroPercents = [
      term.contadoPercent || 0,
      term.dias30Percent || 0,
      term.dias60Percent || 0,
      term.dias90Percent || 0
    ].filter(p => p > 0);

    const hasSplit = nonZeroPercents.length > 1;

    if (hasSplit && bill.date) {
      const splits = [
        { percent: term.contadoPercent || 0, days: 0 },
        { percent: term.dias30Percent || 0, days: 30 },
        { percent: term.dias60Percent || 0, days: 60 },
        { percent: term.dias90Percent || 0, days: 90 }
      ].filter(s => s.percent > 0);

      splits.forEach(s => {
        const portionAmount = remaining * (s.percent / 100);
        const dueDate = calculateDueDateFromTerm(bill.date, s.days);
        const monthKey = dueDate.slice(0, 7);
        ensureMonthKey(monthKey);
        aggregated[monthKey].totalAdeudado += portionAmount;
        ensureSupplierMonth(monthKey, bill.supplierName).totalAdeudado += portionAmount;
      });
    } else {
      const relevantDate = (bill.paymentDate && bill.paymentDate.trim()) || bill.date;
      if (!relevantDate) return;
      const monthKey = relevantDate.slice(0, 7);
      ensureMonthKey(monthKey);
      aggregated[monthKey].totalAdeudado += remaining;
      ensureSupplierMonth(monthKey, bill.supplierName).totalAdeudado += remaining;
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
    const rawMonthName = (!isNaN(monthIndex) && MONTH_NAMES[monthIndex]) ? MONTH_NAMES[monthIndex] : monthStr || monthKey;
    const capitalizedMonth = rawMonthName.charAt(0).toUpperCase() + rawMonthName.slice(1);
    const dateLabel = `${capitalizedMonth} ${yearStr || '2026'}`;

    const data = aggregated[monthKey] || { totalAdeudado: 0, totalPagado: 0, totalGastos: 0 };
    const totalAdeudado = data.totalAdeudado;
    const totalPagado = data.totalPagado;
    const totalGastos = data.totalGastos;
    const total = totalAdeudado + totalPagado + totalGastos;
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

    const suppMap = supplierAggregated[monthKey] || {};
    const supplierBreakdown = Object.entries(suppMap)
      .map(([supplierName, sData]) => ({
        supplierName,
        totalAdeudado: sData.totalAdeudado,
        totalPagado: sData.totalPagado,
        total: sData.totalAdeudado + sData.totalPagado
      }))
      .filter(item => item.total > 0 || item.totalAdeudado > 0 || item.totalPagado > 0)
      .sort((a, b) => b.total - a.total);

    const expMap = expenseCategoryAggregated[monthKey] || {};
    const expenseBreakdown: ExpenseBreakdownItem[] = Object.entries(expMap)
      .map(([category, amount]) => ({ category, amount }))
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    return {
      monthKey,
      dateLabel,
      totalAdeudado,
      totalPagado,
      totalGastos,
      total,
      presupuestoTotal,
      cumplimientoPercentage,
      statusLevel,
      supplierBreakdown,
      expenseBreakdown
    };
  });
}

export function calculateSupplierAccountMovements(
  supplierName: string,
  bills: SupplierBill[],
  payments: SupplierPayment[] = []
): SupplierAccountMovement[] {
  const trimmed = (supplierName || '').trim().toLowerCase();

  const filteredBills = trimmed
    ? bills.filter(b => b.supplierName.trim().toLowerCase() === trimmed)
    : bills;

  const filteredPayments = trimmed
    ? payments.filter(p => p.supplierName.trim().toLowerCase() === trimmed)
    : payments;

  interface RawMovement {
    id: string;
    type: 'bill' | 'payment';
    supplierName: string;
    date: string;
    voucherNumber: string;
    voucherUrl?: string;
    voucherName?: string;
    status?: string;
    lineTag?: string;
    debe: number;
    haber: number;
  }

  const raw: RawMovement[] = [
    ...filteredBills.map(b => {
      const remaining = getRemainingBalance(b, payments);
      const totalPaid = getTotalPaidForBill(payments, b.id);
      let statusLabel = 'Pendiente';
      const bStatus = (b.status as string);
      if (remaining === 0 || bStatus === 'paid' || bStatus === 'Pagado') {
        statusLabel = 'Pagado';
      } else if (totalPaid > 0 || bStatus === 'partial' || bStatus === 'Pago parcial') {
        statusLabel = 'Pago parcial';
      }
      return {
        id: b.id,
        type: 'bill' as const,
        supplierName: b.supplierName,
        date: b.date,
        voucherNumber: formatInvoiceFullNumber(b),
        voucherUrl: b.voucherUrl,
        voucherName: b.voucherName,
        status: statusLabel,
        lineTag: 'Factura de Compra',
        debe: b.amount,
        haber: 0
      };
    }),
    ...filteredPayments.map(p => ({
      id: p.id,
      type: 'payment' as const,
      supplierName: p.supplierName,
      date: p.date,
      voucherNumber: p.billInvoiceNumber ? `Pago Fact. ${p.billInvoiceNumber}` : 'Orden de Pago',
      voucherUrl: p.voucherUrl,
      voucherName: p.voucherName,
      status: 'Pagado',
      lineTag: `Pago (${p.paymentMethod})`,
      debe: 0,
      haber: p.amount
    }))
  ];

  raw.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.type !== b.type) return a.type === 'bill' ? -1 : 1;
    return a.id.localeCompare(b.id);
  });

  let currentSaldo = 0;
  return raw.map(m => {
    currentSaldo += m.debe - m.haber;
    return {
      id: m.id,
      type: m.type,
      supplierName: m.supplierName,
      voucherNumber: m.voucherNumber,
      voucherUrl: m.voucherUrl,
      voucherName: m.voucherName,
      status: m.status,
      lineTag: m.lineTag,
      date: m.date,
      debe: m.debe,
      haber: m.haber,
      saldo: currentSaldo
    };
  });
}

export function groupProjectionsByYear(projections: MonthlyExpenditureProjection[]): YearlyExpenditureProjection[] {
  const groups: Record<number, MonthlyExpenditureProjection[]> = {};

  projections.forEach(p => {
    const yearStr = p.monthKey.split('-')[0];
    const year = parseInt(yearStr, 10) || new Date().getFullYear();
    if (!groups[year]) groups[year] = [];
    groups[year].push(p);
  });

  const sortedYears = Object.keys(groups).map(Number).sort((a, b) => a - b);

  return sortedYears.map(year => {
    const yearProjections = groups[year];
    const totalAdeudado = yearProjections.reduce((sum, p) => sum + p.totalAdeudado, 0);
    const totalPagado = yearProjections.reduce((sum, p) => sum + p.totalPagado, 0);
    const totalGastos = yearProjections.reduce((sum, p) => sum + (p.totalGastos || 0), 0);
    const total = totalAdeudado + totalPagado + totalGastos;
    const presupuestoTotal = yearProjections.reduce((sum, p) => sum + p.presupuestoTotal, 0);

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
      year,
      totalAdeudado,
      totalPagado,
      totalGastos,
      total,
      presupuestoTotal,
      cumplimientoPercentage,
      statusLevel,
      projections: yearProjections
    };
  });
}

export function getTermDaysFromType(termType: SupplierCreditTerm['termType']): number {
  switch (termType) {
    case '15_dias': return 15;
    case '30_dias': return 30;
    case '60_dias': return 60;
    case '90_dias': return 90;
    case 'cuotas_30_60': return 30;
    case 'cuotas_30_60_90': return 30;
    case 'contado':
    default: return 0;
  }
}

export function formatTermLabel(termType: SupplierCreditTerm['termType']): string {
  switch (termType) {
    case 'contado': return 'Contado (0 días)';
    case '15_dias': return '15 Días';
    case '30_dias': return '30 Días';
    case '60_dias': return '60 Días';
    case '90_dias': return '90 Días';
    case 'cuotas_30_60': return '30 y 60 Días (2 Cuotas)';
    case 'cuotas_30_60_90': return '30, 60 y 90 Días (3 Cuotas)';
    default: return 'Contado';
  }
}

export function formatCreditTermSummary(term: SupplierCreditTerm): string {
  const parts: string[] = [];
  if (term.contadoPercent && term.contadoPercent > 0) parts.push(`${term.contadoPercent}% Contado`);
  if (term.dias30Percent && term.dias30Percent > 0) parts.push(`${term.dias30Percent}% 30d`);
  if (term.dias60Percent && term.dias60Percent > 0) parts.push(`${term.dias60Percent}% 60d`);
  if (term.dias90Percent && term.dias90Percent > 0) parts.push(`${term.dias90Percent}% 90d`);

  if (parts.length > 0) {
    return parts.join(' / ');
  }
  return formatTermLabel(term.termType);
}

export function calculateDueDateFromTerm(invoiceDateStr: string, termDays: number): string {
  if (!invoiceDateStr) return new Date().toISOString().split('T')[0];
  const d = new Date(invoiceDateStr);
  if (isNaN(d.getTime())) return invoiceDateStr;
  d.setDate(d.getDate() + termDays);
  return d.toISOString().split('T')[0];
}

const DEFAULT_SUPPLIER_TERMS: Record<string, SupplierCreditTerm> = {
  'Distribuidora FarmaVet SA': { supplierName: 'Distribuidora FarmaVet SA', termType: '30_dias', termDays: 30, contadoPercent: 0, dias30Percent: 100, dias60Percent: 0, dias90Percent: 0 },
  'Laboratorios Zoonosis SRL': { supplierName: 'Laboratorios Zoonosis SRL', termType: '60_dias', termDays: 60, contadoPercent: 0, dias30Percent: 0, dias60Percent: 100, dias90Percent: 0 },
  'Insumos Médicos del Plata': { supplierName: 'Insumos Médicos del Plata', termType: 'cuotas_30_60', termDays: 30, installmentsCount: 2, contadoPercent: 0, dias30Percent: 50, dias60Percent: 50, dias90Percent: 0 },
  'Distribuidora Veterinaria Sur': { supplierName: 'Distribuidora Veterinaria Sur', termType: 'contado', termDays: 0, contadoPercent: 100, dias30Percent: 0, dias60Percent: 0, dias90Percent: 0 }
};

export function getSupplierCreditTerms(supplierName: string, customTerms: SupplierCreditTerm[] = []): SupplierCreditTerm {
  const trimmed = (supplierName || '').trim();
  const custom = customTerms.find(t => t.supplierName.toLowerCase() === trimmed.toLowerCase());
  if (custom) return custom;

  if (DEFAULT_SUPPLIER_TERMS[trimmed]) {
    return DEFAULT_SUPPLIER_TERMS[trimmed];
  }

  return {
    supplierName: trimmed || 'Proveedor General',
    termType: '30_dias',
    termDays: 30,
    contadoPercent: 0,
    dias30Percent: 100,
    dias60Percent: 0,
    dias90Percent: 0
  };
}

export function saveSupplierCreditTerm(term: SupplierCreditTerm, existingTerms: SupplierCreditTerm[] = []): SupplierCreditTerm[] {
  const filtered = existingTerms.filter(t => t.supplierName.toLowerCase() !== term.supplierName.toLowerCase());
  return [...filtered, { ...term, lastUpdated: new Date().toISOString().split('T')[0] }];
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

export function calculateInvoiceSubtotalAndTax(
  items: { subtotal?: number }[],
  applyIva: boolean = true,
  ivaRate: number = 0.21,
  perceptions: number = 0
): {
  itemsSum: number;
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
} {
  const itemsSum = items.reduce((acc, curr) => acc + (curr.subtotal || 0), 0);
  const totalAmount = itemsSum + (Number(perceptions) || 0);

  if (!applyIva) {
    return {
      itemsSum,
      totalAmount,
      subtotal: totalAmount,
      taxAmount: 0
    };
  }

  const subtotal = Math.round((totalAmount / (1 + ivaRate)) * 100) / 100;
  const taxAmount = Math.round((totalAmount - subtotal) * 100) / 100;

  return {
    itemsSum,
    totalAmount,
    subtotal,
    taxAmount
  };
}

