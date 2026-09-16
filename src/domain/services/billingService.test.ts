import { describe, it, expect } from 'vitest';
import { BillItem, Product } from '../types';
import { 
  calculateItemSubtotal, 
  calculateBillSummary, 
  processCheckout,
  generateReceiptNumber,
  formatPriceInputDisplay,
  parsePriceInput,
  determineAppointmentsToComplete
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

    it('calculates zero tax when applyTax is false', () => {
      const items: BillItem[] = [
        { id: '1', description: 'Consulta', quantity: 1, unitPrice: 1000, discountPercent: 0 }
      ];
      const summary = calculateBillSummary(items, false);
      expect(summary.taxAmount).toBe(0);
      expect(summary.total).toBe(1000);
    });

    it('calculates custom tax percentage (e.g. 10.5%) correctly', () => {
      const items: BillItem[] = [
        { id: '1', description: 'Consulta', quantity: 1, unitPrice: 1000, discountPercent: 0 }
      ];
      const summary = calculateBillSummary(items, true, 10.5);
      expect(summary.taxAmount).toBe(105);
      expect(summary.total).toBe(1105);
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

    it('attaches voucher file metadata to receipt when provided', () => {
      const result = processCheckout({
        patientId: 'p1',
        patientName: 'Rocky',
        ownerName: 'Carlos Mendoza',
        documentType: 'factura-b',
        emitAfip: true,
        paymentMethod: 'transferencia',
        items,
        productsCatalog,
        voucherName: 'factura_proveedor_123.pdf',
        voucherUrl: 'data:application/pdf;base64,sample'
      });

      expect(result.receipt.voucherName).toBe('factura_proveedor_123.pdf');
      expect(result.receipt.voucherUrl).toBe('data:application/pdf;base64,sample');
    });

    it('defaults ownerName to Sin tutor if empty or whitespace', () => {
      const result = processCheckout({
        patientId: 'p1',
        patientName: 'Rocky',
        ownerName: '   ',
        documentType: 'factura-c',
        emitAfip: false,
        paymentMethod: 'efectivo',
        items,
        productsCatalog
      });

      expect(result.receipt.ownerName).toBe('Sin tutor');
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

    it('emits Factura C with zero tax by default', () => {
      const result = processCheckout({
        patientId: 'p1',
        patientName: 'Rocky',
        ownerName: 'Carlos Mendoza',
        documentType: 'factura-c',
        emitAfip: true,
        paymentMethod: 'efectivo',
        items,
        productsCatalog
      });

      expect(result.receipt.documentType).toBe('factura-c');
      expect(result.receipt.taxAmount).toBe(0);
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

  describe('formatPriceInputDisplay and parsePriceInput', () => {
    it('formatPriceInputDisplay should return empty string for 0, undefined, null or NaN', () => {
      expect(formatPriceInputDisplay(0)).toBe('');
      expect(formatPriceInputDisplay(undefined)).toBe('');
      expect(formatPriceInputDisplay(null)).toBe('');
      expect(formatPriceInputDisplay(NaN)).toBe('');
    });

    it('formatPriceInputDisplay should return string representation for non-zero numbers', () => {
      expect(formatPriceInputDisplay(1500)).toBe('1500');
      expect(formatPriceInputDisplay(15000)).toBe('15000');
    });

    it('parsePriceInput should return numeric price or 0 for empty or invalid input', () => {
      expect(parsePriceInput('')).toBe(0);
      expect(parsePriceInput('   ')).toBe(0);
      expect(parsePriceInput('invalid')).toBe(0);
      expect(parsePriceInput('15000')).toBe(15000);
      expect(parsePriceInput('-500')).toBe(0);
    });
  });

  describe('generateReceiptNumber', () => {
    it('formats document type with custom POS number and padded invoice number', () => {
      const num1 = generateReceiptNumber('factura-c', '1', '2049');
      expect(num1).toBe('FC-C-0001-00002049');

      const num2 = generateReceiptNumber('factura-b', '0002', '8261');
      expect(num2).toBe('FC-B-0002-00008261');
    });

    it('defaults POS number to 0001 if empty', () => {
      const num = generateReceiptNumber('factura-a', '', '500');
      expect(num).toBe('FC-A-0001-00000500');
    });
  });

  describe('determineAppointmentsToComplete', () => {
    const patId = 'pat-100';

    const medicalAppts = [
      {
        id: 'med-1',
        patientId: patId,
        patientName: 'Firulais',
        species: 'Canino' as const,
        breed: 'Labrador',
        ownerName: 'Juan Pérez',
        date: '2026-09-16',
        time: '10:00',
        durationMinutes: 30,
        type: 'Consulta General' as const,
        reason: 'Control rutinario',
        vetName: 'Dr. López',
        status: 'confirmed' as const
      }
    ];

    const groomingAppts = [
      {
        id: 'groom-1',
        patientId: patId,
        patientName: 'Firulais',
        species: 'Canino' as const,
        breed: 'Labrador',
        ownerName: 'Juan Pérez',
        serviceId: 'srv-groom',
        serviceName: 'Corte y Baño',
        date: '2026-09-16',
        time: '14:00',
        durationMinutes: 60,
        price: 12000,
        status: 'confirmed' as const
      }
    ];

    it('should complete ONLY the grooming appointment when only grooming is billed', () => {
      const groomingItems: BillItem[] = [
        {
          id: 'item-g1',
          type: 'service',
          description: 'Corte y Baño',
          category: 'Servicio agendado',
          quantity: 1,
          unitPrice: 12000,
          discountPercent: 0,
          appointmentId: 'groom-1',
          appointmentType: 'grooming'
        }
      ];

      const res = determineAppointmentsToComplete(groomingItems, patId, medicalAppts, groomingAppts);
      expect(res.medicalIdsToComplete).toEqual([]);
      expect(res.groomingIdsToComplete).toEqual(['groom-1']);
    });

    it('should complete ONLY the medical appointment when only medical is billed', () => {
      const medicalItems: BillItem[] = [
        {
          id: 'item-m1',
          type: 'service',
          description: 'Consulta Médica',
          category: 'Servicio agendado',
          quantity: 1,
          unitPrice: 15000,
          discountPercent: 0,
          appointmentId: 'med-1',
          appointmentType: 'medical'
        }
      ];

      const res = determineAppointmentsToComplete(medicalItems, patId, medicalAppts, groomingAppts);
      expect(res.medicalIdsToComplete).toEqual(['med-1']);
      expect(res.groomingIdsToComplete).toEqual([]);
    });

    it('should complete BOTH appointments when both are billed in the same receipt', () => {
      const mixedItems: BillItem[] = [
        {
          id: 'item-m1',
          description: 'Consulta Médica',
          category: 'Servicio agendado',
          quantity: 1,
          unitPrice: 15000,
          discountPercent: 0,
          appointmentId: 'med-1',
          appointmentType: 'medical'
        },
        {
          id: 'item-g1',
          description: 'Corte y Baño',
          category: 'Servicio agendado',
          quantity: 1,
          unitPrice: 12000,
          discountPercent: 0,
          appointmentId: 'groom-1',
          appointmentType: 'grooming'
        }
      ];

      const res = determineAppointmentsToComplete(mixedItems, patId, medicalAppts, groomingAppts);
      expect(res.medicalIdsToComplete).toEqual(['med-1']);
      expect(res.groomingIdsToComplete).toEqual(['groom-1']);
    });

    it('should complete NEITHER appointment when only products are billed', () => {
      const productItems: BillItem[] = [
        {
          id: 'item-p1',
          type: 'product',
          description: 'Shampoo Peluquería 500ml',
          quantity: 1,
          unitPrice: 4500,
          discountPercent: 0
        }
      ];

      const res = determineAppointmentsToComplete(productItems, patId, medicalAppts, groomingAppts);
      expect(res.medicalIdsToComplete).toEqual([]);
      expect(res.groomingIdsToComplete).toEqual([]);
    });
  });
});
