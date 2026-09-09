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
