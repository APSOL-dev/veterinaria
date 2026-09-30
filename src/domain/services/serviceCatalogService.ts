import { ServiceCatalogItem } from '../types';

export function updateServicePrice(
  service: ServiceCatalogItem,
  newPrice: number,
  updatedDate: string = new Date().toISOString().split('T')[0]
): ServiceCatalogItem {
  return {
    ...service,
    price: newPrice,
    priceLastUpdated: updatedDate
  };
}

export function toggleServiceStatus(service: ServiceCatalogItem): ServiceCatalogItem {
  return {
    ...service,
    isActive: !service.isActive
  };
}

export function recordServiceSale(
  service: ServiceCatalogItem,
  saleDate: string = new Date().toISOString().split('T')[0]
): ServiceCatalogItem {
  return {
    ...service,
    lastSoldAt: saleDate
  };
}

export function isPriceUpdateExpired(
  priceLastUpdated: string,
  updateFrequencyDays: number = 30,
  currentDate: string = new Date().toISOString().split('T')[0]
): boolean {
  if (!priceLastUpdated) return true;
  const lastUpdate = new Date(priceLastUpdated + 'T00:00:00');
  const current = new Date(currentDate + 'T00:00:00');
  const dueDate = new Date(lastUpdate.getTime() + updateFrequencyDays * 86400000);
  return current > dueDate;
}

export function getPriceUpdateStatusInfo(
  priceLastUpdated: string,
  updateFrequencyDays: number = 30,
  currentDate: string = new Date().toISOString().split('T')[0]
): { isExpired: boolean; daysDifference: number; statusLabel: 'Vencido' | 'Vigente'; dueDateString: string } {
  if (!priceLastUpdated) {
    return { isExpired: true, daysDifference: 0, statusLabel: 'Vencido', dueDateString: '' };
  }

  const lastUpdate = new Date(priceLastUpdated + 'T00:00:00');
  const current = new Date(currentDate + 'T00:00:00');
  const dueDate = new Date(lastUpdate.getTime() + updateFrequencyDays * 86400000);

  const diffMs = current.getTime() - dueDate.getTime();
  const diffDays = Math.abs(Math.round(diffMs / 86400000));
  const isExpired = current > dueDate;

  const dueDateString = dueDate.toISOString().split('T')[0];

  return {
    isExpired,
    daysDifference: diffDays,
    statusLabel: isExpired ? 'Vencido' : 'Vigente',
    dueDateString
  };
}

/**
 * Applies a percentage price update (inflation adjustment or discount) to selected services or by category.
 */
export function applyBulkInflationToServices(
  services: ServiceCatalogItem[],
  percentage: number,
  filter?: { serviceIds?: string[]; category?: string }
): { updatedServices: ServiceCatalogItem[]; updatedCount: number } {
  if (!Array.isArray(services) || services.length === 0 || percentage === 0 || isNaN(percentage)) {
    return { updatedServices: services || [], updatedCount: 0 };
  }

  const today = new Date().toISOString().substring(0, 10);
  const factor = 1 + percentage / 100;
  let updatedCount = 0;

  const targetIds = filter?.serviceIds && filter.serviceIds.length > 0 ? new Set(filter.serviceIds) : null;
  const targetCategory = filter?.category && filter.category !== 'Todos' ? filter.category.trim().toLowerCase() : null;

  const updatedServices = services.map(service => {
    let shouldUpdate = true;

    if (targetIds) {
      shouldUpdate = targetIds.has(service.id);
    } else if (targetCategory) {
      shouldUpdate = (service.category || '').trim().toLowerCase() === targetCategory;
    }

    if (!shouldUpdate) {
      return service;
    }

    const currentPrice = Number(service.price) || 0;
    const rawNewPrice = currentPrice * factor;
    // Round to 2 decimals
    const newPrice = Math.round(rawNewPrice * 100) / 100;

    updatedCount++;
    return {
      ...service,
      price: Math.max(0, newPrice),
      priceLastUpdated: today
    };
  });

  return { updatedServices, updatedCount };
}
