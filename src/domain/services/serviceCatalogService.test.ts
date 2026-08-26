import { describe, it, expect } from 'vitest';
import { ServiceCatalogItem } from '../types';
import { 
  updateServicePrice, 
  toggleServiceStatus, 
  recordServiceSale 
} from './serviceCatalogService';

const mockService: ServiceCatalogItem = {
  id: 'srv-1',
  category: 'clinica',
  name: 'Consulta Médica General',
  description: 'Atención clínica veterinaria básica',
  quantity: 1,
  isActive: true,
  price: 5000,
  priceLastUpdated: '2026-01-01',
  lastSoldAt: '2026-08-01'
};

describe('serviceCatalogService', () => {
  it('updateServicePrice should update price and priceLastUpdated date', () => {
    const updated = updateServicePrice(mockService, 6500, '2026-08-26');
    expect(updated.price).toBe(6500);
    expect(updated.priceLastUpdated).toBe('2026-08-26');
  });

  it('toggleServiceStatus should invert isActive state', () => {
    const toggled = toggleServiceStatus(mockService);
    expect(toggled.isActive).toBe(false);

    const toggledBack = toggleServiceStatus(toggled);
    expect(toggledBack.isActive).toBe(true);
  });

  it('recordServiceSale should update lastSoldAt', () => {
    const sold = recordServiceSale(mockService, '2026-08-26');
    expect(sold.lastSoldAt).toBe('2026-08-26');
  });
});
