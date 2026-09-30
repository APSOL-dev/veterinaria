import { describe, it, expect } from 'vitest';
import { ServiceCatalogItem } from '../types';
import { 
  updateServicePrice, 
  toggleServiceStatus, 
  recordServiceSale,
  isPriceUpdateExpired,
  getPriceUpdateStatusInfo,
  applyBulkInflationToServices
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

  describe('isPriceUpdateExpired & getPriceUpdateStatusInfo', () => {
    it('detects when price update is expired based on frequency days', () => {
      // Last updated 2026-08-01, frequency 30 days -> Due 2026-08-31. Today 2026-09-09 -> EXPIRED
      const isExpired = isPriceUpdateExpired('2026-08-01', 30, '2026-09-09');
      expect(isExpired).toBe(true);

      const status = getPriceUpdateStatusInfo('2026-08-01', 30, '2026-09-09');
      expect(status.isExpired).toBe(true);
      expect(status.statusLabel).toBe('Vencido');
    });

    it('detects when price update is still valid', () => {
      // Last updated 2026-09-01, frequency 30 days -> Due 2026-10-01. Today 2026-09-09 -> VALID
      const isExpired = isPriceUpdateExpired('2026-09-01', 30, '2026-09-09');
      expect(isExpired).toBe(false);

      const status = getPriceUpdateStatusInfo('2026-09-01', 30, '2026-09-09');
      expect(status.isExpired).toBe(false);
      expect(status.statusLabel).toBe('Vigente');
    });
  });

  describe('applyBulkInflationToServices', () => {
    const mockServices: ServiceCatalogItem[] = [
      { id: 's1', category: 'clinica', name: 'Consulta General', description: '', quantity: 1, isActive: true, price: 10000, priceLastUpdated: '2026-01-01' },
      { id: 's2', category: 'peluqueria', name: 'Baño y Corte', description: '', quantity: 1, isActive: true, price: 15000, priceLastUpdated: '2026-01-01' },
      { id: 's3', category: 'clinica', name: 'Cirugía Menor', description: '', quantity: 1, isActive: true, price: 50000, priceLastUpdated: '2026-01-01' }
    ];

    it('should increase all services prices by percentage', () => {
      const { updatedServices, updatedCount } = applyBulkInflationToServices(mockServices, 10);
      expect(updatedCount).toBe(3);
      expect(updatedServices[0].price).toBe(11000);
      expect(updatedServices[1].price).toBe(16500);
      expect(updatedServices[2].price).toBe(55000);
      expect(updatedServices[0].priceLastUpdated).toBe(new Date().toISOString().substring(0, 10));
    });

    it('should filter by category when specified', () => {
      const { updatedServices, updatedCount } = applyBulkInflationToServices(mockServices, 20, { category: 'peluqueria' });
      expect(updatedCount).toBe(1);
      expect(updatedServices[0].price).toBe(10000); // unchanged
      expect(updatedServices[1].price).toBe(18000); // 15000 + 20%
      expect(updatedServices[2].price).toBe(50000); // unchanged
    });

    it('should filter by specific serviceIds when specified', () => {
      const { updatedServices, updatedCount } = applyBulkInflationToServices(mockServices, 50, { serviceIds: ['s1', 's3'] });
      expect(updatedCount).toBe(2);
      expect(updatedServices[0].price).toBe(15000);
      expect(updatedServices[1].price).toBe(15000); // unchanged
      expect(updatedServices[2].price).toBe(75000);
    });

    it('should do nothing if percentage is 0 or NaN', () => {
      const { updatedServices, updatedCount } = applyBulkInflationToServices(mockServices, 0);
      expect(updatedCount).toBe(0);
      expect(updatedServices).toEqual(mockServices);
    });
  });
});
