import { describe, it, expect } from 'vitest';
import { Product, ServiceCatalogItem } from '../../domain/types';
import { applyBulkInflationToProducts } from '../../domain/services/inventoryService';
import { applyBulkInflationToServices } from '../../domain/services/serviceCatalogService';

describe('Stock and Services Inflation Selection Flow', () => {
  const mockProducts: Product[] = [
    {
      id: 'prod-1',
      sku: 'MED-001',
      name: 'Bravecto 10-20kg',
      category: 'Medicamentos',
      currentStock: 10,
      minStock: 5,
      price: 10000,
      priceLastUpdated: '2026-09-01'
    },
    {
      id: 'prod-2',
      sku: 'ALM-002',
      name: 'Royal Canin Maxi 15kg',
      category: 'Alimentación',
      currentStock: 4,
      minStock: 2,
      price: 50000,
      priceLastUpdated: '2026-09-01'
    },
    {
      id: 'prod-3',
      sku: 'ACC-003',
      name: 'Collar Antipulgas',
      category: 'Accesorios',
      currentStock: 8,
      minStock: 3,
      price: 20000,
      priceLastUpdated: '2026-09-01'
    }
  ];

  const mockServices: ServiceCatalogItem[] = [
    {
      id: 'srv-1',
      name: 'Consulta General',
      category: 'clinica',
      description: 'Examen clínico general',
      price: 15000,
      quantity: 1,
      isActive: true,
      priceLastUpdated: '2026-09-01'
    },
    {
      id: 'srv-2',
      name: 'Baño y Corte Canino',
      category: 'peluqueria',
      description: 'Peluquería completa canina',
      price: 18000,
      quantity: 1,
      isActive: true,
      priceLastUpdated: '2026-09-01'
    }
  ];

  it('should adjust only specifically selected products when scope is selected', () => {
    const selectedIds = ['prod-1', 'prod-3'];
    const result = applyBulkInflationToProducts(mockProducts, 10, { productIds: selectedIds });

    expect(result.updatedCount).toBe(2);
    const updatedProd1 = result.updatedProducts.find(p => p.id === 'prod-1');
    const updatedProd2 = result.updatedProducts.find(p => p.id === 'prod-2');
    const updatedProd3 = result.updatedProducts.find(p => p.id === 'prod-3');

    expect(updatedProd1?.price).toBe(11000);
    expect(updatedProd2?.price).toBe(50000); // Not modified
    expect(updatedProd3?.price).toBe(22000);
  });

  it('should adjust only specifically selected services when scope is selected', () => {
    const selectedIds = ['srv-2'];
    const result = applyBulkInflationToServices(mockServices, 20, { serviceIds: selectedIds });

    expect(result.updatedCount).toBe(1);
    const updatedSrv1 = result.updatedServices.find(s => s.id === 'srv-1');
    const updatedSrv2 = result.updatedServices.find(s => s.id === 'srv-2');

    expect(updatedSrv1?.price).toBe(15000); // Not modified
    expect(updatedSrv2?.price).toBe(21600); // 18000 * 1.2
  });

  it('should support toggling selection mode state correctly', () => {
    let isSelectionMode = false;
    let selectedProductIds: string[] = [];

    // User opens inflation modal with 0 selected and clicks "Seleccionados"
    // Action: enable selection mode and close modal
    if (selectedProductIds.length === 0) {
      isSelectionMode = true;
    }
    expect(isSelectionMode).toBe(true);

    // User checks product 1 and product 2
    selectedProductIds = [...selectedProductIds, 'prod-1', 'prod-2'];
    expect(selectedProductIds.length).toBe(2);

    // Checkbox visibility rule: visible if isSelectionMode is true or selectedProductIds.length > 0
    const isSelectionActive = isSelectionMode || selectedProductIds.length > 0;
    expect(isSelectionActive).toBe(true);

    // User cancels selection
    isSelectionMode = false;
    selectedProductIds = [];
    const isSelectionActiveAfterCancel = isSelectionMode || selectedProductIds.length > 0;
    expect(isSelectionActiveAfterCancel).toBe(false);
  });
});
