import { describe, it, expect } from 'vitest';
import {
  createPaymentRecord,
  getPaymentsForBill,
  getTotalPaidForBill,
  getRemainingBalance,
} from './paymentService';
import { SupplierBill, SupplierPayment } from '../types';

const mockBill: SupplierBill = {
  id: 'bill-1',
  supplierName: 'Proveedor Ejemplo',
  invoiceNumber: 'FAC-0001',
  date: '2025-05-01',
  amount: 10000,
  itemsCount: 3,
  status: 'pending',
};

const mockPayments: SupplierPayment[] = [
  {
    id: 'pay-1',
    billId: 'bill-1',
    billInvoiceNumber: 'FAC-0001',
    supplierName: 'Proveedor Ejemplo',
    date: '2025-05-10',
    amount: 3000,
    paymentMethod: 'Efectivo',
  },
  {
    id: 'pay-2',
    billId: 'bill-1',
    billInvoiceNumber: 'FAC-0001',
    supplierName: 'Proveedor Ejemplo',
    date: '2025-05-20',
    amount: 4000,
    paymentMethod: 'Transferencia',
  },
  {
    id: 'pay-3',
    billId: 'bill-2',
    billInvoiceNumber: 'FAC-0002',
    supplierName: 'Otro Proveedor',
    date: '2025-05-15',
    amount: 5000,
    paymentMethod: 'Cheque',
  },
];

describe('paymentService', () => {
  describe('createPaymentRecord', () => {
    it('debe crear un registro de pago con id único', () => {
      const data = {
        billId: 'bill-1',
        billInvoiceNumber: 'FAC-0001',
        supplierName: 'Proveedor Ejemplo',
        date: '2025-06-01',
        amount: 2500,
        paymentMethod: 'Efectivo' as const,
        note: 'Pago parcial',
      };

      const payment = createPaymentRecord(data);

      expect(payment.id).toBeDefined();
      expect(payment.id).toMatch(/^pay-/);
      expect(payment.billId).toBe('bill-1');
      expect(payment.billInvoiceNumber).toBe('FAC-0001');
      expect(payment.supplierName).toBe('Proveedor Ejemplo');
      expect(payment.date).toBe('2025-06-01');
      expect(payment.amount).toBe(2500);
      expect(payment.paymentMethod).toBe('Efectivo');
      expect(payment.note).toBe('Pago parcial');
    });

    it('debe registrar el nombre del comprobante (voucherName) cuando se adjunta un archivo', () => {
      const data = {
        billId: 'bill-1',
        billInvoiceNumber: 'FAC-0001',
        supplierName: 'Proveedor Ejemplo',
        date: '2026-08-31',
        amount: 5000,
        paymentMethod: 'Transferencia' as const,
        voucherName: 'comprobante_transf_1234.pdf',
      };

      const payment = createPaymentRecord(data);

      expect(payment.voucherName).toBe('comprobante_transf_1234.pdf');
    });

    it('dos pagos creados deben tener IDs distintos', () => {
      const data = {
        billId: 'bill-1',
        billInvoiceNumber: 'FAC-0001',
        supplierName: 'Proveedor',
        date: '2025-06-01',
        amount: 1000,
        paymentMethod: 'Transferencia' as const,
      };
      const p1 = createPaymentRecord(data);
      const p2 = createPaymentRecord(data);
      expect(p1.id).not.toBe(p2.id);
    });
  });

  describe('getPaymentsForBill', () => {
    it('debe retornar solo los pagos correspondientes a la factura indicada', () => {
      const result = getPaymentsForBill(mockPayments, 'bill-1');
      expect(result).toHaveLength(2);
      expect(result.every(p => p.billId === 'bill-1')).toBe(true);
    });

    it('debe retornar lista vacía si no hay pagos para esa factura', () => {
      const result = getPaymentsForBill(mockPayments, 'bill-999');
      expect(result).toHaveLength(0);
    });
  });

  describe('getTotalPaidForBill', () => {
    it('debe sumar correctamente los pagos de una factura', () => {
      const total = getTotalPaidForBill(mockPayments, 'bill-1');
      expect(total).toBe(7000); // 3000 + 4000
    });

    it('debe retornar 0 si no hay pagos para esa factura', () => {
      const total = getTotalPaidForBill(mockPayments, 'bill-999');
      expect(total).toBe(0);
    });
  });

  describe('getRemainingBalance', () => {
    it('debe calcular el saldo restante correctamente', () => {
      const remaining = getRemainingBalance(mockBill, mockPayments);
      expect(remaining).toBe(3000); // 10000 - 7000
    });

    it('debe retornar el monto total si no hay pagos', () => {
      const remaining = getRemainingBalance(mockBill, []);
      expect(remaining).toBe(10000);
    });

    it('debe retornar 0 si la factura está completamente pagada', () => {
      const fullPayments: SupplierPayment[] = [
        {
          id: 'pay-full',
          billId: 'bill-1',
          billInvoiceNumber: 'FAC-0001',
          supplierName: 'Proveedor Ejemplo',
          date: '2025-05-30',
          amount: 10000,
          paymentMethod: 'Transferencia',
        },
      ];
      const remaining = getRemainingBalance(mockBill, fullPayments);
      expect(remaining).toBe(0);
    });

    it('no debe retornar valores negativos si se pagó de más', () => {
      const overPayments: SupplierPayment[] = [
        {
          id: 'pay-over',
          billId: 'bill-1',
          billInvoiceNumber: 'FAC-0001',
          supplierName: 'Proveedor Ejemplo',
          date: '2025-05-30',
          amount: 12000,
          paymentMethod: 'Efectivo',
        },
      ];
      const remaining = getRemainingBalance(mockBill, overPayments);
      expect(remaining).toBe(0);
    });
  });
});
