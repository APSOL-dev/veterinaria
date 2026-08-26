import { describe, it, expect } from 'vitest';
import { BillItem, Product } from '../types';
import { 
  calculateItemSubtotal, 
  calculateBillSummary, 
  processCheckout 
} from './billingService';

describe('billingService', () => {
  describe('calculateItemSubtotal', () => {
    it('calculates price * quantity without discount', () => {
      const subtotal = calculateItemSubtotal(3500, 1, 0);
      expect(subtotal).toBe(3500);
    });

    it('applies discount percentage correctly', () => {
      const subtotal = calculateItemSubtotal(850, 2, 10);
      expect(subtotal).toBe(1530); // 850 * 2 = 1700 - 10% (170) = 1530
    });
  });

  describe('calculateBillSummary', () => {
    it('calculates totals, discount amounts, and taxes for mixed cart', () => {
      const items: BillItem[] = [
        {
          id: 'item-1',
          type: 'service',
          referenceId: 'srv-1',
          description: 'Consulta General',
          quantity: 1,
          unitPrice: 3500,
          discountPercent: 0,
          subtotal: 3500
        },
        {
          id: 'item-2',
          type: 'product',
          referenceId: 'prod-1',
          description: 'Antibiótico Amoxicilina 500mg',
          quantity: 2,
          unitPrice: 850,
          discountPercent: 10,
          subtotal: 1530
        },
        {
          id: 'item-3',
          type: 'service',
          referenceId: 'srv-2',
          description: 'Vacuna Quíntuple',
          quantity: 1,
          unitPrice: 4200,
          discountPercent: 0,
          subtotal: 4200
        }
      ];

      const summary = calculateBillSummary(items, true); // apply 21% IVA
      expect(summary.subtotal).toBe(9400); // 3500 + 1700 + 4200 = 9400
      expect(summary.discountTotal).toBe(170); // 1700 * 0.10 = 170
      const netTotal = 9400 - 170; // 9230
      expect(summary.taxAmount).toBeCloseTo(9230 * 0.21, 2); // 1938.3
      expect(summary.total).toBeCloseTo(9230 + (9230 * 0.21), 2); // 11168.3
    });
  });

  describe('processCheckout', () => {
    const productsCatalog: Product[] = [
      {
        id: 'prod-1',
        sku: 'VET-MED-001',
        name: 'Antibiótico Amoxicilina 500mg',
        category: 'Medicamentos',
        currentStock: 10,
        minStock: 2,
        price: 850
      }
    ];

    const items: BillItem[] = [
      {
        id: 'item-1',
        type: 'service',
        referenceId: 'srv-1',
        description: 'Consulta General',
        quantity: 1,
        unitPrice: 3500,
        discountPercent: 0,
        subtotal: 3500
      },
      {
        id: 'item-2',
        type: 'product',
        referenceId: 'prod-1',
        description: 'Antibiótico Amoxicilina 500mg',
        quantity: 2,
        unitPrice: 850,
        discountPercent: 0,
        subtotal: 1700
      }
    ];

    it('emits official AFIP receipt with CAE and deducts product stock', () => {
      const result = processCheckout({
        patientId: 'p1',
        patientName: 'Rocky',
        ownerName: 'Carlos Mendoza',
        documentType: 'factura-b',
        emitAfip: true,
        paymentMethod: 'efectivo',
        items,
        productsCatalog
      });

      expect(result.receipt.documentType).toBe('factura-b');
      expect(result.receipt.afipCae).toBeDefined();
      expect(result.receipt.afipCae).toHaveLength(14);
      expect(result.receipt.total).toBeGreaterThan(0);

      // Verify stock was deducted for prod-1 (10 - 2 = 8)
      const updatedProd = result.updatedProducts.find(p => p.id === 'prod-1');
      expect(updatedProd?.currentStock).toBe(8);
      expect(result.stockMovements).toHaveLength(1);
      expect(result.stockMovements[0].type).toBe('sale');
    });

    it('emits Remito without AFIP CAE but STILL deducts product stock', () => {
      const result = processCheckout({
        patientId: 'p1',
        patientName: 'Rocky',
        ownerName: 'Carlos Mendoza',
        documentType: 'remito',
        emitAfip: false,
        paymentMethod: 'efectivo',
        items,
        productsCatalog
      });

      expect(result.receipt.documentType).toBe('remito');
      expect(result.receipt.afipCae).toBeUndefined();
      
      // Remito ALSO deducts product stock!
      const updatedProd = result.updatedProducts.find(p => p.id === 'prod-1');
      expect(updatedProd?.currentStock).toBe(8);
    });

    it('throws an error if any product item exceeds available stock', () => {
      const excessiveItems: BillItem[] = [
        {
          id: 'item-2',
          type: 'product',
          referenceId: 'prod-1',
          description: 'Antibiótico Amoxicilina 500mg',
          quantity: 25, // Only 10 in stock
          unitPrice: 850,
          discountPercent: 0,
          subtotal: 21250
        }
      ];

      expect(() => {
        processCheckout({
          documentType: 'factura-b',
          emitAfip: true,
          paymentMethod: 'efectivo',
          items: excessiveItems,
          productsCatalog
        });
      }).toThrowError(/Stock insuficiente/);
    });
  });
});
