import { SupplierBill, SupplierQuote } from '../types';

export function createSupplierBillRecord(input: {
  supplierName: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  itemsCount: number;
  status: 'paid' | 'pending';
}): SupplierBill {
  return {
    id: 'bill-' + Date.now(),
    supplierName: input.supplierName,
    invoiceNumber: input.invoiceNumber,
    date: input.date,
    amount: input.amount,
    itemsCount: input.itemsCount,
    status: input.status
  };
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
