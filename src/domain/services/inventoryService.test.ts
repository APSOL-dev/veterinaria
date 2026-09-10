import { describe, it, expect } from 'vitest';
import { Product } from '../types';
import { 
  recordStockEntry, 
  recordStockSale, 
  recordStockAdjustment, 
  findProductByBarcode, 
  getLowStockAlerts,
  processStockReceiptFromBill
} from './inventoryService';

describe('inventoryService', () => {
  const sampleProduct: Product = {
    id: 'prod-1',
    sku: 'VET-MED-001',
    name: 'Bravecto Perros 10-20kg',
    category: 'Medicamentos',
    currentStock: 10,
    minStock: 5,
    price: 32.5,
    barcode: '7791234567890'
  };

  describe('recordStockEntry', () => {
    it('increases current stock and creates entry movement', () => {
      const { updatedProduct, movement } = recordStockEntry(sampleProduct, 15, 'Distribuidora Vet');
      expect(updatedProduct.currentStock).toBe(25);
      expect(movement.type).toBe('entry');
      expect(movement.quantity).toBe(15);
      expect(movement.provider).toBe('Distribuidora Vet');
    });
  });

  describe('recordStockSale', () => {
    it('decreases stock on valid quantity', () => {
      const { updatedProduct, movement } = recordStockSale(sampleProduct, 4);
      expect(updatedProduct.currentStock).toBe(6);
      expect(movement.type).toBe('sale');
      expect(movement.quantity).toBe(4);
    });

    it('throws error if selling more than available stock', () => {
      expect(() => recordStockSale(sampleProduct, 15)).toThrowError(/Stock insuficiente/);
    });
  });

  describe('recordStockAdjustment', () => {
    it('sets new stock level and records adjustment with reason', () => {
      const { updatedProduct, movement } = recordStockAdjustment(sampleProduct, 8, 'Ajuste por rotura');
      expect(updatedProduct.currentStock).toBe(8);
      expect(movement.type).toBe('adjustment');
      expect(movement.quantity).toBe(-2);
      expect(movement.reasonNote).toBe('Ajuste por rotura');
    });
  });

  describe('findProductByBarcode', () => {
    const catalog: Product[] = [
      sampleProduct,
      {
        id: 'prod-2',
        sku: 'VET-ALM-042',
        name: 'Royal Canin Gastrointestinal 2kg',
        category: 'Alimentación',
        currentStock: 4,
        minStock: 5,
        price: 24.99,
        barcode: '7790000111222'
      }
    ];

    it('returns matching product when barcode exists', () => {
      const found = findProductByBarcode(catalog, '7791234567890');
      expect(found).toBeDefined();
      expect(found?.name).toBe('Bravecto Perros 10-20kg');
    });

    it('returns undefined when barcode does not match', () => {
      const found = findProductByBarcode(catalog, '9999999999999');
      expect(found).toBeUndefined();
    });
  });

  describe('getLowStockAlerts', () => {
    it('returns products where current stock is less than or equal to minimum stock', () => {
      const catalog: Product[] = [
        sampleProduct, // 10 stock, 5 min -> OK
        {
          id: 'prod-2',
          sku: 'VET-ALM-042',
          name: 'Royal Canin Gastrointestinal 2kg',
          category: 'Alimentación',
          currentStock: 4,
          minStock: 5,
          price: 24.99
        }, // 4 stock, 5 min -> Low stock
        {
          id: 'prod-3',
          sku: 'VET-MED-089',
          name: 'Meloxicam Inyectable 50ml',
          category: 'Medicamentos',
          currentStock: 0,
          minStock: 2,
          price: 18.2
        } // 0 stock, 2 min -> Out of stock
      ];

      const alerts = getLowStockAlerts(catalog);
      expect(alerts).toHaveLength(2);
      expect(alerts.map(p => p.id)).toEqual(['prod-2', 'prod-3']);
    });
  });

  describe('processStockReceiptFromBill', () => {
    const catalog: Product[] = [
      sampleProduct, // id: 'prod-1', currentStock: 10, price: 32.5
      {
        id: 'prod-2',
        sku: 'VET-ALM-042',
        name: 'Royal Canin Gastrointestinal 2kg',
        category: 'Alimentación',
        currentStock: 4,
        minStock: 5,
        price: 24.99
      }
    ];

    it('updates stock and catalog prices for items received in a bill', () => {
      const bill = {
        id: 'bill-100',
        supplierName: 'Distribuidora FarmaVet SA',
        invoiceNumber: '0001-00001234',
        date: '2026-09-09',
        amount: 500,
        itemsCount: 2,
        status: 'pending' as const,
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            productName: 'Bravecto Perros 10-20kg',
            quantity: 10,
            unitCost: 35.0,
            subtotal: 350.0,
            updateCatalogPrice: true
          },
          {
            id: 'item-2',
            productId: 'prod-2',
            productName: 'Royal Canin Gastrointestinal 2kg',
            quantity: 5,
            unitCost: 20.0,
            subtotal: 100.0,
            updateCatalogPrice: false
          }
        ]
      };

      const updatedCatalog = processStockReceiptFromBill(bill, catalog);
      const prod1 = updatedCatalog.find(p => p.id === 'prod-1');
      const prod2 = updatedCatalog.find(p => p.id === 'prod-2');

      expect(prod1?.currentStock).toBe(20); // 10 + 10
      expect(prod1?.price).toBe(35.0); // updated catalog price
      expect(prod2?.currentStock).toBe(9);  // 4 + 5
      expect(prod2?.price).toBe(24.99); // price unchanged
    });

    it('returns unmodified catalog if bill has no items or no matching products', () => {
      const billNoItems = {
        id: 'bill-101',
        supplierName: 'Laboratorios Zoonosis SRL',
        invoiceNumber: '0001-00005555',
        date: '2026-09-09',
        amount: 200,
        itemsCount: 0,
        status: 'pending' as const
      };

      const updatedCatalog = processStockReceiptFromBill(billNoItems, catalog);
      expect(updatedCatalog).toEqual(catalog);
    });

    it('creates new product entry in catalog if bill item has no matching existing product', () => {
      const billNewProduct = {
        id: 'bill-102',
        supplierName: 'Distribuidora FarmaVet SA',
        invoiceNumber: '0001-00009999',
        date: '2026-09-10',
        amount: 30000,
        itemsCount: 1,
        status: 'pending' as const,
        items: [
          {
            id: 'item-new-1',
            productName: 'Vacuna ParvovirusCanino 10ml',
            quantity: 8,
            unitCost: 3750,
            subtotal: 30000,
            updateCatalogPrice: true
          }
        ]
      };

      const updatedCatalog = processStockReceiptFromBill(billNewProduct, catalog);
      expect(updatedCatalog.length).toBe(catalog.length + 1);

      const created = updatedCatalog.find(p => p.name === 'Vacuna ParvovirusCanino 10ml');
      expect(created).toBeDefined();
      expect(created?.currentStock).toBe(8);
      expect(created?.price).toBe(3750);
    });

    it('matches existing catalog product when productName has leading/trailing whitespace or case differences', () => {
      const billWithWhitespace = {
        id: 'bill-103',
        supplierName: 'Distribuidora FarmaVet SA',
        invoiceNumber: '0001-00008888',
        date: '2026-09-10',
        amount: 249.9,
        itemsCount: 1,
        status: 'pending' as const,
        items: [
          {
            id: 'item-ws-1',
            productName: '  Royal Canin Gastrointestinal 2kg ',
            quantity: 6,
            unitCost: 24.99,
            subtotal: 149.94
          }
        ]
      };

      const updatedCatalog = processStockReceiptFromBill(billWithWhitespace, catalog);
      expect(updatedCatalog.length).toBe(catalog.length);
      const prod = updatedCatalog.find(p => p.id === 'prod-2');
      expect(prod?.currentStock).toBe(10); // 4 + 6
    });

    it('performs numeric addition when quantity or currentStock are string numbers (preventing string concatenation)', () => {
      const billWithStringQty = {
        id: 'bill-104',
        supplierName: 'Distribuidora FarmaVet SA',
        invoiceNumber: '0001-00007777',
        date: '2026-09-10',
        amount: 249.9,
        itemsCount: 1,
        status: 'pending' as const,
        items: [
          {
            id: 'item-str-1',
            productId: 'prod-2',
            productName: 'Royal Canin Gastrointestinal 2kg',
            quantity: '17' as any,
            unitCost: 24.99,
            subtotal: 424.83
          }
        ]
      };

      const catalogWithStrStock: Product[] = [
        {
          id: 'prod-2',
          sku: 'VET-ALM-042',
          name: 'Royal Canin Gastrointestinal 2kg',
          category: 'Alimentación',
          currentStock: '4' as any,
          minStock: 5,
          price: 24.99
        }
      ];

      const updatedCatalog = processStockReceiptFromBill(billWithStringQty, catalogWithStrStock);
      const prod = updatedCatalog.find(p => p.id === 'prod-2');
      expect(prod?.currentStock).toBe(21); // 4 + 17 = 21, NOT '417'
    });
  });
});
