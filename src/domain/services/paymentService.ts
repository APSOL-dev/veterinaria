import { SupplierBill, SupplierPayment, SupplierPaymentMethod } from '../types';

export type CreatePaymentData = {
  billId: string;
  billInvoiceNumber: string;
  supplierName: string;
  date: string;
  amount: number;
  paymentMethod: SupplierPaymentMethod;
  note?: string;
  voucherName?: string;
  voucherUrl?: string;
};

/**
 * Crea un nuevo registro de pago para una factura de proveedor.
 */
export function createPaymentRecord(data: CreatePaymentData): SupplierPayment {
  return {
    id: `pay-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    billId: data.billId,
    billInvoiceNumber: data.billInvoiceNumber,
    supplierName: data.supplierName,
    date: data.date,
    amount: data.amount,
    paymentMethod: data.paymentMethod,
    note: data.note,
    voucherName: data.voucherName,
    voucherUrl: data.voucherUrl,
  };
}

/**
 * Retorna todos los pagos correspondientes a una factura específica.
 */
export function getPaymentsForBill(
  payments: SupplierPayment[],
  billId: string
): SupplierPayment[] {
  return payments.filter(p => p.billId === billId);
}

/**
 * Suma el total pagado para una factura específica.
 */
export function getTotalPaidForBill(
  payments: SupplierPayment[],
  billId: string
): number {
  return getPaymentsForBill(payments, billId).reduce(
    (sum, p) => sum + p.amount,
    0
  );
}

/**
 * Calcula el saldo restante de una factura (nunca negativo).
 */
export function getRemainingBalance(
  bill: SupplierBill,
  payments: SupplierPayment[]
): number {
  const paid = getTotalPaidForBill(payments, bill.id);
  return Math.max(0, bill.amount - paid);
}

/**
 * Determina el estado de pago de una factura: 'pending' (sin pagos), 'partial' (pago parcial), 'paid' (pagada totalmente).
 */
export function getBillPaymentStatus(
  bill: SupplierBill,
  payments: SupplierPayment[]
): 'paid' | 'partial' | 'pending' {
  const totalPaid = getTotalPaidForBill(payments, bill.id);
  if (totalPaid <= 0) return 'pending';
  if (totalPaid >= bill.amount) return 'paid';
  return 'partial';
}

/**
 * Registra un pago (parcial o total) para una factura y calcula el saldo resultante.
 */
export function applyPartialPaymentToBill(
  bill: SupplierBill,
  paymentData: CreatePaymentData,
  existingPayments: SupplierPayment[]
): {
  newPayment: SupplierPayment;
  updatedPayments: SupplierPayment[];
  totalPaid: number;
  remainingBalance: number;
  status: 'paid' | 'partial' | 'pending';
  isFullyPaid: boolean;
  isPartiallyPaid: boolean;
} {
  const newPayment = createPaymentRecord(paymentData);
  const updatedPayments = [...existingPayments, newPayment];
  const totalPaid = getTotalPaidForBill(updatedPayments, bill.id);
  const remainingBalance = Math.max(0, bill.amount - totalPaid);
  const status = getBillPaymentStatus(bill, updatedPayments);

  return {
    newPayment,
    updatedPayments,
    totalPaid,
    remainingBalance,
    status,
    isFullyPaid: status === 'paid',
    isPartiallyPaid: status === 'partial'
  };
}

