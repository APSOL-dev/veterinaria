import { describe, it, expect } from 'vitest';
import { Product } from '../types';
import { 
  recordStockEntry, 
  recordStockSale, 
  recordStockAdjustment, 
  findProductByBarcode, 
  getLowStockAlerts,
  processStockReceiptFromBill,
  createNewProductRecord,
  applyBulkInflationToProducts
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

  describe('createNewProductRecord', () => {
    it('creates a new product record with generated ID, clean values, priceLastUpdated and updateFrequencyDays', () => {
      const product = createNewProductRecord({
        sku: ' VET-MED-999 ',
        name: ' Shampú Antiséptico ',
        category: 'Insumos Clínicos',
        currentStock: 15,
        minStock: 3,
        price: 8500,
        barcode: ' 7799999999999 ',
        updateFrequencyDays: 60
      });

      expect(product.id).toMatch(/^prod-/);
      expect(product.sku).toBe('VET-MED-999');
      expect(product.name).toBe('Shampú Antiséptico');
      expect(product.category).toBe('Insumos Clínicos');
      expect(product.currentStock).toBe(15);
      expect(product.minStock).toBe(3);
      expect(product.price).toBe(8500);
      expect(product.barcode).toBe('7799999999999');
      expect(product.updateFrequencyDays).toBe(60);
      expect(product.priceLastUpdated).toBeDefined();
    });

    it('updates priceLastUpdated when catalog price is updated via processStockReceiptFromBill', () => {
      const catalog: Product[] = [
        {
          id: 'prod-1',
          sku: 'VET-MED-001',
          name: 'Bravecto Perros 10-20kg',
          category: 'Medicamentos',
          currentStock: 10,
          minStock: 5,
          price: 32.5,
          priceLastUpdated: '2026-01-01',
          updateFrequencyDays: 30
        }
      ];

      const bill = {
        id: 'bill-200',
        supplierName: 'Distribuidora FarmaVet SA',
        invoiceNumber: '0001-00001234',
        date: '2026-09-16',
        amount: 350,
        itemsCount: 1,
        status: 'pending' as const,
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            productName: 'Bravecto Perros 10-20kg',
            quantity: 10,
            unitCost: 40.0,
            subtotal: 400.0,
            updateCatalogPrice: true
          }
        ]
      };

      const updated = processStockReceiptFromBill(bill, catalog);
      expect(updated[0].price).toBe(40.0);
      expect(updated[0].priceLastUpdated).toBe('2026-09-16');
    });

    it('generates auto SKU if SKU is empty', () => {
      const product = createNewProductRecord({
        name: 'Termómetro Digital',
        category: 'Insumos Clínicos',
        currentStock: 5,
        minStock: 1,
        price: 4500
      });

      expect(product.sku).toMatch(/^VET-PRD-\d{3}$/);
      expect(product.barcode).toBeUndefined();
    });

    it('throws error if product name is empty', () => {
      expect(() => createNewProductRecord({
        name: '   ',
        category: 'Accesorios',
        currentStock: 1,
        minStock: 1,
        price: 1000
      })).toThrowError(/nombre del producto es obligatorio/);
    });
  });

  describe('applyBulkInflationToProducts', () => {
    const testProducts: Product[] = [
      {
        id: 'p-1',
        sku: 'VET-MED-01',
        name: 'Antiparasitario Canino',
        category: 'Medicamentos',
        currentStock: 10,
        minStock: 2,
        price: 10000,
        priceLastUpdated: '2026-01-01'
      },
      {
        id: 'p-2',
        sku: 'VET-MED-02',
        name: 'Antibiótico Felino',
        category: 'Medicamentos',
        currentStock: 5,
        minStock: 1,
        price: 20000,
        priceLastUpdated: '2026-01-01'
      },
      {
        id: 'p-3',
        sku: 'VET-ALM-01',
        name: 'Alimento Premium 15kg',
        category: 'Alimentación',
        currentStock: 8,
        minStock: 3,
        price: 50000,
        priceLastUpdated: '2026-01-01'
      },
      {
        id: 'p-4',
        sku: 'VET-ACC-01',
        name: 'Collar Ajustable',
        category: 'Accesorios',
        currentStock: 12,
        minStock: 5,
        price: 4000,
        priceLastUpdated: '2026-01-01'
      }
    ];

    it('applies inflation percentage to all products when no filter is provided', () => {
      const today = new Date().toISOString().substring(0, 10);
      const { updatedProducts, updatedCount } = applyBulkInflationToProducts(testProducts, 10);

      expect(updatedCount).toBe(4);
      expect(updatedProducts[0].price).toBe(11000); // 10000 + 10%
      expect(updatedProducts[1].price).toBe(22000); // 20000 + 10%
      expect(updatedProducts[2].price).toBe(55000); // 50000 + 10%
      expect(updatedProducts[3].price).toBe(4400);  // 4000 + 10%
      expect(updatedProducts[0].priceLastUpdated).toBe(today);
    });

    it('applies inflation percentage only to specific selected product IDs', () => {
      const { updatedProducts, updatedCount } = applyBulkInflationToProducts(testProducts, 20, {
        productIds: ['p-1', 'p-3']
      });

      expect(updatedCount).toBe(2);
      expect(updatedProducts.find(p => p.id === 'p-1')?.price).toBe(12000); // +20%
      expect(updatedProducts.find(p => p.id === 'p-2')?.price).toBe(20000); // Unchanged
      expect(updatedProducts.find(p => p.id === 'p-3')?.price).toBe(60000); // +20%
      expect(updatedProducts.find(p => p.id === 'p-4')?.price).toBe(4000);  // Unchanged
    });

    it('applies inflation percentage only to products in a specific category', () => {
      const { updatedProducts, updatedCount } = applyBulkInflationToProducts(testProducts, 15, {
        category: 'Medicamentos'
      });

      expect(updatedCount).toBe(2);
      expect(updatedProducts.find(p => p.id === 'p-1')?.price).toBe(11500); // +15%
      expect(updatedProducts.find(p => p.id === 'p-2')?.price).toBe(23000); // +15%
      expect(updatedProducts.find(p => p.id === 'p-3')?.price).toBe(50000); // Unchanged (Alimentación)
      expect(updatedProducts.find(p => p.id === 'p-4')?.price).toBe(4000);  // Unchanged (Accesorios)
    });

    it('supports price reduction with negative percentage', () => {
      const { updatedProducts, updatedCount } = applyBulkInflationToProducts(testProducts, -10, {
        productIds: ['p-1']
      });

      expect(updatedCount).toBe(1);
      expect(updatedProducts.find(p => p.id === 'p-1')?.price).toBe(9000); // 10000 - 10%
    });

    it('handles 0% percentage or empty products without modifying prices', () => {
      const { updatedProducts, updatedCount } = applyBulkInflationToProducts(testProducts, 0);
      expect(updatedCount).toBe(0);
      expect(updatedProducts).toEqual(testProducts);

      const emptyRes = applyBulkInflationToProducts([], 10);
      expect(emptyRes.updatedCount).toBe(0);
      expect(emptyRes.updatedProducts).toEqual([]);
    });
  });

  describe('Corroboración: Los productos se suman al inventario al cargar una factura', () => {
    it('suma correctamente las cantidades recibidas al stock actual de los productos existentes', () => {
      const initialCatalog: Product[] = [
        {
          id: 'prod-10',
          sku: 'MED-010',
          name: 'Amoxicilina 500mg',
          category: 'Medicamentos',
          currentStock: 15,
          minStock: 5,
          price: 1200
        },
        {
          id: 'prod-20',
          sku: 'INS-020',
          name: 'Gasas estériles',
          category: 'Insumos Clínicos',
          currentStock: 50,
          minStock: 20,
          price: 300
        }
      ];

      const bill = {
        id: 'bill-101',
        supplierName: 'Droguería Central',
        invoiceNumber: 'FC-A-0001-00009999',
        date: '2026-09-24',
        amount: 30000,
        itemsCount: 2,
        status: 'pending' as const,
        items: [
          {
            id: 'bi-1',
            productId: 'prod-10',
            productName: 'Amoxicilina 500mg',
            quantity: 25,
            unitCost: 1000,
            subtotal: 25000
          },
          {
            id: 'bi-2',
            productId: 'prod-20',
            productName: 'Gasas estériles',
            quantity: 50,
            unitCost: 250,
            subtotal: 12500
          }
        ]
      };

      const updated = processStockReceiptFromBill(bill, initialCatalog);

      const amoxi = updated.find(p => p.id === 'prod-10');
      const gasas = updated.find(p => p.id === 'prod-20');

      expect(amoxi?.currentStock).toBe(40); // 15 + 25
      expect(gasas?.currentStock).toBe(100); // 50 + 50
    });

    it('crea automáticamente nuevos productos en el inventario con el stock de la factura si no existían previamente', () => {
      const initialCatalog: Product[] = [];

      const bill = {
        id: 'bill-102',
        supplierName: 'Distribuidora PetFood',
        invoiceNumber: 'FC-B-0002-00003333',
        date: '2026-09-24',
        amount: 80000,
        itemsCount: 1,
        status: 'pending' as const,
        items: [
          {
            id: 'bi-3',
            productName: 'Pipetas Antipulgas Plus',
            quantity: 30,
            unitCost: 2500,
            subtotal: 75000
          }
        ]
      };

      const updated = processStockReceiptFromBill(bill, initialCatalog);

      expect(updated).toHaveLength(1);
      expect(updated[0].name).toBe('Pipetas Antipulgas Plus');
      expect(updated[0].currentStock).toBe(30);
      expect(updated[0].price).toBe(2500);
    });
  });
});

